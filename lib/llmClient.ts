import { Paper, ReviewRun } from '@/store/useReviewStore';

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
    confidence: number;
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
            confidence: 1.0
        };
    }

    const systemPrompt = `You are an expert academic researcher assisting with a Systematic Literature Review.
Your task is to review the title and abstract of a single academic paper and decide whether it should be INCLUDED or EXCLUDED based ONLY on the provided criteria.

Research Topic: ${researchParams.topic}
Inclusion Criteria: ${researchParams.inclusionCriteria}
Exclusion Criteria: ${researchParams.exclusionCriteria}
Extra Context: ${researchParams.extraContext}

If the paper meets ALL inclusion criteria and NO exclusion criteria, mark it as INCLUDED.
If the paper fails at least one inclusion criterion or meets an exclusion criterion, mark it as EXCLUDED.
If you are confident, rate your confidence higher.

Return your answer strictly in ONE valid JSON object with the following keys:
- "decision": either "INCLUDED" or "EXCLUDED".
- "reason": A brief string explaining your reasoning.
- "confidence": A number from 0.0 to 1.0 indicating your confidence in the decision.
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
            reason: result.reason || 'No reason provided by AI',
            confidence: typeof result.confidence === 'number' ? result.confidence : 0.5
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
