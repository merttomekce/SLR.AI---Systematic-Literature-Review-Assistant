import { Paper, ReviewRun } from '@/store/useReviewStore';

export class RateLimitError extends Error {
    public retryAfterSeconds: number;
    constructor(retryAfterSeconds: number = 60) {
        super(`Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`);
        this.name = 'RateLimitError';
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

export class QuotaError extends Error {
    constructor() {
        super(`Daily quota reached or out of credits.`);
        this.name = 'QuotaError';
    }
}

export interface LLMRequest {
    provider: string; // 'anthropic' | 'openai' | 'google'
    model: string;
    apiKey: string;
    systemPrompt: string;
    userPrompt: string;
}

export interface Step1Result {
    decision: 'INCLUDED' | 'EXCLUDED' | 'NOT ACCESSIBLE';
    reason: string;
    relevancy: number;
}

export interface Step2Result {
    decision: 'INCLUDED' | 'EXCLUDED';
    reason: string;
    extractedData: Record<string, string>;
}

// Function to call Anthropic API
async function callAnthropic(req: LLMRequest): Promise<string> {
    const url = 'https://api.anthropic.com/v1/messages';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': req.apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true', // Required for client-side Anthropic calls
        },
        body: JSON.stringify({
            model: req.model,
            max_tokens: 1500,
            system: req.systemPrompt,
            temperature: 0,
            messages: [{ role: 'user', content: req.userPrompt }],
        }),
    });

    if (!response.ok) {
        if (response.status === 402) {
            throw new QuotaError();
        }
        if (response.status === 429) {
            // Anthropic headers: anthropic-ratelimit-reset (timestamp) or retry-after (seconds)
            const resetHeader = response.headers.get('anthropic-ratelimit-reset');
            const retryHeader = response.headers.get('retry-after');
            let waitSeconds = 60;

            if (retryHeader) {
                waitSeconds = parseInt(retryHeader, 10);
            } else if (resetHeader) {
                const resetTime = new Date(resetHeader).getTime();
                waitSeconds = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
            }

            // If wait is suspiciously long (> 1 hour), assume it's a daily/monthly hard cap
            if (waitSeconds > 3600) throw new QuotaError();
            throw new RateLimitError(waitSeconds);
        }

        const errorText = await response.text();
        throw new Error(`Anthropic Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

// Function to call OpenAI API
async function callOpenAI(req: LLMRequest): Promise<string> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${req.apiKey}`,
        },
        body: JSON.stringify({
            model: req.model,
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: req.systemPrompt },
                { role: 'user', content: req.userPrompt }
            ],
        }),
    });

    if (!response.ok) {
        if (response.status === 402) {
            throw new QuotaError();
        }
        if (response.status === 429) {
            const resetRequests = response.headers.get('x-ratelimit-reset-requests');
            const retryAfter = response.headers.get('retry-after');
            let waitSeconds = 60;

            if (resetRequests) {
                // e.g. "12s" or "6m0s" - usually retry-after is safer for 429s, but fallback parsing
                waitSeconds = parseFloat(resetRequests) || 60;
            }
            if (retryAfter) {
                waitSeconds = parseInt(retryAfter, 10);
            }

            if (waitSeconds > 3600) throw new QuotaError();
            throw new RateLimitError(waitSeconds);
        }
        const errorText = await response.text();
        throw new Error(`OpenAI Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Function to call Google Gemini API
async function callGoogle(req: LLMRequest): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent?key=${req.apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: req.systemPrompt }]
            },
            contents: [{
                parts: [{ text: req.userPrompt }]
            }],
            generationConfig: {
                temperature: 0,
                responseMimeType: 'application/json',
            }
        }),
    });

    if (!response.ok) {
        if (response.status === 402) {
            throw new QuotaError();
        }
        if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            let waitSeconds = 60; // Google often doesn't guarantee headers, default to 60s

            if (retryAfter) {
                waitSeconds = parseInt(retryAfter, 10);
            }

            if (waitSeconds > 3600) throw new QuotaError();
            throw new RateLimitError(waitSeconds);
        }

        const errorText = await response.text();
        throw new Error(`Google API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function executeLLM(req: LLMRequest): Promise<string> {
    if (req.provider === 'anthropic') {
        return await callAnthropic(req);
    } else if (req.provider === 'openai') {
        return await callOpenAI(req);
    } else if (req.provider === 'google') {
        return await callGoogle(req);
    } else {
        throw new Error(`Unsupported provider: ${req.provider}`);
    }
}

export async function processStep1(
    paper: Paper,
    config: { provider: string; model: string; apiKey: string },
    researchParams: { topic: string; inclusionCriteria: string; exclusionCriteria: string; extraContext: string; }
): Promise<Step1Result> {
    if (!paper.abstract || paper.abstract.trim().length === 0) {
        return {
            decision: 'NOT ACCESSIBLE',
            reason: 'No abstract provided for processing.',
            relevancy: 1
        };
    }

    const systemPrompt = `You are an expert academic researcher conducting the Abstract Screening phase (Step 1) of a Systematic Literature Review (SLR) following PRISMA guidelines.
Your task is to review the title and abstract of a single academic paper and decide whether it should be INCLUDED for full-text review or EXCLUDED.

Research Topic: ${researchParams.topic}
Inclusion Criteria: ${researchParams.inclusionCriteria}
Exclusion Criteria: ${researchParams.exclusionCriteria}
Extra Context: ${researchParams.extraContext}

EVALUATION RULES (Based on SRS & Abstract Limitations):
1. INCLUDED: Paper meets all inclusion criteria and none of the exclusion criteria.
2. EXCLUDED: Paper fails at least one inclusion criterion or meets an exclusion criterion.
3. HANDLING MISSING DATA: Abstracts are short summaries. If an abstract lacks sufficient detail to definitively confirm an Inclusion Criterion, you MUST give it the benefit of the doubt and assume it passes that criterion. 
4. Do NOT exclude a paper simply because the abstract didn't mention a specific detail. Exclude ONLY for explicit contradictions.

Return your answer strictly in ONE valid JSON object with the following keys:
- "reasoning": A detailed step-by-step evaluation of the abstract against the criteria.
- "decision": strictly either "INCLUDED" or "EXCLUDED".
- "relevancy": An integer from 1 to 5 indicating the paper's relevancy to the topic.
No markdown backticks, just raw JSON string.`;

    const userPrompt = `Title: ${paper.title || 'N/A'}\nAuthors: ${paper.author || 'N/A'}\nYear: ${paper.year || 'N/A'}\nAbstract: ${paper.abstract}\n`;

    try {
        const textResp = await executeLLM({
            provider: config.provider,
            model: config.model,
            apiKey: config.apiKey,
            systemPrompt,
            userPrompt: config.provider === 'anthropic' ? userPrompt + "\n\nProvide JUST the raw JSON object, starting with { and ending with }." : userPrompt
        });

        // Attempt to parse JSON
        const match = textResp.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : textResp;
        const result = JSON.parse(jsonStr);

        return {
            decision: ['INCLUDED', 'EXCLUDED'].includes(result.decision) ? result.decision : 'EXCLUDED',
            reason: result.reasoning || result.reason || 'No reason provided by AI',
            relevancy: typeof result.relevancy === 'number' ? result.relevancy : 3
        };
    } catch (error) {
        console.error("Step 1 LLM Error:", error);
        throw error;
    }
}

export async function processStep2(
    paper: Paper,
    fullText: string,
    config: { provider: string; model: string; apiKey: string },
    researchParams: { topic: string; inclusionCriteria: string; exclusionCriteria: string; extraContext: string; extractionFields: string }
): Promise<Step2Result> {
    const fields = researchParams.extractionFields.split(',').map(f => f.trim()).filter(f => f);
    const fieldsJsonDescription = fields.map(f => `"${f}": "value found in text, or 'Not reported'"`).join(',\n  ');

    const systemPrompt = `You are an expert academic researcher conducting Full-Text Review and Data Extraction for a Systematic Literature Review.
Your task is to review the full text of an academic paper and:
1. Make a final inclusion/exclusion decision based on the criteria.
2. Extract the requested data fields.

Research Topic: ${researchParams.topic}
Inclusion Criteria: ${researchParams.inclusionCriteria}
Exclusion Criteria: ${researchParams.exclusionCriteria}
Extra Context: ${researchParams.extraContext}

You must return strictly a single valid JSON object with the following structure:
{
  "decision": "INCLUDED" or "EXCLUDED",
  "reason": "Brief justification for the final decision based on the full text",
  "extractedData": {
    ${fieldsJsonDescription}
  }
}
No markdown backticks, just raw JSON.`;

    const userPrompt = `Full Text of Paper "${paper.title}":\n\n${fullText.slice(0, 100000)} /* Truncated to avoid massive context limits if necessary, though ideally passing the whole text */`;

    try {
        const textResp = await executeLLM({
            provider: config.provider,
            model: config.model,
            apiKey: config.apiKey,
            systemPrompt,
            userPrompt: config.provider === 'anthropic' ? userPrompt + "\n\nProvide JUST the raw JSON object, starting with { and ending with }." : userPrompt
        });

        const match = textResp.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : textResp;
        const result = JSON.parse(jsonStr);

        return {
            decision: ['INCLUDED', 'EXCLUDED'].includes(result.decision) ? result.decision : 'EXCLUDED',
            reason: result.reason || 'No reason provided by AI',
            extractedData: result.extractedData || {}
        };
    } catch (error) {
        console.error("Step 2 LLM Error:", error);
        throw error;
    }
}
