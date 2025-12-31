export interface Slide {
  slideNumber: number;
  title: string;
  content: string;
  visualDescription: string;
  imagePrompt: string;
  layoutSuggestion: string;
}

export interface CarouselData {
  topic: string;
  overview: string;
  slides: Slide[];
}

export interface CreativeVariation {
  id: number;
  conceptTitle: string; // ex: "Abordagem Minimalista"
  marketingAngle: string; // ex: "Foco na dor do cliente"
  visualPrompt: string;
  colorPaletteSuggestion: string;
}

export interface CreativeData {
    topic: string;
    variations: CreativeVariation[];
}

export interface GenerationConfig {
  slideCount: number;
  tone: ToneType;
  style: VisualStyleType;
  goal: CarouselGoal; // New Field
  inputType: 'topic' | 'content'; 
  customTheme?: string;
  includePeople: boolean;
  referenceImage?: string;
  characterStyle?: CharacterStyleType;
  // Creative Specific
  aspectRatio?: '1:1' | '9:16' | '16:9';
}

export enum CarouselGoal {
  GROWTH = 'Crescimento (Seguidores)',
  SALES = 'Vendas / Conversão',
  ENGAGEMENT = 'Engajamento (Comentários)',
  AUTHORITY = 'Autoridade / Educação',
  VIRAL = 'Viralidade (Compartilhamentos)'
}

export enum ToneType {
  PROFESSIONAL = 'Profissional',
  CASUAL = 'Descontraído',
  EDUCATIONAL = 'Educativo',
  PERSUASIVE = 'Persuasivo',
  CREATIVE = 'Criativo'
}

export enum VisualStyleType {
  MINIMAL_DARK = 'Minimalista Dark',
  GRADIENT_TECH = 'Gradiente Tech',
  CLEAN_LIGHT = 'Clean Light',
  NEO_BRUTALISM = 'Neo-Brutalismo',
  RETRO_FUTURISM = 'Retrô Futurista',
  WATERCOLOR_MINIMAL = 'Aquarela Minimalista',
  HAND_DRAWN = 'Hand-Drawn (Sketch)',
  MAGAZINE = 'Editorial / Revista',
  STORYBOARD = 'Storyboard / HQs',
  ICON_GRID = 'Grade de Ícones',
  QUOTE_CARD = 'Cartões de Citação',
  THREE_D_ISOMETRIC = '3D Isométrico',
  THREE_D_CLAYMORPHISM = '3D Claymorphism',
  THREE_D_CARTOON = '3D Cartoon',
  CUSTOM = 'Personalizado'
}

export enum CharacterStyleType {
  REALISTIC = 'Fotorealista / Profissional',
  PIXAR_3D = '3D Cute (Estilo Pixar)',
  ANIME_MODERN = 'Anime Moderno (Shonen)',
  ANIME_RETRO = 'Anime Retro (Anos 90)',
  CLAY = 'Massinha / Claymation',
  CYBERPUNK = 'Cyberpunk / Futurista',
  FLAT_VECTOR = 'Vetor Flat (Corporate Memphis)',
  SKETCH = 'Esboço a Lápis / Artístico'
}

export interface HistoryItem {
  id: string;
  topic: string;
  slideCount: number;
  createdAt: string;
  style: VisualStyleType;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}