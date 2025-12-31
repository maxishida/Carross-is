import React from 'react';
import { Slide, VisualStyleType } from '../types';

interface SlideCardProps {
  slide: Slide;
  totalSlides: number;
  style: VisualStyleType;
}

const SlideCard: React.FC<SlideCardProps> = ({ slide, totalSlides, style }) => {
  
  // Dynamic styling based on the selected visual style
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
    if (style === VisualStyleType.RETRO_FUTURISM) {
        return <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-black/80 z-10 opacity-70"></div>;
    }
    return null;
  };

  const getBackgroundAccent = () => {
      switch(style) {
        case VisualStyleType.NEO_BRUTALISM:
            return (
                <>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full border-2 border-black transform translate-x-10 -translate-y-10 opacity-100 z-0"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 border-2 border-black transform -translate-x-5 translate-y-5 rotate-12 z-0"></div>
                </>
            );
        case VisualStyleType.THREE_D_ISOMETRIC:
             return (
                <div className="absolute inset-0 opacity-10 z-0" style={{backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
             );
        case VisualStyleType.THREE_D_CLAYMORPHISM:
             return (
                <>
                  <div className="absolute top-10 right-10 size-20 rounded-full bg-white/40 blur-xl"></div>
                  <div className="absolute bottom-10 left-10 size-32 rounded-full bg-purple-300/30 blur-2xl"></div>
                </>
             );
        case VisualStyleType.THREE_D_CARTOON:
             return (
                <div className="absolute inset-0 z-0 overflow-hidden">
                   <div className="absolute -top-10 -right-10 size-40 bg-yellow-300 rounded-full opacity-50 blur-xl"></div>
                   <div className="absolute -bottom-10 -left-10 size-40 bg-pink-600 rounded-full opacity-50 blur-xl"></div>
                </div>
             );
        case VisualStyleType.MINIMAL_DARK:
        case VisualStyleType.GRADIENT_TECH:
             return (
                <div className={`absolute inset-0 opacity-20 z-0 ${style === VisualStyleType.CLEAN_LIGHT ? 'bg-slate-100' : 'bg-slate-900'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl transform -translate-x-10 translate-y-10"></div>
                </div>
            );
        default: return null;
      }
  }

  return (
    <div className={`group relative flex-shrink-0 w-[300px] aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border transition-all duration-300 hover:scale-[1.01] ${getCardStyle()}`}>
      
      {/* Background/Visual Placeholder */}
      {getGradientOverlay()}
      {getBackgroundAccent()}

      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start">
        <span className={`text-4xl font-black ${style === VisualStyleType.NEO_BRUTALISM ? 'opacity-100 text-black' : 
            style === VisualStyleType.HAND_DRAWN ? 'font-serif text-gray-500' : 
            style === VisualStyleType.MAGAZINE ? 'font-serif text-black' : 'opacity-30'}`}>
            {String(slide.slideNumber).padStart(2, '0')}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur-sm border 
            ${style === VisualStyleType.NEO_BRUTALISM ? 'bg-white border-black text-black border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white/10 border-white/10'}`}>
            {slide.layoutSuggestion}
        </span>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-8 z-20 pt-10">
        <h3 className={`text-xl font-bold mb-4 leading-tight 
            ${style === VisualStyleType.HAND_DRAWN ? 'font-serif text-red-700' : ''}
            ${style === VisualStyleType.CLEAN_LIGHT || style === VisualStyleType.WATERCOLOR_MINIMAL || style === VisualStyleType.THREE_D_ISOMETRIC || style === VisualStyleType.THREE_D_CLAYMORPHISM ? 'text-slate-900' : 
              style === VisualStyleType.NEO_BRUTALISM ? 'text-black' : 
              style === VisualStyleType.MAGAZINE ? 'text-black font-serif italic' : 
              style === VisualStyleType.HAND_DRAWN ? 'text-gray-900' : 'text-white'}`}>
          {slide.title}
        </h3>
        <p className={`text-sm font-body leading-relaxed 
            ${style === VisualStyleType.CLEAN_LIGHT || style === VisualStyleType.WATERCOLOR_MINIMAL || style === VisualStyleType.THREE_D_ISOMETRIC || style === VisualStyleType.THREE_D_CLAYMORPHISM ? 'text-slate-600' : 
              style === VisualStyleType.NEO_BRUTALISM ? 'text-gray-900 font-bold' : 
              style === VisualStyleType.MAGAZINE ? 'text-gray-700 font-serif' :
              style === VisualStyleType.HAND_DRAWN ? 'text-gray-600 font-serif italic' : 'text-gray-300'}`}>
          {slide.content}
        </p>
      </div>

      {/* Footer / Prompt Info */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 z-30 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t 
         ${style === VisualStyleType.NEO_BRUTALISM ? 'bg-white border-black border-t-2' : 
           style === VisualStyleType.HAND_DRAWN ? 'bg-[#f0ece5] border-dashed border-gray-400' : 
           'bg-black/60 backdrop-blur-xl border-white/10'}`}>
        <div className="flex flex-col gap-1">
            <span className={`text-[10px] font-bold uppercase ${style === VisualStyleType.NEO_BRUTALISM || style === VisualStyleType.HAND_DRAWN || style === VisualStyleType.MAGAZINE ? 'text-black' : 'text-primary'}`}>Prompt Visual</span>
            <p className={`text-[10px] line-clamp-3 font-mono ${style === VisualStyleType.NEO_BRUTALISM || style === VisualStyleType.HAND_DRAWN || style === VisualStyleType.MAGAZINE ? 'text-black' : 'text-slate-300'}`}>
                {slide.imagePrompt}
            </p>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className={`size-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors
            ${style === VisualStyleType.NEO_BRUTALISM ? 'bg-black text-white hover:bg-white hover:text-black border-2 border-black' : 'bg-black/50 hover:bg-primary text-white border border-white/10'}`} 
            title="Editar">
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
      </div>
    </div>
  );
};

export default SlideCard;