
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CarouselData, CreativeData, GenerationConfig, VisualStyleType, CharacterStyleType, ToneType, CarouselGoal, MotionConfig, MotionResult, MotionStyle, SlideLayoutType } from "../types";

// Helper to safely get API Key
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API Key not found in environment variables");
    return "";
  }
  return key;
};

// --- ESTRATÉGIAS DE COPYWRITING ---
const GOAL_INSTRUCTIONS: Record<CarouselGoal, string> = {
    [CarouselGoal.GROWTH]: "ESTRATÉGIA: Crescimento. Slide 1: QUEBRA DE PADRÃO (Imagem chocante + Título polêmico). Slide 2: Retenção. Slide Final: CTA de 'Salvar'.",
    [CarouselGoal.SALES]: "ESTRATÉGIA: VENDA AGRESSIVA. Slide 1: A DOR do cliente escancarada. Slide 2: Por que os métodos atuais falham. Slide 3: A Sua Solução (Mecanismo Único). Slide Final: CTA DE COMPRA IMEDIATA.",
    [CarouselGoal.ENGAGEMENT]: "ESTRATÉGIA: Tribalismo. Use 'Nós vs Eles'. Faça perguntas que obrigam a pessoa a responder.",
    [CarouselGoal.AUTHORITY]: "ESTRATÉGIA: Expert. Use dados, gráficos e termos proprietários. Mostre que você é o líder.",
    [CarouselGoal.VIRAL]: "ESTRATÉGIA: Relatabilidade. 'Eu na vida real'. Humor rápido e visual."
};

// --- DICIONÁRIO DE ESTILOS VISUAIS (O "CÉREBRO" DE DESIGN) ---
// Isso treina o modelo para saber exatamente o que cada nome significa visualmente.
export const STYLE_PROMPT_MAP: Record<string, string> = {
    // COMERCIAIS
    "Neon Tech": "dark background, glowing purple and blue neon lights, futuristic UI elements, high contrast, cyber aesthetic, 8k render",
    "Cyber Promo": "aggressive digital aesthetic, glitch effects, bold typography, high energy, neon green and black, futuristic HUD",
    "Premium Black & Gold": "luxurious black texture background, metallic gold accents, serif typography, elegant lighting, premium product showcase",
    "Oferta Explosiva": "vibrant red and yellow, dynamic motion blur, 3D particles, impact text, exciting atmosphere",
    "Flash Sale Dinâmica": "fast motion, bright electric colors, lightning bolts, countdown aesthetic, urgent visual style",
    "Desconto Minimalista": "clean solid background, huge bold typography percent signs, plenty of white space, modern swiss design",
    "Vitrine 3D": "3D podium, studio lighting, soft shadows, pastel colors, clean product display environment",
    "Produto Flutuante": "anti-gravity effect, levitating objects, soft clouds or abstract shapes, dreamy lighting, focus on center",
    "Tech Clean": "white and silver palette, glass textures, soft blue glow, modern technology feel, apple aesthetic",
    "Marketplace Moderno": "colorful grid layout, soft rounded corners, playful icons, user interface elements, app store vibe",

    // BRANDING
    "Branding Minimal": "lots of negative space, neutral colors (beige, grey, white), sophisticated sans-serif fonts, gallery look",
    "Luxo Sofisticado": "rich velvet textures, deep jewel tones (emerald, sapphire), classic elegance, cinematic lighting",
    "Corporativo Moderno": "navy blue and white, geometric shapes, professional stock photography style, clean lines, trustworthy",
    "Visual Institucional": "solid brand colors, watermark logos, structured grid, formal composition, clear hierarchy",
    "Startup Tech": "vibrant gradients (purple/orange), isometric illustrations, dark mode UI, dot patterns, innovative feel",
    "Clean Business": "white background, thin grey lines, blue accents, airy composition, organized and professional",
    "Profissional Elegante": "monochrome palette, sharp focus, high quality textures, executive look, confident",
    "Branding Futurista": "chrome textures, liquid metal shapes, iridescent colors, sci-fi minimalism, forward thinking",
    "Marca Premium": "matte finishes, spot gloss effects simulated, high contrast black and white, timeless design",
    "Estilo Editorial": "magazine layout, large serif headings, artistic photography cropping, fashion editorial vibe",

    // SOCIAL MEDIA
    "Carrossel Informativo": "clear card separations, bullet point icons, progress bars, readable typography, educational layout",
    "Post Educativo": "chalkboard or whiteboard aesthetic, doodle icons, arrows and diagrams, handwritten font elements",
    "Conteúdo de Valor": "high contrast text, simple abstract background shapes, focus on readability and data visualization",
    "Story Dinâmico": "vertical composition, kinetic typography, background video blur effect, engaging stickers look",
    "Reels Promocional": "fast paced visual rhythm, bold overlay text, motion blur background, trend aesthetic",
    "Feed Harmonizado": "consistent color filter, puzzle feed edges, soft continuous aesthetic, seamless pattern",
    "Destaque de Benefícios": "checkmarks, glowing highlights on key items, split screen comparison, persuasive visual cues",
    "Chamada para Ação": "arrows pointing to button, pulsing elements, high contrast button graphic, urgent visual flow",
    "Conteúdo Engajador": "meme-style layout, relatable imagery, question marks, conversation bubbles, interactive feel",
    "Post de Conversão": "trust badges, 5 star rating visuals, testimonial quotes design, guarantee seals, credible look",

    // CRIATIVOS
    "Futurista Neon": "synthwave aesthetic, retro sun, grid floor, pink and cyan neon, outrun style",
    "Estilo Metaverso": "3D avatars, virtual reality goggles, floating digital screens, purple haze, cyber environment",
    "Visual Holográfico": "translucent rainbow textures, iridescent foil, holographic stickers, futuristic shimmer",
    "Estética Cyberpunk": "night city rain, neon signs reflection, dystopian tech, cables and wires, gritty texture",
    "Arte Digital": "abstract fluid shapes, generative art patterns, vibrant ink splashes, creative composition",
    "Design 3D": "blender 3d style, clay render or glossy plastic, soft lighting, cute shapes, toy-like aesthetic",
    "Visual Isométrico": "3D isometric view, miniature world, blocky structures, clean vector look, sim city vibe",
    "Estilo UI/UX": "glassmorphism cards, blurred background, app interface buttons, user profile circles, modern dashboard",
    "Visual Gamer": "RGB lighting, dark background, angular geometric shapes, tech glitch, esports aesthetic",
    "Tech Dark Mode": "pure black background, dark grey cards, subtle white text, coding terminal aesthetic",

    // TENDÊNCIAS
    "Glassmorphism": "frosted glass cards, background blur, vivid background orbs, white borders, translucent layers",
    "Neumorphism": "soft extruded shapes, light shadows, tactile feel, monochromatic off-white, soft plastic look",
    "Dark UI": "charcoal grey surfaces, vivid accent colors, high contrast text, oled friendly, sleek interface",
    "Soft Gradient": "mesh gradients, pastel color blends, aurora borealis effect, soothing and calm background",
    "Bold Typography": "massive text filling the screen, tight letter spacing, brutalist layout, high impact",
    "Clean Tech": "circuit board lines, white minimalism, silver accents, laboratory clean look",
    "Visual Dinâmico": "speed lines, motion trails, tilted composition, action oriented, high energy",
    "High Contrast": "black and yellow or black and white, hazard stripes, warning aesthetic, attention grabbing",
    "Estética Minimal": "single object focus, vast empty space, bauhaus influence, geometric simplicity",
    "Visual Premium": "gold foil textures, silk fabric background, spotlight effect, museum display style",
    
    // NICHOS
    "Eletrônicos Premium": "sleek metal textures, blue LED lights, macro photography style, high tech gadget feel",
    "Moda Urbana": "streetwear vibe, graffiti textures, concrete background, flash photography style",
    "Beleza Estética": "soft skin tones, water ripples, floral elements, pastel pink and beige, spa atmosphere",
    "Fitness Moderno": "dynamic action freeze, sweat droplets, neon green or orange energy, gym texture background",
    "Imobiliário Luxo": "marble floors, architectural lines, golden hour lighting, wide angle expansive feel",
    "Restaurante Gourmet": "dark moody lighting, steam rising, warm wood textures, appetizing color palette",
    
    // EMOCIONAL
    "Storytelling Visual": "cinematic framing, emotional lighting, character focus, narrative sequence",
    "Inspiração": "sunrise colors, mountain peaks, wide open spaces, motivational atmosphere",
    "Humanizado": "warm lighting, candid photography style, genuine smiles, soft focus, approachable",
    "Autoridade": "library background, podium, books, deep blue and mahogany, serious and credible"
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
          imagePrompt: { type: Type.STRING, description: "Prompt visual fotográfico completo. Use termos como '8k', 'cinematic lighting', 'depth of field'." },
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
                    visualPrompt: { type: Type.STRING, description: "Prompt visual para gerar uma imagem DE FUNDO. Deve ter espaço negativo para texto." },
                    colorPaletteSuggestion: { type: Type.STRING, description: "CSS Linear Gradient valid string" },
                    fontStyle: { type: Type.STRING, enum: ['sans', 'serif', 'mono', 'display'] },
                    layoutMode: { type: Type.STRING, enum: ['centered', 'left-aligned', 'bold-frame'] }
                },
                required: ["id", "conceptTitle", "marketingAngle", "visualPrompt", "colorPaletteSuggestion", "fontStyle", "layoutMode"]
            }
        }
    },
    required: ["topic", "variations"]
};

// --- API FUNCTIONS ---

export const analyzeImageStyle = async (base64Image: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "";
    const ai = new GoogleGenAI({ apiKey });

    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", // Supports vision
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: "Analise esta imagem e crie um prompt de design detalhado para recriar este ESTILO exato. Foque em: Iluminação, Paleta de Cores, Textura, Composição e Vibe. Seja técnico (ex: 'cinematic lighting', 'bokeh', 'neon'). Retorne APENAS o prompt em inglês." }
                ]
            }
        });
        return response.text || "";
    } catch (error) {
        console.error("Error analyzing image style:", error);
        throw error;
    }
};

export const generateSocialImage = async (prompt: string, aspectRatio: '1:1' | '9:16' | '16:9' = '1:1'): Promise<string | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    try {
        const enhancedPrompt = `High quality, photorealistic or 3D render, trending on artstation. ${prompt}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: {
                parts: [{ text: enhancedPrompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
             if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
             }
        }
        return null;
    } catch (error) {
        console.error("Error generating social image:", error);
        return null;
    }
}

export interface EditImageOptions {
    usePro?: boolean;
    upscale?: boolean;
}

export const editSocialImage = async (
    imageBase64: string, 
    editPrompt: string, 
    assetBase64?: string,
    options?: EditImageOptions
): Promise<string | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    // MODEL SELECTION LOGIC
    // 'gemini-3-pro-image-preview' corresponds to "Nano Banana Pro" / High Quality
    // 'gemini-2.5-flash-image' corresponds to "Flash" / Standard
    const modelName = options?.usePro || options?.upscale 
        ? 'gemini-3-pro-image-preview' 
        : 'gemini-2.5-flash-image';

    // CONFIG LOGIC
    const config: any = {};
    if (options?.upscale) {
        config.imageConfig = {
            imageSize: '2K' // Only available in Pro model
        };
    }

    try {
        // Strip header if present
        const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        
        const parts: any[] = [
            { 
                inlineData: {
                    mimeType: 'image/png', // Assuming PNG for safety
                    data: cleanBase64
                }
            }
        ];

        let instruction = `Edit this image. ${editPrompt}. Maintain the original style and composition where possible.`;
        
        if (options?.upscale) {
            instruction += " Upscale to high resolution, 4k highly detailed, sharpen details.";
        } else {
             instruction += " High quality.";
        }

        if (assetBase64) {
             const cleanAsset = assetBase64.includes(',') ? assetBase64.split(',')[1] : assetBase64;
             parts.push({
                 inlineData: {
                     mimeType: 'image/png',
                     data: cleanAsset
                 }
             });
             instruction += " Use the second image provided as a reference asset (like a logo or object) to insert into the first image as requested.";
        }

        parts.push({ text: instruction });

        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: parts,
            },
            config: config
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error editing social image:", error);
        return null;
    }
}

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
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                systemInstruction: "You are a Senior Motion Design Director AI.",
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
    
    const marketingStrategy = GOAL_INSTRUCTIONS[config.goal] || GOAL_INSTRUCTIONS[CarouselGoal.AUTHORITY];
    
    // LOOKUP THE STYLE PROMPT from our dictionary
    const selectedStyleName = config.style;
    const styleDescription = STYLE_PROMPT_MAP[selectedStyleName] || `Visual style: ${selectedStyleName}`;

    let visualInstructionBlock = "";
    if (config.style === 'Personalizado (Prompt)' && config.customStylePrompt) {
        visualInstructionBlock = `
        VISUAL PERSONALIZADO: "${config.customStylePrompt}"
        `;
    } else {
        visualInstructionBlock = `
        ESTILO VISUAL SELECIONADO: "${selectedStyleName}"
        DIRETRIZES DE DESIGN ESTRITAS: ${styleDescription}
        Aplique esses conceitos visuais (iluminação, textura, cores) em TODOS os 'imagePrompt'.
        `;
    }
    
    let instructions = `
    VOCÊ É UM GERADOR DE CARROSSÉIS PROFISSIONAL.
    
    INPUT: "${input}"
    TOM DE VOZ: ${config.tone}
    QUANTIDADE DE SLIDES: ${config.slideCount}
    
    ---------------------------------------------------
    1. ESTRUTURA E COPYWRITING
    ---------------------------------------------------
    OBJETIVO: ${config.goal}
    ${config.layoutMode ? `FORMATO DE LAYOUT SUGERIDO: "${config.layoutMode}". Adapte o conteúdo para este formato.` : ''}
    
    ESTRATÉGIA DETALHADA:
    ${marketingStrategy}
    
    ---------------------------------------------------
    2. DESIGN & VISUAL (Fundamental)
    ---------------------------------------------------
    ${visualInstructionBlock}
    
    IMPORTANTE: No campo 'imagePrompt', descreva a imagem de fundo que será gerada pela IA. 
    Use termos artísticos (ex: 'bokeh', 'cinematic', 'minimalist', 'neon glow').
    `;

    if (config.referenceImage) {
        instructions += `
    IMAGEM DE REFERÊNCIA: Combine a pessoa da foto com o ESTILO VISUAL definido acima.
    `;
    }

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
            model: "gemini-3-flash-preview",
            contents: requestContent,
            config: {
                systemInstruction: "Você é um Diretor de Arte AI especializado em Social Media.",
                responseMimeType: "application/json",
                responseSchema: carouselSchema,
                temperature: 0.5 
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
    
    // Lookup Style
    const selectedStyleName = config.style;
    const styleDescription = STYLE_PROMPT_MAP[selectedStyleName] || `Visual style: ${selectedStyleName}`;

    const promptText = `
    ATUE COMO UM "AUTO DESIGNER AGENT".
    
    TEMA: "${topic}".
    ESTILO VISUAL ALVO: "${selectedStyleName}"
    
    DEFINIÇÃO VISUAL DO ESTILO (SIGA ESTRITAMENTE): 
    "${styleDescription}"
    
    SUA MISSÃO:
    1. Escolha a MELHOR 'fontStyle' (sans, serif, mono) para este estilo.
    2. Crie uma 'colorPaletteSuggestion' que combine com a descrição visual.
    3. GERE UM 'visualPrompt' OTIMIZADO PARA CRIAÇÃO DE IMAGEM (BACKGROUND).
       - O prompt deve descrever EXATAMENTE o estilo "${selectedStyleName}".
       - Deve pedir "espaço negativo" para o texto.
    
    Gere 6 variações ÚNICAS dentro deste estilo visual.
    `;

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
            model: "gemini-3-flash-preview", 
            contents: requestContent,
            config: {
                responseMimeType: "application/json",
                responseSchema: creativeSchema,
                temperature: 0.8,
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
              model: "gemini-3-flash-preview",
              contents: `DADOS ATUAIS: ${JSON.stringify(currentData)}\nINSTRUÇÃO DE REFINAMENTO: ${instruction}`,
              config: { responseMimeType: "application/json", responseSchema: carouselSchema },
        });
        if (response.text) return JSON.parse(response.text) as CarouselData;
        return null;
    } catch (error) {
        console.error("Error refining carousel:", error);
        throw error;
    }
};

export const rewriteSlideContent = async (text: string, context: string = 'Reescreva para ser mais impactante e curto'): Promise<string | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Texto original: "${text}". Contexto: ${context}. Me dê apenas a versão reescrita, sem aspas.`,
        });
        return response.text || text;
    } catch (error) {
        console.error("Error rewriting text:", error);
        return null;
    }
}


export const chatWithAssistant = async (message: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[]): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "";
    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const chat = ai.chats.create({ 
            model: "gemini-3-flash-preview", 
            history 
        });
        const result = await chat.sendMessage({ message });
        return result.text || "";
    } catch (error) {
        console.error("Error in chat assistant:", error);
        return "Sorry, I am having trouble connecting right now.";
    }
};
