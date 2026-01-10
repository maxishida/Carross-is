
import React, { useState, useRef, useEffect } from 'react';
import { CarouselData, GenerationConfig, ToneType, VisualStyleType, CarouselGoal, Slide, StyleCategory } from '../types';
import { generateCarousel, refineCarousel, generateSocialImage, editSocialImage } from '../services/geminiService';
import SlideCard from './SlideCard';
import ConfigPanel from './ConfigPanel';
import AssistantChat from './AssistantChat';
import * as htmlToImageModule from 'html-to-image';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

interface GeneratorViewProps {
    onBack: () => void;
}

// State interface for the Modal (similar to Creative View)
interface PreviewState {
    slideIndex: number;
    history: string[]; // History of background images
    currentStep: number;
}

const LOADING_STEPS = [
    "Analisando tópico e persona...",
    "Definindo estratégia viral (AIDA)...",
    "Escrevendo copys persuasivas...",
    "Estruturando design visual...",
    "Gerando prompts de arte...",
    "Finalizando estrutura..."
];

const GeneratorView: React.FC<GeneratorViewProps> = ({ onBack }) => {
    const [inputValue, setInputValue] = useState('');
    const [refinementPrompt, setRefinementPrompt] = useState('');
    
    // Loading State
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_STEPS[0]);
    
    const [isRefining, setIsRefining] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [data, setData] = useState<CarouselData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [isMobilePreview, setIsMobilePreview] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false); // ZEN MODE STATE
    
    const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
    
    // --- EDITOR MODAL STATE ---
    const [previewData, setPreviewData] = useState<PreviewState | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [uploadedAsset, setUploadedAsset] = useState<string | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [useProModel, setUseProModel] = useState(false);
    const assetInputRef = useRef<HTMLInputElement>(null);

    const resultsEndRef = useRef<HTMLDivElement>(null);

    const [config, setConfig] = useState<GenerationConfig>({
        slideCount: 5,
        tone: ToneType.PROFESSIONAL,
        style: VisualStyleType.GRADIENT_TECH,
        customStylePrompt: '', 
        brandColor: '#6366f1', 
        goal: CarouselGoal.AUTHORITY,
        inputType: 'topic',
        includePeople: false,
        customTheme: '',
        styleCategory: StyleCategory.COMMERCIAL
    });

    // --- AUTO SAVE & RECOVERY ---
    useEffect(() => {
        const savedData = localStorage.getItem('autosave_carousel_data');
        if (savedData && !data) {
            try {
                const parsed = JSON.parse(savedData);
                // Optional: ask user first. For now, auto-load if empty.
                if (confirm("Encontramos um rascunho não salvo. Deseja recuperar?")) {
                    setData(parsed);
                }
            } catch(e) { console.error("Error loading autosave", e); }
        }
    }, []);

    useEffect(() => {
        if (data) {
            localStorage.setItem('autosave_carousel_data', JSON.stringify(data));
        }
    }, [data]);


    const handleUpdateSlide = (updatedSlide: Slide) => {
        if (!data) return;
        const newSlides = data.slides.map(s => 
            s.slideNumber === updatedSlide.slideNumber ? updatedSlide : s
        );
        setData({ ...data, slides: newSlides });
    };

    // --- REORDERING LOGIC ---
    const handleMoveSlide = (index: number, direction: 'left' | 'right') => {
        if (!data) return;
        const newSlides = [...data.slides];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        
        // Bounds check
        if (targetIndex < 0 || targetIndex >= newSlides.length) return;
        
        // Swap
        [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
        
        // Renumber slides to keep logical order in UI
        newSlides.forEach((s, i) => s.slideNumber = i + 1);
        
        setData({...data, slides: newSlides});
    };

    const handleGenerate = async () => {
        if (!inputValue.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setData(null);
        setGeneratingImages({});

        // Start cycling loading messages
        let stepIndex = 0;
        const intervalId = setInterval(() => {
            stepIndex = (stepIndex + 1) % LOADING_STEPS.length;
            setLoadingMessage(LOADING_STEPS[stepIndex]);
        }, 1500);

        try {
            // STEP 1: Generate Text Structure & Visual Prompts
            const result = await generateCarousel(inputValue, config);
            clearInterval(intervalId);
            
            if(!result) throw new Error("Falha ao gerar estrutura.");
            setData(result);
            
            // STEP 2: Trigger Async Image Generation for backgrounds
            result.slides.forEach(async (slide) => {
                setGeneratingImages(prev => ({ ...prev, [slide.slideNumber]: true }));
                
                const imageBase64 = await generateSocialImage(slide.imagePrompt, config.aspectRatio || '1:1'); // Default portrait for slides usually
                
                if (imageBase64) {
                    setData(prevData => {
                        if (!prevData) return null;
                        return {
                            ...prevData,
                            slides: prevData.slides.map(s => 
                                s.slideNumber === slide.slideNumber ? { ...s, generatedBackground: imageBase64 } : s
                            )
                        };
                    });
                }
                setGeneratingImages(prev => ({ ...prev, [slide.slideNumber]: false }));
            });

        } catch (err) {
            clearInterval(intervalId);
            setError('Ocorreu um erro ao gerar o carrossel. Tente novamente.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // --- EDITOR LOGIC ---

    const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedAsset(reader.result as string);
                if (!editPrompt.includes("Use the attached asset")) {
                     setEditPrompt(prev => prev ? `${prev}. Use the attached asset.` : "Use the attached asset.");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditImage = async (isUpscaleRequest = false) => {
        if (!previewData || !data) return;
        if (!editPrompt.trim() && !isUpscaleRequest) return;
        
        const currentImageUrl = previewData.history[previewData.currentStep];

        setIsEditing(true);
        try {
             const newImageBase64 = await editSocialImage(
                 currentImageUrl, 
                 editPrompt, 
                 uploadedAsset || undefined,
                 { usePro: useProModel, upscale: isUpscaleRequest }
             );
             
             if (newImageBase64) {
                 // Update History
                 setPreviewData(prev => {
                     if (!prev) return null;
                     const newHistory = [...prev.history.slice(0, prev.currentStep + 1), newImageBase64];
                     return {
                         ...prev,
                         history: newHistory,
                         currentStep: newHistory.length - 1
                     };
                 });
                 
                 // Update Main Data Source
                 const currentSlide = data.slides[previewData.slideIndex];
                 handleUpdateSlide({ ...currentSlide, generatedBackground: newImageBase64 });
                 
                 if (!isUpscaleRequest) setEditPrompt(''); 
             }
        } catch (err) {
            console.error(err);
        } finally {
            setIsEditing(false);
        }
    };

    const handleUndo = () => {
        if (!previewData || previewData.currentStep <= 0 || !data) return;
        const prevStep = previewData.currentStep - 1;
        const prevImage = previewData.history[prevStep];

        setPreviewData(prev => prev ? ({ ...prev, currentStep: prevStep }) : null);
        
        const currentSlide = data.slides[previewData.slideIndex];
        handleUpdateSlide({ ...currentSlide, generatedBackground: prevImage });
    };

    const handleDownloadSingle = () => {
        if (!previewData) return;
        const currentImage = previewData.history[previewData.currentStep];
        const link = document.createElement('a');
        link.href = currentImage;
        link.download = `Slide_${previewData.slideIndex + 1}_Background.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper to get modal image
    const getModalDisplayImage = () => {
        if (!previewData) return '';
        if (isComparing && previewData.currentStep > 0) {
            return previewData.history[previewData.currentStep - 1];
        }
        return previewData.history[previewData.currentStep];
    }


    const handleRefine = async () => {
        if (!refinementPrompt.trim() || !data) return;
        setIsRefining(true);
        setError(null);
        try {
            const result = await refineCarousel(data, refinementPrompt, config);
            setData(result);
            setRefinementPrompt('');
        } catch (err) {
            setError('Erro ao refinar. Tente novamente.');
            console.error(err);
        } finally {
            setIsRefining(false);
        }
    };

    const handleExportTxt = () => {
        if (!data) return;
        const lines = [
            `TEMA: ${data.topic}`,
            `RESUMO: ${data.overview}`,
            "---------------------------------------------------",
            ""
        ];
        data.slides.forEach(slide => {
            lines.push(`SLIDE ${slide.slideNumber}: ${slide.title}`);
            lines.push(`TEXTO: ${slide.content}`);
            lines.push(`LAYOUT: ${slide.layoutSuggestion}`);
            lines.push("");
        });
        const blob = new Blob([lines.join("\n")], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Carrossel_${data.topic.substring(0, 15).replace(/\s/g, "_")}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // --- VISUAL EXPORT LOGIC ---
    const handleExportImages = async (format: 'zip' | 'pdf' = 'zip') => {
        if (!data) return;
        setIsDownloading(true);

        try {
            // Get elements by ID pattern we set in SlideCard
            const slideElements = data.slides.map(slide => document.getElementById(`slide-card-${slide.slideNumber}`));
            
            const toPng = htmlToImageModule.toPng || (htmlToImageModule as any).default?.toPng;
            if (!toPng) throw new Error("Library import failed");

            const imageDataPromises = slideElements.map(async (element) => {
                if (!element) return null;
                const options: any = { 
                    pixelRatio: 2, // High res export
                    skipFonts: true,
                    // Filter out UI elements if not handled by data-html2canvas-ignore
                    filter: (node: any) => node.tagName !== 'LINK' 
                };
                return await toPng(element as HTMLElement, options);
            });

            const images = await Promise.all(imageDataPromises);
            const validImages = images.filter((img): img is string => img !== null);

            if (format === 'zip') {
                const zip = new JSZip();
                validImages.forEach((img, index) => {
                     const base64Data = img.split(',')[1];
                     zip.file(`slide_${index + 1}.png`, base64Data, { base64: true });
                });
                const content = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Carrossel_${data.topic.substring(0, 15)}.zip`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // PDF EXPORT
                // 1080x1350 aspect ratio (4:5) usually
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [1080, 1350] // Default standard instagram
                });

                validImages.forEach((img, index) => {
                    if (index > 0) pdf.addPage();
                    pdf.addImage(img, 'PNG', 0, 0, 1080, 1350);
                });

                pdf.save(`Carrossel_LinkedIn_${data.topic.substring(0, 15)}.pdf`);
            }

        } catch (err) {
            console.error("Erro exportação visual:", err);
            setError("Falha ao gerar arquivos. Tente novamente.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    useEffect(() => {
        if (data && resultsEndRef.current) {
            resultsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [data]);

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6 fade-in h-full relative">
            
            {/* --- PREVIEW & EDIT MODAL --- */}
            {previewData && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => { if(!isEditing) setPreviewData(null); }}
                >
                    <div 
                        className="relative max-w-7xl w-full h-[90vh] flex rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#020617]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* LEFT: IMAGE CANVAS */}
                        <div className="flex-1 bg-black/50 flex flex-col relative">
                             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
                                 <button onClick={handleUndo} disabled={previewData.currentStep === 0 || isEditing} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 transition-all">
                                     <span className="material-symbols-outlined text-lg">undo</span>
                                 </button>
                                 <div className="w-px h-4 bg-white/20"></div>
                                 <button
                                    onMouseDown={() => setIsComparing(true)}
                                    onMouseUp={() => setIsComparing(false)}
                                    onMouseLeave={() => setIsComparing(false)}
                                    disabled={previewData.currentStep === 0}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all select-none ${isComparing ? 'bg-primary text-white' : 'hover:bg-white/10 text-slate-300'}`}
                                 >
                                     {isComparing ? 'Original' : 'Segure para Comparar'}
                                 </button>
                                 <div className="w-px h-4 bg-white/20"></div>
                                 <button onClick={handleDownloadSingle} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                                     <span className="material-symbols-outlined text-lg">download</span>
                                 </button>
                             </div>

                             <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                                 <img 
                                    src={getModalDisplayImage()} 
                                    className="max-h-full max-w-full object-contain shadow-2xl rounded-sm transition-all duration-75"
                                />
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
                                        <div className="size-16 rounded-full border-4 border-white/10 border-t-primary animate-spin"></div>
                                        <span className="text-white font-bold tracking-widest text-sm animate-pulse">
                                            {useProModel ? 'APLICANDO NANO PRO...' : 'PROCESSANDO...'}
                                        </span>
                                    </div>
                                )}
                             </div>
                        </div>

                        {/* RIGHT: EDIT CONTROLS */}
                        <div className="w-[350px] bg-[#0f172a] border-l border-white/10 flex flex-col">
                             <div className="p-6 border-b border-white/5">
                                 <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-white font-bold text-lg font-display">Editor Slide {previewData.slideIndex + 1}</h3>
                                    <button onClick={() => setPreviewData(null)} disabled={isEditing} className="text-slate-500 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                 </div>
                                 
                                 {/* PRO MODE TOGGLE */}
                                 <div 
                                    onClick={() => !isEditing && setUseProModel(!useProModel)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${useProModel ? 'bg-amber-900/20 border-amber-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                 >
                                     <div className="flex items-center gap-2">
                                         <span className={`material-symbols-outlined ${useProModel ? 'text-amber-400' : 'text-slate-400'}`}>diamond</span>
                                         <span className={`text-xs font-bold ${useProModel ? 'text-amber-200' : 'text-slate-300'}`}>Modo Pro (Banana)</span>
                                     </div>
                                     <div className={`w-8 h-4 rounded-full relative transition-colors ${useProModel ? 'bg-amber-500' : 'bg-slate-600'}`}>
                                         <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-transform ${useProModel ? 'left-4.5' : 'left-0.5'}`}></div>
                                     </div>
                                 </div>
                             </div>

                             <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                                 {/* Asset Upload */}
                                 <div className="flex flex-col gap-2">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ativo Visual</label>
                                     <div 
                                        onClick={() => assetInputRef.current?.click()}
                                        className={`border border-dashed rounded-xl p-4 flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${uploadedAsset ? 'border-primary bg-primary/5' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}
                                     >
                                         {uploadedAsset ? (
                                             <img src={uploadedAsset} className="h-16 w-auto object-contain" alt="Asset" />
                                         ) : (
                                             <div className="flex flex-col items-center gap-1 text-slate-500">
                                                 <span className="material-symbols-outlined text-xl group-hover:text-primary">upload_file</span>
                                                 <span className="text-[10px]">Clique para enviar</span>
                                             </div>
                                         )}
                                         <input type="file" ref={assetInputRef} className="hidden" accept="image/*" onChange={handleAssetUpload} />
                                     </div>
                                 </div>

                                 {/* Quick Edits */}
                                 <div className="flex flex-col gap-2">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Edições Rápidas</label>
                                     <div className="flex flex-wrap gap-2">
                                         {[
                                             { label: 'Remover Fundo', prompt: 'Remove background, isolate subject on white background' },
                                             { label: 'Adicionar Pessoa', prompt: 'Add a realistic person interacting with the scene' },
                                             { label: 'Minimalista', prompt: 'Make it minimalist, clean background, fewer objects' },
                                             { label: 'Cyberpunk', prompt: 'Change style to cyberpunk neon city' }
                                         ].map((chip) => (
                                             <button 
                                                key={chip.label}
                                                onClick={() => {
                                                    setEditPrompt(chip.prompt);
                                                    if(chip.label.includes("Pessoa") || chip.label.includes("Remover")) setUseProModel(true);
                                                }}
                                                disabled={isEditing}
                                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-primary/20 text-[10px] text-slate-300 transition-all text-left"
                                             >
                                                 {chip.label}
                                             </button>
                                         ))}
                                     </div>
                                 </div>

                                 {/* Text Area */}
                                 <textarea 
                                    className="w-full h-24 bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white resize-none"
                                    placeholder="Descreva o que deseja alterar no fundo..."
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    disabled={isEditing}
                                 />

                                 <button 
                                    onClick={() => handleEditImage(true)}
                                    disabled={isEditing}
                                    className="w-full py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                 >
                                     <span className="material-symbols-outlined text-[16px]">hd</span>
                                     ✨ Upscale 2K
                                 </button>
                             </div>

                             <div className="p-6 border-t border-white/5 bg-black/20">
                                 <button 
                                    onClick={() => handleEditImage(false)}
                                    disabled={!editPrompt.trim() || isEditing}
                                    className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                 >
                                     {isEditing ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">auto_fix_high</span>}
                                     <span>Aplicar Edição</span>
                                 </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-transparent hover:border-white/10">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold text-white font-display neon-text-glow">Nova Criação</h1>
                        <span className="text-xs text-primary font-medium tracking-wide">Agente de Ultra Design Ativo</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* ZEN MODE TOGGLE */}
                    <button 
                        onClick={() => setIsZenMode(!isZenMode)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs font-bold ${isZenMode ? 'bg-white text-black border-white' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
                        title="Modo Foco"
                    >
                        <span className="material-symbols-outlined text-[18px]">self_improvement</span>
                        <span className="hidden sm:inline">Zen Mode</span>
                    </button>
                    
                    <button 
                        onClick={() => setIsAssistantOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/50 text-white rounded-full shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-primary/30 transition-all group"
                    >
                        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">smart_toy</span>
                        <span className="text-sm font-bold hidden sm:inline">Co-piloto IA</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
                {/* Configuration Sidebar - Hidden in Zen Mode */}
                {!isZenMode && (
                    <div className="lg:col-span-3 order-2 lg:order-1 animate-in fade-in slide-in-from-left-4 duration-300">
                        <ConfigPanel config={config} setConfig={setConfig} disabled={isLoading || isRefining} />
                    </div>
                )}

                {/* Main Content - Expands in Zen Mode */}
                <div className={`${isZenMode ? 'lg:col-span-12' : 'lg:col-span-9'} order-1 lg:order-2 flex flex-col gap-8 pb-24 transition-all duration-300`}>
                    
                    {/* Glass Input Panel */}
                    <div className={`glass-panel p-1 rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/5 transition-all duration-500 ${isZenMode ? 'opacity-50 hover:opacity-100' : ''}`}>
                        {/* Tabs */}
                        <div className="flex border-b border-white/5 px-2 pt-2 gap-1">
                            <button 
                                onClick={() => setConfig(prev => ({...prev, inputType: 'topic'}))}
                                className={`px-6 py-3 text-sm font-bold transition-all relative overflow-hidden group rounded-t-lg ${config.inputType === 'topic' ? 'text-white border-b-2 border-primary bg-white/[0.03]' : 'text-slate-500 hover:text-white'}`}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-lg ${config.inputType === 'topic' ? 'text-primary' : ''}`}>edit_square</span>
                                    Criar do Zero
                                </span>
                                {config.inputType === 'topic' && <div className="absolute inset-0 bg-primary/10 opacity-50"></div>}
                            </button>
                            <button 
                                onClick={() => setConfig(prev => ({...prev, inputType: 'content'}))}
                                className={`px-6 py-3 text-sm font-bold transition-all relative overflow-hidden group rounded-t-lg ${config.inputType === 'content' ? 'text-white border-b-2 border-primary bg-white/[0.03]' : 'text-slate-500 hover:text-white'}`}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-lg ${config.inputType === 'content' ? 'text-primary' : ''}`}>transform</span>
                                    Transformar Conteúdo
                                </span>
                                {config.inputType === 'content' && <div className="absolute inset-0 bg-primary/10 opacity-50"></div>}
                            </button>
                        </div>

                        {/* Input Area */}
                        <div className="p-6 md:p-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">auto_fix_high</span>
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Descreva sua ideia</h3>
                                </div>
                                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">IA Prompt v2.0</span>
                            </div>
                            
                            <div className="relative group">
                                {config.inputType === 'topic' ? (
                                    <textarea 
                                        className="w-full h-24 glass-input-premium p-5 resize-none text-lg leading-relaxed font-display" 
                                        placeholder="Ex: 5 Dicas para Liderança Remota em empresas de tecnologia..." 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={isLoading || isRefining}
                                    />
                                ) : (
                                    <textarea 
                                        className="w-full h-36 glass-input-premium p-5 resize-none text-sm leading-relaxed" 
                                        placeholder="Cole aqui a transcrição do vídeo, link (simulado) ou texto completo que deseja resumir em carrossel..." 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={isLoading || isRefining}
                                    />
                                )}
                                
                                <div className="absolute bottom-3 right-3 flex gap-2">
                                    <button 
                                        onClick={() => setInputValue('')}
                                        className="text-[10px] font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
                                        disabled={isLoading}
                                    >
                                        Limpar
                                    </button>
                                    <button 
                                        onClick={handleGenerate}
                                        disabled={isLoading || isRefining || !inputValue.trim()}
                                        className="text-[10px] font-bold text-white px-4 py-1.5 rounded-md bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border border-white/20 transition-all shadow-neon-glow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                                        ) : (
                                            <>
                                                <span>Gerar Mágica</span>
                                                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="flex flex-col gap-5">
                         <div className="flex items-center gap-3">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                            <h2 className="text-lg font-bold text-white font-display neon-text-glow flex items-center gap-2">
                                {isLoading ? 'Processando...' : 'Resultado Preview'}
                                {data && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Finalizado</span>}
                            </h2>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                            
                            {/* NEW: Mobile View Toggle */}
                            {data && (
                                <button 
                                    onClick={() => setIsMobilePreview(!isMobilePreview)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isMobilePreview ? 'bg-white text-black border-white' : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'}`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">smartphone</span>
                                    <span>{isMobilePreview ? 'Sair do Mobile' : 'Ver no Celular'}</span>
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-200 text-center backdrop-blur-sm">
                                {error}
                            </div>
                        )}

                        <div className="w-full overflow-x-auto pb-8 pt-2 custom-scrollbar min-h-[420px]">
                            <div className={`flex gap-6 min-w-max px-1 ${isZenMode ? 'justify-center' : ''}`}>
                                {isLoading && (
                                    <div className="w-full h-[420px] rounded-3xl bg-[#030712]/80 border border-white/10 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden backdrop-blur-md">
                                        {/* STORYTELLER LOADING OVERLAY */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-pulse"></div>
                                        
                                        <div className="relative z-10 flex flex-col items-center gap-6">
                                            <div className="relative">
                                                <div className="size-24 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
                                                <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-primary animate-pulse">auto_awesome</span>
                                            </div>
                                            
                                            <div className="flex flex-col gap-2">
                                                <h3 className="text-2xl font-bold text-white font-display tracking-tight animate-fade-in-up">
                                                    Criando Experiência
                                                </h3>
                                                <p className="text-primary font-mono text-sm uppercase tracking-widest animate-pulse">
                                                    {loadingMessage}
                                                </p>
                                            </div>

                                            <div className="flex gap-2 mt-4">
                                                 <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce delay-100"></span>
                                                 <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce delay-200"></span>
                                                 <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce delay-300"></span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!isLoading && !data && (
                                    <div className="border border-white/10 rounded-3xl bg-[#030712]/60 w-full min-h-[420px] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group shadow-inner">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>
                                        <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-primary/30 rounded-tl-3xl opacity-50 group-hover:opacity-100 group-hover:shadow-[inset_2px_2px_10px_rgba(99,102,241,0.2)] transition-all"></div>
                                        <div className="absolute bottom-0 right-0 w-20 h-20 border-b border-r border-primary/30 rounded-br-3xl opacity-50 group-hover:opacity-100 group-hover:shadow-[inset_-2px_-2px_10px_rgba(99,102,241,0.2)] transition-all"></div>
                                        
                                        <div className="z-10 flex flex-col items-center gap-5 max-w-sm relative">
                                            <div className="size-20 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:border-primary/50 group-hover:shadow-neon-primary transition-all duration-500 backdrop-blur-md">
                                                <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary transition-colors">view_carousel</span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-white font-display tracking-tight">Aguardando Input</h3>
                                            <p className="text-sm text-slate-400 leading-relaxed">
                                                Configure o estilo ao lado e clique em <span className="text-primary font-bold">Gerar Mágica</span> para iniciar a renderização glassmorphism.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!isLoading && data && data.slides.map((slide, index) => (
                                    <div 
                                        key={slide.slideNumber} 
                                        className="relative group cursor-pointer"
                                        onClick={() => {
                                            if(slide.generatedBackground) {
                                                setPreviewData({
                                                    slideIndex: index,
                                                    history: [slide.generatedBackground],
                                                    currentStep: 0
                                                });
                                            }
                                        }}
                                    >
                                        {generatingImages[slide.slideNumber] && (
                                            <div className="absolute top-4 right-4 z-40 bg-black/70 backdrop-blur px-2 py-1 rounded text-[10px] text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[10px] animate-spin">sync</span>
                                                Gerando BG...
                                            </div>
                                        )}
                                        <SlideCard 
                                            id={`slide-card-${slide.slideNumber}`}
                                            slide={slide} 
                                            totalSlides={data.slides.length}
                                            style={config.style}
                                            referenceImage={config.referenceImage}
                                            brandColor={config.brandColor} 
                                            onUpdate={handleUpdateSlide} 
                                            isMobileMode={isMobilePreview}
                                            onMoveLeft={() => handleMoveSlide(index, 'left')}
                                            onMoveRight={() => handleMoveSlide(index, 'right')}
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-50 flex items-center justify-center pointer-events-none rounded-xl">
                                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-2">
                                                <span className="material-symbols-outlined text-white">edit</span>
                                                <span className="text-xs font-bold text-white">Editar Fundo</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={resultsEndRef} />
                            </div>
                        </div>

                        {/* Interactive Refinement Bar */}
                        {data && (
                            <div className="glass-panel p-2 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <span className="material-symbols-outlined text-purple-400">chat_spark</span>
                                </div>
                                <input 
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 text-sm"
                                    placeholder="Ex: Mude a cor para azul neon, coloque um astronauta no slide 2..."
                                    value={refinementPrompt}
                                    onChange={(e) => setRefinementPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isRefining}
                                />
                                <button 
                                    onClick={handleRefine}
                                    disabled={isRefining || !refinementPrompt.trim()}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isRefining ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">send</span>}
                                </button>
                            </div>
                        )}
                        
                        {data && (
                             <div className="flex justify-end gap-3">
                                <button 
                                    onClick={handleExportTxt}
                                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-white/30 transition-all bg-black/20"
                                >
                                    <span className="material-symbols-outlined text-sm">description</span>
                                    Roteiro
                                </button>
                                <button 
                                    onClick={() => handleExportImages('pdf')}
                                    disabled={isDownloading}
                                    className="text-xs font-bold text-white flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
                                >
                                    {isDownloading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">picture_as_pdf</span>}
                                    PDF (LinkedIn)
                                </button>
                                <button 
                                    onClick={() => handleExportImages('zip')}
                                    disabled={isDownloading}
                                    className="text-xs font-bold text-white flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
                                >
                                    {isDownloading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">download_for_offline</span>}
                                    Imagens (ZIP)
                                </button>
                             </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Assistant Chat Drawer */}
            <AssistantChat 
                isOpen={isAssistantOpen} 
                onClose={() => setIsAssistantOpen(false)} 
                onApplyIdea={(idea) => { setInputValue(idea); setIsAssistantOpen(false); }}
            />
        </div>
    );
};

export default GeneratorView;
