
import React, { useState, useEffect } from 'react';
import { Slide, VisualStyleType, SlideLayoutType } from '../types';
import FloatingFormatToolbar from './FloatingFormatToolbar';
import { rewriteSlideContent } from '../services/geminiService';

interface SlideCardProps {
  slide: Slide;
  totalSlides: number;
  style: string; 
  referenceImage?: string; 
  brandColor?: string;
  onUpdate: (updatedSlide: Slide) => void; 
  isMobileMode?: boolean; 
  id?: string; 
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}

const SlideCard: React.FC<SlideCardProps> = ({ slide, totalSlides, style, referenceImage, brandColor, onUpdate, isMobileMode, id, onMoveLeft, onMoveRight }) => {
  const [localTitle, setLocalTitle] = useState(slide.title);
  const [localContent, setLocalContent] = useState(slide.content);
  const [isInverted, setIsInverted] = useState(false); 
  const [isFocused, setIsFocused] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Sync props to local state if external update happens
  useEffect(() => {
      setLocalTitle(slide.title);
      setLocalContent(slide.content);
  }, [slide.title, slide.content]);

  const handleBlur = (field: 'title' | 'content', e: React.FocusEvent<HTMLDivElement>) => {
      setIsFocused(false);
      const newText = e.currentTarget.innerHTML; // Capture HTML for formatting
      if (field === 'title') {
          setLocalTitle(newText);
          onUpdate({ ...slide, title: newText });
      } else {
          setLocalContent(newText);
          onUpdate({ ...slide, content: newText });
      }
  };
  
  const handleMagicRewrite = async () => {
      if (isRewriting) return;
      setIsRewriting(true);
      
      try {
        const newTitle = await rewriteSlideContent(localTitle, "Torne mais curto e impactante (título)");
        const newContent = await rewriteSlideContent(localContent, "Torne mais persuasivo e direto (corpo)");
        
        if (newTitle) setLocalTitle(newTitle);
        if (newContent) setLocalContent(newContent);
        
        onUpdate({
            ...slide,
            title: newTitle || localTitle,
            content: newContent || localContent
        });
      } catch (e) {
          console.error(e);
      } finally {
          setIsRewriting(false);
      }
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

  const isLightStyle = (styleName: string): boolean => {
      const lower = styleName.toLowerCase();
      return lower.includes('clean') || lower.includes('minimal') || lower.includes('white') || lower.includes('soft') || lower.includes('educativo') || lower.includes('bege');
  };
  
  const isNeonStyle = (styleName: string): boolean => {
      const lower = styleName.toLowerCase();
      return lower.includes('neon') || lower.includes('cyber') || lower.includes('dark') || lower.includes('glow') || lower.includes('gamer') || lower.includes('tech');
  };

  const getContainerStyle = () => {
    if (slide.generatedBackground && !imgError) {
        return "bg-slate-900 border-white/10 text-white font-display";
    }
    if (isInverted) return "bg-white text-black border-gray-200 font-sans";
    if (isLightStyle(style)) return "bg-white text-slate-800 border-gray-200 font-sans";
    if (isNeonStyle(style)) return "bg-slate-900 text-white border-white/10 font-display shadow-neon-primary";
    return "bg-[#1a1a1a] text-white border-gray-800 font-sans";
  };

  const getTextColors = () => {
       if (slide.generatedBackground && !imgError) return { title: 'text-white drop-shadow-md', body: 'text-white drop-shadow-md', number: 'text-white/50' };
       if (isInverted) return { title: 'text-black', body: 'text-slate-800', number: 'text-slate-900/20' };
       if (isLightStyle(style)) return { title: 'text-slate-900', body: 'text-slate-600', number: 'text-slate-300' };
       return { title: 'text-white', body: 'text-gray-300', number: 'text-white/20' };
  };

  const colors = getTextColors();
  const brandStyle = brandColor ? { color: brandColor } : {};
  const brandBgStyle = brandColor ? { backgroundColor: brandColor } : {};
  const neonShadow = (brandColor && isNeonStyle(style) && (!slide.generatedBackground || imgError)) ? { boxShadow: `0 0 20px ${brandColor}40` } : {};

  const renderBackgroundDecor = () => {
    if (slide.generatedBackground && !imgError) {
        return (
            <>
                <img 
                    src={slide.generatedBackground} 
                    alt="AI Background" 
                    className="absolute inset-0 w-full h-full object-cover z-0 animate-in fade-in duration-700" 
                    crossOrigin="anonymous"
                    onError={() => setImgError(true)} 
                />
                <div className="absolute inset-0 bg-black/40 z-0"></div> 
            </>
        );
    }
    if (isInverted) return null;
    if (isNeonStyle(style)) return <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 z-0"></div>;
    return <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0 mix-blend-overlay" style={{backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")'}}></div>;
  };

  const renderGhostImage = (className: string) => {
      if (!referenceImage) return null;
      if (slide.layoutSuggestion === SlideLayoutType.TYPOGRAPHIC_CENTER) return null;
      return (
        <div className={`absolute ${className} overflow-hidden pointer-events-none`}>
             <img src={referenceImage} className="w-full h-full object-cover mix-blend-overlay opacity-40 grayscale" alt="Ghost" crossOrigin="anonymous" />
            {className.includes('inset-0') && <div className="absolute inset-0 bg-black/60"></div>}
        </div>
      );
  };

  const renderContent = () => {
    const editableClass = "outline-none focus:bg-white/10 rounded px-1 border border-transparent focus:border-white/20 transition-colors cursor-text";
    
    switch (slide.layoutSuggestion) {
        case SlideLayoutType.SPLIT_TOP_IMAGE:
            return (
                <div className="flex flex-col h-full w-full relative z-10">
                    <div className="h-[55%] w-full relative bg-slate-800/30 overflow-hidden backdrop-blur-sm border-b border-white/10">
                        {renderGhostImage('inset-0')}
                        {(!referenceImage && (!slide.generatedBackground || imgError)) && (
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
                            onFocus={() => setIsFocused(true)}
                            onBlur={(e) => handleBlur('title', e)}
                            className={`text-lg font-bold mb-3 leading-tight ${colors.title} ${editableClass}`}
                            dangerouslySetInnerHTML={{__html: localTitle}}
                        />
                        <div 
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={() => setIsFocused(true)}
                            onBlur={(e) => handleBlur('content', e)}
                            className={`text-xs leading-relaxed ${colors.body} ${editableClass}`}
                            dangerouslySetInnerHTML={{__html: localContent}}
                        />
                    </div>
                </div>
            );

        case SlideLayoutType.FULL_IMAGE_OVERLAY:
            return (
                <div className="h-full w-full relative flex flex-col justify-end p-8 overflow-hidden z-10">
                    {renderGhostImage('inset-0')}
                    {(!referenceImage && (!slide.generatedBackground || imgError)) && (
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
                            onFocus={() => setIsFocused(true)}
                            onBlur={(e) => handleBlur('title', e)}
                            className={`text-xl font-bold text-white mb-3 shadow-black drop-shadow-lg ${editableClass}`}
                            dangerouslySetInnerHTML={{__html: localTitle}}
                        />
                        <div 
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={() => setIsFocused(true)}
                            onBlur={(e) => handleBlur('content', e)}
                            className={`text-sm text-gray-200 font-medium leading-relaxed drop-shadow-md ${editableClass}`}
                            dangerouslySetInnerHTML={{__html: localContent}}
                        />
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
                            onFocus={() => setIsFocused(true)}
                            onBlur={(e) => handleBlur('title', e)}
                            className={`text-2xl font-black mb-6 leading-tight ${colors.title} ${editableClass} p-2`}
                            dangerouslySetInnerHTML={{__html: localTitle}}
                         />
                         <div className="w-16 h-1 bg-current opacity-20 mx-auto mb-6 rounded-full" style={brandBgStyle}></div>
                         <p 
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={() => setIsFocused(true)}
                            onBlur={(e) => handleBlur('content', e)}
                            className={`text-sm font-medium ${colors.body} ${editableClass} p-1`}
                            dangerouslySetInnerHTML={{__html: localContent}}
                         />
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
                            onFocus={() => setIsFocused(true)}
                            onBlur={(e) => handleBlur('title', e)}
                            className={`text-xl font-bold mb-4 ${colors.title} ${editableClass}`}
                            dangerouslySetInnerHTML={{__html: localTitle}}
                        />
                        <div 
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={() => setIsFocused(true)}
                            onBlur={(e) => handleBlur('content', e)}
                            className={`text-sm ${colors.body} ${editableClass}`}
                            dangerouslySetInnerHTML={{__html: localContent}}
                        />
                     </div>
                </div>
            );
    }
  };

  const hasPersonRef = slide.imagePrompt.toLowerCase().includes("person") || slide.imagePrompt.toLowerCase().includes("reference") || (referenceImage !== undefined);

  // --- MOBILE PREVIEW MOCKUP ---
  if (isMobileMode) {
      return (
          <div className="relative flex-shrink-0 mx-2">
             <div className="w-[320px] h-[650px] bg-[#000000] rounded-[45px] border-[8px] border-[#1f2024] shadow-2xl overflow-hidden relative ring-4 ring-black">
                 {/* ... (Mobile Mockup same as before) ... */}
                 
                 {/* Main Content Area */}
                 <div className={`w-full h-full ${getContainerStyle()} relative pt-20 flex flex-col`}>
                      {/* Floating Toolbar only active if focused */}
                      {isFocused && <FloatingFormatToolbar brandColor={brandColor || '#6366f1'} />}
                      
                      {renderBackgroundDecor()}
                      <div className="flex-1 relative flex flex-col">
                          {renderContent()}
                      </div>
                      {/* ... */}
                 </div>
                 
                 {/* ... */}
             </div>
          </div>
      )
  }

  // --- DESKTOP CARD VIEW ---
  return (
    <>
        {/* Floating toolbar is rendered globally but controlled by selection events */}
        {isFocused && <FloatingFormatToolbar brandColor={brandColor || '#6366f1'} />}

        <div 
            id={id}
            className={`group relative flex-shrink-0 w-[300px] aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:z-10 ${getContainerStyle()}`}
            style={isNeonStyle(style) && (!slide.generatedBackground || imgError) ? neonShadow : {}}
        >
        {renderBackgroundDecor()}
        {renderContent()}

        {/* FOOTER INFO - HIDDEN DURING EXPORT */}
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
                {imgError && (
                    <p className="text-[9px] text-red-400 font-bold">Erro: Imagem corrompida ou bloqueada.</p>
                )}
            </div>
        </div>
        
        {/* CONTROLS - HIDDEN DURING EXPORT */}
        <div 
            data-html2canvas-ignore="true"
            className="absolute top-3 right-3 z-40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2"
        >
             {/* NEW: MOVE BUTTONS */}
            <div className="flex gap-1 mb-1 justify-end">
                {onMoveLeft && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); onMoveLeft(); }}
                        className="bg-black/60 hover:bg-white hover:text-black text-white p-1.5 rounded-lg backdrop-blur border border-white/10 transition-colors"
                        title="Mover para Esquerda"
                    >
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    </button>
                )}
                {onMoveRight && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); onMoveRight(); }}
                        className="bg-black/60 hover:bg-white hover:text-black text-white p-1.5 rounded-lg backdrop-blur border border-white/10 transition-colors"
                        title="Mover para Direita"
                    >
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                )}
            </div>

            {/* MAGIC REWRITE BUTTON */}
            <button 
                    onClick={(e) => { e.stopPropagation(); handleMagicRewrite(); }}
                    disabled={isRewriting}
                    className="bg-primary/80 hover:bg-primary text-white p-2 rounded-lg backdrop-blur border border-white/10 shadow-lg transition-colors group/btn relative disabled:opacity-50 disabled:cursor-wait"
                    title="Reescrever com Mágica"
            >
                <span className={`material-symbols-outlined text-[18px] ${isRewriting ? 'animate-spin' : ''}`}>
                    {isRewriting ? 'autorenew' : 'magic_button'}
                </span>
            </button>

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
    </>
  );
};

export default SlideCard;
