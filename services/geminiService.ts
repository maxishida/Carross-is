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

// --- DIRETRIZES DE MARKETING (GOAL-BASED) ---
const GOAL_INSTRUCTIONS: Record<CarouselGoal, string> = {
    [CarouselGoal.GROWTH]: "ESTRATÉGIA: Crescimento. Slide 1: QUEBRA DE PADRÃO (Imagem chocante + Título polêmico). Slide 2: Retenção. Slide Final: CTA de 'Salvar'.",
    [CarouselGoal.SALES]: "ESTRATÉGIA: VENDA AGRESSIVA. Slide 1: A DOR do cliente escancarada. Slide 2: Por que os métodos atuais falham. Slide 3: A Sua Solução (Mecanismo Único). Slide Final: CTA DE COMPRA IMEDIATA.",
    [CarouselGoal.ENGAGEMENT]: "ESTRATÉGIA: Tribalismo. Use 'Nós vs Eles'. Faça perguntas que obrigam a pessoa a responder.",
    [CarouselGoal.AUTHORITY]: "ESTRATÉGIA: Expert. Use dados, gráficos e termos proprietários. Mostre que você é o líder.",
    [CarouselGoal.VIRAL]: "ESTRATÉGIA: Relatabilidade. 'Eu na vida real'. Humor rápido e visual."
};

// --- SCHEMAS ---
const carouselSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING },
    referenceAnalysis: { type: Type.STRING, description: "DESCRIÇÃO DETALHADA DA IMAGEM DE REFERÊNCIA (Se houver). Descreva cabelo, olhos, roupa, acessórios." },
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
          imagePrompt: { type: Type.STRING, description: "Comece OBRIGATORIAMENTE com: 'A person [descrição da referência]...' se houver imagem." },
          layoutSuggestion: { type: Type.STRING }
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
                    visualPrompt: { type: Type.STRING },
                    colorPaletteSuggestion: { type: Type.STRING }
                },
                required: ["id", "conceptTitle", "marketingAngle", "visualPrompt", "colorPaletteSuggestion"]
            }
        }
    },
    required: ["topic", "variations"]
};

// --- MOTION DIRECTOR PROMPT ---
const MOTION_DIRECTOR_SYSTEM_INSTRUCTION = `
You are a Senior Motion Design Director AI.
Mission: Generate premium video prompts for Veo.
Strictly follow: Cinematic, 4k, Professional Lighting.
`;

// --- API FUNCTIONS ---

export const generateMotionConcept = async (config: MotionConfig): Promise<string | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    Create a prompt for Veo video generation.
    Topic: ${config.topic}
    Style: ${config.style}
    Theme: ${config.visualTheme}
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

    const model = (style === MotionStyle.FAST_PUNCHY || style === MotionStyle.GLITCH) 
        ? 'veo-3.1-fast-generate-preview' 
        : 'veo-3.1-generate-preview';

    const ai = new GoogleGenAI({ apiKey });

    try {
        let operation = await ai.models.generateVideos({
            model: model, 
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); 
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
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
    
    // SEPARAÇÃO LÓGICA: COPYWRITING vs DESIGN
    const marketingStrategy = GOAL_INSTRUCTIONS[config.goal] || GOAL_INSTRUCTIONS[CarouselGoal.AUTHORITY];
    
    // Determina a instrução visual: Preset ou Customizado?
    let visualInstructionBlock = "";
    if (config.style === VisualStyleType.CUSTOM && config.customStylePrompt) {
        visualInstructionBlock = `
        ====================================================
        🎨 DIRETRIZ VISUAL PERSONALIZADA (ALTA PRIORIDADE)
        ====================================================
        O usuário definiu um estilo PRÓPRIO. Ignore qualquer preset padrão.
        
        INSTRUÇÃO VISUAL EXATA: "${config.customStylePrompt}"
        
        Aplique essa estética (cores, ambiente, luz) em TODOS os prompts visuais ('imagePrompt').
        `;
    } else {
        visualInstructionBlock = `
        DIRETRIZ VISUAL: Estilo "${config.style}".
        `;
    }
    
    // Prompt extremamente diretivo
    let instructions = `
    VOCÊ É UM GERADOR DE CARROSSÉIS PROFISSIONAL.
    
    CONTEXTO DO PROJETO:
    - INPUT: "${input}"
    - TOM DE VOZ: ${config.tone}
    - QTD SLIDES: ${config.slideCount}
    
    ---------------------------------------------------
    🧠 1. REGRAS DE COPYWRITING (Controlado pelo Objetivo: ${config.goal})
    ---------------------------------------------------
    Sua estrutura de TEXTO (Titulo e Conteúdo) deve seguir estritamente esta estratégia:
    ${marketingStrategy}
    
    NÃO SEJA INFORMATIVO SE O OBJETIVO FOR VENDAS. SEJA PERSUASIVO.
    
    ---------------------------------------------------
    🎨 2. REGRAS DE DESIGN (Controlado pelo Estilo)
    ---------------------------------------------------
    ${visualInstructionBlock}
    `;

    if (config.referenceImage) {
        instructions += `
    
    📷 3. REGRAS DE PERSONAGEM (Imagem de Referência Detectada)
    ---------------------------------------------------
    1. PRIMEIRO: Analise a imagem. Preencha 'referenceAnalysis' com detalhes (cabelo, óculos, barba, roupa).
    2. SEGUNDO: Combine a PESSOA DA FOTO com o ESTILO VISUAL definido acima.
       Exemplo: "O homem da foto [descrição], em um fundo [SEU ESTILO VISUAL AQUI]..."
    
    NÃO REMOVA A PESSOA. NÃO IGNORE O ESTILO VISUAL PERSONALIZADO.
    `;
    } else {
        instructions += `
    Sem imagem de referência. Crie visuais baseados puramente no Estilo Visual definido.
    `;
    }

    const systemInstruction = `
    Você é uma IA híbrida: Copywriter de Elite + Diretor de Arte Criativo.
    Separe as tarefas:
    - O 'content' segue o OBJETIVO (${config.goal}).
    - O 'imagePrompt' segue o ESTILO VISUAL (${config.style === 'Personalizado (Prompt)' ? 'Custom' : config.style}).
    `;

    let requestContent: any = instructions;
    
    if (config.referenceImage) {
        const base64Data = config.referenceImage.includes(',') ? config.referenceImage.split(',')[1] : config.referenceImage;
        
        requestContent = { 
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Data } }, 
                { text: instructions }
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
                temperature: 0.4 // Temperatura média para permitir criatividade no visual customizado mas rigor no copy
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
              contents: `DADOS: ${JSON.stringify(currentData)}\nREFINAMENTO: ${instruction}`,
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