
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { getApiKey } from "./core";
import { CarouselData, CreativeData, GenerationConfig, CarouselGoal, SlideLayoutType, ToneType } from "../../types";

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
    "Branding Minimal": "lots of negative space, neutral colors (beige, grey, white), sophisticated sans-serif fonts, gallery look",
    "Luxo Sofisticado": "rich velvet textures, deep jewel tones (emerald, sapphire), classic elegance, cinematic lighting",
};

const QUALITY_MODIFIERS = "8k resolution, cinematic lighting, depth of field, photorealistic, highly detailed, ray tracing, professional photography, unreal engine 5 render";

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
              description: "Extremely detailed visual prompt in English. MUST include: 1. Scene description relative to content. 2. Specific visual style details defined in rules. 3. Technical keywords: '8k resolution', 'cinematic lighting', 'depth of field', 'photorealistic', 'ray tracing'." 
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

    CRITICAL: For the 'imagePrompt' field in each slide, you MUST write a highly descriptive prompt in English that includes:
    1. A clear description of the scene or abstract visualization suitable for the slide's content.
    2. Specific details from the selected VISUAL STYLE (${selectedStyleName}).
    3. Mandatory professional photography keywords: "8k resolution", "cinematic lighting", "depth of field", "photorealistic", "highly detailed", "ray tracing".
    
    Ensure variety in the prompts while maintaining consistency in the visual style.
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
