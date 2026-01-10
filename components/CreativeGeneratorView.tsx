import React, { useState, useRef } from 'react';
import { CreativeData, GenerationConfig, ToneType, VisualStyleType } from '../types';
import { generateCreativeVariations, generateSocialImage, editSocialImage } from '../services/geminiService';
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
    
    const assetInputRef = useRef<HTMLInputElement>(null);

    const [config, setConfig] = useState<GenerationConfig>({
        slideCount: 1, 
        tone: ToneType.PERSUASIVE,
        style: VisualStyleType.THREE_D_CARTOON, 
        inputType: 'topic',
        includePeople: false,
        aspectRatio: '1:1',
        customTheme: ''
    });

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setData(null);
        setGeneratingImages({});

        try {
            // STEP 1: Generate Text Concept & Visual Prompts (Gemini 3 Flash)
            const result = await generateCreativeVariations(topic, config);
            if (!result) throw new Error("Falha ao gerar variações de texto.");
            
            setData(result);
            setIsLoading(false); // Stop main loading to show text cards

            // STEP 2: Trigger Image Generation for each card (Gemini 2.5 Flash Image)
            // We do this in parallel but update state individually
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
        if (!previewData || (!editPrompt.trim() && !isUpscaleRequest)) return;
        
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
                 // Update Preview Modal History
                 setPreviewData(prev => {
                     if (!prev) return null;
                     const newHistory = [...prev.history.slice(0, prev.currentStep + 1), newImageBase64];
                     return {
                         ...prev,
                         history: newHistory,
                         currentStep: newHistory.length - 1
                     };
                 });
                 
                 // Update Main Grid Data
                 setData(prevData => {
                    if (!prevData) return null;
                    return {
                        ...prevData,
                        variations: prevData.variations.map(v => 
                            v.id === previewData.id ? { ...v, generatedImage: newImageBase64 } : v
                        )
                    };
                });
                if (!isUpscaleRequest) setEditPrompt(''); 
             } else {
                 throw new Error("Falha ao editar a imagem.");
             }
        } catch (err) {
            console.error(err);
        } finally {
            setIsEditing(false);
        }
    };

    const handleUndo = () => {
        if (!previewData || previewData.currentStep <= 0) return;

        const prevStep = previewData.currentStep - 1;
        const prevImage = previewData.history[prevStep];

        setPreviewData(prev => prev ? ({ ...prev, currentStep: prevStep }) : null);
        
        // Sync with grid
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

            // Fix for html-to-image ESM/CJS export mismatch on some CDNs
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

    // Helper to get current displayed image in modal
    const getModalDisplayImage = () => {
        if (!previewData) return '';
        // If Comparing and we have history, show previous step
        if (isComparing && previewData.currentStep > 0) {
            return previewData.history[previewData.currentStep - 1];
        }
        return previewData.history[previewData.currentStep];
    }

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6 fade-in h-full relative p-4">
            
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
                             {/* Toolbar Top */}
                             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
                                 <button 
                                    onClick={handleUndo}
                                    disabled={previewData.currentStep === 0 || isEditing}
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
                                 <img 
                                    src={getModalDisplayImage()} 
                                    alt={previewData.title}
                                    className="max-h-full max-w-full object-contain shadow-2xl rounded-sm transition-all duration-75"
                                />
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
                                        disabled={isEditing}
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
                             <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                                 
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

                                 {/* Chips */}
                                 <div className="flex flex-col gap-2">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Edições Rápidas</label>
                                     <div className="flex flex-wrap gap-2">
                                         {[
                                             { label: 'Remover Fundo', prompt: 'Remove background, isolate subject on white background' },
                                             { label: 'Adicionar Pessoa (Realista)', prompt: 'Add a realistic person interacting with the scene, high detail face' },
                                             { label: 'Inserir Logo (Canto)', prompt: 'Insert the provided logo asset in the top right corner, clear background' },
                                             { label: 'Fundo Cyberpunk', prompt: 'Change background to a cyberpunk city street with neon lights' },
                                             { label: 'Iluminação Estúdio', prompt: 'Improve lighting, softbox studio lighting, professional photography' }
                                         ].map((chip) => (
                                             <button 
                                                key={chip.label}
                                                onClick={() => {
                                                    setEditPrompt(chip.prompt);
                                                    if(chip.label.includes("Pessoa") || chip.label.includes("Remover")) {
                                                        setUseProModel(true); // Auto-enable pro for hard tasks
                                                    }
                                                }}
                                                disabled={isEditing}
                                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/50 text-[10px] text-slate-300 hover:text-white transition-all text-left"
                                             >
                                                 {chip.label}
                                             </button>
                                         ))}
                                     </div>
                                 </div>

                                 {/* Input */}
                                 <div className="flex flex-col gap-2">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prompt de Edição</label>
                                     <textarea 
                                        className="w-full h-24 bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-all"
                                        placeholder="Descreva o que deseja alterar na imagem..."
                                        value={editPrompt}
                                        onChange={(e) => setEditPrompt(e.target.value)}
                                        disabled={isEditing}
                                     />
                                 </div>

                                 {/* Upscale Button */}
                                 <button 
                                    onClick={() => handleEditImage(true)}
                                    disabled={isEditing}
                                    className="w-full py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                 >
                                     <span className="material-symbols-outlined text-[16px]">hd</span>
                                     ✨ Upscale 2K (Alta Definição)
                                 </button>

                             </div>

                             {/* Footer Actions */}
                             <div className="p-6 border-t border-white/5 bg-black/20">
                                 <button 
                                    onClick={() => handleEditImage(false)}
                                    disabled={!editPrompt.trim() || isEditing}
                                    className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                 >
                                     {isEditing ? (
                                         <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                     ) : (
                                         <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">auto_fix_high</span>
                                     )}
                                     <span>{isEditing ? 'Processando...' : 'Aplicar Edição'}</span>
                                 </button>
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
                    <div className="bg-[#0f172a]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-purple-500">photo_library</span>
                            O que você quer criar?
                        </label>
                        
                        {/* Search Input with Embedded Button */}
                        <div className="relative mb-6">
                            <input 
                                className="w-full h-14 pl-5 pr-40 rounded-xl bg-[#020617] border border-white/10 text-white placeholder:text-slate-600 focus:ring-primary focus:border-primary text-base font-medium" 
                                placeholder="Ex: post corrida de ia 2026" 
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                disabled={isLoading}
                            />
                            <button 
                                onClick={handleGenerate}
                                disabled={isLoading || !topic.trim()}
                                className="absolute right-2 top-2 h-10 px-6 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30"
                            >
                                {isLoading ? (
                                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                ) : (
                                    <>
                                        <span>Gerar 6x</span>
                                        <span className="material-symbols-outlined text-[18px]">auto_awesome_motion</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Aspect Ratio Selector */}
                        <div className="flex flex-wrap gap-4 items-center">
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Formato:</span>
                             <div className="flex gap-3">
                                <button 
                                    onClick={() => setConfig(prev => ({...prev, aspectRatio: '1:1'}))}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${config.aspectRatio === '1:1' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-transparent border-slate-700 text-slate-400 hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">crop_square</span>
                                    <span className="text-xs font-bold">Post (1:1)</span>
                                </button>
                                <button 
                                    onClick={() => setConfig(prev => ({...prev, aspectRatio: '9:16'}))}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${config.aspectRatio === '9:16' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-transparent border-slate-700 text-slate-400 hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">crop_portrait</span>
                                    <span className="text-xs font-bold">Story (9:16)</span>
                                </button>
                                <button 
                                    onClick={() => setConfig(prev => ({...prev, aspectRatio: '16:9'}))}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${config.aspectRatio === '16:9' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-transparent border-slate-700 text-slate-400 hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">crop_landscape</span>
                                    <span className="text-xs font-bold">Capa (16:9)</span>
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
                                <h3 className="font-bold text-xl text-white">6 Variações Geradas</h3>
                                
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
                                    <span>Download Completo (ZIP)</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.variations.map((item) => (
                                    <div key={item.id} className="group relative flex flex-col bg-[#0f172a] border border-slate-800 hover:border-primary/50 rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/10">
                                        
                                        {/* HEADER TAG */}
                                        <div className="absolute top-4 left-4 z-20 pointer-events-none">
                                            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 uppercase tracking-wider">
                                                VARIAÇÃO #{item.id}
                                            </span>
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
                                                 <span className="text-[10px] text-white font-bold">Gerando Imagem (Nano)...</span>
                                            </div>
                                        )}

                                        {/* EXPORT AREA (IMAGE + TEXT) */}
                                        {/* Added cursor-pointer and onClick for Preview */}
                                        <div 
                                            className={`creative-card-export w-full relative bg-slate-900 overflow-hidden ${getAspectRatioClass()} ${item.generatedImage ? 'cursor-pointer' : ''}`}
                                            onClick={() => {
                                                if(item.generatedImage) {
                                                    setPreviewData({ 
                                                        id: item.id, 
                                                        title: item.conceptTitle, 
                                                        history: [item.generatedImage],
                                                        currentStep: 0 
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
                                                /* Placeholder while generating */
                                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(135deg, ${item.colorPaletteSuggestion})` }}></div>
                                            )}

                                            {/* LAYER 2: Overlay for Readability */}
                                            <div className="absolute inset-0 opacity-40 bg-black mix-blend-multiply pointer-events-none"></div>
                                            <div className="absolute inset-0 opacity-20 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
                                            
                                            {/* AUTO DESIGN CONTENT (Dynamic Layouts) */}
                                            {/* Added pointer-events-none so click goes to parent container for preview */}
                                            <div className={`absolute inset-0 flex flex-col p-8 z-10 pointer-events-none ${item.layoutMode === 'left-aligned' ? 'items-start text-left justify-end pb-12' : 'items-center text-center justify-center'}`}>
                                                
                                                {/* Dynamic Font Class */}
                                                <h4 className={`text-2xl font-black text-white uppercase tracking-tight leading-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] mb-3 ${getFontClass(item.fontStyle)}`}>
                                                    {item.conceptTitle}
                                                </h4>
                                                
                                                {item.layoutMode === 'centered' && <div className="w-12 h-1 bg-white/80 mb-3 rounded-full shadow-[0_0_10px_white]"></div>}
                                                
                                                <p className="text-xs text-white/95 font-medium max-w-[90%] drop-shadow-xl bg-black/30 p-2 rounded border border-white/10 backdrop-blur-sm">
                                                    {item.marketingAngle}
                                                </p>
                                            </div>
                                            
                                            {/* Style Overlay Badge */}
                                            <div className="absolute bottom-2 right-2 opacity-50">
                                                 <span className="text-[8px] text-white uppercase tracking-widest">{item.layoutMode} • {item.fontStyle}</span>
                                            </div>
                                        </div>

                                        {/* INFO BODY */}
                                        <div className="p-5 flex flex-col gap-4 bg-[#0f172a]">
                                            {/* Marketing Angle */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="material-symbols-outlined text-purple-400 text-sm">psychology</span>
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