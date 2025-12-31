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
        setConfig(prev => ({ ...prev, referenceImage: reader.result as string, includePeople: true }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
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
          case VisualStyleType.WATERCOLOR_MINIMAL: return 'bg-rose-100 border-rose-200';
          case VisualStyleType.HAND_DRAWN: return 'bg-[#fdfbf7] border-dashed border-gray-400';
          case VisualStyleType.MAGAZINE: return 'bg-white border-l-4 border-black';
          case VisualStyleType.STORYBOARD: return 'bg-white border-2 border-black divide-y divide-black';
          case VisualStyleType.ICON_GRID: return 'bg-slate-100 grid grid-cols-2 gap-0.5 border-gray-300';
          case VisualStyleType.QUOTE_CARD: return 'bg-[#3e2723] border-amber-900';
          case VisualStyleType.THREE_D_ISOMETRIC: return 'bg-blue-500 border-blue-400 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)]';
          case VisualStyleType.THREE_D_CLAYMORPHISM: return 'bg-pink-300 border-pink-200 rounded-lg shadow-inner';
          case VisualStyleType.THREE_D_CARTOON: return 'bg-gradient-to-tr from-orange-400 to-yellow-300 border-orange-500';
          default: return 'bg-gray-200';
      }
  };

  return (
    <div className="lg:col-span-4 flex flex-col gap-6 bg-white dark:bg-white/5 dark:backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm h-fit sticky top-6 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
        <span className="material-symbols-outlined text-primary">tune</span>
        <h3 className="font-bold text-lg dark:text-white">Ultra Configuração</h3>
      </div>

      {/* Goal Selector */}
      <div className="flex flex-col gap-2">
         <label className="font-bold text-sm dark:text-gray-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[16px]">ads_click</span>
            Objetivo do Carrossel
         </label>
         <div className="relative">
            <select 
                className="w-full p-3 pl-10 text-sm text-gray-900 bg-gray-50 dark:bg-[#161a2c] border border-gray-200 dark:border-white/10 rounded-xl focus:ring-primary focus:border-primary dark:text-white appearance-none font-medium"
                value={config.goal || CarouselGoal.AUTHORITY}
                onChange={handleGoalChange}
                disabled={disabled}
            >
                {Object.values(CarouselGoal).map((goal) => (
                    <option key={goal} value={goal}>{goal}</option>
                ))}
            </select>
            <span className="absolute left-3 top-3 pointer-events-none material-symbols-outlined text-[18px] text-primary">flag</span>
            <span className="absolute right-3 top-3 pointer-events-none material-symbols-outlined text-[18px] text-gray-500">expand_more</span>
         </div>
      </div>

      {/* Slide Count */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <label className="font-medium text-sm dark:text-gray-300">Quantidade de Slides</label>
          <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-sm">{config.slideCount} slides</span>
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
            />
            <div className="flex justify-between text-xs text-text-secondary font-body px-1">
                <span>3</span>
                <span>5</span>
                <span>7</span>
                <span>10</span>
            </div>
        </div>
      </div>

      {/* Avatar Personalizado (Premium Feature) */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20">
         <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-sm">face</span>
            <label className="font-bold text-sm dark:text-white">Avatar IA Personalizado</label>
         </div>
         
         {!config.referenceImage ? (
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all hover:border-primary"
             >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-primary mb-2 transition-colors">add_photo_alternate</span>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400"><span className="font-semibold">Clique para enviar sua foto</span></p>
                    <p className="text-[10px] text-gray-400">JPG ou PNG (Max 5MB)</p>
                </div>
             </div>
         ) : (
             <div className="relative w-full h-40 rounded-lg overflow-hidden group border border-gray-500/30">
                 <img src={config.referenceImage} alt="Reference" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                    <span className="text-xs text-white font-bold">Foto de Referência Ativa</span>
                 </div>
                 <button 
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                 >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                 </button>
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

         {config.referenceImage && (
             <div className="flex flex-col gap-2 mt-2">
                 <label className="text-xs font-medium dark:text-gray-300">Estilo do Personagem</label>
                 <div className="relative">
                    <select 
                        className="w-full p-2.5 text-xs text-gray-900 bg-white dark:bg-[#161a2c] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:text-white appearance-none"
                        value={config.characterStyle || CharacterStyleType.REALISTIC}
                        onChange={handleCharacterStyleChange}
                        disabled={disabled}
                    >
                        {Object.values(CharacterStyleType).map((style) => (
                            <option key={style} value={style}>{style}</option>
                        ))}
                    </select>
                    <span className="absolute right-2 top-2.5 pointer-events-none material-symbols-outlined text-[18px] text-gray-500">expand_more</span>
                 </div>
             </div>
         )}
      </div>

      {/* Tone of Voice */}
      <div className="flex flex-col gap-3">
        <label className="font-medium text-sm dark:text-gray-300">Tom de Voz</label>
        <div className="grid grid-cols-2 gap-2">
            {Object.values(ToneType).map((tone) => (
                <label key={tone} className="cursor-pointer group">
                    <input 
                        type="radio" 
                        name="tone" 
                        className="peer sr-only" 
                        checked={config.tone === tone}
                        onChange={() => handleToneChange(tone)}
                        disabled={disabled}
                    />
                    <div className="flex items-center justify-center h-10 px-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-medium peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all hover:bg-white/10 dark:text-gray-300 text-center">
                        {tone}
                    </div>
                </label>
            ))}
        </div>
      </div>

      {/* Visual Style & Ultra Design */}
      <div className="flex flex-col gap-3">
        <label className="font-medium text-sm dark:text-gray-300">Estilo Visual (Ultra Design)</label>
        
        {/* Toggle People (Auto-checked if image uploaded) */}
        <div className={`flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 ${config.referenceImage ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">person_add</span>
                <span className="text-sm font-medium dark:text-gray-200">Incluir Pessoas Genéricas</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={config.includePeople}
                    onChange={(e) => setConfig(prev => ({...prev, includePeople: e.target.checked}))}
                    disabled={disabled || !!config.referenceImage}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
        </div>

        {/* Style Selector */}
        <div className="space-y-2">
            {[
                VisualStyleType.MINIMAL_DARK, 
                VisualStyleType.GRADIENT_TECH, 
                VisualStyleType.CLEAN_LIGHT,
                VisualStyleType.NEO_BRUTALISM,
                VisualStyleType.RETRO_FUTURISM,
                VisualStyleType.HAND_DRAWN,
                VisualStyleType.MAGAZINE,
                VisualStyleType.STORYBOARD,
                VisualStyleType.ICON_GRID,
                VisualStyleType.QUOTE_CARD,
                VisualStyleType.THREE_D_ISOMETRIC,
                VisualStyleType.THREE_D_CLAYMORPHISM,
                VisualStyleType.THREE_D_CARTOON
            ].map((style) => (
                <label key={style} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer bg-gray-50 dark:bg-white/5 hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <div className="flex items-center gap-3">
                         <div className={`size-6 rounded shadow-sm border ${getStylePreviewClass(style)}`}></div>
                        <span className="text-sm font-medium dark:text-gray-200">{style}</span>
                    </div>
                    <input 
                        type="radio" 
                        name="style" 
                        className="text-primary focus:ring-primary bg-transparent border-gray-400"
                        checked={config.style === style}
                        onChange={() => handleStyleChange(style)}
                        disabled={disabled}
                    />
                </label>
            ))}

            {/* Custom Theme Input */}
             <label className="flex flex-col gap-2 p-3 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer bg-gray-50 dark:bg-white/5 hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="size-6 rounded shadow-sm border border-dashed border-gray-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                        </div>
                        <span className="text-sm font-medium dark:text-gray-200">Tema Personalizado</span>
                    </div>
                    <input 
                        type="radio" 
                        name="style" 
                        className="text-primary focus:ring-primary bg-transparent border-gray-400"
                        checked={config.style === VisualStyleType.CUSTOM}
                        onChange={() => handleStyleChange(VisualStyleType.CUSTOM)}
                        disabled={disabled}
                    />
                </div>
                {config.style === VisualStyleType.CUSTOM && (
                    <input 
                        type="text"
                        placeholder="Ex: Cyberpunk, Neon, Bege e Dourado..."
                        className="mt-2 w-full text-sm rounded bg-white dark:bg-black/20 border-gray-300 dark:border-white/20 focus:border-primary focus:ring-primary"
                        value={config.customTheme || ''}
                        onChange={(e) => setConfig(prev => ({...prev, customTheme: e.target.value}))}
                        disabled={disabled}
                    />
                )}
            </label>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;