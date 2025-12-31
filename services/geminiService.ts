import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CarouselData, CreativeData, GenerationConfig, VisualStyleType, CharacterStyleType, ToneType, CarouselGoal } from "../types";

// Helper to safely get API Key
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API Key not found in environment variables");
    return "";
  }
  return key;
};

// --- CAROUSEL SCHEMA ---
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

// --- CREATIVE VARIATIONS SCHEMA ---
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


// Internal helper to build system prompt
const buildSystemInstruction = (config: GenerationConfig): string => {
    const visualTheme = config.style === VisualStyleType.CUSTOM && config.customTheme 
        ? config.customTheme 
        : config.style;

    let visualStyleInstructions = "";
    switch (config.style) {
        case VisualStyleType.HAND_DRAWN:
            visualStyleInstructions = "ESTILO HAND-DRAWN/SKETCHNOTE: Use prompts que peçam 'paper background', 'hand-drawn doodles', 'red and black ink', 'sketchy lines'. Evite realismo. Crie uma estética de anotação de caderno.";
            break;
        case VisualStyleType.STORYBOARD:
            visualStyleInstructions = "ESTILO STORYBOARD: Divida a imagem em painéis de quadrinhos (comic book style). Use personagens consistentes em uma jornada sequencial. Estilo visual: 'Graphic Novel', 'Comic panels'.";
            break;
        case VisualStyleType.MAGAZINE:
            visualStyleInstructions = "ESTILO REVISTA/EDITORIAL: Use layout de design editorial sofisticado. 'High fashion photography', 'bold typography', 'pull quotes', 'editorial layout'.";
            break;
        case VisualStyleType.ICON_GRID:
            visualStyleInstructions = "ESTILO GRADE DE ÍCONES (3x4): Crie prompts para uma grade organizada de ícones. 'Grid layout', 'minimalist icons', 'organized pattern'. Ideal para fatos rápidos.";
            break;
        case VisualStyleType.QUOTE_CARD:
            visualStyleInstructions = "ESTILO CARTÃO DE CITAÇÃO: Foco em retrato de alta qualidade de um lado e espaço negativo sólido do outro para texto serifado elegante. 'Cinematic portrait', 'studio lighting', 'solid background for text'.";
            break;
        case VisualStyleType.NEO_BRUTALISM:
            visualStyleInstructions = "ESTILO NEO-BRUTALISMO: Cores vibrantes (amarelo, rosa choque), bordas grossas pretas, sombras duras, tipografia crua. 'Neo-brutalism', 'high contrast', 'raw aesthetics'.";
            break;
        case VisualStyleType.THREE_D_ISOMETRIC:
            visualStyleInstructions = "ESTILO 3D ISOMÉTRICO: Use prompts para renderizações 3D em perspectiva isométrica (ângulo alto). 'Isometric 3D render', 'clean studio lighting', 'soft shadows', 'floating elements', 'Blender 3D style', 'minimalist geometry'. Fundo clean.";
            break;
        case VisualStyleType.THREE_D_CLAYMORPHISM:
            visualStyleInstructions = "ESTILO 3D CLAYMORPHISM: Use prompts para estilo de massinha/argila macia. 'Clay material', 'soft rounded shapes', 'cute 3D characters', 'pastel colors', 'plasticine texture', 'stop motion feel', 'soft inflated look'.";
            break;
        case VisualStyleType.THREE_D_CARTOON:
            visualStyleInstructions = "ESTILO 3D CARTOON: Use prompts para estilo de desenho animado 3D vibrante e expressivo. 'Pixar/Disney style', 'vibrant saturated colors', 'exaggerated features', 'expressive characters', 'smooth rendering', 'fun atmosphere', '3D illustration'.";
            break;
        default:
             visualStyleInstructions = "Estilo Visual Geral: " + visualTheme;
    }

    let peopleInstruction = "";
    
    if (config.referenceImage) {
        const style = config.characterStyle || CharacterStyleType.REALISTIC;
        peopleInstruction = `
        **PROTOCOLO DE CONSISTÊNCIA DE PERSONAGEM (CRÍTICO)**:
        1. Analise a imagem fornecida (rosto, cabelo, acessórios, etnia, idade).
        2. Crie um prompt descritivo base para este personagem.
        3. Para CADA slide, reutilize as características físicas exatas desse personagem.
        4. APLIQUE O ESTILO VISUAL: **${style}**.
           - Se for 'Pixar 3D', transforme a pessoa da foto em um personagem 3D fofo.
           - Se for 'Anime', transforme a pessoa em anime.
           - Se for 'Realista', mantenha a fidelidade fotográfica.
        
        Todos os prompts de imagem DEVEM começar descrevendo este personagem específico realizando a ação do slide.
        `;
    } else if (config.includePeople) {
        peopleInstruction = "INCLUA PESSOAS GENÉRICAS: Os prompts de imagem DEVEM descrever pessoas ou avatares interagindo com elementos.";
    } else {
        peopleInstruction = "SEM PESSOAS: Mantenha o foco em design gráfico abstrato, ícones 3D, tipografia cinética e objetos.";
    }

    // New Tone Logic
    let toneInstruction = `Tom de voz: "${config.tone}".`;
    if (config.tone === ToneType.CREATIVE) {
        toneInstruction = `Tom de voz: "Criativo". Combine elementos de persuasão com um toque artístico e imaginativo. Use metáforas, analogias e linguagem sensorial para descrever conceitos.`;
    }

    // Goal Strategy Logic
    let goalInstruction = "";
    switch (config.goal) {
        case CarouselGoal.SALES:
            goalInstruction = "OBJETIVO: VENDAS. Use framework PAS (Problema, Agitação, Solução). O ÚLTIMO slide DEVE ter um CTA claro de 'Link na Bio' ou 'Compre Agora'.";
            break;
        case CarouselGoal.ENGAGEMENT:
            goalInstruction = "OBJETIVO: ENGAJAMENTO. Faça perguntas provocativas. O ÚLTIMO slide deve pedir para comentar uma opinião específica.";
            break;
        case CarouselGoal.VIRAL:
            goalInstruction = "OBJETIVO: VIRALIDADE. Use 'hooks' polêmicos ou contraintuitivos no início. O ÚLTIMO slide deve incentivar o compartilhamento com 'quem precisa ler isso'.";
            break;
        case CarouselGoal.GROWTH:
            goalInstruction = "OBJETIVO: SEGUIDORES. Entregue valor denso que faça a pessoa sentir que 'precisa' te seguir para não perder mais. CTA final: 'Siga para mais dicas'.";
            break;
        case CarouselGoal.AUTHORITY:
        default:
            goalInstruction = "OBJETIVO: AUTORIDADE. Mostre profundidade técnica e experiência. CTA final: 'Salve para consultar depois'.";
            break;
    }

    return `
    Você é um sistema multiagente de elite para criação visual (Nano Banana Pro) e textual.
    
    ESTRATÉGIA DE CONTEÚDO:
    - ${goalInstruction}
    - ${toneInstruction}
    - Mantenha o texto dos slides conciso e impactante.
    
    DIRETRIZES VISUAIS:
    - **Regra de Estilo**: ${visualStyleInstructions}
    - **Regra de Personagens**: ${peopleInstruction}
    - Crie prompts focando em alta fidelidade (Unreal Engine 5, Octane Render, 8k).
    `;
}

export const generateCarousel = async (
  input: string,
  config: GenerationConfig
): Promise<CarouselData | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = buildSystemInstruction(config);

  try {
    let requestContent: any;
    
    const textPrompt = config.inputType === 'content' 
        ? `FONTE DE CONTEÚDO: "${input}"\nTAREFA: Transforme isso em um carrossel educativo de ${config.slideCount} slides.`
        : `Gere um carrossel completo sobre o tema: ${input}`;

    // Handle Multimodal (Image + Text) Input
    if (config.referenceImage) {
        // Extract base64 part (remove data:image/jpeg;base64, prefix if present)
        const base64Data = config.referenceImage.includes(',') 
            ? config.referenceImage.split(',')[1] 
            : config.referenceImage;
            
        requestContent = {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                { text: textPrompt }
            ]
        };
    } else {
        requestContent = textPrompt;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: requestContent,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: carouselSchema,
        temperature: 0.7,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as CarouselData;
    }
    return null;
  } catch (error) {
    console.error("Error generating carousel:", error);
    throw error;
  }
};

export const generateCreativeVariations = async (
    topic: string,
    config: GenerationConfig
): Promise<CreativeData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemInstruction(config);

    const promptText = `
    TEMA DO CRIATIVO: "${topic}"
    FORMATO: ${config.aspectRatio || '1:1'}

    TAREFA: Gere 6 VARIAÇÕES VISUAIS TOTALMENTE DISTINTAS para este tema.
    
    Eu preciso de diversidade para testes A/B. Gere as seguintes variações:
    1. Variação 1: Foco Minimalista (Clean, tipografia, pouco ruído)
    2. Variação 2: Foco em Lifestyle/Humano (Pessoas usando, emoção)
    3. Variação 3: Foco no Produto/Objeto (Macro, detalhes, 3D render)
    4. Variação 4: Abstrato/Conceitual (Metáforas visuais, gradientes)
    5. Variação 5: Estilo Editorial/Revista (Tipografia bold, layout assimétrico)
    6. Variação 6: Alta Energia/Vibrante (Cores fortes, movimento, neon)

    Retorne apenas o JSON.
    `;

    try {
        let requestContent: any;

        // Handle Image Injection for Creatives too
        if (config.referenceImage) {
             const base64Data = config.referenceImage.includes(',') 
            ? config.referenceImage.split(',')[1] 
            : config.referenceImage;

            requestContent = {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: promptText + "\n\n Use a pessoa da imagem como protagonista nas variações Lifestyle e Editorial." }
                ]
            };
        } else {
            requestContent = promptText;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: requestContent,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: creativeSchema,
                temperature: 0.85, // Higher temp for more creativity variety
            },
        });

        if (response.text) {
            return JSON.parse(response.text) as CreativeData;
        }
        return null;
    } catch (error) {
        console.error("Error generating creatives:", error);
        throw error;
    }
}

export const refineCarousel = async (
    currentData: CarouselData,
    instruction: string,
    config: GenerationConfig
): Promise<CarouselData | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;
  
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemInstruction(config);

    const prompt = `
    DADOS ATUAIS (JSON):
    ${JSON.stringify(currentData)}
    INSTRUÇÃO: "${instruction}"
    TAREFA: Refaça o JSON aplicando as mudanças.
    `;

    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: carouselSchema,
          },
        });
    
        if (response.text) {
          return JSON.parse(response.text) as CarouselData;
        }
        return null;
      } catch (error) {
        console.error("Error refining carousel:", error);
        throw error;
      }
}

export const chatWithAssistant = async (
    message: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "Erro de configuração: API Key ausente.";

    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            history: history,
            config: {
                systemInstruction: `
                Você é o "Co-piloto Criativo". Ajude com ideias de carrosséis e criativos únicos.
                `
            }
        });

        const result = await chat.sendMessage({ message });
        return result.text || "Desculpe, não consegui processar sua resposta.";
    } catch (error) {
        console.error("Chat Error:", error);
        return "Tive um problema ao conectar com o servidor de IA. Tente novamente.";
    }
}