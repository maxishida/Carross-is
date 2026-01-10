import React, { useRef, useState, useEffect } from 'react';
import { GenerationConfig, ToneType, VisualStyleType, CharacterStyleType, CarouselGoal, StyleCategory } from '../types';

interface ConfigPanelProps {
  config: GenerationConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
  disabled: boolean;
  hideSlideCount?: boolean; 
}

// Data map for UI categories
const STYLES_BY_CATEGORY: Record<StyleCategory, string[]> = {
    [StyleCategory.COMMERCIAL]: ["Neon Tech", "Cyber Promo", "Premium Black & Gold", "Oferta Explosiva", "Flash Sale Dinâmica", "Desconto Minimalista", "Vitrine 3D", "Produto Flutuante", "Tech Clean", "Marketplace Moderno"],
    [StyleCategory.BRANDING]: ["Branding Minimal", "Luxo Sofisticado", "Corporativo Moderno", "Visual Institucional", "Startup Tech", "Clean Business", "Profissional Elegante", "Branding Futurista", "Marca Premium", "Estilo Editorial"],
    [StyleCategory.SOCIAL]: ["Carrossel Informativo", "Post Educativo", "Conteúdo de Valor", "Story Dinâmico", "Reels Promocional", "Feed Harmonizado", "Destaque de Benefícios", "Chamada para Ação", "Conteúdo Engajador", "Post de Conversão"],
    [StyleCategory.CREATIVE]: ["Futurista Neon", "Estilo Metaverso", "Visual Holográfico", "Estética Cyberpunk", "Arte Digital", "Design 3D", "Visual Isométrico", "Estilo UI/UX", "Visual Gamer", "Tech Dark Mode"],
    [StyleCategory.TRENDS]: ["Glassmorphism", "Neumorphism", "Dark UI", "Soft Gradient", "Bold Typography", "Clean Tech", "Visual Dinâmico", "High Contrast", "Estética Minimal", "Visual Premium"],
    [StyleCategory.NICHE]: ["Eletrônicos Premium", "Moda Urbana", "Beleza Estética", "Fitness Moderno", "Imobiliário Luxo", "Restaurante Gourmet"],
    [StyleCategory.EMOTIONAL]: ["Storytelling Visual", "Inspiração", "Humanizado", "Autoridade"],
    // Fallbacks or specialized lists
    [StyleCategory.COMMUNICATION]: ["Oferta Direta", "Comunicação Premium", "Copy Persuasiva"],
    [StyleCategory.LAYOUT]: ["Grid 3x3", "Post Único Impactante", "Design Vertical"],
    [StyleCategory.ADS]: ["Criativo de Conversão", "Anúncio de Produto", "Promoção Relâmpago"]
};

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig, disabled, hideSlideCount }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize config with default category if missing
  useEffect(() => {
      if (!config.styleCategory) {
          setConfig(prev => ({ ...prev, styleCategory: StyleCategory.COMMERCIAL, style: STYLES_BY_CATEGORY[StyleCategory.COMMERCIAL][0] }));
      }
  }, []);

  const handleToneChange = (tone: ToneType) => {
    setConfig(prev => ({ ...prev, tone }));
  };
  
  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setConfig(prev => ({ ...prev, goal: e.target.value as CarouselGoal }));
  };
  
  const handleBrandColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfig(prev => ({ ...prev, brandColor: e.target.value }));
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

  const currentStyles = STYLES_BY_CATEGORY[config.styleCategory || StyleCategory.COMMERCIAL] || [];

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
                className="w-full p-3 pl-10 text-xs text-white bg-[#0f172a] border border-white/10 rounded-xl focus:ring-primary focus:border-primary appearance-none font-medium"
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
      
      {/* Brand Color */}
      <div className="flex flex-col gap-2">
         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Cor da Marca (Identidade)
         </label>
         <div className="flex items-center gap-3 p-3 bg-[#0f172a] rounded-xl border border-white/5">
             <div className="relative size-8 rounded-full overflow-hidden border border-white/20 shadow-lg shrink-0">
                 <input 
                    type="color" 
                    value={config.brandColor || '#6366f1'}
                    onChange={handleBrandColorChange}
                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 m-0 cursor-pointer border-none"
                    disabled={disabled}
                 />
             </div>
             <div className="flex flex-col">
                 <span className="text-xs text-white font-mono">{config.brandColor || '#6366f1'}</span>
                 <span className="text-[9px] text-slate-500">Cor Principal</span>
             </div>
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