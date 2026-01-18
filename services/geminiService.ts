
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { getApiKey } from "./ai/core";

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
