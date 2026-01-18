
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
  knowledgeBaseContent?: string; // NEW: Store RAG text content
  knowledgeBaseFileName?: string; // NEW: Store filename
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
  mapDataExplosion?: boolean;
  // Data Specifics
  chartType?: 'Bar' | 'Line' | 'Pie' | 'Floating UI';
  chartData?: string;
  // Typo Specifics
  typoText?: string;
  // Intelligence Features (NEW)
  useThinking?: boolean;
  useGrounding?: 'none' | 'googleSearch' | 'googleMaps';
  // Reference Images (NEW)
  referenceImages?: string[]; // Array of Base64 strings
}

// New Interface to store Video Asset for Extension
export interface GeneratedVeoData {
    uri: string;
    asset: any; // The raw video asset object from Gemini API required for extension
}

export interface MotionScene {
    id: string;
    videoData: GeneratedVeoData;
    prompt: string;
    thumbnail?: string;
    duration: number; // usually 5s or 8s
}

export interface MotionChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    videoData?: GeneratedVeoData; // Changed from videoUri to videoData
    attachment?: string; // Base64 image or video
    attachmentType?: 'image' | 'video'; // NEW
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

// --- AGENCY OS DASHBOARD TYPES ---
export interface AgencyTask {
    id: string;
    title: string;
    client: string;
    status: 'backlog' | 'progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    teamMembers: string[]; // IDs
    deadline?: string; // ISO Date string
    notificationSent?: boolean;
    description?: string;
    estimatedHours?: number; // New: for workload calculation
    isBlocked?: boolean; // New: Block status
    blockReason?: string; // New: Reason for blockage
}

export interface AgencyMetric {
    label: string;
    value: string;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    color: 'red' | 'green' | 'orange' | 'blue';
}

// --- NEW MANAGEMENT TYPES ---

export interface Lead {
    id: string;
    companyName: string;
    contactPerson: string;
    value: number;
    status: 'new' | 'contacted' | 'proposal' | 'negotiation' | 'closed' | 'lost';
    lastContact: string;
    probability: number; // 0-100
}

export interface ProjectPhase {
    name: string;
    status: 'pending' | 'active' | 'completed';
    progress: number;
}

// NEW: Library for Projects
export interface LibraryItem {
    id: string;
    name: string;
    type: 'image' | 'video' | 'doc' | 'folder';
    url?: string; // If file
    createdAt: string;
    size?: string;
    tags?: string[];
}

// NEW: Finance Config for Projects
export interface ProjectFinanceConfig {
    totalValue: number;
    paymentStatus: 'paid' | 'partial' | 'pending';
    installments: number;
    nextPaymentDate?: string;
}

export interface Project {
    id: string;
    name: string;
    client: string;
    deadline: string;
    progress: number; // 0-100
    status: 'active' | 'review' | 'completed' | 'blocked';
    thumbnail?: string; // Project cover or preview
    members: string[]; // IDs of team members
    contextFile?: string; // Content of PDF/TXT attached
    contextFileName?: string;
    phases: ProjectPhase[];
    description?: string;
    library?: LibraryItem[]; // NEW: Asset Library
    finance?: ProjectFinanceConfig; // NEW: Finance Settings
}

export interface FinanceItem {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    status: 'paid' | 'pending' | 'overdue';
    date: string;
    category: string;
}

export interface Allocation {
    id: string;
    projectId: string;
    projectName: string;
    role: string; // Specific role in this project (e.g. Lead Dev)
    hoursPerWeek: number;
    startDate?: string;
    endDate?: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    avatar: string;
    activeProjects: number; // Legacy, can calculate from allocations
    capacity: number; // Weekly capacity in hours (default 40)
    allocations: Allocation[]; // New: Project assignments
    workload: number; // 0-100% (Calculated)
    status: 'online' | 'busy' | 'offline';
    skills: string[];
    bio?: string;
    email?: string;
}

// --- CALENDAR TYPES ---
export interface CalendarEvent {
    id: string;
    title: string;
    start: string; // ISO String
    end: string; // ISO String
    type: 'meeting' | 'task' | 'deadline' | 'other';
    projectId?: string; // Link to project
    description?: string;
    attendees?: string[]; // IDs of team members
}

// --- AGENCY PROPOSAL AI TYPES ---
export interface ProposalOption {
    name: string; // e.g. "Basic", "Growth", "Enterprise"
    price: string;
    timeline: string;
    techStack: string[];
    features: string[];
    isRecommended?: boolean;
}

export interface SuggestedRole {
    role: string;
    seniority: 'Junior' | 'Mid' | 'Senior';
    allocation: string; // e.g. "20h/mês"
}

export interface AgencyProposal {
    clientName: string;
    executiveSummary: string;
    teamStructure: SuggestedRole[];
    options: ProposalOption[];
    nextSteps: string;
}

// --- AI DIRECTOR COMMANDS ---
export interface DirectorAction {
    action: 'create_task' | 'create_event' | 'schedule_meeting' | 'create_project' | 'analyze_finance' | 'audit_schedule' | 'unknown';
    data?: any;
    reply: string;
}