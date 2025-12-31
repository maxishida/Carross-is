import React, { useRef } from 'react';
import { GenerationConfig, ToneType, VisualStyleType, CharacterStyleType, CarouselGoal } from '../types';

interface ConfigPanelProps {
  config: GenerationConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
  disabled: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToneChange = (tone: ToneType) => {
    setConfig(prev => ({ ...prev, tone }));
  };
  
  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setConfig(prev => ({ ...prev, goal: e.target.value as CarouselGoal }));
  };

  const handleStyleChange = (style: VisualStyleType) => {
    setConfig(prev => ({ ...prev, style }));
  };

  const handleCharacterStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     setConfig(prev => ({ ...prev, characterStyle: e.target.value as CharacterStyleType }));
  };

  const handleSlideCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, slideCount: parseInt(e.target.value) }));
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

  const getStylePreviewClass = (style: VisualStyleType) => {
      switch(style) {
          case VisualStyleType.MINIMAL_DARK: return 'bg-gray-900 border-gray-700';
          case VisualStyleType.GRADIENT_TECH: return 'bg-gradient-to-br from-blue-600 to-purple-600 border-transparent';
          case VisualStyleType.CLEAN_LIGHT: return 'bg-gray-100 border-gray-300';
          case VisualStyleType.NEO_BRUTALISM: return 'bg-yellow-400 border-2 border-black';
          case VisualStyleType.RETRO_FUTURISM: return 'bg-gradient-to-r from-pink-500 to-cyan-500 border-transparent';
          default: return 'bg-gray-800';
      }
  };

  return (
    <div className="glass-sidebar lg:rounded-2xl lg:border lg:border-white/10 flex flex-col gap-6 p-6 h-fit sticky top-6 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 pb-4 border-b border-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        <span className="material-symbols-outlined text-primary neon-text-glow">tune</span>
        <h3 className="font-bold text-lg text-white font-display neon-text-glow">Ultra Configuração</h3>
      </div>

      {/* Goal Selector */}
      <div className="flex flex-col gap-2">
         <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
            Objetivo do Carrossel
         </label>
         <div className="relative">
            <select 
                className="w-full p-3 pl-10 text-sm text-white bg-black/40 border border-white/10 rounded-xl focus:ring-primary focus:border-primary appearance-none font-medium transition-all hover:bg-white/5"
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

      {/* Slide Count */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
        <div className="flex justify-between text-xs text-slate-400 mb-3">
          <label className="font-medium tracking-wide">QUANTIDADE DE SLIDES</label>
          <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]">{config.slideCount} slides</span>
        </div>
        <div className="relative flex w-full flex-col gap-2">
            <input 
                type="range" 
                min="3" 
                max="10" 
                step="1"
                value={config.slideCount}
                onChange={handleSlideCountChange}
                disabled={disabled}
                className="w-full mb-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
                <span>MIN: 3</span>
                <span>MAX: 10</span>
            </div>
        </div>
      </div>

      {/* Avatar Personalizado */}
      <div 
        onClick={() => !config.referenceImage && fileInputRef.current?.click()}
        className={`p-5 rounded-xl border border-dashed border-white/20 bg-white/[0.01] hover:bg-white/[0.04] hover:border-primary/40 transition-all cursor-pointer group text-center relative overflow-hidden ${config.referenceImage ? 'border-primary/50 bg-primary/5' : ''}`}
      >
         <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
         
         {!config.referenceImage ? (
            <div className="relative z-10 flex flex-col items-center gap-3 py-1">
                <div className="size-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/50 group-hover:shadow-neon-primary transition-all duration-300">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-white transition-colors">add_a_photo</span>
                </div>
                <div>
                    <span className="text-xs text-white font-medium block mb-0.5 group-hover:text-primary transition-colors">Avatar IA Personalizado</span>
                    <span className="text-[10px] text-slate-500 block">Arraste ou clique para upload</span>
                </div>
            </div>
         ) : (
             <>
                <img src={config.referenceImage} alt="Reference" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-3 z-10">
                    <span className="text-xs text-white font-bold flex items-center gap-1 justify-center">
                        <span className="material-symbols-outlined text-[14px] text-emerald-400">check_circle</span>
                        Imagem Carregada
                    </span>
                </div>
                <button 
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white rounded-full p-1.5 backdrop-blur-sm transition-colors z-20 border border-white/10"
                >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
             </>
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
      
      {config.referenceImage && (
         <div className="animate-in fade-in slide-in-from-top-2">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Estilo Avatar</label>
             <div className="relative">
                <select 
                    className="w-full p-2.5 text-xs text-white bg-black/40 border border-white/10 rounded-lg focus:ring-primary focus:border-primary appearance-none font-medium"
                    value={config.characterStyle || CharacterStyleType.REALISTIC}
                    onChange={handleCharacterStyleChange}
                    disabled={disabled}
                >
                    {Object.values(CharacterStyleType).map((style) => (
                        <option key={style} value={style} className="bg-slate-900">{style}</option>
                    ))}
                </select>
                <span className="absolute right-2 top-2.5 pointer-events-none material-symbols-outlined text-[16px] text-slate-500">expand_more</span>
             </div>
         </div>
      )}

      {/* Tone of Voice */}
      <div>
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 block pl-1">Tom de Voz</label>
        <div className="grid grid-cols-2 gap-2.5">
            {Object.values(ToneType).map((tone) => (
                <label key={tone} className="cursor-pointer group relative">
                    <input 
                        type="radio" 
                        name="tone" 
                        className="peer sr-only" 
                        checked={config.tone === tone}
                        onChange={() => handleToneChange(tone)}
                        disabled={disabled}
                    />
                    <div className={`py-2.5 px-3 rounded-lg text-xs font-medium transition-all text-center border ${config.tone === tone ? 'glass-button-active' : 'glass-button text-slate-400 border-white/5 bg-white/[0.02]'}`}>
                        {tone}
                    </div>
                </label>
            ))}
        </div>
      </div>

      {/* Visual Style */}
      <div>
        <div className="flex justify-between items-center mb-3 pl-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estilo Visual</label>
            
            {/* Toggle People */}
            <div className={`flex items-center gap-2 bg-black/20 p-1 pr-2 rounded-full border border-white/5 ${config.referenceImage ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="relative inline-block w-8 h-4 rounded-full cursor-pointer bg-slate-800 border border-white/10">
                    <input 
                        className="peer appearance-none w-8 h-4 absolute rounded-full opacity-0 cursor-pointer" 
                        id="switch-style" 
                        type="checkbox"
                        checked={config.includePeople}
                        onChange={(e) => setConfig(prev => ({...prev, includePeople: e.target.checked}))}
                        disabled={disabled || !!config.referenceImage}
                    />
                    <label className={`absolute left-[2px] top-[2px] w-3 h-3 rounded-full transition-all cursor-pointer pointer-events-none ${config.includePeople ? 'bg-primary shadow-neon-primary translate-x-4' : 'bg-slate-400'}`} htmlFor="switch-style"></label>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Pessoas</span>
            </div>
        </div>

        <div className="flex flex-col gap-2.5">
            {[
                VisualStyleType.MINIMAL_DARK, 
                VisualStyleType.GRADIENT_TECH, 
                VisualStyleType.CLEAN_LIGHT,
                VisualStyleType.NEO_BRUTALISM,
                VisualStyleType.RETRO_FUTURISM,
                VisualStyleType.THREE_D_ISOMETRIC,
                VisualStyleType.THREE_D_CARTOON
            ].map((style) => (
                <label key={style} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all group relative overflow-hidden ${config.style === style ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/20'}`}>
                    {config.style === style && <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50"></div>}
                    
                    <div className="flex items-center gap-3 relative z-10">
                         <div className={`size-8 rounded-lg shadow-lg border border-white/20 ${getStylePreviewClass(style)}`}></div>
                        <span className={`text-sm font-semibold transition-colors ${config.style === style ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                            {style}
                        </span>
                    </div>
                    
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center relative z-10 transition-colors ${config.style === style ? 'border-primary bg-primary/20 shadow-neon-primary' : 'border-slate-700 group-hover:border-slate-400'}`}>
                        {config.style === style && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_5px_white]"></div>}
                    </div>
                    
                    <input 
                        type="radio" 
                        name="style" 
                        className="hidden"
                        checked={config.style === style}
                        onChange={() => handleStyleChange(style)}
                        disabled={disabled}
                    />
                </label>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;