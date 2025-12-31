import React from 'react';
import { Slide, VisualStyleType } from '../types';

interface SlideCardProps {
  slide: Slide;
  totalSlides: number;
  style: VisualStyleType;
  referenceImage?: string; // Prop nova
}

const SlideCard: React.FC<SlideCardProps> = ({ slide, totalSlides, style, referenceImage }) => {
  
  const getCardStyle = () => {
    switch (style) {
      case VisualStyleType.CLEAN_LIGHT:
        return "bg-white text-slate-800 border-gray-200";
      case VisualStyleType.GRADIENT_TECH:
        return "bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-white/10 shadow-[0_0_15px_rgba(79,70,229,0.3)]";
      case VisualStyleType.NEO_BRUTALISM:
        return "bg-[#FFFDF5] text-black border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl";
      case VisualStyleType.RETRO_FUTURISM:
        return "bg-[#1a0b2e] text-cyan-50 border-purple-500/50 shadow-[0_0_20px_rgba(216,27,96,0.5)]";
      case VisualStyleType.WATERCOLOR_MINIMAL:
        return "bg-[#fff1f2] text-slate-700 border-rose-200";
      case VisualStyleType.HAND_DRAWN:
        return "bg-[#fdfbf7] text-gray-800 border-2 border-dashed border-gray-400 font-serif";
      case VisualStyleType.MAGAZINE:
        return "bg-white text-black border-gray-300 font-serif";
      case VisualStyleType.STORYBOARD:
        return "bg-white text-black border-2 border-black divide-y-2 divide-black";
      case VisualStyleType.ICON_GRID:
        return "bg-slate-50 text-slate-800 border-gray-200";
      case VisualStyleType.QUOTE_CARD:
        return "bg-[#3e2723] text-[#ffecb3] border-amber-900 font-serif";
      case VisualStyleType.THREE_D_ISOMETRIC:
        return "bg-[#f0f4f8] text-slate-700 border-white shadow-xl";
      case VisualStyleType.THREE_D_CLAYMORPHISM:
        return "bg-[#ffe4e6] text-slate-700 border-white/50 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.5),0_10px_20px_rgba(0,0,0,0.1)]";
      case VisualStyleType.THREE_D_CARTOON:
        return "bg-gradient-to-br from-orange-400 to-pink-500 text-white border-white/20 shadow-lg";
      case VisualStyleType.MINIMAL_DARK:
      default:
        return "bg-[#1a1a1a] text-white border-gray-800";
    }
  };

  const getGradientOverlay = () => {
    if (style === VisualStyleType.GRADIENT_TECH) {
      return <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10 opacity-60"></div>;
    }
    return null;
  };

  // Detecta se há referência pessoal no prompt para destacar
  const hasPersonRef = slide.imagePrompt.toLowerCase().includes("person") || slide.imagePrompt.toLowerCase().includes("reference") || (referenceImage !== undefined);

  return (
    <div className={`group relative flex-shrink-0 w-[300px] aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border transition-all duration-300 hover:scale-[1.01] ${getCardStyle()}`}>
      
      {/* Reference Image Background Overlay (Ghosting) */}
      {referenceImage && (
        <div className="absolute inset-0 z-0">
            <img 
                src={referenceImage} 
                className={`w-full h-full object-cover mix-blend-overlay opacity-30 grayscale transition-opacity group-hover:opacity-50`} 
                alt="Reference Ghost" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
        </div>
      )}

      {/* Background/Visual Placeholder */}
      {getGradientOverlay()}

      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start">
        <span className={`text-4xl font-black ${style === VisualStyleType.NEO_BRUTALISM ? 'opacity-100 text-black' : 'opacity-30'}`}>
            {String(slide.slideNumber).padStart(2, '0')}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur-sm border 
            ${style === VisualStyleType.NEO_BRUTALISM ? 'bg-white border-black text-black border-2' : 'bg-white/10 border-white/10'}`}>
            {slide.layoutSuggestion}
        </span>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-8 z-20 pt-10">
        <h3 className={`text-xl font-bold mb-4 leading-tight 
            ${style === VisualStyleType.CLEAN_LIGHT ? 'text-slate-900' : 
              style === VisualStyleType.NEO_BRUTALISM ? 'text-black' : 'text-white'}`}>
          {slide.title}
        </h3>
        <p className={`text-sm font-body leading-relaxed 
            ${style === VisualStyleType.CLEAN_LIGHT ? 'text-slate-600' : 
              style === VisualStyleType.NEO_BRUTALISM ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
          {slide.content}
        </p>
      </div>

      {/* Footer / Prompt Info */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 z-30 transform translate-y-[85%] group-hover:translate-y-0 transition-transform duration-300 border-t 
         ${style === VisualStyleType.NEO_BRUTALISM ? 'bg-white border-black border-t-2' : 'bg-black/80 backdrop-blur-xl border-white/10'}`}>
        <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold uppercase ${hasPersonRef ? 'text-amber-400' : 'text-primary'}`}>
                    {hasPersonRef ? '✦ Prompt com Personagem' : 'Prompt Visual'}
                </span>
                <span className="material-symbols-outlined text-[14px] opacity-50 group-hover:opacity-0 transition-opacity">expand_less</span>
            </div>
            <p className={`text-[10px] font-mono leading-tight ${style === VisualStyleType.NEO_BRUTALISM ? 'text-black' : 'text-slate-300'} ${hasPersonRef ? 'text-amber-100' : ''}`}>
                {slide.imagePrompt}
            </p>
        </div>
      </div>
    </div>
  );
};

export default SlideCard;