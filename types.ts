
export interface Slide {
  slideNumber: number;
  title: string;
  content: string;
  visualDescription: string;
  imagePrompt: string;
  layoutSuggestion: SlideLayoutType;
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
}

export interface CreativeData {
    topic: string;
    variations: CreativeVariation[];
}

export interface GenerationConfig {
  slideCount: number;
  tone: ToneType;
  styleCategory: StyleCategory; // NOVO: Categoria macro
  style: string; // Alterado para string para aceitar a lista dinâmica
  customStylePrompt?: string; 
  brandColor?: string; 
  goal: CarouselGoal; 
  inputType: 'topic' | 'content'; 
  customTheme?: string;
  includePeople: boolean;
  referenceImage?: string;
  characterStyle?: CharacterStyleType;
  aspectRatio?: '1:1' | '9:16' | '16:9';
}

// --- MOTION / VEO TYPES ---

export enum MotionType {
  TEXT_ONLY = 'motion_text_only',
  IMAGE_ONLY = 'image_motion_only',
  MIXED = 'mixed_motion'
}

export enum MotionStyle {
  SMOOTH = 'Smooth (Suave)',
  FAST_PUNCHY = 'Fast & Punchy (Rápido)',
  CINEMATIC = 'Cinematic (Cinematográfico)',
  MINIMAL = 'Minimal (Minimalista)',
  LUXURY = 'Luxury (Luxuoso)',
  DRAMATIC = 'Dramatic (Dramático)',
  SLOW_MOTION = 'Slow Motion (Câmera Lenta)',
  GLITCH = 'Glitch / Cyberpunk',
  WIPE = 'Wipe Transition (Transição)'
}

export enum MotionVisualTheme {
  DARK = 'Dark Mode',
  CLEAN_LIGHT = 'Clean Light',
  TECH_GRADIENT = 'Tech Gradient',
  BRUTALIST = 'Brutalist',
  NEON_GLASS = 'Neon Glass'
}

export interface MotionConfig {
  topic: string;
  type: MotionType;
  style: MotionStyle;
  visualTheme: MotionVisualTheme;
  platform: 'Instagram' | 'LinkedIn' | 'Ads';
}

export interface MotionResult {
  script: string; 
  videoUri?: string; 
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

// Novas Categorias para organizar a lista gigante
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

// Mapeamento dos estilos antigos para compatibilidade, se necessário, mas focaremos nas strings dinâmicas
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
