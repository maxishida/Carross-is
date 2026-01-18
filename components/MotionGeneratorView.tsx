
import React, { useState, useEffect, useRef } from 'react';
import { MotionConfig, MotionMode, MotionStyle, MotionVisualTheme, MotionAspectRatio, MotionChatMessage, GeneratedVeoData, MotionScene } from '../types';
import { generateVeoVideo, enhanceMotionPrompt, generateMapPrompt, generateDataPrompt, refineMotionChat, generateTypographyPrompt, generateVeoFromImage, generateAndPlaySpeech, analyzeVisualContent, extendVeoVideo, generateVeoWithReferences, generateSocialImage, extractMapParameters } from '../services/geminiService';

interface MotionGeneratorViewProps {
    onBack: () => void;
}

const TEMPLATES = [
    { label: 'Map Travel', icon: 'flight_takeoff', mode: MotionMode.MAPS, desc: 'Zoom de mapa animado' },
    { label: 'Chart Data', icon: 'analytics', mode: MotionMode.DATA, desc: 'Gráficos 3D em movimento' },
    { label: 'Kinetic Text', icon: 'text_fields', mode: MotionMode.TYPOGRAPHY, desc: 'Tipografia viral' }, 
    { label: 'Social Intro', icon: 'waving_hand', mode: MotionMode.STUDIO, desc: 'Intro rápida e viral' },
];

const MotionGeneratorView: React.FC<MotionGeneratorViewProps> = ({ onBack }) => {
    // UI State
    const [currentMode, setCurrentMode] = useState<MotionMode>(MotionMode.STUDIO);
    const [config, setConfig] = useState<MotionConfig>({
        mode: MotionMode.STUDIO,
        topic: '',
        style: MotionStyle.HERA_EVOLUTION,
        visualTheme: MotionVisualTheme.NEON,
        aspectRatio: '16:9',
        fps: '60',
        resolution: '4K',
        mapStyle: 'Satellite',
        mapDataExplosion: false, 
        chartType: 'Bar',
        typoText: '',
        useThinking: false,
        useGrounding: 'none'
    });

    // Chat State
    const [chatHistory, setChatHistory] = useState<MotionChatMessage[]>([
        { 
            id: 'init', 
            role: 'assistant', 
            content: 'Olá! Sou o Motion Director AI. Posso ver vídeos, analisar imagens, pensar profundamente (Gemini 3 Pro) e acessar Mapas/Busca.', 
            timestamp: Date.now() 
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    
    // Media & Storyboard State
    const [attachedImages, setAttachedImages] = useState<string[]>([]);
    const [storyboardImages, setStoryboardImages] = useState<string[]>([]); // Generated candidate images
    const [selectedStoryboardImage, setSelectedStoryboardImage] = useState<string | null>(null);
    const [isStoryboardMode, setIsStoryboardMode] = useState(false);
    
    const [attachedVideo, setAttachedVideo] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentVideoData, setCurrentVideoData] = useState<GeneratedVeoData | null>(null);
    const [loadingStep, setLoadingStep] = useState('');
    const [isExtendingMode, setIsExtendingMode] = useState(false);

    // Timeline State
    const [scenes, setScenes] = useState<MotionScene[]>([]);
    const [isPlayingSequence, setIsPlayingSequence] = useState(false);
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [chatHistory]);

    // --- PLAYBACK SEQUENCER ---
    useEffect(() => {
        if (isPlayingSequence && scenes.length > 0) {
            const videoEl = document.getElementById('sequence-player') as HTMLVideoElement;
            if (videoEl) {
                videoEl.src = scenes[currentSceneIndex].videoData.uri;
                videoEl.play();
                videoEl.onended = () => {
                    if (currentSceneIndex < scenes.length - 1) {
                        setCurrentSceneIndex(prev => prev + 1);
                    } else {
                        setIsPlayingSequence(false);
                        setCurrentSceneIndex(0);
                    }
                };
            }
        }
    }, [isPlayingSequence, currentSceneIndex, scenes]);

    // --- HANDLERS ---

    const handleModeSwitch = (mode: MotionMode) => {
        setCurrentMode(mode);
        setConfig(prev => ({ ...prev, mode }));
        setStoryboardImages([]);
        setIsStoryboardMode(false);
        
        let content = `Modo alterado para: ${mode}`;
        if (mode === MotionMode.MAPS) content = "Modo Mapas Ativado. Diga a origem e o destino (ex: 'De Paris para Londres').";
            
        setChatHistory(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: content,
            timestamp: Date.now()
        }]);
    };

    const handleSpeak = async (id: string, text: string) => {
        if (speakingId) return;
        setSpeakingId(id);
        try {
            await generateAndPlaySpeech(text);
        } catch (e) {
            console.error(e);
        } finally {
            setSpeakingId(null);
        }
    };

    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            const isVideo = file.type.startsWith('video/');
            
            if (isVideo) {
                setMediaType('video');
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAttachedVideo(reader.result as string);
                    setInputMessage(prev => prev ? prev : "Analise este vídeo e extraia os principais movimentos para replicar no Veo.");
                    setAttachedImages([]);
                };
                reader.readAsDataURL(file);
            } else {
                setMediaType('image');
                setAttachedVideo(null); 
                const pendingImages: string[] = [];
                let processedCount = 0;
                const maxToAdd = 3 - attachedImages.length;
                const filesToProcess = Array.from(files).slice(0, maxToAdd);

                filesToProcess.forEach(f => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        pendingImages.push(reader.result as string);
                        processedCount++;
                        if (processedCount === filesToProcess.length) {
                            setAttachedImages(prev => [...prev, ...pendingImages]);
                        }
                    };
                    reader.readAsDataURL(f);
                });
            }
        }
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setAttachedImages(prev => prev.filter((_, i) => i !== index));
        if (attachedImages.length <= 1) setMediaType(null);
    };

    // --- STORYBOARD LOGIC ---
    const handleGenerateStoryboard = async () => {
        if (!inputMessage.trim()) return;
        setIsGenerating(true);
        setLoadingStep("Storyboard: Gerando 4 opções (Nano Banana)...");
        
        try {
            const promises = Array(4).fill(0).map(() => generateSocialImage(inputMessage, '16:9'));
            const results = await Promise.all(promises);
            const validImages = results.filter(img => img !== null) as string[];
            
            if (validImages.length > 0) {
                setStoryboardImages(validImages);
                setIsStoryboardMode(true);
                setChatHistory(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `🎨 Gere 4 opções de estilo para sua cena. Selecione a melhor para animar com o Veo.`,
                    timestamp: Date.now()
                }]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
            setLoadingStep('');
        }
    };

    const handleConfirmStoryboard = async () => {
        if (!selectedStoryboardImage) return;
        setAttachedImages([selectedStoryboardImage]); // Set as ref
        setStoryboardImages([]); // Clear candidates
        setIsStoryboardMode(false);
        handleSendMessage(true); // Force send with ref
    };

    const handleExtensionClick = () => {
        setIsExtendingMode(true);
        setChatHistory(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: 'MODO DE EXTENSÃO ATIVADO: Descreva o que acontece a seguir no vídeo (ex: "A câmera se afasta revelando a cidade")...',
            timestamp: Date.now()
        }]);
    };

    const handleCancelExtension = () => {
        setIsExtendingMode(false);
        setInputMessage('');
    };

    const handleSendMessage = async (forceWithRef = false) => {
        if (!inputMessage.trim() && attachedImages.length === 0 && !attachedVideo && currentMode === MotionMode.STUDIO && !isExtendingMode && !forceWithRef) return;

        // User Msg
        const userMsg: MotionChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage || (attachedImages.length > 0 ? `Gerar vídeo com ${attachedImages.length} referências` : `Gerar vídeo no modo ${currentMode}`),
            timestamp: Date.now(),
            attachment: attachedVideo || (attachedImages.length > 0 ? attachedImages[0] : undefined),
            attachmentType: mediaType || undefined
        };
        setChatHistory(prev => [...prev, userMsg]);
        
        const promptText = inputMessage;
        setInputMessage('');
        const currentImages = [...attachedImages];
        const currentVideo = attachedVideo;
        
        // Don't clear images if we forced a ref gen (storyboard flow)
        if (!forceWithRef) {
            setAttachedImages([]);
            setAttachedVideo(null);
            setMediaType(null);
        }
        
        setIsGenerating(true);
        
        let stepText = 'Motion Director: Processando...';
        if (isExtendingMode) stepText = 'Veo 3.1: Estendendo timeline (+5s)...';
        else if (config.useThinking) stepText = 'Gemini 3 Pro: Pensando profundamente (Budget 32k)...';
        setLoadingStep(stepText);

        try {
            let finalPrompt = '';
            let videoResult: GeneratedVeoData | null = null;

            if (isExtendingMode && currentVideoData?.asset) {
                videoResult = await extendVeoVideo(currentVideoData.asset, promptText);
                setIsExtendingMode(false); 
            } 
            else {
                if (currentMode === MotionMode.MAPS) {
                    // --- MAPS MODE INTELLIGENCE ---
                    // 1. Try to extract params from natural language
                    setLoadingStep("Extraindo coordenadas...");
                    const params = await extractMapParameters(promptText);
                    const newStart = params.start || config.mapStart;
                    const newEnd = params.end || config.mapEnd;

                    // 2. Update state if found
                    if (params.start || params.end) {
                         setConfig(prev => ({ ...prev, mapStart: newStart, mapEnd: newEnd }));
                    }

                    // 3. Validation - If missing, ask the user instead of erroring
                    if (!newStart || !newEnd) {
                        setChatHistory(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: `📍 Modo Mapas: Identifiquei ${newEnd ? `Destino: **${newEnd}**` : ''} ${newStart ? `Origem: **${newStart}**` : ''}. \n\n${!newStart ? 'Qual o ponto de partida (Origem)?' : 'Qual o destino?'}`
                            timestamp: Date.now()
                        }]);
                        setIsGenerating(false);
                        return; // EXIT early
                    }

                    // 4. Generate if valid
                    finalPrompt = generateMapPrompt(newStart, newEnd, config.mapStyle || 'Satellite', config.mapDataExplosion || false);
                    setLoadingStep(`Veo: Renderizando rota ${newStart} -> ${newEnd}...`);
                    videoResult = await generateVeoVideo(finalPrompt, config.style, config.aspectRatio);
                } 
                else if (currentMode === MotionMode.DATA) {
                    if (!config.chartData && !promptText) throw new Error("Insira os dados do gráfico.");
                    // Assume promptText IS the data if chartData is empty
                    const dataToUse = config.chartData || promptText;
                    finalPrompt = generateDataPrompt(config.chartType || 'Bar', dataToUse, config.visualTheme);
                    setLoadingStep('Veo: Animando dados com Easy-ease...');
                    videoResult = await generateVeoVideo(finalPrompt, config.style, config.aspectRatio);
                }
                else if (currentMode === MotionMode.TYPOGRAPHY) {
                     const textToUse = config.typoText || promptText;
                     if (!textToUse) throw new Error("Insira o texto para animar.");
                     finalPrompt = generateTypographyPrompt(textToUse);
                     setLoadingStep('Veo: Aplicando Kinetic Typography...');
                     videoResult = await generateVeoVideo(finalPrompt, MotionStyle.KINETIC_TYPO, config.aspectRatio);
                } 
                else {
                    // STUDIO MODE
                    if (currentImages.length > 0) {
                        setLoadingStep(`Veo 3.1: Usando ${currentImages.length} referências visuais...`);
                        videoResult = await generateVeoWithReferences(promptText, currentImages);
                    } else {
                        const historyForAI = chatHistory.concat(userMsg).map(m => ({ 
                            role: m.role, 
                            content: m.content, 
                            attachment: m.attachment,
                            attachmentType: m.attachmentType
                        }));
                        finalPrompt = await refineMotionChat(historyForAI, config);
                        setLoadingStep(`Veo 3.1: Gerando cena (${config.aspectRatio})...`);
                        videoResult = await generateVeoVideo(finalPrompt, config.style, config.aspectRatio);
                    }
                }
            }
            
            if (videoResult) {
                setCurrentVideoData(videoResult);
                
                // Add to Timeline
                setScenes(prev => [...prev, {
                    id: Date.now().toString(),
                    videoData: videoResult!,
                    prompt: finalPrompt || promptText,
                    duration: 5 // Default assumption
                }]);

                setChatHistory(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `🎬 Renderização concluída. Adicionado à Timeline.`,
                    timestamp: Date.now(),
                    videoData: videoResult || undefined
                }]);
            } else {
                throw new Error("Falha na geração (API não retornou URI).");
            }

        } catch (err: any) {
            setChatHistory(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: `Erro: ${err.message || 'Falha desconhecida.'}`,
                timestamp: Date.now()
            }]);
            setIsExtendingMode(false);
        } finally {
            setIsGenerating(false);
            setLoadingStep('');
            if (forceWithRef) setAttachedImages([]); // Clear after ref usage
        }
    };

    const handleDownload = (uri: string) => {
        const a = document.createElement('a');
        a.href = uri;
        a.target = '_blank';
        a.download = 'motion_export.mp4';
        a.click();
    };

    // Helper to get active intelligence icon
    const getBrainIcon = () => {
        if (config.useThinking) return 'psychology';
        if (config.useGrounding === 'googleMaps') return 'map';
        if (config.useGrounding === 'googleSearch') return 'travel_explore';
        return 'auto_awesome';
    };

    return (
        <div className="max-w-[1800px] mx-auto flex flex-col h-[calc(100vh-80px)] fade-in pb-4 px-4 overflow-hidden">
            
            {/* SEQUENTIAL PLAYER OVERLAY */}
            {isPlayingSequence && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
                    <video 
                        id="sequence-player"
                        className="max-h-[80vh] max-w-full shadow-2xl border border-white/10"
                        controls={false}
                    />
                    <div className="mt-4 flex gap-4 text-white font-bold font-display">
                        <span>Cena {currentSceneIndex + 1} de {scenes.length}</span>
                        <button onClick={() => setIsPlayingSequence(false)} className="text-red-500">Parar</button>
                    </div>
                </div>
            )}

            {/* TOP BAR: MODES */}
            <div className="flex items-center justify-between mb-4 shrink-0 bg-[#1e1b2e]/90 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-2"></div>
                    {Object.values(MotionMode).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => handleModeSwitch(mode)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${currentMode === mode ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">
                                {mode === MotionMode.MAPS ? 'public' : mode === MotionMode.DATA ? 'monitoring' : mode === MotionMode.TYPOGRAPHY ? 'text_fields' : 'movie_edit'}
                            </span>
                            {mode === MotionMode.TYPOGRAPHY ? 'Typo' : mode}
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-3 pr-2">
                     <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Veo 3.1</span>
                        <select 
                            className="bg-transparent text-white text-[10px] font-bold outline-none cursor-pointer"
                            value={config.aspectRatio}
                            onChange={(e) => setConfig({...config, aspectRatio: e.target.value as any})}
                            disabled={attachedImages.length > 0} 
                        >
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                        </select>
                     </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
                
                {/* LEFT: PREVIEW & TIMELINE */}
                <div className="flex-1 flex flex-col gap-4 min-w-0 h-full">
                    {/* Main Canvas */}
                    <div className="flex-1 bg-[#050511] rounded-3xl border border-white/10 relative overflow-hidden flex items-center justify-center group shadow-2xl min-h-0">
                        {isGenerating ? (
                            <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center gap-4">
                                <div className="size-20 rounded-full border-4 border-neon-cyan/20 border-t-neon-cyan animate-spin"></div>
                                <div className="text-center">
                                    <h3 className="text-white font-display font-bold animate-pulse">MOTION DIRECTOR</h3>
                                    <p className="text-neon-cyan text-xs font-mono mt-1">{loadingStep}</p>
                                </div>
                            </div>
                        ) : isStoryboardMode && storyboardImages.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 p-8 w-full h-full bg-black/80">
                                {storyboardImages.map((img, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setSelectedStoryboardImage(img)}
                                        className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedStoryboardImage === img ? 'border-neon-cyan scale-105 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'border-white/10 hover:border-white/50'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt={`option-${i}`} />
                                    </div>
                                ))}
                                <button 
                                    onClick={handleConfirmStoryboard}
                                    disabled={!selectedStoryboardImage}
                                    className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-neon-cyan text-black font-bold px-8 py-3 rounded-full shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                                >
                                    Confirmar & Animar
                                </button>
                            </div>
                        ) : currentVideoData ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-[#050511]">
                                <video 
                                    src={currentVideoData.uri} 
                                    className={`max-w-full max-h-full shadow-2xl ${config.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}`}
                                    controls 
                                    autoPlay 
                                    loop
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 opacity-30">
                                <span className="material-symbols-outlined text-6xl">movie_filter</span>
                                <p className="font-mono text-sm uppercase">Aguardando Direção</p>
                            </div>
                        )}
                        
                        {/* Overlay Controls */}
                        {currentVideoData && !isGenerating && !isStoryboardMode && (
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button 
                                    onClick={handleExtensionClick}
                                    className="bg-primary/80 hover:bg-primary backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/10 text-xs font-bold flex items-center gap-1 shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-sm">playlist_add</span>
                                    Estender
                                </button>
                                <button 
                                    onClick={() => handleDownload(currentVideoData.uri)}
                                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-2 rounded-full border border-white/10"
                                >
                                    <span className="material-symbols-outlined">download</span>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* TIMELINE SEQUENCER (NEW) */}
                    <div className="h-32 bg-[#1e1b2e]/80 border border-white/10 rounded-2xl p-2 flex flex-col shrink-0 backdrop-blur-sm">
                        <div className="flex justify-between items-center px-2 mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-neon-cyan">view_timeline</span>
                                Timeline ({scenes.length} cenas)
                            </span>
                            <button 
                                onClick={() => { setIsPlayingSequence(true); setCurrentSceneIndex(0); }}
                                disabled={scenes.length === 0}
                                className="flex items-center gap-1 text-[10px] font-bold text-white bg-green-600/20 border border-green-500/50 px-2 py-1 rounded hover:bg-green-600/40 disabled:opacity-30"
                            >
                                <span className="material-symbols-outlined text-sm">play_arrow</span>
                                Reproduzir Sequência
                            </button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-1 pb-1">
                            {scenes.map((scene, idx) => (
                                <div 
                                    key={scene.id} 
                                    onClick={() => setCurrentVideoData(scene.videoData)}
                                    className={`relative aspect-video h-full rounded-lg overflow-hidden border cursor-pointer shrink-0 transition-all group ${currentVideoData?.uri === scene.videoData.uri ? 'border-neon-cyan' : 'border-white/10 hover:border-white/30'}`}
                                >
                                    <video src={scene.videoData.uri} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white p-1 truncate">
                                        {idx + 1}. {scene.prompt}
                                    </div>
                                </div>
                            ))}
                            {scenes.length === 0 && (
                                <div className="flex items-center justify-center w-full text-slate-500 text-xs italic">
                                    Nenhuma cena criada ainda.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: CHAT INTERFACE (The "Director") */}
                <div className="w-full lg:w-[400px] bg-[#151221] border-l border-white/10 flex flex-col shadow-2xl h-full">
                    <div className="p-4 border-b border-white/5 bg-[#1e1b2e]/50 flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                            Director AI Agent
                        </h3>
                        
                        {/* INTELLIGENCE TOOLBAR */}
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setConfig(prev => ({...prev, useThinking: !prev.useThinking}))}
                                className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${config.useThinking ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'border-white/10 text-slate-500 hover:text-white'}`}
                                title="Gemini 3 Pro (32k Tokens)"
                            >
                                <span className="material-symbols-outlined text-[12px]">psychology</span>
                                Think
                            </button>
                            <button 
                                onClick={() => setConfig(prev => ({...prev, useGrounding: prev.useGrounding === 'googleMaps' ? 'none' : 'googleMaps'}))}
                                className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${config.useGrounding === 'googleMaps' ? 'bg-green-500/20 border-green-500 text-green-300' : 'border-white/10 text-slate-500 hover:text-white'}`}
                                title="Gemini 2.5 Flash + Maps"
                            >
                                <span className="material-symbols-outlined text-[12px]">map</span>
                                Maps
                            </button>
                            <button 
                                onClick={() => setConfig(prev => ({...prev, useGrounding: prev.useGrounding === 'googleSearch' ? 'none' : 'googleSearch'}))}
                                className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${config.useGrounding === 'googleSearch' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'border-white/10 text-slate-500 hover:text-white'}`}
                                title="Gemini 3 Flash + Search"
                            >
                                <span className="material-symbols-outlined text-[12px]">travel_explore</span>
                                Search
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                        {chatHistory.map((msg) => (
                            <div key={msg.id} className={`flex flex-col gap-1 max-w-[90%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                                {msg.attachment && (
                                    <div className="w-20 h-20 mb-1 rounded-lg border border-white/20 overflow-hidden relative bg-black">
                                        {msg.attachmentType === 'video' ? (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white text-2xl">videocam</span>
                                            </div>
                                        ) : (
                                            <img src={msg.attachment} className="w-full h-full object-cover" alt="attachment" />
                                        )}
                                    </div>
                                )}
                                <div 
                                    className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap relative group ${
                                        msg.role === 'user' 
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-sm shadow-lg' 
                                            : msg.role === 'system'
                                            ? 'bg-transparent text-slate-500 text-xs italic border border-white/5'
                                            : 'bg-[#1e1b2e] text-slate-200 rounded-tl-sm border border-white/5 shadow-sm'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                                {msg.videoData && (
                                    <div className="mt-1 w-32 aspect-video bg-black rounded-lg border border-white/10 overflow-hidden relative group cursor-pointer" onClick={() => setCurrentVideoData(msg.videoData!)}>
                                        <video src={msg.videoData.uri} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white drop-shadow-md">play_circle</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isGenerating && (
                             <div className="self-start bg-white/5 p-3 rounded-2xl rounded-tl-sm border border-white/5">
                                <div className="flex gap-2 items-center">
                                    <span className="material-symbols-outlined text-sm animate-spin text-slate-400">{getBrainIcon()}</span>
                                    <div className="flex gap-1">
                                        <span className="size-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                        <span className="size-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                        <span className="size-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* REFERENCE FRAME UPLOAD & INPUT */}
                    <div className="p-4 bg-[#1e1b2e] border-t border-white/5 flex flex-col gap-2">
                        {isExtendingMode && (
                             <div className="flex items-center justify-between bg-purple-500/20 text-purple-200 text-xs px-3 py-1.5 rounded-lg border border-purple-500/30 animate-in fade-in">
                                 <span className="font-bold flex items-center gap-1">
                                     <span className="material-symbols-outlined text-[14px] animate-pulse">playlist_add</span>
                                     Estendendo Vídeo...
                                 </span>
                                 <button onClick={handleCancelExtension} className="hover:text-white"><span className="material-symbols-outlined text-[14px]">close</span></button>
                             </div>
                        )}

                        {/* DISPLAY VIDEO ATTACHMENT */}
                        {attachedVideo && (
                            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
                                <span className="material-symbols-outlined text-slate-400">videocam</span>
                                <span className="text-[10px] text-slate-400 flex-1 truncate">
                                    Vídeo para Análise
                                </span>
                                <button onClick={() => { setAttachedVideo(null); setMediaType(null); }} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>
                            </div>
                        )}

                        {/* DISPLAY IMAGE GRID (UP TO 3) */}
                        {attachedImages.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {attachedImages.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square bg-white/5 rounded-lg border border-white/10 overflow-hidden group">
                                        <img src={img} className="w-full h-full object-cover" alt={`ref-${idx}`} />
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                        >
                                            <span className="material-symbols-outlined text-[12px]">close</span>
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center text-white py-0.5">
                                            Ref {idx + 1}
                                        </div>
                                    </div>
                                ))}
                                {attachedImages.length < 3 && (
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square bg-white/5 rounded-lg border border-dashed border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-slate-400">add</span>
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {/* STORYBOARD TOGGLE */}
                        <div className="flex items-center justify-between">
                            <div className="relative flex items-center gap-2">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isExtendingMode || attachedImages.length >= 3}
                                    className={`p-3 rounded-xl border transition-colors ${attachedImages.length > 0 || attachedVideo ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'} ${(isExtendingMode || attachedImages.length >= 3) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title="Anexar Imagens (até 3) ou Vídeo"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                                </button>
                                {/* Allow multiple file selection */}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*,video/*" 
                                    multiple
                                    onChange={handleMediaUpload}
                                />
                            </div>
                            
                            {/* NEW: Storyboard Button */}
                            <button
                                onClick={handleGenerateStoryboard}
                                disabled={isGenerating || isExtendingMode || !inputMessage.trim()}
                                className="text-[10px] font-bold text-yellow-300 border border-yellow-500/30 bg-yellow-500/10 px-2 py-1.5 rounded-lg hover:bg-yellow-500/20 disabled:opacity-30 transition-all flex items-center gap-1"
                                title="Gerar 4 opções antes de animar"
                            >
                                <span className="material-symbols-outlined text-sm">dashboard</span>
                                Storyboard
                            </button>
                        </div>

                        <div className="relative flex-1">
                            <input 
                                className={`w-full bg-black/40 text-white text-sm rounded-xl pl-4 pr-12 py-3 border focus:ring-1 outline-none transition-colors ${isExtendingMode ? 'border-purple-500 focus:border-purple-500 focus:ring-purple-500' : 'border-white/10 focus:border-neon-cyan focus:ring-neon-cyan'}`}
                                placeholder={isExtendingMode ? "O que acontece a seguir?" : (attachedImages.length > 0 ? "Prompt para essas referências..." : (currentMode === MotionMode.MAPS ? "Gerar mapa..." : "Instruir Diretor..."))}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleSendMessage()}
                                disabled={isGenerating}
                                autoFocus={isExtendingMode}
                            />
                            <button 
                                onClick={() => handleSpeak('input', inputMessage)}
                                disabled={!inputMessage.trim() || !!speakingId}
                                className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
                                title="Ouvir texto (TTS)"
                            >
                                <span className="material-symbols-outlined text-[16px]">volume_up</span>
                            </button>
                            <button 
                                onClick={() => handleSendMessage()}
                                disabled={isGenerating}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors disabled:opacity-50 ${isExtendingMode ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white' : 'bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan hover:text-black'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">send</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MotionGeneratorView;
