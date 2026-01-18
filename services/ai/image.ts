
import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "./core";

const QUALITY_MODIFIERS = "8k resolution, cinematic lighting, depth of field, photorealistic, highly detailed, ray tracing, professional photography, unreal engine 5 render";

export const analyzeImageStyle = async (base64Image: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "";
    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: "Analise esta imagem e crie um prompt de design detalhado." }
                ]
            }
        });
        return response.text || "";
    } catch (error) { return ""; }
};

export const generateSocialImage = async (prompt: string, aspectRatio: '1:1' | '9:16' | '16:9' = '1:1'): Promise<string | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    try {
        const finalPrompt = prompt.toLowerCase().includes('8k') ? prompt : `${prompt}, ${QUALITY_MODIFIERS}`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: { parts: [{ text: finalPrompt }] },
            config: { imageConfig: { aspectRatio: aspectRatio } }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
             if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
    } catch (error) { return null; }
}

export const editSocialImage = async (imageBase64: string, editPrompt: string, assetBase64?: string, options?: any): Promise<string | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    const modelName = options?.usePro || options?.upscale || options?.expandToStory ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    const config: any = {};
    if (options?.upscale) config.imageConfig = { imageSize: '2K' };
    if (options?.expandToStory) config.imageConfig = { aspectRatio: '9:16' };
    
    try {
        const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const parts: any[] = [{ inlineData: { mimeType: 'image/png', data: cleanBase64 } }];
        let instruction = `Edit this image. ${editPrompt}. Maintain style.`;
        if (options?.upscale) instruction += " Upscale to high resolution.";
        if (options?.expandToStory) instruction += " OUTPAINTING: Expand to 9:16.";
        if (assetBase64) {
             const cleanAsset = assetBase64.includes(',') ? assetBase64.split(',')[1] : assetBase64;
             parts.push({ inlineData: { mimeType: 'image/png', data: cleanAsset } });
             instruction += " Use attached asset.";
        }
        parts.push({ text: instruction });
        const response = await ai.models.generateContent({ model: modelName, contents: { parts: parts }, config: config });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
    } catch (error) { return null; }
}

export const analyzeVisualContent = async (base64Data: string, mimeType: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "API Key missing";
    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", // Best for visual understanding
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: cleanBase64 } },
                    { text: "Analyze this content in extreme detail for a motion graphics director. Identify the subject, lighting, colors, movement (if video), and key elements that can be animated. Be concise but technical." }
                ]
            }
        });
        return response.text || "Analysis failed.";
    } catch (e) {
        console.error("Visual Analysis Error", e);
        return "Could not analyze the visual content.";
    }
};
