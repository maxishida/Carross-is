
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

// --- DICIONÁRIO DE ESTILOS VISUAIS (O "CÉREBRO" DE DESIGN) ---
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
        // Enforcing Quality Modifiers if not present
        const finalPrompt = prompt.toLowerCase().includes('8k') 
            ? prompt 
            : `${prompt}, ${QUALITY_MODIFIERS}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: {
                parts: [{ text: finalPrompt }]
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
    expandToStory?: boolean; // New for outpainting
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
    const modelName = options?.usePro || options?.upscale || options?.expandToStory
        ? 'gemini-3-pro-image-preview' 
        : 'gemini-2.5-flash-image';

    // CONFIG LOGIC
    const config: any = {};
    if (options?.upscale) {
        config.imageConfig = {
            imageSize: '2K' // Only available in Pro model
        };
    }
    if (options?.expandToStory) {
        config.imageConfig = {
            aspectRatio: '9:16' // Force story ratio
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
        } 
        
        if (options?.expandToStory) {
            instruction += " OUTPAINTING TASK: Expand this square image into a vertical 9:16 format (Story). Generate the missing top and bottom parts seamlessly to match the existing background scene. Keep the main subject centered.";
        }

        if (!options?.upscale && !options?.expandToStory) {
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
             const separator = videoUri.includes('?') ? '&' : '?';
             return `${videoUri}${separator}key=${apiKey}`;
        }
        return null;

    } catch (error) {
        console.error("Error generating Veo video:", error);
        throw error;
    }
};

// NEW: Generate Veo from Image (Creative Director Persona)
export const generateVeoFromImage = async (imageBase64: string, description: string): Promise<string | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    // Director Persona Prompt Construction
    const prompt = `
    Agente: Diretor de Criação Cinematográfica.
    
    Ação: Animar esta imagem estática em um vídeo de 8 segundos.
    
    Descrição da Cena: "${description}"
    
    Diretrizes:
    - Mantenha extrema fidelidade visual à imagem fornecida.
    - Crie um movimento sutil e cinematográfico (slow motion, parallax, ou iluminação dinâmica).
    - O vídeo deve parecer uma extensão viva da imagem.
    - Foco em realismo, fluidez e alto impacto visual.
    `;

    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: cleanBase64,
                mimeType: 'image/png' // Assuming PNG
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9' // Default cinematic aspect ratio
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
        console.error("Error generating Veo from Image:", error);
        throw error;
    }
}

// NEW: Research Agent using Google Search
export const researchTopic = async (topic: string, audience?: string): Promise<{ text: string, sources: string[] }> => {
    const apiKey = getApiKey();
    if (!apiKey) return { text: "", sources: [] };
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Pesquise informações relevantes, dados, estatísticas recentes e tendências sobre: "${topic}"${audience ? ` focado no público: ${audience}` : ''}. Traga pontos chaves de autoridade.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        
        const text = response.text || "";
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((c: any) => c.web?.uri)
            .filter((u: string) => !!u) || [];

        return { text, sources };
    } catch (e) {
        console.error("Research failed", e);
        return { text: "", sources: [] };
    }
}

export const generateCarousel = async (input: string, config: GenerationConfig, researchContext?: string): Promise<CarouselData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    
    const marketingStrategy = GOAL_INSTRUCTIONS[config.goal] || GOAL_INSTRUCTIONS[CarouselGoal.AUTHORITY];
    
    // LOOKUP THE STYLE PROMPT from our dictionary
    const selectedStyleName = config.style;
    const styleDescription = STYLE_PROMPT_MAP[selectedStyleName] || `Visual style: ${selectedStyleName}`;

    // CONCISE VISUAL INSTRUCTIONS
    const visualInstructionBlock = (config.style === 'Personalizado (Prompt)' && config.customStylePrompt)
        ? `CUSTOM VISUAL: "${config.customStylePrompt}"`
        : `VISUAL STYLE: "${selectedStyleName}"\nSTYLE RULES: ${styleDescription}`;
    
    // BRAND VOICE CLONING INJECTION
    let systemPersona = "ROLE: Expert Social Media Strategist & Art Director.";
    if (config.brandVoiceSample) {
        systemPersona = `
        ROLE: Brand Voice Clone.
        INSTRUCTION: Analyze and strictly mimic the tone, vocabulary, and emoji usage of this sample:
        "${config.brandVoiceSample}"
        `;
    }

    let instructions = `
    ${systemPersona}
    TASK: Create a ${config.slideCount}-slide carousel.

    [PROJECT DATA]
    INPUT: "${input}"
    AUDIENCE: ${config.audience || 'General'}
    GOAL: ${config.goal}
    STRATEGY: ${marketingStrategy}
    ${config.layoutMode ? `PREFERRED LAYOUT: ${config.layoutMode}` : ''}
    ${researchContext ? `RESEARCH: ${researchContext}` : ''}
    
    [VISUAL DIRECTIVES]
    ${visualInstructionBlock}
    
    CRITICAL FOR 'imagePrompt':
    1. Start with the specific subject/scene description.
    2. Incorporate the VISUAL STYLE.
    3. MANDATORY: Append these quality boosters to EVERY prompt: "${QUALITY_MODIFIERS}".
    4. Ensure the prompt describes a BACKGROUND scene (leave center/side empty for text overlay).
    `;

    if (config.referenceImage) {
        instructions += `
    REFERENCE IMAGE: Integrate the subject of the attached image into the generated backgrounds.
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
                systemInstruction: "You are a specialized Social Media AI Agent.",
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

    let promptText = "";
    
    // E-COMMERCE / PRODUCT MODE LOGIC
    if (config.inputType === 'product' && config.productImageUrl) {
         promptText = `
         ATUE COMO UM AGENTE DE "PRODUCT PHOTOGRAPHY AI" E "MARKETING WRAPPER".
         
         PRODUTO: "${config.productName || topic}"
         URL DE REFERÊNCIA (CONTEXTO): "${config.productUrl || 'N/A'}"
         ESTILO VISUAL DO FUNDO: "${selectedStyleName}" (Baseado em: ${styleDescription})
         
         SUA MISSÃO:
         1. Crie copys de venda persuasivas para este produto (marketingAngle, conceptTitle).
         2. GERE UM 'visualPrompt' PARA O FUNDO DA FOTO DO PRODUTO.
            - O prompt deve criar um Cenario/Podium/Fundo que combine com o produto.
            - IMPORTANTE: O prompt DEVE pedir explicitamente um espaço vazio no CENTRO ou LEVEMENTE ACIMA para inserirmos a foto do produto depois.
            - Exemplo: "A minimal geometric podium in a pastel pink room, soft lighting, empty space on top of podium for product placement, ${QUALITY_MODIFIERS}".
            - NÃO GERE O PRODUTO NO PROMPT. GERE APENAS O CENÁRIO (BACKGROUND).
            - SEMPRE INCLUA: "${QUALITY_MODIFIERS}".
         
         Gere 6 variações de ângulos de marketing e cenários para este produto.
         `;
    } else {
        // STANDARD TOPIC MODE
        promptText = `
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
           - OBRIGATÓRIO: Termine todo prompt com: "${QUALITY_MODIFIERS}".
        
        Gere 6 variações ÚNICAS dentro deste estilo visual.
        `;
    }

    let requestContent: any = promptText;
    
    // Pass image context if available (Product Image or Reference Image)
    const imageToAnalyze = (config.inputType === 'product' && config.productImageUrl) ? config.productImageUrl : config.referenceImage;

     if (imageToAnalyze) {
        const base64Data = imageToAnalyze.includes(',') ? imageToAnalyze.split(',')[1] : imageToAnalyze;
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