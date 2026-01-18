
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CreativeData, GenerationConfig, ToneType, VisualStyleType, StyleCategory, CarouselGoal } from '../types';
import { generateCreativeVariations, generateSocialImage, editSocialImage, researchTopic, generateVeoFromImage } from '../services/geminiService';
import ConfigPanel from './ConfigPanel';
import * as htmlToImageModule from 'html-to-image';
import JSZip from 'jszip';

interface CreativeGeneratorViewProps {
    onBack: () => void;
}

interface PreviewState {
    id: number;
    title: string;
    history: string[]; // Stack of image URLs for Undo functionality
    currentStep: number;
    videoUrl?: string; // New: Store generated video URL
}

const CreativeGeneratorView: React.FC<CreativeGeneratorViewProps> = ({ onBack }) => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [data, setData] = useState<CreativeData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
    
    // State for Image Preview & Edit Modal
    const [previewData, setPreviewData] = useState<PreviewState | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [uploadedAsset, setUploadedAsset] = useState<string | null>(null);
    const [isComparing, setIsComparing] = useState(false); 
    const [useProModel, setUseProModel] = useState(false); // Pro Toggle
    
    // NEW: Motion Director State
    const [motionPrompt, setMotionPrompt] = useState('');
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(false);
    
    // NEW: Sorting State
    const [sortBy, setSortBy] = useState<'default' | 'score'>('default');

    const assetInputRef = useRef<HTMLInputElement>(null);
    const productInputRef = useRef<HTMLInputElement>(null); // New ref for product image

    const [config, setConfig] = useState<GenerationConfig>({
        slideCount: 1, 
        tone: ToneType.PERSUASIVE,
        style: 'Vitrine 3D', // Default to a product friendly style
        inputType: 'topic',
        includePeople: false,
        aspectRatio: '1:1',
        customTheme: '',
        styleCategory: StyleCategory.COMMERCIAL, // Default to Commercial
        goal: CarouselGoal.SALES,
        productName: '',
        productUrl: '',
        productImageUrl: '',
        brandVoiceSample: ''
    });

    useEffect(() => {
        // Keyboard Shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // Esc to close modal
            if (e.key === 'Escape') {
                if (previewData && !isEditing && !isGeneratingVideo) {
                    setPreviewData(null);
                }
            }
            // Ctrl + Enter to Generate (if not in modal)
            if (e.ctrlKey && e.key === 'Enter') {
                if (!previewData && !isLoading && (topic.trim() || (config.inputType === 'product' && config.productImageUrl))) {
                    handleGenerate();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewData, isEditing, isGeneratingVideo, isLoading, topic, config]);

    useEffect(() => {
        // Check for paid API key for Veo
        const checkKey = async () => {
            const aistudio = (window as any).aistudio;
            if (aistudio) {
                const hasKey = await aistudio.hasSelectedApiKey();
                setHasApiKey(hasKey);
            } else {
                setHasApiKey(true); // Dev fallback
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        const aistudio = (window as any).aistudio;
        if (aistudio) {
            try {
                await aistudio.openSelectKey();
                setHasApiKey(true); 
            } catch (e) {
                console.error("Erro ao selecionar chave:", e);
            }
        }
    };

    const handleGenerate = async () => {
        // Validation based on mode
        if (config.inputType === 'product') {
            if (!config.productImageUrl) {
                alert("Por favor, faça o upload da imagem do produto.");
                return;
            }
        } else {
            if (!topic.trim()) return;
        }
        
        setIsLoading(true);
        setError(null);
        setData(null);
        setGeneratingImages({});

        try {
            // OPTIONAL: Research Link Context if Product URL is present
            let context = topic;
            if (config.inputType === 'product' && config.productUrl) {
                // Quick research to get context if user didn't type much name
                 const res = await researchTopic(config.productUrl);
                 if (res.text) context += ` ${res.text.substring(0, 300)}`;
            }

            // STEP 1: Generate Text Concept & Visual Prompts (Gemini 3 Flash)
            const result = await generateCreativeVariations(context || config.productName || "Produto", config);
            if (!result) throw new Error("Falha ao gerar variações de texto.");
            
            setData(result);
            setIsLoading(false); // Stop main loading to show text cards

            // STEP 2: Trigger Image Generation for each card (Gemini 2.5 Flash Image)
            result.variations.forEach(async (variation) => {
                setGeneratingImages(prev => ({ ...prev, [variation.id]: true }));
                
                const imageBase64 = await generateSocialImage(variation.visualPrompt, config.aspectRatio || '1:1');
                
                if (imageBase64) {
                    setData(prevData => {
                        if (!prevData) return null;
                        return {
                            ...prevData,
                            variations: prevData.variations.map(v => 
                                v.id === variation.id ? { ...v, generatedImage: imageBase64 } : v
                            )
                        };
                    });
                }
                
                setGeneratingImages(prev => ({ ...prev, [variation.id]: false }));
            });

        } catch (err) {
            setError('Erro ao gerar criativos. Tente novamente.');
            console.error(err);
            setIsLoading(false);
        }
    };

    const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setConfig(prev => ({ ...prev, productImageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

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

    const handleEditImage = async (isUpscaleRequest = false, isOutpainting = false) => {
        if (!previewData) return;
        if (!editPrompt.trim() && !isUpscaleRequest && !isOutpainting) return;
        
        const currentImageUrl = previewData.history[previewData.currentStep];

        setIsEditing(true);
        try {
             const newImageBase64 = await editSocialImage(
                 currentImageUrl, 
                 editPrompt, 
                 uploadedAsset || undefined,
                 { 
                     usePro: useProModel, 
                     upscale: isUpscaleRequest,
                     expandToStory: isOutpainting
                 }
             );
             
             if (newImageBase64) {
                 setPreviewData(prev => {
                     if (!prev) return null;
                     const newHistory = [...prev.history.slice(0, prev.currentStep + 1), newImageBase64];
                     return {
                         ...prev,
                         history: newHistory,
                         currentStep: newHistory.length - 1
                     };
                 });
                 
                 setData(prevData => {
                    if (!prevData) return null;
                    return {
                        ...prevData,
                        variations: prevData.variations.map(v => 
                            v.id === previewData.id ? { ...v, generatedImage: newImageBase64 } : v
                        )
                    };
                });
                if (!isUpscaleRequest && !isOutpainting) setEditPrompt(''); 
             } else {
                 throw new Error("Falha ao editar a imagem.");
             }
        } catch (err) {
            console.error(err);
        } finally {
            setIsEditing(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (!previewData || !motionPrompt.trim()) return;
        
        setIsGeneratingVideo(true);
        // Ensure prompt matches the "Director" persona
        const directorPrompt = motionPrompt;
        const currentImage = previewData.history[previewData.currentStep];

        try {
            const videoUri = await generateVeoFromImage(currentImage, directorPrompt);
            if (videoUri) {
                // Update Preview State with video
                setPreviewData(prev => prev ? ({ ...prev, videoUrl: videoUri }) : null);
                
                // Update Main Data
                setData(prevData => {
                    if (!prevData) return null;
                    return {
                        ...prevData,
                        variations: prevData.variations.map(v => 
                            v.id === previewData.id ? { ...v, generatedVideo: videoUri } : v
                        )
                    };
                });
            } else {
                throw new Error("Falha ao gerar vídeo.");
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Erro ao gerar vídeo com Veo.");
        } finally {
            setIsGeneratingVideo(false);
        }
    };

    const handleUndo = () => {
        if (!previewData || previewData.currentStep <= 0) return;

        const prevStep = previewData.currentStep - 1;
        const prevImage = previewData.history[prevStep];

        setPreviewData(prev => prev ? ({ ...prev, currentStep: prevStep }) : null);
        
        setData(prevData => {
            if (!prevData) return null;
            return {
                ...prevData,
                variations: prevData.variations.map(v => 
                    v.id === previewData.id ? { ...v, generatedImage: prevImage } : v
                )
            };
        });
    };
    
    const handleDownloadSingle = () => {
        if (!previewData) return;
        const currentImage = previewData.history[previewData.currentStep];
        const link = document.createElement('a');
        link.href = currentImage;
        link.download = `Nano_Edit_${previewData.title.replace(/\s/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAll = async () => {
        if (!data) return;
        setIsDownloading(true);

        try {
            const zip = new JSZip();
            const elements = document.querySelectorAll('.creative-card-export');
            
            if (elements.length === 0) {
                throw new Error("Nenhum criativo encontrado para exportar.");
            }

            const toPng = htmlToImageModule.toPng || (htmlToImageModule as any).default?.toPng;
            
            if (!toPng) {
                 throw new Error("Failed to load image generator library.");
            }

            const promises = Array.from(elements).map(async (element, index) => {
                const options: any = { 
                    pixelRatio: 2,
                    skipFonts: true,
                    filter: (node: any) => {
                        return (node.tagName !== 'LINK');
                    }
                };

                const dataUrl = await toPng(element as HTMLElement, options);
                const base64Data = dataUrl.split(',')[1];
                zip.file(`criativo_${index + 1}_${data.topic.substring(0, 10)}.png`, base64Data, { base64: true });
            });

            await Promise.all(promises);
            const content = await zip.generateAsync({ type: 'blob' });
            
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Pack_Criativos_${data.topic.replace(/\s/g, '_')}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Erro ao baixar criativos:", err);
            setError("Falha ao gerar o arquivo ZIP. Tente novamente.");
        } finally {
            setIsDownloading(false);
        }
    };

    const getAspectRatioClass = () => {
        switch(config.aspectRatio) {
            case '9:16': return 'aspect-[9/16]';
            case '16:9': return 'aspect-video';
            case '1:1': 
            default: return 'aspect-square';
        }
    }

    const getFontClass = (fontType: string) => {
        switch(fontType) {
            case 'serif': return 'font-serif';
            case 'mono': return 'font-mono';
            case 'display': return 'font-display';
            default: return 'font-sans';
        }
    };

    const getModalDisplayImage = () => {
        if (!previewData) return '';
        if (isComparing && previewData.currentStep > 0) {
            return previewData.history[previewData.currentStep - 1];
        }
        return previewData.history[previewData.currentStep];
    }
    
    // NEW: Helper for Score Color
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        if (score >= 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    };

    // Calculate highest score for Winner Badge
    const highestScore = useMemo(() => {
        if (!data?.variations?.length) return 0;
        return Math.max(...data.variations.map(v => v.predictionScore));
    }, [data]);

    // Sorting Logic
    const sortedVariations = useMemo(() => {
        if (!data?.variations) return [];
        if (sortBy === 'score') {
            return [...data.variations].sort((a, b) => b.predictionScore - a.predictionScore);
        }
        return data.variations;
    }, [data, sortBy]);

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6 fade-in h-full relative p-4">
            
            {/* --- PREVIEW & EDIT MODAL --- */}
            {previewData && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => { if(!isEditing && !isGeneratingVideo) setPreviewData(null); }}
                >
                    <div 
                        className="relative max-w-7xl w-full h-[90vh] flex rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#020617]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* LEFT: IMAGE / VIDEO CANVAS */}
                        <div className="flex-1 bg-black/50 flex flex-col relative">
                             {/* Toolbar Top */}
                             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
                                 <button 
                                    onClick={handleUndo}
                                    disabled={previewData.currentStep === 0 || isEditing || !!previewData.videoUrl}
                                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 transition-all tooltip-trigger"
                                    title="Desfazer"
                                 >
                                     <span className="material-symbols-outlined text-lg">undo</span>
                                 </button>
                                 <div className="w-px h-4 bg-white/20"></div>
                                 <button
                                    onMouseDown={() => setIsComparing(true)}
                                    onMouseUp={() => setIsComparing(false)}
                                    onMouseLeave={() => setIsComparing(false)}
                                    disabled={previewData.currentStep === 0}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all select-none ${isComparing ? 'bg-primary text-white shadow-neon-primary' : 'hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer'}`}
                                 >
                                     {isComparing ? 'Original' : 'Segure para Comparar'}
                                 </button>
                                 <div className="w-px h-4 bg-white/20"></div>
                                 <button 
                                    onClick={handleDownloadSingle}
                                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                    title="Baixar esta imagem"
                                 >
                                     <span className="material-symbols-outlined text-lg">download</span>
                                 </button>
                             </div>

                             <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                                 {/* VIDEO OR IMAGE DISPLAY */}
                                 {previewData.videoUrl ? (
                                     <div className="relative w-full h-full flex items-center justify-center">
                                         <video 
                                            src={previewData.videoUrl} 
                                            controls 
                                            autoPlay 
                                            loop
                                            className="max-h-full max-w-full rounded-lg shadow-2xl border border-white/10"
                                         />
                                         <button 
                                            onClick={() => setPreviewData({...previewData, videoUrl: undefined})}
                                            className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-red-500/80 transition-colors"
                                            title="Voltar para Imagem"
                                         >
                                             <span className="material-symbols-outlined">close</span>
                                         </button>
                                     </div>
                                 ) : (
                                     <img 
                                        src={getModalDisplayImage()} 
                                        alt={previewData.title}
                                        className="max-h-full max-w-full object-contain shadow-2xl rounded-sm transition-all duration-75"
                                    />
                                 )}

                                 {/* OVERLAYS */}
                                 {isEditing && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
                                        <div className="relative">
                                            <div className="size-16 rounded-full border-4 border-white/10 border-t-primary animate-spin"></div>
                                            <span className="material-symbols-outlined text-3xl text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">auto_fix_high</span>
                                        </div>
                                        <span className="text-white font-bold tracking-widest text-sm animate-pulse">
                                            {useProModel ? 'APLICANDO NANO PRO (2K)...' : 'APLICANDO MÁGICA...'}
                                        </span>
                                    </div>
                                 )}
                                 
                                 {isGeneratingVideo && (
                                     <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-40">
                                         <div className="size-20 rounded-full border-4 border-white/10 border-t-neon-cyan animate-spin"></div>
                                         <div className="text-center">
                                             <h3 className="text-xl font-bold text-white font-display neon-text-glow">Diretor Veo em Ação</h3>
                                             <p className="text-sm text-neon-cyan animate-pulse mt-2">Renderizando vídeo de 8s (Flash 3.1)...</p>
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>

                        {/* RIGHT: EDIT CONTROLS */}
                        <div className="w-[350px] bg-[#0f172a] border-l border-white/10 flex flex-col">
                             {/* Header */}
                             <div className="p-6 border-b border-white/5">
                                 <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-white font-bold text-lg font-display">Editor Nano AI</h3>
                                    <button 
                                        onClick={() => setPreviewData(null)}
                                        className="text-slate-500 hover:text-white transition-colors"
                                        disabled={isEditing || isGeneratingVideo}
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                 </div>
                                 
                                 {/* PRO MODE TOGGLE */}
                                 <div 
                                    onClick={() => !isEditing && setUseProModel(!useProModel)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${useProModel ? 'bg-gradient-to-r from-amber-500/10 to-amber-700/10 border-amber-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                 >
                                     <div className="flex items-center gap-2">
                                         <span className={`material-symbols-outlined ${useProModel ? 'text-amber-400' : 'text-slate-400'}`}>diamond</span>
                                         <div className="flex flex-col">
                                             <span className={`text-xs font-bold ${useProModel ? 'text-amber-200' : 'text-slate-300'}`}>Modo Pro (Banana)</span>
                                             <span className="text-[9px] text-slate-500">{useProModel ? 'Alta qualidade, edições complexas' : 'Rápido, edições simples'}</span>
                                         </div>
                                     </div>
                                     <div className={`w-8 h-4 rounded-full relative transition-colors ${useProModel ? 'bg-amber-500' : 'bg-slate-600'}`}>
                                         <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-transform ${useProModel ? 'left-4.5' : 'left-0.5'}`}></div>
                                     </div>
                                 </div>
                             </div>

                             {/* Edit Form */}
                             <div className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
                                 
                                 {/* --- IMAGE EDITOR SECTION --- */}
                                 <div className="flex flex-col gap-6 relative">
                                     <div className="flex items-center gap-2 mb-2">
                                         <span className="material-symbols-outlined text-primary text-sm">photo_filter</span>
                                         <h4 className="text-xs font-bold text-white uppercase tracking-widest">Editor de Imagem</h4>
                                     </div>

                                     {/* Asset Upload Section */}
                                     <div className="flex flex-col gap-2">
                                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ativo Visual (Logo/Imagem)</label>
                                         <div 
                                            onClick={() => assetInputRef.current?.click()}
                                            className={`border border-dashed rounded-xl p-4 flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${uploadedAsset ? 'border-primary bg-primary/5' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}
                                         >
                                             {uploadedAsset ? (
                                                 <>
                                                     <img src={uploadedAsset} className="h-16 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" alt="Asset" />
                                                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                         <span className="text-xs text-white font-bold">Trocar Imagem</span>
                                                     </div>
                                                     <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setUploadedAsset(null);
                                                        }}
                                                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors z-20"
                                                     >
                                                         <span className="material-symbols-outlined text-[14px]">close</span>
                                                     </button>
                                                 </>
                                             ) : (
                                                 <div className="flex flex-col items-center gap-1 text-slate-500">
                                                     <span className="material-symbols-outlined text-xl group-hover:text-primary transition-colors">upload_file</span>
                                                     <span className="text-[10px] group-hover:text-white transition-colors">Clique para enviar</span>
                                                 </div>
                                             )}
                                             <input 
                                                type="file" 
                                                ref={assetInputRef} 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={handleAssetUpload}
                                             />
                                         </div>
                                     </div>

                                     {/* Quick Edits */}
                                     <div className="flex flex-col gap-2">
                                         <div className="flex flex-wrap gap-2">
                                             {['Remover Fundo', 'Adicionar Pessoa (Realista)', 'Inserir Logo', 'Fundo Cyberpunk'].map((chip) => (
                                                 <button 
                                                    key={chip}
                                                    onClick={() => {
                                                        setEditPrompt(chip === 'Remover Fundo' ? 'Remove background' : chip);
                                                        if(chip.includes('Pessoa')) setUseProModel(true);
                                                    }}
                                                    disabled={isEditing}
                                                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/50 text-[10px] text-slate-300 hover:text-white transition-all"
                                                 >
                                                     {chip}
                                                 </button>
                                             ))}
                                         </div>
                                         <textarea 
                                            className="w-full h-20 bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:border-primary focus:ring-1 resize-none"
                                            placeholder="Prompt de edição..."
                                            value={editPrompt}
                                            onChange={(e) => setEditPrompt(e.target.value)}
                                            disabled={isEditing}
                                         />
                                         
                                         {/* ACTION BUTTONS GRID */}
                                         <div className="grid grid-cols-2 gap-2">
                                             <button 
                                                onClick={() => handleEditImage(true)}
                                                disabled={isEditing}
                                                className="py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                                                title="Aumentar resolução"
                                             >
                                                 <span className="material-symbols-outlined text-[16px]">hd</span>
                                                 Upscale
                                             </button>
                                             
                                             {/* FEATURE 3: SMART OUTPAINTING */}
                                             <button 
                                                onClick={() => handleEditImage(false, true)}
                                                disabled={isEditing}
                                                className="py-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                                                title="Expandir para 9:16 (Story)"
                                             >
                                                 <span className="material-symbols-outlined text-[16px]">aspect_ratio</span>
                                                 Expandir (Story)
                                             </button>
                                         </div>

                                         <button 
                                            onClick={() => handleEditImage(false)}
                                            disabled={!editPrompt.trim() || isEditing}
                                            className="w-full py-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 text-white font-bold rounded-lg shadow-lg text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                                         >
                                             {isEditing ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">auto_fix_high</span>}
                                             Aplicar Edição
                                         </button>
                                     </div>
                                 </div>

                                 <div className="h-px bg-white/10 w-full"></div>

                                 {/* --- MOTION DIRECTOR SECTION --- */}
                                 <div className="flex flex-col gap-4">
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className="material-symbols-outlined text-neon-cyan text-sm">movie_filter</span>
                                         <h4 className="text-xs font-bold text-white uppercase tracking-widest">Motion Director (Veo)</h4>
                                     </div>
                                     
                                     {!hasApiKey ? (
                                         <button 
                                            onClick={handleSelectKey}
                                            className="w-full py-3 bg-yellow-600/20 border border-yellow-500/50 hover:bg-yellow-600/30 text-yellow-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                         >
                                             <span className="material-symbols-outlined text-sm">key</span>
                                             Conectar Faturamento (Veo)
                                         </button>
                                     ) : (
                                         <div className="flex flex-col gap-3">
                                             <p className="text-[10px] text-slate-400 leading-relaxed">
                                                 Descreva como a imagem deve ganhar vida (clima, movimento de câmera, iluminação).
                                             </p>
                                             <textarea 
                                                className="w-full h-24 bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan resize-none"
                                                placeholder="Ex: Câmera orbitando o produto em slow motion, partículas de luz flutuando, atmosfera mágica..."
                                                value={motionPrompt}
                                                onChange={(e) => setMotionPrompt(e.target.value)}
                                                disabled={isGeneratingVideo}
                                             />
                                             <button 
                                                onClick={handleGenerateVideo}
                                                disabled={!motionPrompt.trim() || isGeneratingVideo}
                                                className="w-full py-3 bg-gradient-to-r from-neon-cyan/20 to-blue-600/20 hover:from-neon-cyan/40 hover:to-blue-600/40 border border-neon-cyan/50 text-neon-cyan font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.2)] text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                             >
                                                 {isGeneratingVideo ? (
                                                     <span className="material-symbols-outlined animate-spin text-sm">movie</span>
                                                 ) : (
                                                     <span className="material-symbols-outlined text-sm">videocam</span>
                                                 )}
                                                 {isGeneratingVideo ? 'Renderizando (8s)...' : 'Gerar Vídeo 8s (Veo Flash)'}
                                             </button>
                                         </div>
                                     )}
                                 </div>

                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-white">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold text-white font-display">Gerador de Criativos</h1>
                        <span className="text-xs text-slate-400">Motor: Auto Design (Gemini 3 Flash) + Image Gen (Nano Banana)</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
                {/* Configuration Sidebar */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                    <ConfigPanel config={config} setConfig={setConfig} disabled={isLoading} hideSlideCount={true} />
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9 order-1 lg:order-2 flex flex-col gap-8 pb-24">
                    {/* Input & Filters Area */}
                    <div className={`glass-panel p-1 rounded-2xl shadow-xl transition-all duration-300 ${config.inputType === 'product' ? 'border-purple-500/30 shadow-purple-900/10' : ''}`}>
                         {/* Mode Switcher */}
                        <div className="flex border-b border-white/5 px-2 pt-2 gap-1 mb-4">
                            <button 
                                onClick={() => setConfig(prev => ({...prev, inputType: 'topic', styleCategory: StyleCategory.SOCIAL}))}
                                className={`px-6 py-3 text-sm font-bold transition-all relative overflow-hidden group rounded-t-lg ${config.inputType === 'topic' ? 'text-white border-b-2 border-primary bg-white/[0.03]' : 'text-slate-500 hover:text-white'}`}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">edit_square</span>
                                    Criar do Zero
                                </span>
                            </button>
                            <button 
                                onClick={() => setConfig(prev => ({...prev, inputType: 'product', styleCategory: StyleCategory.COMMERCIAL}))}
                                className={`px-6 py-3 text-sm font-bold transition-all relative overflow-hidden group rounded-t-lg ${config.inputType === 'product' ? 'text-white border-b-2 border-purple-500 bg-white/[0.03]' : 'text-slate-500 hover:text-white'}`}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-lg ${config.inputType === 'product' ? 'text-purple-400' : ''}`}>shopping_bag</span>
                                    E-commerce / Produto
                                </span>
                                {config.inputType === 'product' && <div className="absolute inset-0 bg-purple-500/10 opacity-50"></div>}
                            </button>
                        </div>
                        
                        <div className="px-6 pb-6 pt-2">
                            {config.inputType === 'topic' ? (
                                <>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined text-purple-500">photo_library</span>
                                        O que você quer criar?
                                    </label>
                                    <div className="relative mb-6">
                                        <input 
                                            className="w-full h-14 pl-5 pr-40 rounded-xl bg-[#020617] border border-white/10 text-white placeholder:text-slate-600 focus:ring-primary focus:border-primary text-base font-medium" 
                                            placeholder="Ex: post corrida de ia 2026" 
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
                                     {/* Left Column: Text Inputs */}
                                     <div className="flex flex-col gap-4">
                                         <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Link do Produto (Wrapper)</label>
                                            <div className="relative">
                                                <input 
                                                    className="w-full p-3 pl-9 rounded-xl bg-[#020617] border border-white/10 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                                    placeholder="https://loja.com/produto"
                                                    value={config.productUrl || ''}
                                                    onChange={(e) => setConfig({...config, productUrl: e.target.value})}
                                                />
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">link</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1">*A IA usará este link para extrair contexto sobre o produto.</p>
                                         </div>
                                         
                                         <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Nome do Produto</label>
                                            <input 
                                                className="w-full p-3 rounded-xl bg-[#020617] border border-white/10 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                                placeholder="Ex: Tênis Runner Pro X"
                                                value={config.productName || ''}
                                                onChange={(e) => setConfig({...config, productName: e.target.value})}
                                            />
                                         </div>
                                     </div>

                                     {/* Right Column: Image Upload */}
                                     <div>
                                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Imagem do Produto (Recortada)</label>
                                         <div 
                                            onClick={() => productInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-xl h-[140px] flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${config.productImageUrl ? 'border-purple-500 bg-purple-500/5' : 'border-white/20 hover:bg-white/5'}`}
                                         >
                                             {config.productImageUrl ? (
                                                 <img src={config.productImageUrl} className="h-full w-full object-contain p-2" alt="Product" />
                                             ) : (
                                                 <div className="flex flex-col items-center gap-2 text-slate-400">
                                                     <span className="material-symbols-outlined text-3xl group-hover:text-purple-400">add_photo_alternate</span>
                                                     <span className="text-xs font-bold">Upload PNG (Sem Fundo)</span>
                                                 </div>
                                             )}
                                             <input 
                                                type="file" 
                                                ref={productInputRef} 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={handleProductImageUpload} 
                                            />
                                         </div>
                                     </div>
                                </div>
                            )}

                            {/* Aspect Ratio Selector & Action Button */}
                            <div className="flex flex-wrap items-end justify-between gap-4 mt-6 pt-4 border-t border-white/5">
                                 <div className="flex gap-3">
                                    <button 
                                        onClick={() => setConfig(prev => ({...prev, aspectRatio: '1:1'}))}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${config.aspectRatio === '1:1' ? 'bg-primary/20 border-primary text-primary' : 'bg-transparent border-slate-700 text-slate-400 hover:bg-white/5'}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">crop_square</span>
                                        <span className="text-[10px] font-bold">1:1</span>
                                    </button>
                                    <button 
                                        onClick={() => setConfig(prev => ({...prev, aspectRatio: '9:16'}))}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${config.aspectRatio === '9:16' ? 'bg-primary/20 border-primary text-primary' : 'bg-transparent border-slate-700 text-slate-400 hover:bg-white/5'}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">crop_portrait</span>
                                        <span className="text-[10px] font-bold">9:16</span>
                                    </button>
                                 </div>

                                 <button 
                                    onClick={handleGenerate}
                                    disabled={isLoading || (config.inputType === 'product' ? !config.productImageUrl : !topic.trim())}
                                    className="h-10 px-8 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30"
                                >
                                    {isLoading ? (
                                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                    ) : (
                                        <>
                                            <span>{config.inputType === 'product' ? 'Gerar Cenários' : 'Gerar 6x'}</span>
                                            <span className="material-symbols-outlined text-[18px]">auto_awesome_motion</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Grid */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-200 text-center">
                            {error}
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col gap-4">
                            <h3 className="font-bold text-xl text-white">Gerando Conceitos...</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className={`w-full rounded-2xl bg-slate-800 animate-pulse border border-slate-700 relative overflow-hidden aspect-[4/5]`}>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isLoading && data && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-xl text-white">
                                    {config.inputType === 'product' ? '6 Cenários de Produto' : '6 Variações Geradas'}
                                </h3>
                                
                                <div className="flex items-center gap-2">
                                    {/* SORTING TOGGLE */}
                                    <button 
                                        onClick={() => setSortBy(prev => prev === 'default' ? 'score' : 'default')}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all border ${sortBy === 'score' ? 'bg-primary text-white border-primary shadow-neon-primary' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">sort</span>
                                        {sortBy === 'score' ? 'Ordenado: Score AI' : 'Ordenar por Performance'}
                                    </button>

                                    <button 
                                        onClick={handleDownloadAll}
                                        disabled={isDownloading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDownloading ? (
                                            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[20px]">download_for_offline</span>
                                        )}
                                        <span>Download (ZIP)</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sortedVariations.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className={`group relative flex flex-col bg-[#0f172a] border rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/10
                                            ${item.predictionScore === highestScore && sortBy === 'score' ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'border-slate-800 hover:border-primary/50'}
                                        `}
                                    >
                                        
                                        {/* HEADER TAG */}
                                        <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-wrap items-center gap-2 max-w-[90%]">
                                            {/* AI SCORE BADGE */}
                                            {item.predictionScore && (
                                                <span className={`backdrop-blur-md text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider flex items-center gap-1 shadow-lg ${getScoreColor(item.predictionScore)}`}>
                                                    <span className="material-symbols-outlined text-[10px]">auto_graph</span>
                                                    {item.predictionScore}% {item.predictionLabel}
                                                </span>
                                            )}
                                            {/* WINNER CROWN (If highest) */}
                                            {item.predictionScore === highestScore && (
                                                <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg shadow-yellow-500/40 animate-pulse flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[10px]">emoji_events</span>
                                                    WINNER
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* EXPAND/PREVIEW INDICATOR (HOVER) */}
                                        {item.generatedImage && (
                                            <div className="absolute inset-x-0 top-0 h-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/20">
                                                    <span className="material-symbols-outlined text-white text-sm">open_in_full</span>
                                                    <span className="text-[10px] font-bold text-white uppercase">Visualizar & Editar</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Loading Indicator for Image Generation */}
                                        {generatingImages[item.id] && (
                                            <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/20 flex items-center gap-2">
                                                 <span className="material-symbols-outlined text-yellow-400 text-sm animate-spin">sync</span>
                                                 <span className="text-[10px] text-white font-bold">Gerando Imagem...</span>
                                            </div>
                                        )}

                                        {/* EXPORT AREA (IMAGE + TEXT + PRODUCT OVERLAY) */}
                                        <div 
                                            className={`creative-card-export w-full relative bg-slate-900 overflow-hidden ${getAspectRatioClass()} ${item.generatedImage ? 'cursor-pointer' : ''}`}
                                            onClick={() => {
                                                if(item.generatedImage) {
                                                    setPreviewData({ 
                                                        id: item.id, 
                                                        title: item.conceptTitle, 
                                                        history: [item.generatedImage],
                                                        currentStep: 0,
                                                        videoUrl: item.generatedVideo // Load video if exists
                                                    });
                                                }
                                            }}
                                        >
                                            
                                            {/* LAYER 1: Generated Image or Fallback Gradient */}
                                            {item.generatedImage ? (
                                                <img 
                                                    src={item.generatedImage} 
                                                    className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-1000"
                                                    alt="Generated background"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(135deg, ${item.colorPaletteSuggestion})` }}></div>
                                            )}
                                            
                                            {/* LAYER 1.5: PRODUCT OVERLAY (E-commerce Mode) */}
                                            {config.inputType === 'product' && config.productImageUrl && (
                                                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none p-8">
                                                    <img 
                                                        src={config.productImageUrl} 
                                                        className="w-full h-full object-contain drop-shadow-2xl filter brightness-105"
                                                        style={{maxHeight: '70%', maxWidth: '70%'}}
                                                        alt="Product Overlay"
                                                    />
                                                </div>
                                            )}

                                            {/* LAYER 2: Overlay for Readability (Only if not in product mode, or minimized) */}
                                            {config.inputType !== 'product' && (
                                                <>
                                                    <div className="absolute inset-0 opacity-40 bg-black mix-blend-multiply pointer-events-none"></div>
                                                    <div className="absolute inset-0 opacity-20 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
                                                </>
                                            )}
                                            
                                            {/* AUTO DESIGN CONTENT (Dynamic Layouts - Hidden in Product Mode usually, or minimal) */}
                                            {config.inputType !== 'product' && (
                                                <div className={`absolute inset-0 flex flex-col p-8 z-10 pointer-events-none ${item.layoutMode === 'left-aligned' ? 'items-start text-left justify-end pb-12' : 'items-center text-center justify-center'}`}>
                                                    
                                                    <h4 className={`text-2xl font-black text-white uppercase tracking-tight leading-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] mb-3 ${getFontClass(item.fontStyle)}`}>
                                                        {item.conceptTitle}
                                                    </h4>
                                                    
                                                    {item.layoutMode === 'centered' && <div className="w-12 h-1 bg-white/80 mb-3 rounded-full shadow-[0_0_10px_white]"></div>}
                                                    
                                                    <p className="text-xs text-white/95 font-medium max-w-[90%] drop-shadow-xl bg-black/30 p-2 rounded border border-white/10 backdrop-blur-sm">
                                                        {item.marketingAngle}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {/* Style Overlay Badge */}
                                            <div className="absolute bottom-2 right-2 opacity-50">
                                                 <span className="text-[8px] text-white uppercase tracking-widest">{item.layoutMode}</span>
                                            </div>

                                            {/* Video Indicator */}
                                            {item.generatedVideo && (
                                                <div className="absolute bottom-2 left-2 z-20">
                                                    <span className="bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[10px]">videocam</span>
                                                        VEO
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* INFO BODY */}
                                        <div className="p-5 flex flex-col gap-4 bg-[#0f172a] relative">
                                            {/* AI Prediction Section */}
                                            {item.predictionReason && (
                                                <div className="bg-black/30 p-3 rounded-lg border border-white/5 relative overflow-hidden group/score">
                                                     <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-xs text-primary">psychology</span>
                                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Potencial de CTR</span>
                                                        <span className="ml-auto text-[10px] font-mono text-primary">{item.predictionScore}/100</span>
                                                    </div>
                                                    
                                                    {/* SCORE BAR VISUALIZATION */}
                                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                                item.predictionScore >= 80 ? 'bg-emerald-500' : 
                                                                item.predictionScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${item.predictionScore}%` }}
                                                        ></div>
                                                    </div>

                                                    <p className="text-[10px] text-slate-400 leading-relaxed italic border-l-2 border-white/10 pl-2">
                                                        "{item.predictionReason}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Marketing Angle */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="material-symbols-outlined text-purple-400 text-sm">lightbulb</span>
                                                    <span className="text-xs font-bold text-purple-300">Ângulo de Marketing</span>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                                    {item.marketingAngle}
                                                </p>
                                            </div>
                                            
                                            {/* Visual Prompt Box */}
                                            <div className="bg-[#020617] p-3 rounded-lg border border-slate-800 group-hover:border-slate-700 transition-colors">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">PROMPT VISUAL (NANO)</span>
                                                    <button 
                                                        onClick={() => navigator.clipboard.writeText(item.visualPrompt)}
                                                        className="text-primary hover:text-white transition-colors"
                                                        title="Copiar Prompt"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                                    </button>
                                                </div>
                                                <p className="text-[10px] font-mono text-slate-500 line-clamp-4 leading-relaxed">
                                                    {item.visualPrompt}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreativeGeneratorView;
