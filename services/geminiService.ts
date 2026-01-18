
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { getApiKey } from "./ai/core";
import { AgencyProposal, DirectorAction, FinanceItem } from "../types";

export * from "./ai/core";
export * from "./ai/text";
export * from "./ai/image";
export * from "./ai/video";
export * from "./ai/audio";
export * from "./ai/live";

// Helper for Motion View to extract Start/End params from chat
export const extractMapParameters = async (text: string): Promise<{ start?: string, end?: string }> => {
    const apiKey = getApiKey();
    if (!apiKey) return {};
    const ai = new GoogleGenAI({ apiKey });

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            start: { type: Type.STRING, description: "The origin location mentioned. Null if not found." },
            end: { type: Type.STRING, description: "The destination location mentioned. Null if not found." }
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", // Fast model for extraction
            contents: `Extract map origin (start) and destination (end) from this user text: "${text}". If user says 'from X', X is start. If 'to Y', Y is end. Return valid JSON.`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: schema,
                temperature: 0
            }
        });
        
        if (response.text) {
            return JSON.parse(response.text);
        }
        return {};
    } catch (e) {
        console.error("Map extraction failed", e);
        return {};
    }
};

const proposalSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        clientName: { type: Type.STRING },
        executiveSummary: { type: Type.STRING },
        teamStructure: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING },
                    seniority: { type: Type.STRING, enum: ['Junior', 'Mid', 'Senior'] },
                    allocation: { type: Type.STRING }
                }
            }
        },
        options: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    price: { type: Type.STRING },
                    timeline: { type: Type.STRING },
                    techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                    features: { type: Type.ARRAY, items: { type: Type.STRING } },
                    isRecommended: { type: Type.BOOLEAN }
                }
            }
        },
        nextSteps: { type: Type.STRING }
    },
    required: ["clientName", "executiveSummary", "teamStructure", "options", "nextSteps"]
};

// --- AGENCY AI AGENT (Operations Director) ---
export const generateAgencyProposal = async (
    briefing: string, 
    contextFiles?: string // RAG Context (Rate Cards, Past Proposals)
): Promise<AgencyProposal | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
    ROLE: Operations Director of a High-End Digital Agency.
    TASK: Structure a commercial proposal based on the client briefing.
    
    GUIDELINES:
    1. Analyze the briefing to understand the client's pain points and goals.
    2. Suggest a diverse team (Squad) based on the needs (e.g., Designer, Dev, Copywriter).
    3. Create 3 pricing tiers: 
       - "MVP / Basic": Minimum viable solution.
       - "Growth / Standard": Balanced (Recommended).
       - "Enterprise / Scale": High-end with all features + support.
    4. Estimate realistic timelines.
    5. If 'CONTEXT' is provided, use those prices/rates as a baseline. If not, use standard market rates for a premium agency in Brazil (BRL).
    
    CONTEXT (RAG):
    ${contextFiles || "No specific rate card provided. Use market standards."}
    
    BRIEFING:
    "${briefing}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", // Good balance of intelligence and speed
            contents: systemPrompt,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: proposalSchema,
                temperature: 0.4
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as AgencyProposal;
        }
        return null;
    } catch (e) {
        console.error("Agency Proposal Generation Failed", e);
        throw e;
    }
};

// --- DIRECTOR AGENT (DASHBOARD COMMANDS) ---
const actionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        action: { 
            type: Type.STRING, 
            enum: ['create_task', 'create_event', 'schedule_meeting', 'create_project', 'analyze_finance', 'audit_schedule', 'unknown'] 
        },
        data: { 
            type: Type.OBJECT, 
            description: "Parameters extracted (title, date, description). For create_event, must include 'start' (ISO) and 'end' (ISO).",
            properties: {
                title: { type: Type.STRING, description: "Title of the task, event, or project" },
                name: { type: Type.STRING, description: "Project name" },
                client: { type: Type.STRING, description: "Client name" },
                priority: { type: Type.STRING, description: "Task priority (low, medium, high)" },
                deadline: { type: Type.STRING, description: "Task deadline (ISO String)" },
                start: { type: Type.STRING, description: "Event start time (ISO String)" },
                end: { type: Type.STRING, description: "Event end time (ISO String)" },
                description: { type: Type.STRING, description: "Description or details" }
            }
        },
        reply: { type: Type.STRING, description: "Natural language confirmation or answer." }
    },
    required: ["action", "reply"]
};

export const parseAgencyCommand = async (
    userPrompt: string, 
    contextData?: string, // Calendar events, tasks list, etc.
    crmData?: string // New: Leads list for cross-referencing
): Promise<DirectorAction | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    const currentDate = new Date();
    const systemPrompt = `
    You are the 'Agency Director AI' (Executive Assistant).
    Your job is to manage the user's Dashboard, Tasks, and CALENDAR proactively.
    
    CURRENT DATE/TIME: ${currentDate.toISOString()}
    DAY OF WEEK: ${currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
    
    CALENDAR CONTEXT:
    ${contextData || "No events scheduled."}

    CRM CONTEXT (Clients/Leads):
    ${crmData || "No leads found."}
    
    INTELLIGENCE RULES:
    1. **Conflict Detection:** Before scheduling ('create_event'), check the CALENDAR CONTEXT. If the user asks for a time that overlaps with an existing event, WARN them in the 'reply' but still generate the JSON to allow the user to decide.
    2. **CRM Integration:** If the user creates an event/task mentioning a client name found in CRM CONTEXT:
       - Mention in 'reply' that you recognized the client.
       - Suggest (in text) that they might want to prepare a presentation.
    3. **Date Logic:** Always convert "tomorrow", "next monday" to ISO strings relative to CURRENT DATE.
    
    AVAILABLE ACTIONS:
    1. 'create_task': If user wants to add a todo/task. Extract: { title, priority, deadline }.
    2. 'create_event' (or 'schedule_meeting'): Extract: { title, start (ISO), end (ISO), description }. Default duration: 1 hour.
    3. 'audit_schedule': If user asks "What do I have today?", "Briefing", "Am I busy?". Analyze CONTEXT. Return a concise, strategic summary.
    4. 'unknown': If unsure.
    
    USER PROMPT: "${userPrompt}"
    
    Return JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: systemPrompt,
            config: { responseMimeType: "application/json", responseSchema: actionSchema }
        });
        if(response.text) return JSON.parse(response.text) as DirectorAction;
        return null;
    } catch (e) { console.error(e); return null; }
};

// --- FINANCE ANALYST AI ---
export const analyzeFinanceData = async (transactions: FinanceItem[], query: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "Erro de conexão.";
    const ai = new GoogleGenAI({ apiKey });

    // Minimize token usage by stripping unnecessary fields if list is huge
    const dataStr = JSON.stringify(transactions.map(t => ({ d: t.description, a: t.amount, t: t.type, c: t.category, dt: t.date })));

    const prompt = `
    ROLE: Financial Analyst.
    DATA (JSON): ${dataStr}
    
    USER QUERY: "${query}"
    
    INSTRUCTIONS:
    1. Analyze the JSON data to answer the user.
    2. Calculate totals, margins, or specific items if asked.
    3. Be concise and professional. Use formatting (bold/bullet points).
    4. If the user asks for insights, identify trends (e.g., "High spending on Software").
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return response.text || "Sem resposta.";
    } catch (e) { return "Erro ao analisar dados financeiros."; }
};

export const parseFinanceFile = async (text: string): Promise<FinanceItem[]> => {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    const ai = new GoogleGenAI({ apiKey });

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                type: { type: Type.STRING, enum: ['income', 'expense'] },
                date: { type: Type.STRING },
                category: { type: Type.STRING },
                status: { type: Type.STRING, enum: ['paid', 'pending'] }
            }
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Extract financial transactions from this text/csv content. Convert to JSON. Current Date: ${new Date().toISOString()}. CONTENT: \n${text.substring(0, 30000)}`,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        if(response.text) {
            const items = JSON.parse(response.text);
            return items.map((i: any) => ({...i, id: Date.now().toString() + Math.random()}));
        }
        return [];
    } catch(e) { console.error(e); return []; }
};
