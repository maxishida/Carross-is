
import React, { useState, useEffect, useRef } from 'react';
import { Slide, VisualStyleType, SlideLayoutType } from '../types';
import FloatingFormatToolbar from './FloatingFormatToolbar';
import { rewriteSlideContent, generateAndPlaySpeech } from '../services/geminiService';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  tone: string;
  brandVoice?: string;
  onRegenerateImage?: () => void;
  isRegenerating?: boolean;
}

const SlideCard: React.FC<SlideCardProps> = ({ slide, totalSlides, style, referenceImage, brandColor, onUpdate, isMobileMode, id, onMoveLeft, onMoveRight, tone, brandVoice, onRegenerateImage, isRegenerating }) => {
  const [localTitle, setLocalTitle] = useState(slide.title);
  const [localContent, setLocalContent] = useState(slide.content);
  const [isInverted, setIsInverted] = useState(false); 
  const [isFocused, setIsFocused] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // --- CANVAS INTERACTIVE STATE ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [bgScale, setBgScale] = useState(1);
  const [bgPosition, setBgPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef<{x: number, y: number} | null>(null);

  // DnD Hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slide.slideNumber.toString(), disabled: isEditMode }); // Disable DnD when editing canvas

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  useEffect(() => {
      setLocalTitle(slide.title);
      setLocalContent(slide.content);
  }, [slide.title, slide.content]);

  // --- CANVAS HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
      if (!isEditMode) return;
      dragStartRef.current = { x: e.clientX - bgPosition.x, y: e.clientY - bgPosition.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isEditMode || !dragStartRef.current) return;
      setBgPosition({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y
      });
  };

  const handleMouseUp = () => {
      dragStartRef.current = null;
  };

  const handleBlur = (field: 'title' | 'content', e: React.FocusEvent<HTMLDivElement>) => {
      setIsFocused(false);
      const newText = e.currentTarget.innerHTML; 
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
        const newTitle = await rewriteSlideContent(localTitle, tone, brandVoice);
        const newContent = await rewriteSlideContent(localContent, tone, brandVoice);
        if (newTitle) setLocalTitle(newTitle);
        if (newContent) setLocalContent(newContent);
        onUpdate({
            ...slide,
            title: newTitle || localTitle,
            content: newContent || localContent
        });
      } catch (e) { console.error(e); } finally { setIsRewriting(false); }
  };

  const handleSpeak = async () => {
      if (isSpeaking) return;
      setIsSpeaking(true);
      try {
          const cleanTitle = localTitle.replace(/<[^>]*>?/gm, '');
          const cleanContent = localContent.replace(/<[^>]*>?/gm, '');
          const textToRead = `${cleanTitle}. ${cleanContent}`;
          await generateAndPlaySpeech(textToRead);
      } catch (e) { console.error(e); } finally { setIsSpeaking(false); }
  }

  const cycleLayout = () => {
      const layouts = Object.values(SlideLayoutType);
      const currentIndex = layouts.indexOf(slide.layoutSuggestion);
      const nextIndex = (currentIndex + 1) % layouts.length;
      onUpdate({ ...slide, layoutSuggestion: layouts[nextIndex] });
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
    if (slide.generatedBackground && !imgError) return "bg-slate-900 border-white/10 text-white font-display";
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
            <div 
                className="absolute inset-0 z-0 overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isEditMode ? 'move' : 'default' }}
            >
                <img 
                    src={slide.generatedBackground} 
                    alt="AI Background" 
                    className="w-full h-full object-cover transition-transform duration-75 origin-center" 
                    style={{ 
                        transform: `scale(${bgScale}) translate(${bgPosition.x}px, ${bgPosition.y}px)` 
                    }}
                    crossOrigin="anonymous"
                    onError={() => setImgError(true)} 
                />
                <div className={`absolute inset-0 bg-black/40 pointer-events-none transition-opacity ${isEditMode ? 'opacity-0' : 'opacity-100'}`}></div> 
            </div>
        );
    }
    if (isInverted) return null;
    if (isNeonStyle(style)) return <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 z-0"></div>;
    return <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0 mix-blend-overlay" style={{backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")'}}></div>;
  };

  const renderContent = () => {
    const editableClass = "outline-none focus:bg-white/10 rounded px-1 border border-transparent focus:border-white/20 transition-colors cursor-text relative z-20";
    return (
        <div className="h-full w-full relative flex flex-col p-8 z-10 pointer-events-none">
             <div className="pointer-events-auto">
                <span className={`text-4xl font-black ${colors.number}`}>
                    {String(slide.slideNumber).padStart(2, '0')}
                </span>
                <div className="mt-8">
                    <div 
                        contentEditable={!isEditMode}
                        onFocus={() => setIsFocused(true)}
                        onBlur={(e) => handleBlur('title', e)}
                        className={`text-xl font-bold mb-4 ${colors.title} ${editableClass}`}
                        dangerouslySetInnerHTML={{__html: localTitle}}
                    />
                    <div 
                        contentEditable={!isEditMode}
                        onFocus={() => setIsFocused(true)}
                        onBlur={(e) => handleBlur('content', e)}
                        className={`text-sm ${colors.body} ${editableClass}`}
                        dangerouslySetInnerHTML={{__html: localContent}}
                    />
                </div>
             </div>
        </div>
    );
  };

  const hasPersonRef = slide.imagePrompt.toLowerCase().includes("person") || slide.imagePrompt.toLowerCase().includes("reference") || (referenceImage !== undefined);

  if (isMobileMode) {
      return (
          <div className="relative flex-shrink-0 w-[300px] h-[550px] bg-black rounded-3xl border-4 border-gray-800 overflow-hidden mx-auto shadow-2xl">
              {renderBackgroundDecor()}
              {renderContent()}
          </div>
      )
  }

  return (
    <>
        {isFocused && <FloatingFormatToolbar brandColor={brandColor || '#6366f1'} />}

        <div 
            ref={setNodeRef}
            style={dndStyle}
            id={id}
            className={`group relative flex-shrink-0 w-[300px] aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:z-10 ${getContainerStyle()}`}
        >
        
        {/* DRAG HANDLE */}
        {!isEditMode && (
            <div 
                {...attributes} 
                {...listeners} 
                className="absolute top-0 left-0 right-0 h-10 z-50 cursor-grab active:cursor-grabbing hover:bg-gradient-to-b hover:from-black/40 hover:to-transparent transition-all"
                title="Arrastar para reordenar"
            ></div>
        )}

        {renderBackgroundDecor()}
        
        {/* Render Layout Content based on type */}
        {renderContent()}

        {/* CANVAS CONTROLS (ZOOM SLIDER) - Only in Edit Mode */}
        {isEditMode && (
            <div className="absolute bottom-16 left-4 right-4 z-50 bg-[#1e1b2e]/90 backdrop-blur-xl rounded-xl p-4 border border-white/20 flex flex-col gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                    <span>Zoom</span>
                    <span>{Math.round(bgScale * 100)}%</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={bgScale} 
                    onChange={(e) => setBgScale(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[9px] text-slate-500 text-center font-medium">Arraste a imagem para mover</p>
                <button 
                    onClick={() => setIsEditMode(false)}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                >
                    Concluir Ajuste
                </button>
            </div>
        )}

        {/* FOOTER INFO - HIDDEN DURING EXPORT */}
        <div 
            data-html2canvas-ignore="true"
            className={`absolute bottom-0 left-0 right-0 p-3 z-30 transform translate-y-[85%] group-hover:translate-y-0 transition-transform duration-300 border-t bg-[#1e1b2e]/95 backdrop-blur-xl border-white/10 ${isEditMode ? 'hidden' : ''}`}
        >
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${hasPersonRef ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                            {slide.layoutSuggestion.split(' ')[0]} 
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold truncate max-w-[100px]">{style}</span>
                    </div>
                    <span className="material-symbols-outlined text-[14px] opacity-50 group-hover:opacity-0 transition-opacity text-white">expand_less</span>
                </div>
                <p className="text-[9px] font-mono leading-tight text-slate-500 mt-2 line-clamp-3 hover:line-clamp-none transition-all cursor-text select-text bg-black/20 p-2 rounded">
                    {slide.imagePrompt}
                </p>
            </div>
        </div>
        
        {/* CONTROLS - HIDDEN DURING EXPORT */}
        <div 
            data-html2canvas-ignore="true"
            className={`absolute top-3 right-3 z-40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col gap-2 ${isEditMode ? 'hidden' : ''}`}
        >
            <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditMode(true); }}
                    className="size-8 bg-[#1e1b2e]/80 hover:bg-[#1e1b2e] text-white rounded-lg backdrop-blur border border-white/10 shadow-lg transition-all flex items-center justify-center hover:scale-105"
                    title="Ajustar Imagem (Pan/Zoom)"
            >
                <span className="material-symbols-outlined text-[18px]">transform</span>
            </button>

            {onRegenerateImage && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onRegenerateImage(); }}
                    disabled={isRegenerating}
                    className="size-8 bg-[#1e1b2e]/80 hover:bg-[#1e1b2e] text-white rounded-lg backdrop-blur border border-white/10 shadow-lg transition-all flex items-center justify-center hover:scale-105 disabled:opacity-50"
                    title="Regenerar Fundo (Variação)"
                >
                    <span className={`material-symbols-outlined text-[18px] ${isRegenerating ? 'animate-spin text-yellow-400' : ''}`}>
                        {isRegenerating ? 'sync' : 'refresh'}
                    </span>
                </button>
            )}

            <button 
                    onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
                    disabled={isSpeaking}
                    className="size-8 bg-[#1e1b2e]/80 hover:bg-[#1e1b2e] text-white rounded-lg backdrop-blur border border-white/10 shadow-lg transition-all flex items-center justify-center hover:scale-105 disabled:opacity-50"
                    title="Ouvir Slide (TTS)"
            >
                <span className={`material-symbols-outlined text-[18px] ${isSpeaking ? 'animate-pulse text-green-400' : ''}`}>volume_up</span>
            </button>

            <button 
                    onClick={(e) => { e.stopPropagation(); handleMagicRewrite(); }}
                    disabled={isRewriting}
                    className="size-8 bg-gradient-to-br from-purple-600 to-pink-600 hover:brightness-110 text-white rounded-lg backdrop-blur shadow-lg transition-all flex items-center justify-center hover:scale-105 disabled:opacity-50"
                    title="Reescrever com Mágica"
            >
                <span className={`material-symbols-outlined text-[18px] ${isRewriting ? 'animate-spin' : ''}`}>
                    {isRewriting ? 'autorenew' : 'magic_button'}
                </span>
            </button>

            <button 
                    onClick={(e) => { e.stopPropagation(); cycleLayout(); }}
                    className="size-8 bg-[#1e1b2e]/80 hover:bg-[#1e1b2e] text-white rounded-lg backdrop-blur border border-white/10 shadow-lg transition-all flex items-center justify-center hover:scale-105"
                    title="Trocar Layout"
                >
                <span className="material-symbols-outlined text-[18px]">shuffle</span>
            </button>
        </div>

        </div>
    </>
  );
};

export default SlideCard;
