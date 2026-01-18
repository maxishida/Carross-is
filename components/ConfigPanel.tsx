
import React, { useRef, useState, useEffect } from 'react';
import { GenerationConfig, ToneType, VisualStyleType, CharacterStyleType, CarouselGoal, StyleCategory } from '../types';
import { analyzeImageStyle, extractTextFromFile } from '../services/geminiService';

interface ConfigPanelProps {
  config: GenerationConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
  disabled: boolean;
  hideSlideCount?: boolean; 
}

const STYLES_BY_CATEGORY: Record<StyleCategory, string[]> = {
    [StyleCategory.COMMERCIAL]: ["Neon Tech", "Cyber Promo", "Premium Black & Gold", "Oferta Explosiva", "Flash Sale Dinâmica", "Desconto Minimalista", "Vitrine 3D", "Produto Flutuante", "Tech Clean", "Marketplace Moderno", "Personalizado (Prompt)"],
    [StyleCategory.BRANDING]: ["Branding Minimal", "Luxo Sofisticado", "Corporativo Moderno", "Visual Institucional", "Startup Tech", "Clean Business", "Profissional Elegante", "Branding Futurista", "Marca Premium", "Estilo Editorial"],
    [StyleCategory.SOCIAL]: ["Carrossel Informativo", "Post Educativo", "Conteúdo de Valor", "Story Dinâmico", "Reels Promocional", "Feed Harmonizado", "Destaque de Benefícios", "Chamada para Ação", "Conteúdo Engajador", "Post de Conversão"],
    [StyleCategory.CREATIVE]: ["Futurista Neon", "Estilo Metaverso", "Visual Holográfico", "Estética Cyberpunk", "Arte Digital", "Design 3D", "Visual Isométrico", "Estilo UI/UX", "Visual Gamer", "Tech Dark Mode"],
    [StyleCategory.TRENDS]: ["Glassmorphism", "Neumorphism", "Dark UI", "Soft Gradient", "Bold Typography", "Clean Tech", "Visual Dinâmico", "High Contrast", "Estética Minimal", "Visual Premium"],
    [StyleCategory.NICHE]: ["Eletrônicos Premium", "Moda Urbana", "Beleza Estética", "Fitness Moderno", "Imobiliário Luxo", "Restaurante Gourmet"],
    [StyleCategory.EMOTIONAL]: ["Storytelling Visual", "Inspiração", "Humanizado", "Autoridade"],
    [StyleCategory.COMMUNICATION]: ["Oferta Direta", "Comunicação Premium", "Copy Persuasiva"],
    [StyleCategory.LAYOUT]: ["Grid 3x3", "Post Único Impactante", "Design Vertical"],
    [StyleCategory.ADS]: ["Criativo de Conversão", "Anúncio de Produto", "Promoção Relâmpago"]
};

const LAYOUT_SUGGESTIONS: Record<CarouselGoal, Array<{ label: string, slides: number, icon: string, description: string }>> = {
    [CarouselGoal.GROWTH]: [
        { label: 'Post Único Impactante', slides: 1, icon: 'crop_square', description: 'Imagem única viral' },
        { label: 'Carrossel Curto', slides: 4, icon: 'view_week', description: 'Rápido (3-4 slides)' },
        { label: 'Twitter Thread', slides: 7, icon: 'format_list_bulleted', description: 'Narrativa longa' }
    ],
    [CarouselGoal.SALES]: [
        { label: 'Método AIDA', slides: 4, icon: 'ads_click', description: 'Atenção, Interesse, Desejo, Ação' },
        { label: 'Vitrine de Produto', slides: 3, icon: 'storefront', description: 'Destaque visual do produto' },
        { label: 'Quebra de Objeções', slides: 6, icon: 'verified_user', description: 'Prova social e garantia' }
    ],
    [CarouselGoal.ENGAGEMENT]: [
        { label: 'Lista/Checklist', slides: 5, icon: 'checklist', description: 'Salvável e prático' },
        { label: 'Quiz Interativo', slides: 4, icon: 'quiz', description: 'Pergunta e Resposta' },
        { label: 'Meme/Relatável', slides: 3, icon: 'sentiment_satisfied', description: 'Conexão rápida' }
    ],
    [CarouselGoal.AUTHORITY]: [
        { label: 'Deep Dive (Aula)', slides: 8, icon: 'school', description: 'Conteúdo denso' },
        { label: 'Passo a Passo', slides: 6, icon: 'format_list_numbered', description: 'Tutorial "Como fazer"' },
        { label: 'Estudo de Caso', slides: 5, icon: 'analytics', description: 'Análise de resultados' }
    ],
    [CarouselGoal.VIRAL]: [
        { label: 'Opinião Polêmica', slides: 3, icon: 'campaign', description: 'Gera debate' },
        { label: 'Antes x Depois', slides: 2, icon: 'compare_arrows', description: 'Transformação visual' },
        { label: 'Grid 3x3', slides: 9, icon: 'grid_view', description: 'Mosaico visual' }
    ]
};

// PRESET COLORS
const BRAND_PRESETS = [
    { color: '#6366f1', name: 'Indigo' },
    { color: '#a855f7', name: 'Purple' },
    { color: '#ec4899', name: 'Pink' },
    { color: '#f43f5e', name: 'Rose' },
    { color: '#ef4444', name: 'Red' },
    { color: '#f97316', name: 'Orange' },
    { color: '#eab308', name: 'Yellow' },
    { color: '#84cc16', name: 'Lime' },
    { color: '#22c55e', name: 'Green' },
    { color: '#10b981', name: 'Emerald' },
    { color: '#14b8a6', name: 'Teal' },
    { color: '#06b6d4', name: 'Cyan' },
    { color: '#0ea5e9', name: 'Sky' },
    { color: '#3b82f6', name: 'Blue' },
    { color: '#64748b', name: 'Slate' },
    { color: '#ffffff', name: 'White' },
];

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig, disabled, hideSlideCount }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kbInputRef = useRef<HTMLInputElement>(null); // Knowledge Base Input
  const [loadedDefaults, setLoadedDefaults] = useState(false);
  const [analyzingStyle, setAnalyzingStyle] = useState(false);
  const [readingKb, setReadingKb] = useState(false);
  
  // --- PERSISTENT BRAND KIT ---
  useEffect(() => {
      // Load Brand Kit from local storage on mount
      const savedKit = localStorage.getItem('user_brand_kit');
      if (savedKit) {
          try {
              const kit = JSON.parse(savedKit);
              setConfig(prev => ({
                  ...prev,
                  // Brand Identity
                  brandColor: kit.brandColor || prev.brandColor,
                  brandVoiceSample: kit.brandVoiceSample || prev.brandVoiceSample,
                  knowledgeBaseContent: kit.knowledgeBaseContent || prev.knowledgeBaseContent,
                  knowledgeBaseFileName: kit.knowledgeBaseFileName || prev.knowledgeBaseFileName,
                  
                  // Strategy
                  goal: kit.goal || prev.goal,
                  audience: kit.audience || prev.audience,
                  tone: kit.tone || prev.tone,
                  
                  // Visuals
                  styleCategory: kit.styleCategory || prev.styleCategory,
                  style: kit.style || prev.style,
                  aspectRatio: kit.aspectRatio || prev.aspectRatio,
                  includePeople: kit.includePeople ?? prev.includePeople,
                  characterStyle: kit.characterStyle || prev.characterStyle,
              }));
          } catch(e) { console.error("Erro ao carregar configurações salvas", e); }
      } else {
          // Default init if no save found
          if (!config.styleCategory) {
              setConfig(prev => ({ ...prev, styleCategory: StyleCategory.COMMERCIAL, style: STYLES_BY_CATEGORY[StyleCategory.COMMERCIAL][0] }));
          }
      }
      setLoadedDefaults(true);
  }, []);

  // Save Brand Kit whenever relevant config changes
  useEffect(() => {
      if (!loadedDefaults) return;
      
      const kitToSave = {
          brandColor: config.brandColor,
          styleCategory: config.styleCategory,
          style: config.style,
          tone: config.tone,
          audience: config.audience,
          brandVoiceSample: config.brandVoiceSample,
          knowledgeBaseContent: config.knowledgeBaseContent, // Save KB too
          knowledgeBaseFileName: config.knowledgeBaseFileName,
          goal: config.goal,
          aspectRatio: config.aspectRatio,
          includePeople: config.includePeople,
          characterStyle: config.characterStyle
      };
      localStorage.setItem('user_brand_kit', JSON.stringify(kitToSave));
  }, [
      config.brandColor, 
      config.styleCategory, 
      config.style, 
      config.tone, 
      config.audience, 
      config.brandVoiceSample, 
      config.knowledgeBaseContent,
      config.goal,
      config.aspectRatio,
      config.includePeople,
      config.characterStyle,
      loadedDefaults
  ]);

  const handleResetDefaults = () => {
      if(confirm("Deseja apagar suas preferências salvas e voltar ao padrão?")) {
          localStorage.removeItem('user_brand_kit');
          window.location.reload();
      }
  };


  const handleToneChange = (tone: ToneType) => {
    setConfig(prev => ({ ...prev, tone }));
  };
  
  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newGoal = e.target.value as CarouselGoal;
      setConfig(prev => ({ ...prev, goal: newGoal }));
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ 
            ...prev, 
            referenceImage: reader.result as string, 
            includePeople: true,
            characterStyle: prev.characterStyle || CharacterStyleType.REALISTIC
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setReadingKb(true);
      try {
          const text = await extractTextFromFile(file);
          if (text) {
              setConfig(prev => ({
                  ...prev,
                  knowledgeBaseContent: text,
                  knowledgeBaseFileName: file.name
              }));
          }
      } catch (e: any) {
          alert(e.message || "Erro ao ler arquivo");
      } finally {
          setReadingKb(false);
      }
  };
  
  const handleAnalyzeStyle = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!config.referenceImage) return;
      
      setAnalyzingStyle(true);
      try {
          const stylePrompt = await analyzeImageStyle(config.referenceImage);
          if (stylePrompt) {
              setConfig(prev => ({
                  ...prev,
                  styleCategory: StyleCategory.COMMERCIAL, // Fallback category
                  style: 'Personalizado (Prompt)',
                  customStylePrompt: stylePrompt
              }));
              alert("Estilo clonado com sucesso! O prompt personalizado foi atualizado.");
          }
      } catch (e) {
          console.error(e);
          alert("Falha ao analisar imagem.");
      } finally {
          setAnalyzingStyle(false);
      }
  };

  const removeImage = (e: React.MouseEvent) => {
      e.stopPropagation(); 
      setConfig(prev => ({ ...prev, referenceImage: undefined }));
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeKb = () => {
      setConfig(prev => ({ ...prev, knowledgeBaseContent: undefined, knowledgeBaseFileName: undefined }));
      if (kbInputRef.current) kbInputRef.current.value = '';
  };

  const applyLayout = (layout: { label: string, slides: number }) => {
      setConfig(prev => ({
          ...prev,
          slideCount: layout.slides,
          layoutMode: layout.label
      }));
  };

  const currentStyles = STYLES_BY_CATEGORY[config.styleCategory || StyleCategory.COMMERCIAL] || [];
  const suggestedLayouts = LAYOUT_SUGGESTIONS[config.goal || CarouselGoal.AUTHORITY] || [];

  return (
    <div className="bg-[#050511] lg:rounded-2xl border border-white/5 flex flex-col gap-6 p-6 h-fit max-h-[calc(100vh-100px)] lg:sticky top-6 shadow-2xl overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">tune</span>
            <h3 className="font-bold text-lg text-white font-display">Ultra Configuração</h3>
        </div>
        
        <button 
            onClick={handleResetDefaults}
            className="text-slate-500 hover:text-white transition-colors"
        >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
        </button>
      </div>

      {/* Goal Selector */}
      <div className="flex flex-col gap-2 shrink-0">
         <div className="flex justify-between items-center">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Objetivo do Carrossel
             </label>
             {loadedDefaults && (
                 <span className="text-[9px] text-green-500/80 flex items-center gap-1">
                     <span className="material-symbols-outlined text-[12px]">save</span>
                     Auto-save
                 </span>
             )}
         </div>
         <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                <span className="material-symbols-outlined text-[18px]">flag</span>
            </div>
            <select 
                className="w-full p-3 pl-10 text-xs text-white bg-[#0b0f19] border border-white/10 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary appearance-none font-medium transition-all group-hover:border-white/20"
                value={config.goal || CarouselGoal.AUTHORITY}
                onChange={handleGoalChange}
                disabled={disabled}
            >
                {Object.values(CarouselGoal).map((goal) => (
                    <option key={goal} value={goal} className="bg-[#0b0f19]">{goal}</option>
                ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none material-symbols-outlined text-[18px] text-slate-500">expand_more</span>
         </div>
      </div>

      {/* Audience Input */}
      <div className="flex flex-col gap-2 shrink-0">
         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Público Alvo
         </label>
         <input 
            type="text"
            className="w-full p-3 text-xs text-white bg-[#0b0f19] border border-white/10 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-600 outline-none transition-all hover:border-white/20"
            placeholder="Ex: Empreendedores, Designers..."
            value={config.audience || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, audience: e.target.value }))}
            disabled={disabled}
         />
      </div>

      {/* Brand Knowledge Base (RAG) */}
      <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Base de Conhecimento (RAG)
            </label>
            <span className="text-[9px] font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded tracking-wide">
                FEATURE #2
            </span>
          </div>
          
          {!config.knowledgeBaseContent ? (
              <div 
                onClick={() => !readingKb && kbInputRef.current?.click()}
                className={`h-16 border border-dashed border-white/10 bg-white/[0.02] rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all group ${disabled || readingKb ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                  {readingKb ? (
                      <span className="material-symbols-outlined animate-spin text-slate-500">sync</span>
                  ) : (
                      <span className="material-symbols-outlined text-slate-500 group-hover:text-emerald-400 transition-colors">upload_file</span>
                  )}
                  <p className="text-[9px] text-slate-500 group-hover:text-slate-300 transition-colors">{readingKb ? 'Processando...' : 'Upload PDF/TXT (Contexto)'}</p>
              </div>
          ) : (
              <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl group hover:border-emerald-500/40 transition-all">
                  <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <span className="material-symbols-outlined text-sm">description</span>
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-[10px] font-bold text-emerald-100 truncate max-w-[120px]">{config.knowledgeBaseFileName || 'Arquivo Carregado'}</span>
                        <span className="text-[9px] text-emerald-500/70">Contexto Ativo</span>
                      </div>
                  </div>
                  <button onClick={removeKb} className="text-emerald-500/50 hover:text-emerald-400 transition-colors p-1">
                      <span className="material-symbols-outlined text-sm">close</span>
                  </button>
              </div>
          )}
          <input 
            type="file" 
            ref={kbInputRef} 
            className="hidden" 
            accept=".pdf,.txt,.md" 
            onChange={handleKbUpload}
            disabled={disabled || readingKb}
          />
      </div>

      {/* Layout Suggestions */}
      <div className="flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Sugestão de Layout
            </label>
            {!hideSlideCount && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    {config.slideCount} SLIDES
                </span>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
              {suggestedLayouts.map((layout) => (
                  <button
                      key={layout.label}
                      onClick={() => applyLayout(layout)}
                      disabled={disabled}
                      className={`
                          group relative p-3 rounded-xl border text-left transition-all overflow-hidden flex items-center justify-between
                          ${config.layoutMode === layout.label 
                              ? 'bg-[#1e1b4b]/50 border-primary/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                              : 'bg-[#0b0f19] border-white/5 hover:bg-white/5 hover:border-white/10'}
                      `}
                  >
                      <div className="flex items-center gap-3">
                          <div className={`
                              size-9 rounded-lg flex items-center justify-center transition-colors
                              ${config.layoutMode === layout.label ? 'bg-primary text-white' : 'bg-white/5 text-slate-500 group-hover:text-white'}
                          `}>
                              <span className="material-symbols-outlined text-[18px]">{layout.icon}</span>
                          </div>
                          <div className="flex flex-col">
                              <span className={`text-xs font-bold transition-colors ${config.layoutMode === layout.label ? 'text-white' : 'text-slate-300'}`}>
                                  {layout.label}
                              </span>
                              <span className="text-[9px] text-slate-600 font-medium">
                                  {layout.description}
                              </span>
                          </div>
                      </div>
                      
                      {config.layoutMode === layout.label && (
                         <span className="material-symbols-outlined text-primary text-sm animate-in fade-in zoom-in">check_circle</span>
                      )}
                  </button>
              ))}
          </div>
      </div>
      
      <div className="h-px bg-white/5 w-full shrink-0"></div>

      {/* Brand Color */}
      <div className="flex flex-col gap-3 shrink-0 pb-4">
         <div className="flex justify-between items-center">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Cor da Marca
             </label>
             <span className="text-[10px] font-mono text-slate-600 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                {config.brandColor || '#6366f1'}
             </span>
         </div>
         
         <div className="grid grid-cols-8 gap-2.5">
             {BRAND_PRESETS.map((preset) => (
                 <button
                    key={preset.color}
                    onClick={() => setConfig(prev => ({...prev, brandColor: preset.color}))}
                    className={`size-6 rounded-full transition-all relative group ${config.brandColor === preset.color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#050511] scale-110' : 'hover:scale-110 hover:ring-1 hover:ring-white/50'}`}
                    style={{backgroundColor: preset.color}}
                    title={preset.name}
                 >
                    {config.brandColor === preset.color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="size-1.5 bg-white rounded-full shadow-sm"></div>
                        </div>
                    )}
                 </button>
             ))}
         </div>
         
         {/* Custom Picker */}
         <div className="relative w-full h-9 bg-[#0b0f19] rounded-xl border border-white/10 flex items-center px-3 cursor-pointer hover:border-white/20 transition-colors group">
             <span className="text-[10px] text-slate-400 flex-1 group-hover:text-slate-300">Customizar Hex...</span>
             <span className="material-symbols-outlined text-[14px] text-slate-600 group-hover:text-slate-400">palette</span>
             <input 
                type="color" 
                value={config.brandColor || '#6366f1'}
                onChange={(e) => setConfig(prev => ({...prev, brandColor: e.target.value}))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
             />
         </div>
      </div>

    </div>
  );
};

export default ConfigPanel;
