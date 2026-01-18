import React, { useState, useRef, useEffect } from 'react';
import { CarouselData, GenerationConfig, ToneType, VisualStyleType, CarouselGoal, Slide, StyleCategory, Project } from '../types';
import { generateCarousel, refineCarousel, generateSocialImage, editSocialImage, researchTopic, generateAndPlaySpeech, STYLE_PROMPT_MAP } from '../services/geminiService';
import SlideCard from './SlideCard';
import ConfigPanel from './ConfigPanel';
import AssistantChat from './AssistantChat';
import InstagramMockup from './InstagramMockup';
import * as htmlToImageModule from 'html-to-image';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useAgency } from '../context/AgencyContext';

interface GeneratorViewProps {
    onBack: () => void;
}

const LOADING_STEPS = [
    "Agente de Pesquisa: Consultando Google...",
    "Analisando tópico e audiência...",
    "Definindo estratégia viral (AIDA)...",
    "Escrevendo copys persuasivas...",
    "Estruturando design visual...",
    "Gerando prompts de arte...",
    "Finalizando estrutura..."
];

const GeneratorView: React.FC<GeneratorViewProps> = ({ onBack }) => {
    // --- CONTEXT ---
    const { projects, addToast } = useAgency();

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
    const [isZenMode, setIsZenMode] = useState(false); 
    const [isSpeakingInput, setIsSpeakingInput] = useState(false);
    const [showInstagramMockup, setShowInstagramMockup] = useState(false);
    
    const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
    
    // Project Save State
    const [saveProjectModalOpen, setSaveProjectModalOpen] = useState(false);
    
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
        styleCategory: StyleCategory.COMMERCIAL,
        audience: ''
    });

    // Ensure Assistant is closed on mount
    useEffect(() => {
        setIsAssistantOpen(false);
    }, []);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id && data) {
            const oldIndex = data.slides.findIndex((slide) => slide.slideNumber.toString() === active.id);
            const newIndex = data.slides.findIndex((slide) => slide.slideNumber.toString() === over.id);
            
            const newSlides = arrayMove(data.slides, oldIndex, newIndex);
            
            // Renumber slides logically
            const renumberedSlides = newSlides.map((slide, idx) => ({
                ...slide,
                slideNumber: idx + 1
            }));

            setData({ ...data, slides: renumberedSlides });
        }
    };

    const handleRemixStyle = (newStyle: string) => {
        setConfig(prev => ({ ...prev, style: newStyle }));
    };

    // --- AUTO SAVE & RECOVERY ---
    useEffect(() => {
        const savedData = localStorage.getItem('autosave_carousel_data');
        if (savedData && !data) {
            try {
                const parsed = JSON.parse(savedData);
                if (confirm("Encontramos um rascunho não salvo. Deseja recuperar?")) {
                    setData(parsed);
                }
            } catch(e) { console.error("Error loading autosave", e); }
        }
    }, []);

    useEffect(() => {
        if (data) {
            try {
                const lightweightData = {
                    ...data,
                    slides: data.slides.map(s => ({ ...s, generatedBackground: undefined }))
                };
                localStorage.setItem('autosave_carousel_data', JSON.stringify(lightweightData));
            } catch (e) { console.warn("Autosave failed.", e); }
        }
    }, [data]);

    const handleUpdateSlide = (updatedSlide: Slide) => {
        if (!data) return;
        const newSlides = data.slides.map(s => 
            s.slideNumber === updatedSlide.slideNumber ? updatedSlide : s
        );
        setData({ ...data, slides: newSlides });
    };

    const handleRegenerateSingleImage = async (slideNumber: number) => {
        if (!data) return;
        const slide = data.slides.find(s => s.slideNumber === slideNumber);
        if (!slide) return;
        setGeneratingImages(prev => ({ ...prev, [slideNumber]: true }));
        try {
            const promptWithVariation = `${slide.imagePrompt}, distinct variation, alternative composition, different angle`;
            const newImage = await generateSocialImage(promptWithVariation, config.aspectRatio || '1:1');
            if (newImage) {
                handleUpdateSlide({ ...slide, generatedBackground: newImage });
            }
        } catch (e) { console.error(`Falha ao regenerar slide ${slideNumber}`, e); } 
        finally { setGeneratingImages(prev => ({ ...prev, [slideNumber]: false })); }
    };

    const handleGenerate = async () => {
        if (!inputValue.trim()) return;
        setIsLoading(true);
        setError(null);
        setData(null);
        setGeneratingImages({});
        let stepIndex = 0;
        setLoadingMessage(LOADING_STEPS[0]);
        const intervalId = setInterval(() => {
            stepIndex = (stepIndex + 1) % LOADING_STEPS.length;
            setLoadingMessage(LOADING_STEPS[stepIndex]);
        }, 2000);

        try {
            let researchResult = { text: "", sources: [] as string[] };
            if (config.inputType === 'topic') {
                setLoadingMessage("Agente de Pesquisa: Buscando fontes...");
                researchResult = await researchTopic(inputValue, config.audience);
            }
            const result = await generateCarousel(inputValue, config, researchResult.text);
            clearInterval(intervalId);
            if(!result) throw new Error("Falha ao gerar estrutura.");
            result.sources = researchResult.sources;
            setData(result);
            result.slides.forEach(async (slide) => {
                try {
                    setGeneratingImages(prev => ({ ...prev, [slide.slideNumber]: true }));
                    const imageBase64 = await generateSocialImage(slide.imagePrompt, config.aspectRatio || '1:1');
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
                } catch (imgErr) { console.error(`Erro ao gerar imagem`, imgErr); } 
                finally { setGeneratingImages(prev => ({ ...prev, [slide.slideNumber]: false })); }
            });
        } catch (err) {
            clearInterval(intervalId);
            setError('Ocorreu um erro ao gerar o carrossel. Tente novamente.');
            console.error(err);
        } finally { setIsLoading(false); }
    };

    const handleExportImages = async (format: 'zip' | 'pdf' = 'zip') => {
        if (!data) return;
        setIsDownloading(true);
        try {
            const slideElements = data.slides.map(slide => document.getElementById(`slide-card-${slide.slideNumber}`));
            const toPng = htmlToImageModule.toPng || (htmlToImageModule as any).default?.toPng;
            if (!toPng) throw new Error("Library import failed");
            const imageDataPromises = slideElements.map(async (element) => {
                if (!element) return null;
                return await toPng(element as HTMLElement, { pixelRatio: 2, skipFonts: true, filter: (node: any) => node.tagName !== 'LINK' });
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
                a.download = `Carrossel.zip`;
                a.click();
            } else {
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1080, 1350] });
                validImages.forEach((img, index) => {
                    if (index > 0) pdf.addPage();
                    pdf.addImage(img, 'PNG', 0, 0, 1080, 1350);
                });
                pdf.save(`Carrossel.pdf`);
            }
        } catch (err) { console.error("Erro export", err); setError("Falha ao gerar arquivos."); } 
        finally { setIsDownloading(false); }
    };

    const handleSaveToProject = (projectId: string) => {
        addToast("Arte salva na Biblioteca do Projeto!", "success");
        setSaveProjectModalOpen(false);
    };

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6 fade-in h-full relative">
            
            <InstagramMockup 
                isOpen={showInstagramMockup} 
                onClose={() => setShowInstagramMockup(false)} 
                slides={data?.slides || []} 
                topic={data?.topic || "Assunto"} 
            />

            {/* SAVE TO PROJECT MODAL */}
            {saveProjectModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1e1b2e] border border-white/10 rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Salvar na Biblioteca do Projeto</h3>
                        <div className="space-y-2">
                            {projects.map(p => (
                                <button 
                                    key={p.id} 
                                    onClick={() => handleSaveToProject(p.id)}
                                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-between group"
                                >
                                    <span className="text-sm text-white font-medium">{p.name}</span>
                                    <i className="fa-solid fa-cloud-arrow-up text-slate-500 group-hover:text-purple-400"></i>
                                </button>
                            ))}
                            {projects.length === 0 && <p className="text-slate-500 text-xs">Nenhum projeto ativo.</p>}
                        </div>
                        <button onClick={() => setSaveProjectModalOpen(false)} className="mt-4 w-full text-slate-400 text-xs hover:text-white">Cancelar</button>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-transparent hover:border-white/10">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold text-white font-display tracking-tight">Carrossel Glass</h1>
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Agente de Ultra Design Ativo</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
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
                        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 text-white rounded-full shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:bg-purple-500/30 transition-all group ${isAssistantOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isAssistantOpen}
                    >
                        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">smart_toy</span>
                        <span className="text-sm font-bold hidden sm:inline">Co-piloto IA</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full overflow-hidden">
                {/* Configuration Sidebar */}
                {!isZenMode && (
                    <div className="lg:col-span-3 order-2 lg:order-1 animate-in fade-in slide-in-from-left-4 duration-300 flex flex-col gap-4 h-full overflow-hidden">
                        <ConfigPanel config={config} setConfig={setConfig} disabled={isLoading || isRefining} />
                        
                        {/* STYLE REMIXER (Instant Style Change) */}
                        <div className="bg-[#1e1b2e]/80 backdrop-blur-xl lg:rounded-2xl border border-white/5 p-4 shadow-lg shrink-0">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-pink-400">palette</span>
                                Visual Remix (Instant)
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.keys(STYLE_PROMPT_MAP).slice(0, 6).map((styleName) => (
                                    <button 
                                        key={styleName}
                                        onClick={() => handleRemixStyle(styleName)}
                                        className="text-[9px] bg-black/40 hover:bg-white/10 border border-white/5 rounded-lg py-2 px-1 text-center truncate transition-all hover:border-pink-500/50 text-slate-300 hover:text-white"
                                    >
                                        {styleName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className={`${isZenMode ? 'lg:col-span-12' : 'lg:col-span-9'} order-1 lg:order-2 flex flex-col gap-8 pb-24 transition-all duration-300 h-full overflow-y-auto custom-scrollbar`}>
                    
                    {/* Input Panel */}
                    {!data && !isLoading && (
                         <div className="flex flex-col gap-4 pt-10">
                             {/* Large Input Box Mockup (Dark Glass) */}
                             <div className="bg-[#1e1b2e]/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative min-h-[200px] flex flex-col justify-center border border-white/10 group focus-within:border-purple-500/50 transition-colors">
                                <textarea 
                                    className="w-full bg-transparent border-none p-0 resize-none text-2xl font-display font-medium text-white placeholder:text-slate-500 focus:ring-0 leading-tight" 
                                    placeholder="Descreva seu tópico aqui..." 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    autoFocus
                                />
                                <div className="absolute bottom-6 right-6 flex items-center gap-3">
                                    <button 
                                        onClick={handleGenerate} 
                                        className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-pink-900/20 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                                    >
                                        <span>Gerar Mágica</span>
                                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                    </button>
                                </div>
                             </div>
                             
                             <div className="flex justify-center gap-6 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                 <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">bolt</span> Rápido</span>
                                 <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">auto_awesome</span> IA Generativa</span>
                                 <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">verified</span> Profissional</span>
                             </div>
                         </div>
                    )}

                    {/* Results Area */}
                    {(data || isLoading) && (
                    <div className="flex flex-col gap-5">
                         <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-white font-display tracking-tight flex items-center gap-2">
                                {isLoading ? 'Processando...' : 'Resultado'}
                            </h2>
                            {data && (
                                <>
                                    <button 
                                        onClick={() => setIsMobilePreview(!isMobilePreview)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isMobilePreview ? 'bg-white text-black border-white' : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">smartphone</span>
                                        <span>{isMobilePreview ? 'Sair do Mobile' : 'Ver no Celular'}</span>
                                    </button>
                                    
                                    {/* INSTAGRAM MOCKUP BUTTON */}
                                    <button 
                                        onClick={() => setShowInstagramMockup(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border bg-gradient-to-r from-pink-500/20 to-orange-500/20 border-pink-500/30 text-white hover:border-pink-500 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">view_comfy</span>
                                        <span>Simular Feed</span>
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="w-full overflow-x-auto pb-8 pt-2 custom-scrollbar min-h-[420px]">
                            {/* DND CONTEXT WRAPPER */}
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={data?.slides.map(s => s.slideNumber.toString()) || []} strategy={horizontalListSortingStrategy}>
                                    <div className={`flex gap-6 min-w-max px-1 ${isZenMode ? 'justify-center' : ''}`}>
                                        {isLoading && (
                                            <div className="w-full h-[420px] rounded-3xl bg-[#1e1b2e]/80 border border-white/10 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
                                                <div className="size-24 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin mb-6"></div>
                                                <h3 className="text-2xl font-bold text-white font-display">Criando Experiência</h3>
                                                <p className="text-purple-400 font-mono text-sm uppercase tracking-widest animate-pulse mt-2">{loadingMessage}</p>
                                            </div>
                                        )}

                                        {!isLoading && data && data.slides.map((slide, index) => (
                                            <div key={slide.slideNumber.toString()} className="relative group">
                                                {generatingImages[slide.slideNumber] && (
                                                    <div className="absolute top-4 right-4 z-40 bg-black/70 backdrop-blur px-2 py-1 rounded text-[10px] text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[10px] animate-spin">sync</span>
                                                        Gerando BG...
                                                    </div>
                                                )}
                                                <SlideCard 
                                                    id={slide.slideNumber.toString()} // ID for DnD
                                                    slide={slide} 
                                                    totalSlides={data.slides.length}
                                                    style={config.style}
                                                    referenceImage={config.referenceImage}
                                                    brandColor={config.brandColor} 
                                                    onUpdate={handleUpdateSlide} 
                                                    isMobileMode={isMobilePreview}
                                                    tone={config.tone}
                                                    brandVoice={config.brandVoiceSample}
                                                    onRegenerateImage={() => handleRegenerateSingleImage(slide.slideNumber)}
                                                    isRegenerating={generatingImages[slide.slideNumber]}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                        
                        {/* Export Buttons */}
                        {data && (
                             <div className="flex justify-end gap-3">
                                <button onClick={() => setSaveProjectModalOpen(true)} className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                                    <span className="material-symbols-outlined text-sm">folder_open</span>
                                    Salvar na Biblioteca
                                </button>
                                <button onClick={() => handleExportImages('zip')} className="text-xs font-bold text-white flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20">
                                    {isDownloading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">download_for_offline</span>}
                                    Download (ZIP)
                                </button>
                             </div>
                        )}
                    </div>
                    )}
                </div>
            </div>

            <AssistantChat 
                isOpen={isAssistantOpen} 
                onClose={() => setIsAssistantOpen(false)} 
                onApplyIdea={(idea) => { setInputValue(idea); setIsAssistantOpen(false); }}
            />
        </div>
    );
};

export default GeneratorView;