
import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "./core";
import { GeneratedVeoData, MotionConfig, MotionStyle, MotionAspectRatio } from "../../types";

export const generateMapPrompt = (start: string, end: string, style: string, isExplosion: boolean): string => {
    let prompt = `
    Cinematic top-down 3D Map sequence.
    LOCATION: From ${start} to ${end}.
    CAMERA: Orbital flyover with smooth parallax (Google Earth Studio style).
    STYLE: ${style}, photorealistic textures, 45-degree angle.
    `;
    
    if (isExplosion) {
        prompt += `
        ACTION: As camera arrives at ${end}, trigger a 'MOTION DATA EXPLOSION'.
        VFX: Glowing neon pins emerge from the ground, expanding into floating holographic 3D bar charts and data lines.
        ATMOSPHERE: Cyber-overlay, global illumination, neon blue and cyan data points.
        `;
    } else {
        prompt += `
        ACTION: Smooth zoom in towards the destination.
        VFX: Highlight the travel path with a glowing golden line.
        `;
    }
    
    prompt += ` TECH: 8k resolution, 60fps, motion blur, highly detailed.`;
    return prompt;
};

export const generateDataPrompt = (chartType: string, dataDescription: string, theme: string): string => {
    return `
    Professional Motion Graphics Data Visualization.
    TYPE: Animated ${chartType}.
    DATA: ${dataDescription}.
    STYLE: ${theme} (Hera Evolution style, clean, 3D depth).
    ACTION: Elements animate with easy-ease curves. 3D tracking text.
    DETAILS: 4k resolution, cinematic lighting, glass textures.
    `;
};

export const generateTypographyPrompt = (text: string): string => {
    return `
    Kinetic Typography Animation.
    TEXT: "${text}".
    STYLE: Apple Keynote style, bold sans-serif fonts, vibrant colors.
    ACTION: Text emerges from digital glitch, floating particles, deep 3D depth.
    CAMERA: Slow push in, dynamic lighting shifts. 60fps, high fidelity.
    `;
};

export const refineMotionChat = async (
    history: {role: string, content: string, attachment?: string, attachmentType?: 'image'|'video'}[],
    config?: MotionConfig
): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "";
    const ai = new GoogleGenAI({ apiKey });

    // --- INTELLIGENCE ROUTER ---
    let model = "gemini-3-flash-preview"; // Default fast
    let tools: any[] | undefined = undefined;
    let thinkingConfig: any | undefined = undefined;
    let systemInstruction = `
    ATUE COMO: "Motion Director AI", especialista em Motion Design e Vídeo (Veo 3.1).
    MISSÃO: Criar prompts de vídeo cinematográficos.
    ESTILO: "Hera Evolution" (Fluido, Parallax, Dados Neon).
    OUTPUT: Apenas o prompt técnico em Inglês.
    `;

    // 1. Thinking Mode (Deep Reasoning)
    if (config?.useThinking) {
        model = "gemini-3-pro-preview";
        thinkingConfig = { thinkingBudget: 32768 }; // MAX THINKING
        systemInstruction += "\nTHINKING MODE: ON. Analyze the user request deeply to construct the perfect scene composition before outputting the prompt.";
    }

    // 2. Maps Grounding (Real Location Data)
    else if (config?.useGrounding === 'googleMaps') {
        model = "gemini-2.5-flash"; // Required for Maps
        tools = [{ googleMaps: {} }];
        systemInstruction += "\nACCESS: Google Maps. If the user mentions a place, use the tool to get real details (coordinates, visual surroundings) and incorporate them into the prompt for realism.";
    }

    // 3. Search Grounding (Real Time Trends)
    else if (config?.useGrounding === 'googleSearch') {
        model = "gemini-3-flash-preview"; // Good for Search
        tools = [{ googleSearch: {} }];
        systemInstruction += "\nACCESS: Google Search. If the user mentions a recent event or trend, use the tool to find visual details and include them in the prompt.";
    }

    // Process history to handle attachments (Image or Video)
    const contents = [
        { role: 'user', parts: [{ text: systemInstruction }] } // Inject system prompt
    ];
    
    for (const msg of history) {
        const parts: any[] = [{ text: msg.content }];
        if (msg.attachment) {
            const cleanBase64 = msg.attachment.includes(',') ? msg.attachment.split(',')[1] : msg.attachment;
            const mimeType = msg.attachmentType === 'video' ? 'video/mp4' : 'image/png';
            parts.push({ inlineData: { mimeType: mimeType, data: cleanBase64 } });
        }
        contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: parts
        });
    }

    try {
        const reqConfig: any = {};
        if (tools) reqConfig.tools = tools;
        if (thinkingConfig) reqConfig.thinkingConfig = thinkingConfig;

        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: reqConfig
        });
        
        // Log grounding metadata if available
        if (response.candidates?.[0]?.groundingMetadata) {
            console.log("Grounding Used:", response.candidates[0].groundingMetadata);
        }

        return response.text || "";
    } catch (e) {
        console.error("Refinement error", e);
        return history[history.length-1].content; // Fallback
    }
};

export const enhanceMotionPrompt = async (userInput: string): Promise<string> => {
     // Reuses the logic from refineMotionChat but for a single input
     return refineMotionChat([{ role: 'user', content: userInput }]);
}

export const generateVeoVideo = async (prompt: string, style: MotionStyle = MotionStyle.CINEMATIC, aspectRatio: MotionAspectRatio = '16:9'): Promise<GeneratedVeoData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    // "Hera Evolution" demands quality -> Use standard model
    const model = 'veo-3.1-generate-preview'; 

    const ai = new GoogleGenAI({ apiKey });

    try {
        let operation = await ai.models.generateVideos({
            model: model, 
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); 
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const videoAsset = operation.response?.generatedVideos?.[0]?.video;
        const videoUri = videoAsset?.uri;
        
        if (videoUri) {
             const separator = videoUri.includes('?') ? '&' : '?';
             return {
                 uri: `${videoUri}${separator}key=${apiKey}`,
                 asset: videoAsset
             };
        }
        return null;

    } catch (error) {
        console.error("Error generating Veo video:", error);
        throw error;
    }
};

export const generateVeoWithReferences = async (prompt: string, images: string[]): Promise<GeneratedVeoData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    if (images.length === 0 || images.length > 3) {
        console.error("Veo 3.1 supports between 1 and 3 reference images.");
        return null;
    }

    try {
        const referenceImagesPayload = [];
        for (const imgBase64 of images) {
            const cleanBase64 = imgBase64.includes(',') ? imgBase64.split(',')[1] : imgBase64;
            referenceImagesPayload.push({
                image: {
                    imageBytes: cleanBase64,
                    mimeType: 'image/png', 
                },
                referenceType: 'ASSET',
            });
        }

        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview', 
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                referenceImages: referenceImagesPayload,
                resolution: '720p', 
                aspectRatio: '16:9' 
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); 
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const videoAsset = operation.response?.generatedVideos?.[0]?.video;
        const videoUri = videoAsset?.uri;
        
        if (videoUri) {
            return {
                uri: `${videoUri}&key=${apiKey}`,
                asset: videoAsset
            };
        }
        return null;
    } catch (error) { 
        console.error("Veo Reference Generation Error:", error);
        throw error; 
    }
}

export const generateVeoFromImage = async (imageBase64: string, description: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<GeneratedVeoData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview', 
            prompt: description,
            image: {
                imageBytes: cleanBase64,
                mimeType: 'image/png' 
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); 
            operation = await ai.operations.getVideosOperation({operation: operation});
        }
        const videoAsset = operation.response?.generatedVideos?.[0]?.video;
        const videoUri = videoAsset?.uri;
        
        if (videoUri) {
            return {
                uri: `${videoUri}&key=${apiKey}`,
                asset: videoAsset
            };
        }
        return null;
    } catch (error) { return null; }
}

export const extendVeoVideo = async (previousVideoAsset: any, prompt: string): Promise<GeneratedVeoData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt: prompt,
            video: previousVideoAsset,
            config: {
                numberOfVideos: 1,
                resolution: '720p', 
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); 
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const videoAsset = operation.response?.generatedVideos?.[0]?.video;
        const videoUri = videoAsset?.uri;

        if (videoUri) {
             const separator = videoUri.includes('?') ? '&' : '?';
             return {
                 uri: `${videoUri}${separator}key=${apiKey}`,
                 asset: videoAsset
             };
        }
        return null;

    } catch (error) {
        console.error("Error extending Veo video:", error);
        throw error;
    }
};
