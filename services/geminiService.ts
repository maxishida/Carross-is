
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { CarouselData, CreativeData, GenerationConfig, VisualStyleType, CharacterStyleType, ToneType, CarouselGoal, MotionConfig, MotionStyle, SlideLayoutType, MotionAspectRatio } from "../types";

// Helper to safely get API Key
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API Key not found in environment variables");
    return "";
  }
  return key;
};

// --- AUDIO CONTEXT SINGLETON ---
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

// Base64 decoding helper
const decodeBase64ToArrayBuffer = (base64: string) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// --- CONSTANTES DE QUALIDADE VISUAL ---
const QUALITY_MODIFIERS = "8k resolution, cinematic lighting, depth of field, photorealistic, highly detailed, ray tracing, professional photography, unreal engine 5 render";

// --- ESTRATÉGIAS DE COPYWRITING ---
const GOAL_INSTRUCTIONS: Record<CarouselGoal, string> = {
    [CarouselGoal.GROWTH]: "STRATEGY: Pattern Interrupt. Slide 1: Shocking/Controversial Hook. Slide 2: Retention. Final: 'Save' CTA.",
    [CarouselGoal.SALES]: "STRATEGY: Aggressive Sales (AIDA). Slide 1: Pain Point. Slide 2: Why current methods fail. Slide 3: Unique Mechanism. Final: Urgent Purchase CTA.",
    [CarouselGoal.ENGAGEMENT]: "STRATEGY: Tribalism. Use 'Us vs Them'. Ask questions that force comments.",
    [CarouselGoal.AUTHORITY]: "STRATEGY: Expert/Deep Dive. Use data, charts, and proprietary terms. Establish leadership.",
    [CarouselGoal.VIRAL]: "STRATEGY: Relatability. 'Me in real life'. Fast visual humor."
};

// --- DICIONÁRIO DE ESTILOS VISUAIS ---
export const STYLE_PROMPT_MAP: Record<string, string> = {
    // COMERCIAIS
    "Neon Tech": "dark background, glowing purple and blue neon lights, futuristic UI elements, high contrast, cyber aesthetic",
    "Cyber Promo": "aggressive digital aesthetic, glitch effects, bold typography, high energy, neon green and black, futuristic HUD",
    "Premium Black & Gold": "luxurious black texture background, metallic gold accents, serif typography, elegant lighting, premium product showcase",
    "Oferta Explosiva": "vibrant red and yellow, dynamic motion blur, 3D particles, impact text, exciting atmosphere",
    "Flash Sale Dinâmica": "fast motion, bright electric colors, lightning bolts, countdown aesthetic, urgent visual style",
    "Desconto Minimalista": "clean solid background, huge bold typography percent signs, plenty of white space, modern swiss design",
    "Vitrine 3D": "3D podium, studio lighting, soft shadows, pastel colors, clean product display environment",
    "Produto Flutuante": "anti-gravity effect, levitating objects, soft clouds or abstract shapes, dreamy lighting, focus on center",
    "Tech Clean": "white and silver palette, glass textures, soft blue glow, modern technology feel, apple aesthetic",
    "Marketplace Moderno": "colorful grid layout, soft rounded corners, playful icons, user interface elements, app store vibe",
    // (Other styles omitted for brevity, logic handles existing map)
    "Branding Minimal": "lots of negative space, neutral colors (beige, grey, white), sophisticated sans-serif fonts, gallery look",
    "Luxo Sofisticado": "rich velvet textures, deep jewel tones (emerald, sapphire), classic elegance, cinematic lighting",
};

// --- SCHEMAS ---
const carouselSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING },
    referenceAnalysis: { type: Type.STRING },
    overview: { type: Type.STRING },
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          slideNumber: { type: Type.INTEGER },
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          visualDescription: { type: Type.STRING },
          imagePrompt: { 
              type: Type.STRING, 
              description: "Prompt visual EXTREMAMENTE DETALHADO em Inglês. Deve incluir: Descrição da cena + Estilo Visual (do mapa) + Iluminação (ex: cinematic, volumetric) + Detalhes técnicos (8k, depth of field, ray tracing)." 
          },
          layoutSuggestion: { 
              type: Type.STRING, 
              enum: [
                  SlideLayoutType.FULL_IMAGE_OVERLAY, 
                  SlideLayoutType.SPLIT_TOP_IMAGE, 
                  SlideLayoutType.TYPOGRAPHIC_CENTER, 
                  SlideLayoutType.MINIMAL_ICON
              ]
          }
        },
        required: ["slideNumber", "title", "content", "visualDescription", "imagePrompt", "layoutSuggestion"]
      }
    }
  },
  required: ["topic", "referenceAnalysis", "overview", "slides"]
};

const creativeSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        topic: { type: Type.STRING },
        variations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER },
                    conceptTitle: { type: Type.STRING },
                    marketingAngle: { type: Type.STRING },
                    visualPrompt: { type: Type.STRING, description: "Prompt visual para gerar uma imagem DE FUNDO. Deve incluir termos como '8k', 'cinematic lighting', 'depth of field'." },
                    colorPaletteSuggestion: { type: Type.STRING, description: "CSS Linear Gradient valid string" },
                    fontStyle: { type: Type.STRING, enum: ['sans', 'serif', 'mono', 'display'] },
                    layoutMode: { type: Type.STRING, enum: ['centered', 'left-aligned', 'bold-frame'] },
                    predictionScore: { type: Type.INTEGER },
                    predictionLabel: { type: Type.STRING, enum: ['Viral', 'High', 'Medium', 'Low'] },
                    predictionReason: { type: Type.STRING }
                },
                required: ["id", "conceptTitle", "marketingAngle", "visualPrompt", "colorPaletteSuggestion", "fontStyle", "layoutMode", "predictionScore", "predictionLabel", "predictionReason"]
            }
        }
    },
    required: ["topic", "variations"]
};

// --- API FUNCTIONS ---

// ... (Existing image functions: analyzeImageStyle, generateSocialImage, editSocialImage - unchanged logic, kept for context) ...
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

// --- TEXT TO SPEECH (TTS) ---
export const generateAndPlaySpeech = async (text: string): Promise<void> => {
    const apiKey = getApiKey();
    if (!apiKey || !text) return;
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (base64Audio) {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }
            
            const arrayBuffer = decodeBase64ToArrayBuffer(base64Audio);
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start(0);
        }
    } catch (error) {
        console.error("Error generating speech:", error);
        throw error;
    }
}

// --- NEW MOTION FUNCTIONS & PROMPT ENGINEERING ---

// 1. GEO MAPS PROMPT BUILDER
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

// 2. CHART/DATA PROMPT BUILDER
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

// 3. TYPOGRAPHY PROMPT BUILDER
export const generateTypographyPrompt = (text: string): string => {
    return `
    Kinetic Typography Animation.
    TEXT: "${text}".
    STYLE: Apple Keynote style, bold sans-serif fonts, vibrant colors.
    ACTION: Text emerges from digital glitch, floating particles, deep 3D depth.
    CAMERA: Slow push in, dynamic lighting shifts. 60fps, high fidelity.
    `;
};

// 4. VISUAL UNDERSTANDING (VIDEO & IMAGE)
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

// 5. CHAT REFINEMENT AGENT (THE "ROUTER")
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

export const generateVeoVideo = async (prompt: string, style: MotionStyle = MotionStyle.CINEMATIC, aspectRatio: MotionAspectRatio = '16:9'): Promise<string | null> => {
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

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
             const separator = videoUri.includes('?') ? '&' : '?';
             return `${videoUri}${separator}key=${apiKey}`;
        }
        return null;

    } catch (error) {
        console.error("Error generating Veo video:", error);
        throw error;
    }
};

export const generateVeoFromImage = async (imageBase64: string, description: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview', // MUST use fast for image-to-video currently per docs/prompt
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
        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) return `${videoUri}&key=${apiKey}`;
        return null;
    } catch (error) { return null; }
}

// ... (Rest of existing functions unchanged: researchTopic, generateCarousel, etc.) ...
export const researchTopic = async (topic: string, audience?: string): Promise<{ text: string, sources: string[] }> => {
    const apiKey = getApiKey();
    if (!apiKey) return { text: "", sources: [] };
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Research: "${topic}"${audience ? ` audience: ${audience}` : ''}.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
        });
        const text = response.text || "";
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter((u: string) => !!u) || [];
        return { text, sources };
    } catch (e) { return { text: "", sources: [] }; }
}

export const generateCarousel = async (input: string, config: GenerationConfig, researchContext?: string): Promise<CarouselData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    
    const marketingStrategy = GOAL_INSTRUCTIONS[config.goal] || GOAL_INSTRUCTIONS[CarouselGoal.AUTHORITY];
    const selectedStyleName = config.style;
    const styleDescription = STYLE_PROMPT_MAP[selectedStyleName] || `Visual style: ${selectedStyleName}`;
    const visualInstructionBlock = (config.style === 'Personalizado (Prompt)' && config.customStylePrompt)
        ? `CUSTOM VISUAL: "${config.customStylePrompt}"`
        : `VISUAL STYLE: "${selectedStyleName}"\nRULES: ${styleDescription}`;

    const instructions = `
    TASK: Create a ${config.slideCount}-slide carousel.
    INPUT: "${input}"
    STRATEGY: ${marketingStrategy}
    LAYOUT: ${config.layoutMode}
    ${researchContext ? `RESEARCH: ${researchContext}` : ''}
    ${visualInstructionBlock}
    IMPORTANT: Append "${QUALITY_MODIFIERS}" to every image prompt.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: instructions,
            config: { responseMimeType: "application/json", responseSchema: carouselSchema, temperature: 0.5 },
        });
        if (response.text) return JSON.parse(response.text) as CarouselData;
        return null;
    } catch (error) { throw error; }
};

export const generateCreativeVariations = async (topic: string, config: GenerationConfig): Promise<CreativeData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    const selectedStyleName = config.style;
    const styleDescription = STYLE_PROMPT_MAP[selectedStyleName] || `Visual style: ${selectedStyleName}`;

    let promptText = `
        TOPIC: "${topic}".
        STYLE: "${selectedStyleName}" (${styleDescription})
        TASK: Generate 6 creative variations with marketing angles and visual prompts.
        Include 'predictionScore' (0-100) for CTR performance.
        MANDATORY: Append "${QUALITY_MODIFIERS}" to visualPrompt.
    `;
    
    if (config.inputType === 'product') {
        promptText = `
        PRODUCT: "${config.productName || topic}".
        CONTEXT: "${config.productUrl}".
        STYLE: "${selectedStyleName}".
        TASK: Generate 6 product photography background concepts.
        Visual prompts must allow empty space for product placement.
        Include 'predictionScore'.
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: promptText,
            config: { responseMimeType: "application/json", responseSchema: creativeSchema, temperature: 0.8 },
        });
        if (response.text) return JSON.parse(response.text) as CreativeData;
        return null;
    } catch (error) { throw error; }
};

export const refineCarousel = async (currentData: CarouselData, instruction: string, config: GenerationConfig): Promise<CarouselData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `DATA: ${JSON.stringify(currentData)}\nINSTRUCTION: ${instruction}`,
              config: { responseMimeType: "application/json", responseSchema: carouselSchema },
        });
        if (response.text) return JSON.parse(response.text) as CarouselData;
        return null;
    } catch (error) { throw error; }
};

export const rewriteSlideContent = async (text: string, tone: string = 'Profissional', brandVoice?: string): Promise<string | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    let prompt = `Rewrite: "${text}". Tone: ${tone}. Concise.`;
    if (brandVoice) prompt += ` Mimic voice: "${brandVoice}".`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
        return response.text || text;
    } catch (error) { return null; }
}

export const chatWithAssistant = async (message: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[]): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "";
    const ai = new GoogleGenAI({ apiKey });
    try {
        const chat = ai.chats.create({ model: "gemini-3-flash-preview", history });
        const result = await chat.sendMessage({ message });
        return result.text || "";
    } catch (error) { return "Error connecting."; }
};

// NEW: Enhance Prompt Helper (Simple)
export const enhanceMotionPrompt = async (userInput: string): Promise<string> => {
     // Reuses the logic from refineMotionChat but for a single input
     return refineMotionChat([{ role: 'user', content: userInput }]);
}
