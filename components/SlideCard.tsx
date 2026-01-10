
import React, { useState, useEffect } from 'react';
import { Slide, VisualStyleType, SlideLayoutType } from '../types';

interface SlideCardProps {
  slide: Slide;
  totalSlides: number;
  style: string; 
  referenceImage?: string; 
  brandColor?: string;
  onUpdate: (updatedSlide: Slide) => void; 
  isMobileMode?: boolean; 
  id?: string; // Added for export targeting
}

const SlideCard: React.FC<SlideCardProps> = ({ slide, totalSlides, style, referenceImage, brandColor, onUpdate, isMobileMode, id }) => {
  const [localTitle, setLocalTitle] = useState(slide.title);
  const [localContent, setLocalContent] = useState(slide.content);
  const [isInverted, setIsInverted] = useState(false); 

  const handleBlur = () => {
      onUpdate({
          ...slide,
          title: localTitle,
          content: localContent
      });
  };

  const cycleLayout = () => {
      const layouts = Object.values(SlideLayoutType);
      const currentIndex = layouts.indexOf(slide.layoutSuggestion);
      const nextIndex = (currentIndex + 1) % layouts.length;
      onUpdate({
          ...slide,
          layoutSuggestion: layouts[nextIndex]
      });
  };

  // Helper to detect if the style implies a Light Theme
  const isLightStyle = (styleName: string): boolean => {
      const lower = styleName.toLowerCase();
      return lower.includes('clean') || lower.includes('minimal') || lower.includes('white') || lower.includes('soft') || lower.includes('educativo') || lower.includes('bege');
  };
  
  // Helper to detect if the style implies a Neon/Dark Theme
  const isNeonStyle = (styleName: string): boolean => {
      const lower = styleName.toLowerCase();
      return lower.includes('neon') || lower.includes('cyber') || lower.includes('dark') || lower.includes('glow') || lower.includes('gamer') || lower.includes('tech');
  };

  const getContainerStyle = () => {
    // If we have a generated background, we use transparent bg to show it
    if (slide.generatedBackground) {
        return "bg-slate-900 border-white/10 text-white font-display";
    }

    if (isInverted) {
        return "bg-white text-black border-gray-200 font-sans";
    }
    if (isLightStyle(style)) {
        return "bg-white text-slate-800 border-gray-200 font-sans";
    }
    if (isNeonStyle(style)) {
        return "bg-slate-900 text-white border-white/10 font-display shadow-neon-primary";
    }
    return "bg-[#1a1a1a] text-white border-gray-800 font-sans";
  };

  const getTextColors = () => {
       // Contrast adjustment for generated backgrounds
       if (slide.generatedBackground) {
            return { title: 'text-white drop-shadow-md', body: 'text-white drop-shadow-md', number: 'text-white/50' };
       }

       if (isInverted) return { title: 'text-black', body: 'text-slate-800', number: 'text-slate-900/20' };

       if (isLightStyle(style)) {
           return { title: 'text-slate-900', body: 'text-slate-600', number: 'text-slate-300' };
       }
       return { title: 'text-white', body: 'text-gray-300', number: 'text-white/20' };
  };

  const colors = getTextColors();
  
  const brandStyle = brandColor ? { color: brandColor } : {};
  const brandBgStyle = brandColor ? { backgroundColor: brandColor } : {};
  const brandGradientText = brandColor ? { 
      background: `linear-gradient(to right, ${brandColor}, white)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
  } : {};
  
  const neonShadow = (brandColor && isNeonStyle(style) && !slide.generatedBackground) ? { boxShadow: `0 0 20px ${brandColor}40` } : {};

  // Background Decorativo (Pattern/Gradient) or Generated Image
  const renderBackgroundDecor = () => {
    if (slide.generatedBackground) {
        return (
            <>
                {/* Use crossOrigin anonymous to allow html-to-image to capture external images if headers allow */}
                <img src={slide.generatedBackground} alt="AI Background" className="absolute inset-0 w-full h-full object-cover z-0 animate-in fade-in duration-700" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-black/40 z-0"></div> {/* Dimmer overlay for text readability */}
            </>
        );
    }

    if (isInverted) return null;
    if (isNeonStyle(style)) {
        return <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 z-0"></div>;
    }
    return <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0 mix-blend-overlay" style={{backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")'}}></div>;
  };

  const renderGhostImage = (className: string) => {
      if (!referenceImage) return null;
      if (slide.layoutSuggestion === SlideLayoutType.TYPOGRAPHIC_CENTER) return null;

      return (
        <div className={`absolute ${className} overflow-hidden pointer-events-none`}>
             <img 
                src={referenceImage} 
                className="w-full h-full object-cover mix-blend-overlay opacity-40 grayscale" 
                alt="Reference Ghost" 
                crossOrigin="anonymous"
            />
            {className.includes('inset-0') && <div className="absolute inset-0 bg-black/60"></div>}
        </div>
      );
  };

  // --- RENDERIZAÇÃO BASEADA EM LAYOUT ---

  const renderContent = () => {
    switch (slide.layoutSuggestion) {
        case SlideLayoutType.SPLIT_TOP_IMAGE:
            return (
                <div className="flex flex-col h-full w-full relative z-10">
                    <div className="h-[55%] w-full relative bg-slate-800/30 overflow-hidden transition-all duration-500 backdrop-blur-sm border-b border-white/10">
                        {renderGhostImage('inset-0')}
                        {!referenceImage && !slide.generatedBackground && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                <span className="material-symbols-outlined text-6xl" style={brandStyle}>image</span>
                            </div>
                        )}
                        <div className="absolute top-4 left-4 z-20">
                            <span className={`text-5xl font-black ${colors.number} opacity-50`}>
                                {String(slide.slideNumber).padStart(2, '0')}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 p-6 flex flex-col justify-center relative z-10 bg-white/5 backdrop-blur-md">
                        <div 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => { setLocalTitle(e.currentTarget.innerText); handleBlur(); }}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-lg font-bold mb-3 leading-tight ${colors.title} outline-none focus:bg-white/10 rounded px-1 border border-transparent focus:border-white/20`}
                        >
                            {slide.title}
                        </div>
                        <div 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => { setLocalContent(e.currentTarget.innerText); handleBlur(); }}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-xs leading-relaxed ${colors.body} outline-none focus:bg-white/10 rounded px-1 border border-transparent focus:border-white/20`}
                        >
                            {slide.content}
                        </div>
                    </div>
                </div>
            );

        case SlideLayoutType.FULL_IMAGE_OVERLAY:
            return (
                <div className="h-full w-full relative flex flex-col justify-end p-8 overflow-hidden z-10">
                    {renderGhostImage('inset-0')}
                    {!referenceImage && !slide.generatedBackground && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-50"></div>
                    )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-0"></div>
                     
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 opacity-70">
                             <span className="text-4xl font-black text-white/40">{String(slide.slideNumber).padStart(2, '0')}</span>
                             <div className="h-[2px] w-12 bg-primary" style={brandBgStyle}></div>
                        </div>
                        <div 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => { setLocalTitle(e.currentTarget.innerText); handleBlur(); }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xl font-bold text-white mb-3 shadow-black drop-shadow-lg outline-none focus:border-b border-white/30"
                        >
                            {slide.title}
                        </div>
                        <div 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => { setLocalContent(e.currentTarget.innerText); handleBlur(); }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-gray-200 font-medium leading-relaxed drop-shadow-md outline-none focus:border-b border-white/30"
                        >
                            {slide.content}
                        </div>
                     </div>
                </div>
            );

        case SlideLayoutType.TYPOGRAPHIC_CENTER:
            return (
                <div className="h-full w-full p-8 flex flex-col justify-center items-center text-center relative overflow-hidden z-10 backdrop-blur-[2px]">
                    <div className="absolute top-10 left-10 text-9xl opacity-5 font-serif" style={brandStyle}>"</div>
                    <div className="absolute bottom-10 right-10 text-9xl opacity-5 font-serif rotate-180" style={brandStyle}>"</div>
                    
                    <div className="relative z-10 bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                         <span className={`text-sm font-bold tracking-widest uppercase mb-6 block ${colors.number}`}>
                            Slide {String(slide.slideNumber).padStart(2, '0')}
                         </span>
                         <h3 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => { setLocalTitle(e.currentTarget.innerText); handleBlur(); }}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-2xl font-black mb-6 leading-tight ${colors.title} outline-none focus:bg-white/10 p-2 rounded`}
                            style={brandColor && !isInverted && !slide.generatedBackground ? brandGradientText : {}}
                         >
                             {slide.title.toUpperCase()}
                         </h3>
                         <div className="w-16 h-1 bg-current opacity-20 mx-auto mb-6 rounded-full" style={brandBgStyle}></div>
                         <p 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => { setLocalContent(e.currentTarget.innerText); handleBlur(); }}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-sm font-medium ${colors.body} outline-none focus:bg-white/10 p-1 rounded`}
                         >
                             {slide.content}
                         </p>
                    </div>
                </div>
            );

        default:
            return (
                <div className="h-full w-full p-8 flex flex-col relative z-10 backdrop-blur-[1px]">
                     <div className="flex justify-between items-start mb-8">
                        <span className={`text-4xl font-black ${colors.number}`}>
                            {String(slide.slideNumber).padStart(2, '0')}
                        </span>
                        {referenceImage ? (
                            <div className="size-16 rounded-full border-2 border-white/10 overflow-hidden relative" style={{borderColor: brandColor}}>
                                <img src={referenceImage} className="w-full h-full object-cover opacity-80" crossOrigin="anonymous" />
                            </div>
                        ) : (
                             <div className="size-12 rounded-full bg-white/5 flex items-center justify-center backdrop-blur-md border border-white/10">
                                 <span className="material-symbols-outlined opacity-50" style={brandStyle}>auto_awesome</span>
                             </div>
                        )}
                     </div>
                     
                     <div className="mt-auto bg-black/30 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                        <div 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => { setLocalTitle(e.currentTarget.innerText); handleBlur(); }}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-xl font-bold mb-4 ${colors.title} outline-none focus:bg-white/10 rounded px-1`}
                        >
                            {slide.title}
                        </div>
                        <div 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => { setLocalContent(e.currentTarget.innerText); handleBlur(); }}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-sm ${colors.body} outline-none focus:bg-white/10 rounded px-1`}
                        >
                            {slide.content}
                        </div>
                     </div>
                </div>
            );
    }
  };

  const hasPersonRef = slide.imagePrompt.toLowerCase().includes("person") || slide.imagePrompt.toLowerCase().includes("reference") || (referenceImage !== undefined);

  if (isMobileMode) {
      return (
          <div className="relative flex-shrink-0 mx-2">
             <div className="w-[300px] h-[600px] bg-black rounded-[40px] border-[8px] border-slate-800 shadow-2xl overflow-hidden relative">
                 <div className="absolute top-0 w-full h-8 z-50 flex justify-between px-6 items-center text-[10px] text-white font-bold bg-black/20 backdrop-blur-sm">
                     <span>9:41</span>
                     <div className="flex gap-1">
                        <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
                        <span className="material-symbols-outlined text-[14px]">wifi</span>
                        <span className="material-symbols-outlined text-[14px]">battery_full</span>
                     </div>
                 </div>
                 
                 <div className={`w-full h-full ${getContainerStyle()} relative pt-8 flex flex-col`}>
                      {renderBackgroundDecor()}
                      <div className="flex-1 relative">{renderContent()}</div>
                 </div>
                 
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-50"></div>
             </div>
          </div>
      )
  }

  return (
    <div 
        id={id}
        className={`group relative flex-shrink-0 w-[300px] aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:z-10 ${getContainerStyle()}`}
        style={isNeonStyle(style) && !slide.generatedBackground ? neonShadow : {}}
    >
      {renderBackgroundDecor()}
      {renderContent()}

      {/* FOOTER INFO - HIDDEN DURING EXPORT (using data-html2canvas-ignore) */}
      <div 
        data-html2canvas-ignore="true"
        className={`absolute bottom-0 left-0 right-0 p-3 z-30 transform translate-y-[85%] group-hover:translate-y-0 transition-transform duration-300 border-t bg-black/90 backdrop-blur-xl border-white/10`}
      >
        <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${hasPersonRef ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/20 text-primary'}`}>
                        {slide.layoutSuggestion.split(' ')[0]} 
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold truncate max-w-[100px]">{style}</span>
                </div>
                <span className="material-symbols-outlined text-[14px] opacity-50 group-hover:opacity-0 transition-opacity text-white">expand_less</span>
            </div>
            <p className="text-[9px] font-mono leading-tight text-slate-400 mt-2 line-clamp-3 hover:line-clamp-none transition-all cursor-text select-text">
                {slide.imagePrompt}
            </p>
        </div>
      </div>
      
      {/* CONTROLS - HIDDEN DURING EXPORT */}
      <div 
        data-html2canvas-ignore="true"
        className="absolute top-3 right-3 z-40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2"
      >
           <button 
                onClick={(e) => { e.stopPropagation(); cycleLayout(); }}
                className="bg-black/60 hover:bg-primary text-white p-2 rounded-lg backdrop-blur border border-white/10 shadow-lg transition-colors group/btn relative"
                title="Trocar Layout"
            >
               <span className="material-symbols-outlined text-[18px]">shuffle</span>
           </button>
           
           <button 
                onClick={(e) => { e.stopPropagation(); setIsInverted(!isInverted); }}
                className="bg-black/60 hover:bg-white hover:text-black text-white p-2 rounded-lg backdrop-blur border border-white/10 shadow-lg transition-colors group/btn relative"
                title="Inverter Cores"
           >
               <span className="material-symbols-outlined text-[18px]">contrast</span>
           </button>
      </div>

    </div>
  );
};

export default SlideCard;
