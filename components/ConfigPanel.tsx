
import React, { useRef, useState, useEffect } from 'react';
import { GenerationConfig, ToneType, VisualStyleType, CharacterStyleType, CarouselGoal, StyleCategory } from '../types';

interface ConfigPanelProps {
  config: GenerationConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
  disabled: boolean;
  hideSlideCount?: boolean; 
}

const STYLES_BY_CATEGORY: Record<StyleCategory, string[]> = {
    [StyleCategory.COMMERCIAL]: ["Neon Tech", "Cyber Promo", "Premium Black & Gold", "Oferta Explosiva", "Flash Sale Dinâmica", "Desconto Minimalista", "Vitrine 3D", "Produto Flutuante", "Tech Clean", "Marketplace Moderno"],
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
        { label: 'Post Único Impactante', slides: 1, icon: 'crop_square', description: 'Imagem única com alta viralidade' },
        { label: 'Carrossel Curto', slides: 4, icon: 'view_week', description: 'Rápido de consumir (3-4 slides)' },
        { label: 'Twitter Thread Style', slides: 7, icon: 'lists', description: 'Texto focado em narrativa' }
    ],
    [CarouselGoal.SALES]: [
        { label: 'Método AIDA', slides: 4, icon: 'ads_click', description: 'Atenção, Interesse, Desejo, Ação' },
        { label: 'Vitrine de Produto', slides: 3, icon: 'storefront', description: 'Destaque visual do produto' },
        { label: 'Quebra de Objeções', slides: 6, icon: 'verified', description: 'Prova social e garantia' }
    ],
    [CarouselGoal.ENGAGEMENT]: [
        { label: 'Lista/Checklist', slides: 5, icon: 'checklist', description: 'Salvável e prático' },
        { label: 'Quiz Interativo', slides: 4, icon: 'quiz', description: 'Pergunta e Resposta no final' },
        { label: 'Meme/Relatável', slides: 3, icon: 'mood', description: 'Conexão emocional rápida' }
    ],
    [CarouselGoal.AUTHORITY]: [
        { label: 'Deep Dive (Aula)', slides: 8, icon: 'school', description: 'Conteúdo denso e educativo' },
        { label: 'Passo a Passo', slides: 6, icon: 'steps', description: 'Tutorial "Como fazer"' },
        { label: 'Estudo de Caso', slides: 5, icon: 'analytics', description: 'Análise de resultados' }
    ],
    [CarouselGoal.VIRAL]: [
        { label: 'Opinião Polêmica', slides: 3, icon: 'campaign', description: 'Gera debate nos comentários' },
        { label: 'Antes x Depois', slides: 2, icon: 'compare', description: 'Transformação visual' },
        { label: 'Grid 3x3 (Conceito)', slides: 9, icon: 'grid_view', description: 'Mosaico visual impactante' }
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
  
  useEffect(() => {
      if (!config.styleCategory) {
          setConfig(prev => ({ ...prev, styleCategory: StyleCategory.COMMERCIAL, style: STYLES_BY_CATEGORY[StyleCategory.COMMERCIAL][0] }));
      }
  }, []);

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

  const removeImage = (e: React.MouseEvent) => {
      e.stopPropagation(); 
      setConfig(prev => ({ ...prev, referenceImage: undefined }));
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className="bg-[#050511] lg:rounded-2xl border border-white/10 flex flex-col gap-6 p-6 h-fit lg:sticky top-6">
      
      {/* Header */}
      <div className="flex items-center gap-2 pb-4 border-b border-white/10">
        <span className="material-symbols-outlined text-primary text-xl">tune</span>
        <h3 className="font-bold text-lg text-white font-display">Ultra Configuração</h3>
      </div>

      {/* Goal Selector */}
      <div className="flex flex-col gap-2">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Objetivo do Carrossel (Copywriting)
         </label>
         <div className="relative">
            <select 
                className="w-full p-3 pl-10 text-xs text-white bg-[#0f172a] border border-white/10 rounded-xl focus:ring-primary focus:border-primary appearance-none font-medium transition-colors"
                value={config.goal || CarouselGoal.AUTHORITY}
                onChange={handleGoalChange}
                disabled={disabled}
            >
                {Object.values(CarouselGoal).map((goal) => (
                    <option key={goal} value={goal} className="bg-slate-900 text-white">{goal}</option>
                ))}
            </select>
            <span className="absolute left-3 top-3 pointer-events-none material-symbols-outlined text-[18px] text-primary">flag</span>
            <span className="absolute right-3 top-3 pointer-events-none material-symbols-outlined text-[18px] text-slate-500">expand_more</span>
         </div>
      </div>

      {/* DYNAMIC LAYOUT SUGGESTIONS */}
      <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
              <span>Sugestão de Layout</span>
              {!hideSlideCount && <span className="text-primary">{config.slideCount} Slides</span>}
          </label>
          <div className="grid grid-cols-1 gap-2">
              {suggestedLayouts.map((layout) => (
                  <button
                      key={layout.label}
                      onClick={() => applyLayout(layout)}
                      disabled={disabled}
                      className={`
                          group relative p-3 rounded-xl border text-left transition-all overflow-hidden
                          ${config.layoutMode === layout.label 
                              ? 'bg-primary/10 border-primary shadow-neon-primary' 
                              : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}
                      `}
                  >
                      <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${config.layoutMode === layout.label ? 'bg-primary text-white' : 'bg-black/30 text-slate-400 group-hover:text-white'}`}>
                                  <span className="material-symbols-outlined text-[18px]">{layout.icon}</span>
                              </div>
                              <div className="flex flex-col">
                                  <span className={`text-xs font-bold ${config.layoutMode === layout.label ? 'text-white' : 'text-slate-300'}`}>
                                      {layout.label}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-medium">
                                      {layout.description}
                                  </span>
                              </div>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${config.layoutMode === layout.label ? 'bg-black/30 text-white' : 'bg-black/20 text-slate-500'}`}>
                              {layout.slides}x
                          </span>
                      </div>
                      {/* Active Indicator Bar */}
                      {config.layoutMode === layout.label && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                      )}
                  </button>
              ))}
          </div>
      </div>
      
      <div className="h-px bg-white/5 my-1"></div>

      {/* Brand Color Presets */}
      <div className="flex flex-col gap-3">
         <div className="flex justify-between items-center">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Cor da Marca
             </label>
             <div className="flex items-center gap-2">
                 <div className="size-3 rounded-full" style={{backgroundColor: config.brandColor || '#6366f1'}}></div>
                 <span className="text-[10px] font-mono text-slate-500">{config.brandColor || '#6366f1'}</span>
             </div>
         </div>
         
         <div className="grid grid-cols-8 gap-2">
             {BRAND_PRESETS.map((preset) => (
                 <button
                    key={preset.color}
                    onClick={() => setConfig(prev => ({...prev, brandColor: preset.color}))}
                    className={`size-6 rounded-full border transition-all ${config.brandColor === preset.color ? 'border-white scale-125 shadow-neon-glow' : 'border-transparent hover:scale-110'}`}
                    style={{backgroundColor: preset.color}}
                    title={preset.name}
                 />
             ))}
         </div>
         
         {/* Custom Picker Fallback */}
         <div className="relative w-full h-8 bg-white/5 rounded-lg border border-white/10 flex items-center px-3 cursor-pointer hover:bg-white/10">
             <span className="text-[10px] text-slate-400 flex-1">Customizar Hex...</span>
             <span className="material-symbols-outlined text-[14px] text-slate-500">palette</span>
             <input 
                type="color" 
                value={config.brandColor || '#6366f1'}
                onChange={(e) => setConfig(prev => ({...prev, brandColor: e.target.value}))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
             />
         </div>
      </div>

      {/* Visual Reference */}
      <div className="flex flex-col gap-2">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             Referência Visual (IA)
         </label>
         
         {!config.referenceImage ? (
            <div 
                onClick={() => !disabled && fileInputRef.current?.click()}
                className={`h-24 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                 <span className="material-symbols-outlined text-slate-500 group-hover:text-primary">add_a_photo</span>
                 <p className="text-[10px] text-slate-500">Carregar imagem de referência</p>
            </div>
         ) : (
             <div className="relative rounded-xl overflow-hidden border border-white/20 group h-24">
                 <img src={config.referenceImage} className="w-full h-full object-cover" alt="Reference" />
                 <button 
                    onClick={removeImage}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                     <span className="material-symbols-outlined">delete</span>
                 </button>
                 <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-white">Ref. Ativa</div>
             </div>
         )}
         <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload}
            disabled={disabled}
        />
      </div>

      {/* STYLE SELECTOR (CATEGORY + STYLE) */}
      <div className="flex flex-col gap-3">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Categoria de Estilo
         </label>
         <div className="relative">
            <select 
                className="w-full p-3 bg-[#0f172a] border border-white/10 rounded-xl text-xs text-white focus:border-primary appearance-none font-bold"
                value={config.styleCategory || StyleCategory.COMMERCIAL}
                onChange={(e) => {
                    const newCat = e.target.value as StyleCategory;
                    setConfig(prev => ({ 
                        ...prev, 
                        styleCategory: newCat,
                        style: STYLES_BY_CATEGORY[newCat]?.[0] || '' // Reset style when category changes
                    }));
                }}
                disabled={disabled}
            >
                {Object.values(StyleCategory).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
            <span className="absolute right-3 top-3 pointer-events-none material-symbols-outlined text-[18px] text-slate-500">category</span>
         </div>

         <div className="grid grid-cols-2 gap-2 mt-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
             {currentStyles.map((s) => (
                 <button
                    key={s}
                    onClick={() => setConfig(prev => ({ ...prev, style: s }))}
                    disabled={disabled}
                    className={`
                        relative px-3 py-2.5 rounded-lg text-left transition-all border
                        ${config.style === s 
                            ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                            : 'bg-[#1e293b] text-slate-400 border-transparent hover:bg-slate-800 hover:text-white'}
                    `}
                 >
                     <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold truncate pr-1">
                            {s}
                         </span>
                         {config.style === s && (
                             <div className="size-1.5 rounded-full bg-purple-600"></div>
                         )}
                     </div>
                 </button>
             ))}
         </div>
      </div>

      {/* Tone Selector */}
      <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Tom de Voz
          </label>
          <div className="flex flex-wrap gap-2">
              {Object.values(ToneType).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleToneChange(t)}
                    disabled={disabled}
                    className={`
                        px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all
                        ${config.tone === t 
                            ? 'bg-white text-black border-white' 
                            : 'bg-transparent text-slate-500 border-white/10 hover:border-white/30 hover:text-white'}
                    `}
                  >
                      {t}
                  </button>
              ))}
          </div>
      </div>

    </div>
  );
};

export default ConfigPanel;
