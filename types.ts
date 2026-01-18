
export interface Slide {
  slideNumber: number;
  title: string;
  content: string;
  visualDescription: string;
  imagePrompt: string;
  layoutSuggestion: SlideLayoutType;
  generatedBackground?: string;
}

export enum SlideLayoutType {
    FULL_IMAGE_OVERLAY = 'Imagem Fundo Total',
    SPLIT_TOP_IMAGE = 'Divisão: Imagem Topo',
    TYPOGRAPHIC_CENTER = 'Foco Tipográfico',
    MINIMAL_ICON = 'Minimalista com Ícone'
}

export interface CarouselData {
  topic: string;
  overview: string;
  referenceAnalysis?: string;
  slides: Slide[];
  sources?: string[];
}

export interface CreativeVariation {
  id: number;
  conceptTitle: string; 
  marketingAngle: string; 
  visualPrompt: string;
  colorPaletteSuggestion: string;
  fontStyle: 'sans' | 'serif' | 'mono' | 'display';
  layoutMode: 'centered' | 'left-aligned' | 'bold-frame';
  generatedImage?: string; 
  isProductVariation?: boolean;
  generatedVideo?: string;
  predictionScore: number;
  predictionLabel: 'Viral' | 'High' | 'Medium' | 'Low';
  predictionReason: string;
}

export interface CreativeData {
    topic: string;
    variations: CreativeVariation[];
}

export interface GenerationConfig {
  slideCount: number;
  tone: ToneType;
  styleCategory: StyleCategory; 
  style: string; 
  customStylePrompt?: string; 
  brandColor?: string; 
  goal: CarouselGoal; 
  inputType: 'topic' | 'content' | 'product';
  customTheme?: string;
  includePeople: boolean;
  referenceImage?: string;
  characterStyle?: CharacterStyleType;
  aspectRatio?: '1:1' | '9:16' | '16:9';
  layoutMode?: string; 
  audience?: string;
  productUrl?: string;
  productImageUrl?: string;
  productName?: string;
  brandVoiceSample?: string;
}

// --- MOTION / VEO TYPES ---

export enum MotionMode {
  STUDIO = 'Chat Studio',
  MAPS = 'Geo Maps',
  DATA = 'Data Motion',
  TYPOGRAPHY = 'Kinetic Typo', // NEW
  TEMPLATES = 'Templates'
}

export enum MotionStyle {
  HERA_EVOLUTION = 'Hera Evolution (Fluido/Cinematic)', // NEW
  KINETIC_TYPO = 'Kinetic Typography (Apple Style)', // NEW
  CINEMATIC = 'Cinematic Standard',
  PHOTOREALISTIC = 'Photorealistic',
  ANIMATED_3D = '3D Animation',
  CYBERPUNK = 'Cyberpunk/Glitch',
  MINIMALIST = 'Clean/Minimalist',
  VINTAGE = 'Vintage/Film Grain',
  DRONE = 'Drone/Aerial',
  MACRO = 'Macro/Close-up',
  INFOGRAPHIC = 'Infographic/Corporate', 
  SATELLITE = 'Satellite/Google Earth'   
}

export enum MotionVisualTheme {
  DARK = 'Dark Mode',
  LIGHT = 'Light Mode',
  NEON = 'Neon',
  NATURE = 'Nature',
  CORPORATE = 'Corporate',
  ABSTRACT = 'Abstract'
}

export type MotionAspectRatio = '16:9' | '9:16';

export interface MotionConfig {
  mode: MotionMode;
  topic: string;
  style: MotionStyle;
  visualTheme: MotionVisualTheme;
  aspectRatio: MotionAspectRatio;
  fps: '30' | '60';
  resolution: '1080p' | '4K';
  // Map Specifics
  mapStart?: string;
  mapEnd?: string;
  mapStyle?: 'Satellite' | 'Vector' | '3D Relief';
  mapDataExplosion?: boolean; // NEW: Controls the specific VFX
  // Data Specifics
  chartType?: 'Bar' | 'Line' | 'Pie' | 'Floating UI';
  chartData?: string;
  // Typography Specifics
  typoText?: string;
}

export interface MotionChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    videoUri?: string; // If the message resulted in a video
    attachment?: string; // Base64 image
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

export enum StyleCategory {
  COMMERCIAL = 'Comercial & E-commerce',
  BRANDING = 'Branding & Negócios',
  SOCIAL = 'Social Media',
  CREATIVE = 'Criativo & Artístico',
  NICHE = 'Nichos Específicos',
  COMMUNICATION = 'Comunicação Visual',
  LAYOUT = 'Estrutura & Layout',
  TRENDS = 'Tendências Modernas',
  ADS = 'Anúncios & Ads',
  EMOTIONAL = 'Emocional & Conexão'
}

export enum VisualStyleType {
  CUSTOM = 'Personalizado (Prompt)', 
  MINIMAL_DARK = 'Minimalista Dark',
  GRADIENT_TECH = 'Gradiente Tech',
  CLEAN_LIGHT = 'Clean Light',
  NEO_BRUTALISM = 'Neo-Brutalismo',
  THREE_D_CARTOON = '3D Cartoon'
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
  style: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ToastNotification {
    id: string;
    type: 'success' | 'error' | 'info' | 'loading';
    message: string;
}
