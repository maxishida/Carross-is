import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CarouselData, CreativeData, GenerationConfig, VisualStyleType, CharacterStyleType, ToneType, CarouselGoal, MotionConfig, MotionResult, MotionStyle } from "../types";

// Helper to safely get API Key
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API Key not found in environment variables");
    return "";
  }
  return key;
};

// --- MOTION DIRECTOR PROMPT ---
const MOTION_DIRECTOR_SYSTEM_INSTRUCTION = `
You are a Senior Motion Design Director AI, specialized in Kinetic Typography and SaaS-grade motion systems.
Your mission is to generate premium motion scenes based strictly on user inputs.

🔹 OUTPUT FORMAT (STRICT)
Return a detailed paragraph describing the video for a video generation model (Veo).
The description must be vivid, specifying camera movement, lighting, colors, and exactly what happens.
Focus on "Cinematic", "High Quality", "4k", "Professional Lighting".

Structure the prompt to include:
1. Visual Style & Colors (based on user theme)
2. Main Subject/Action (Image motion or Text content)
3. Camera Movement (Pan, Zoom, Push-in)
4. Atmosphere (Lighting, Mood)

IF MOTION_TEXT_ONLY: Describe the text appearing on screen with kinetic animation. Mention the font style and background.
IF IMAGE_MOTION_ONLY: Describe the scene vividly.
IF MIXED: Describe the scene with text overlay.

CONSTRAINTS:
- No logos, No watermarks.
- Keep text short and readable.
- High premium motion only.
`;

// --- SCHEMAS ---

const carouselSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING, description: "O tema refinado do carrossel" },
    overview: { type: Type.STRING, description: "Resumo da estratégia e público-alvo" },
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          slideNumber: { type: Type.INTEGER },
          title: { type: Type.STRING, description: "Título chamativo (máx 5 palavras)" },
          content: { type: Type.STRING, description: "Mensagem principal (1-2 frases)" },
          visualDescription: { type: Type.STRING, description: "Descrição visual (ícones, gráficos, layout)" },
          imagePrompt: { type: Type.STRING, description: "Prompt detalhado para geração de imagem no Nano Banana Pro" },
          layoutSuggestion: { type: Type.STRING, description: "Estilo de layout (ex: Checklist, Grade, Storyboard)" }
        },
        required: ["slideNumber", "title", "content", "visualDescription", "imagePrompt", "layoutSuggestion"]
      }
    }
  },
  required: ["topic", "overview", "slides"]
};

const creativeSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        topic: { type: Type.STRING },
        variations: {
            type: Type.ARRAY,
            description: "6 unique visual variations",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER },
                    conceptTitle: { type: Type.STRING, description: "Nome do conceito visual (ex: Minimalista, Lifestyle)" },
                    marketingAngle: { type: Type.STRING, description: "Por que esse visual funciona (gatilho mental)" },
                    visualPrompt: { type: Type.STRING, description: "Prompt de alta fidelidade para o Nano Banana Pro" },
                    colorPaletteSuggestion: { type: Type.STRING, description: "Sugestão de cores hex" }
                },
                required: ["id", "conceptTitle", "marketingAngle", "visualPrompt", "colorPaletteSuggestion"]
            }
        }
    },
    required: ["topic", "variations"]
};

// --- API FUNCTIONS ---

export const generateMotionConcept = async (config: MotionConfig): Promise<string | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    USER CONFIGURATION:
    Topic: ${config.topic}
    Motion Type: ${config.type}
    Motion Style: ${config.style}
    Visual Theme: ${config.visualTheme}
    Platform: ${config.platform}

    Generate the PROMPT SPECIFICATION for the video model.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: MOTION_DIRECTOR_SYSTEM_INSTRUCTION,
                temperature: 0.7,
            },
        });
        return response.text || null;
    } catch (error) {
        console.error("Error generating motion concept:", error);
        throw error;
    }
};

export const generateVeoVideo = async (prompt: string, style: MotionStyle = MotionStyle.CINEMATIC): Promise<string | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    // Use fast model for fast/punchy style, otherwise high quality
    const model = (style === MotionStyle.FAST_PUNCHY) 
        ? 'veo-3.1-fast-generate-preview' 
        : 'veo-3.1-generate-preview';

    const ai = new GoogleGenAI({ apiKey });

    try {
        console.log(`Starting generation with model: ${model}`);
        let operation = await ai.models.generateVideos({
            model: model, 
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        // Polling loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
            operation = await ai.operations.getVideosOperation({operation: operation});
            console.log("Polling Veo operation...");
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (videoUri) {
            // Append API key for playback as per documentation
            return `${videoUri}&key=${apiKey}`;
        }
        return null;

    } catch (error) {
        console.error("Error generating Veo video:", error);
        throw error;
    }
};

export const generateCarousel = async (input: string, config: GenerationConfig): Promise<CarouselData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `You are an AI for carousels. Style: ${config.style}. Tone: ${config.tone}. Goal: ${config.goal}`; 

    const textPrompt = config.inputType === 'content' 
        ? `FONTE: "${input}"\nTAREFA: Carrossel de ${config.slideCount} slides.`
        : `Tema: ${input}`;

    let requestContent: any = textPrompt;
    if (config.referenceImage) {
        const base64Data = config.referenceImage.includes(',') ? config.referenceImage.split(',')[1] : config.referenceImage;
        requestContent = { 
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Data } }, 
                { text: textPrompt }
            ] 
        };
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: requestContent,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: carouselSchema,
            },
        });

        if (response.text) return JSON.parse(response.text) as CarouselData;
        return null;
    } catch (error) {
        console.error("Error generating carousel:", error);
        throw error;
    }
};

export const generateCreativeVariations = async (topic: string, config: GenerationConfig): Promise<CreativeData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    
    const promptText = `TEMA: "${topic}". Gere 6 variações visuais.`;
    let requestContent: any = promptText;
     if (config.referenceImage) {
        const base64Data = config.referenceImage.includes(',') ? config.referenceImage.split(',')[1] : config.referenceImage;
        requestContent = { 
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Data } }, 
                { text: promptText }
            ] 
        };
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: requestContent,
            config: {
                responseMimeType: "application/json",
                responseSchema: creativeSchema,
            },
        });
        if (response.text) return JSON.parse(response.text) as CreativeData;
        return null;
    } catch (error) {
        console.error("Error generating creative variations:", error);
        throw error;
    }
};

export const refineCarousel = async (currentData: CarouselData, instruction: string, config: GenerationConfig): Promise<CarouselData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: `DADOS: ${JSON.stringify(currentData)}\nINSTRUÇÃO: ${instruction}`,
              config: { responseMimeType: "application/json", responseSchema: carouselSchema },
        });
        if (response.text) return JSON.parse(response.text) as CarouselData;
        return null;
    } catch (error) {
        console.error("Error refining carousel:", error);
        throw error;
    }
};

export const chatWithAssistant = async (message: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[]): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "";
    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const chat = ai.chats.create({ model: "gemini-2.5-flash", history });
        const result = await chat.sendMessage({ message });
        return result.text || "";
    } catch (error) {
        console.error("Error in chat assistant:", error);
        return "Sorry, I am having trouble connecting right now.";
    }
};