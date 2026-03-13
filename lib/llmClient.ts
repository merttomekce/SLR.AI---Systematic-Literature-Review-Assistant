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

// Function to call OpenAI API (or compatible local server)
async function callOpenAI(req: LLMRequest): Promise<string> {
    const isLocal = req.provider === 'local' || req.provider === 'lmstudio';
    let url = 'https://api.openai.com/v1/chat/completions';
    
    // In local mode, we pass the endpoint URL inside the apiKey field from the store
    if (isLocal) {
        const endpoint = req.apiKey && req.apiKey.startsWith('http') ? req.apiKey : 'http://127.0.0.1:11434/v1';
        url = endpoint.endsWith('/') ? `${endpoint}chat/completions` : `${endpoint}/chat/completions`;
    }

    const authHeader = isLocal ? 'Bearer local' : `Bearer ${req.apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
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
    } else if (req.provider === 'openai' || req.provider === 'local' || req.provider === 'lmstudio') {
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

export interface ExtractedParameters {
    topic: string;
    inclusionCriteria: string;
    exclusionCriteria: string;
    extractionFields: string;
    extraContext: string;
}

export async function extractResearchParameters(
    text: string,
    config: { provider: string; model: string; apiKey: string }
): Promise<ExtractedParameters> {
    const systemPrompt = `You are an expert academic researcher setting up a Systematic Literature Review (SLR). 
Your task is to analyze the provided Requirements Document text and extract the key research parameters needed to configure an AI screening tool.

CRITICAL INSTRUCTION: You must return STRICTLY a valid JSON object. Do not include markdown \`\`\`json backticks. Do not include any text before or after the JSON.
CRITICAL INSTRUCTION: All newlines inside string values MUST be escaped as \\n. Raw unescaped newlines will break the parser.

You must return strictly a single valid JSON object with the following structure:
{
  "topic": "A clear, concise 1-2 sentence description of the research topic or research question.",
  "inclusionCriteria": "A bulleted or numbered list of criteria a paper MUST meet to be included.",
  "exclusionCriteria": "A bulleted or numbered list of reasons to definitively exclude a paper.",
  "extractionFields": "A comma-separated list of specific data points or metrics that need to be extracted from the full text of included papers (e.g., Study Design, Sample Size, Outcomes).",
  "extraContext": "Any other important context, definitions, or instructions for the reviewer found in the document that doesn't fit neatly into the criteria above."
}

If any field is completely missing from the document, provide an empty string for that field, but try your best to infer the research topic from the document title or abstract.`;

    const userPrompt = `Requirements Document Text:\n\n${text.slice(0, 100000)}`;

    try {
        const textResp = await executeLLM({
            provider: config.provider,
            model: config.model,
            apiKey: config.apiKey,
            systemPrompt,
            userPrompt: config.provider === 'anthropic' ? userPrompt + "\n\nProvide JUST the raw JSON object, starting with { and ending with }." : userPrompt
        });

        // Robustly parse JSON even if wrapped in markdown blocks
        let jsonStr = textResp.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '');
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '');
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace(/```$/, '');
        jsonStr = jsonStr.trim();

        // Fallback to strict regex if the above didn't result in a valid leading {
        if (!jsonStr.startsWith('{')) {
            const match = jsonStr.match(/\{[\s\S]*\}/);
            jsonStr = match ? match[0] : jsonStr;
        }

        let result;
        try {
           // Attempt to sanitize unescaped newlines within string values before parsing
           // This is a common issue with local models returning JSON-like strings
           const sanitizedStr = jsonStr.replace(/"([^"]*)"/g, (match, p1) => {
               return `"${p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`;
           });
           result = JSON.parse(sanitizedStr);
        } catch (parseError) {
           console.error("Failed to parse JSON strictly. Raw LLM Output:", textResp);
           
           // Use highly resilient regex that spans multiple lines to find key-value blocks
           const topicMatch = textResp.match(/"topic"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|"inclusionCriteria"|}))/);
           const inclusionMatch = textResp.match(/"inclusionCriteria"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|"exclusionCriteria"|}))/);
           const exclusionMatch = textResp.match(/"exclusionCriteria"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|"extractionFields"|}))/);
           const extractionMatch = textResp.match(/"extractionFields"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|"extraContext"|}))/);
           const contextMatch = textResp.match(/"extraContext"\s*:\s*"([\s\S]*?)"(?=\s*(?:,|}))/);
           
           result = {
              topic: topicMatch ? topicMatch[1] : '',
              inclusionCriteria: inclusionMatch ? inclusionMatch[1] : '',
              exclusionCriteria: exclusionMatch ? exclusionMatch[1] : '',
              extractionFields: extractionMatch ? extractionMatch[1] : '',
              extraContext: contextMatch ? contextMatch[1] : ''
           };
        }

        return {
            topic: result.topic || '',
            inclusionCriteria: result.inclusionCriteria || '',
            exclusionCriteria: result.exclusionCriteria || '',
            extractionFields: result.extractionFields || '',
            extraContext: result.extraContext || ''
        };
    } catch (error) {
        console.error("Parameter Extraction LLM Error:", error);
        throw error;
    }
}

export function extractResearchParametersRegex(text: string): ExtractedParameters {
    // A fast, offline regex-based fallback to extract parameters when no LLM is available.
    
    // Topic: Look for early instances of "Title", "Topic", "Objective", or take the first few lines.
    let topic = "";
    const topicMatch = text.match(/(?:Title|Project Title|Topic|Objective)[\s\S]*?(?=\n\n|\r\n\r\n|Inclusion|Background|Introduction)/i);
    if (topicMatch) {
       topic = topicMatch[0].replace(/(Title|Project Title|Topic|Objective)[\s]*:?/i, '').trim().substring(0, 300);
    } else {
       // Just grab the first 200 characters of the document as a fallback topic
       topic = text.substring(0, 200).trim().replace(/\n/g, ' ');
    }

    // Inclusion Criteria
    let inclusionCriteria = "";
    const incMatch = text.match(/(?:Inclusion Criteria|Eligibility Criteria|Participants)[\s\S]*?(?=\n.*Exclusion|\n.*Data Extraction|\n.*Search Strategy|\n.*Methods)/i);
    if (incMatch) {
        inclusionCriteria = incMatch[0].replace(/(Inclusion Criteria|Eligibility Criteria|Participants)[\s]*:?/i, '').trim().substring(0, 1000);
    }

    // Exclusion Criteria
    let exclusionCriteria = "";
    const excMatch = text.match(/(?:Exclusion Criteria|Exclusion Rules)[\s\S]*?(?=\n.*Data Extraction|\n.*Search Strategy|\n.*Methods|\n.*Risk of Bias)/i);
    if (excMatch) {
        exclusionCriteria = excMatch[0].replace(/(Exclusion Criteria|Exclusion Rules)[\s]*:?/i, '').trim().substring(0, 1000);
    }

    // Extraction Fields
    let extractionFields = "";
    const extMatch = text.match(/(?:Data Extraction|Data points|Data to extract)[\s\S]*?(?=\n.*Risk of Bias|\n.*Quality Assessment|\n.*Data Synthesis|References)/i);
    if (extMatch) {
        extractionFields = extMatch[0].replace(/(Data Extraction|Data points|Data to extract)[\s]*:?/i, '').trim().substring(0, 1000);
    }

    return {
        topic,
        inclusionCriteria,
        exclusionCriteria,
        extractionFields,
        extraContext: "Extracted via Offline Regex Fallback Mode. Please review and refine."
    };
}
