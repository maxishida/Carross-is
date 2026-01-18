
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { getApiKey } from "./ai/core";
import { AgencyProposal } from "../types";

export * from "./ai/core";
export * from "./ai/text";
export * from "./ai/image";
export * from "./ai/video";
export * from "./ai/audio";

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
