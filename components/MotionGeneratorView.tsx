
import React, { useState, useEffect, useRef } from 'react';
import { MotionConfig, MotionMode, MotionStyle, MotionVisualTheme, MotionAspectRatio, MotionChatMessage, GeneratedVeoData } from '../types';
import { generateVeoVideo, enhanceMotionPrompt, generateMapPrompt, generateDataPrompt, refineMotionChat, generateTypographyPrompt, generateVeoFromImage, generateAndPlaySpeech, analyzeVisualContent, extendVeoVideo } from '../services/geminiService';

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
        style: MotionStyle.HERA_EVOLUTION, // Default to Hera
        visualTheme: MotionVisualTheme.NEON,
        aspectRatio: '16:9',
        fps: '60',
        resolution: '4K',
        // Map Defaults
        mapStyle: 'Satellite',
        mapDataExplosion: false, 
        // Data Defaults
        chartType: 'Bar',
        // Typo Defaults
        typoText: '',
        // Intelligence
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
    const [attachedMedia, setAttachedMedia] = useState<string | null>(null); // Base64
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentVideoData, setCurrentVideoData] = useState<GeneratedVeoData | null>(null); // Changed from simple URI to full Data object
    const [loadingStep, setLoadingStep] = useState('');
    const [isExtendingMode, setIsExtendingMode] = useState(false); // State to track if user is extending

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [chatHistory]);

    // --- HANDLERS ---

    const handleModeSwitch = (mode: MotionMode) => {
        setCurrentMode(mode);
        setConfig(prev => ({ ...prev, mode }));
        
        let content = `Modo alterado para: ${mode}`;
        if (mode === MotionMode.MAPS) content = "Modo Mapas Ativado. Posso usar o Google Maps (Gemini 2.5) para realismo.";
            
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
        const file = e.target.files?.[0];
        if (file) {
            const isVideo = file.type.startsWith('video/');
            setMediaType(isVideo ? 'video' : 'image');
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachedMedia(reader.result as string);
                // Auto-analyze instruction if video
                if (isVideo) {
                    setInputMessage(prev => prev ? prev : "Analise este vídeo e extraia os principais movimentos para replicar no Veo.");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExtensionClick = () => {
        setIsExtendingMode(true);
        // Add a system message guiding the user
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

    const handleSendMessage = async () => {
        if (!inputMessage.trim() && !attachedMedia && currentMode === MotionMode.STUDIO && !isExtendingMode) return;

        // 1. Add User Message
        const userMsg: MotionChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage || (attachedMedia ? 'Analisar mídia anexada...' : `Gerar vídeo no modo ${currentMode}`),
            timestamp: Date.now(),
            attachment: attachedMedia || undefined,
            attachmentType: mediaType || undefined
        };
        setChatHistory(prev => [...prev, userMsg]);
        
        // Reset Inputs
        const promptText = inputMessage;
        setInputMessage('');
        const currentAttachment = attachedMedia;
        const currentMediaType = mediaType;
        setAttachedMedia(null);
        setMediaType(null);
        
        setIsGenerating(true);
        
        // Determine Loading State
        let stepText = 'Motion Director: Processando...';
        if (isExtendingMode) stepText = 'Veo 3.1: Estendendo timeline (+5s)...';
        else if (config.useThinking) stepText = 'Gemini 3 Pro: Pensando profundamente (Budget 32k)...';
        else if (config.useGrounding === 'googleMaps') stepText = 'Gemini 2.5: Acessando Google Maps...';
        else if (config.useGrounding === 'googleSearch') stepText = 'Gemini 3 Flash: Pesquisando tendências...';
        setLoadingStep(stepText);

        try {
            let finalPrompt = '';
            let videoResult: GeneratedVeoData | null = null;

            // --- EXTENSION LOGIC ---
            if (isExtendingMode && currentVideoData?.asset) {
                videoResult = await extendVeoVideo(currentVideoData.asset, promptText);
                setIsExtendingMode(false); // Reset extension mode after call
            } 
            // --- STANDARD GENERATION LOGIC ---
            else {
                // 2. Build Prompt based on Mode or Use Director for Studio
                if (currentMode === MotionMode.MAPS) {
                    if (!config.mapStart || !config.mapEnd) throw new Error("Defina origem e destino.");
                    finalPrompt = generateMapPrompt(config.mapStart, config.mapEnd, config.mapStyle || 'Satellite', config.mapDataExplosion || false);
                    setLoadingStep('Veo: Renderizando topografia 3D...');
                    videoResult = await generateVeoVideo(finalPrompt, config.style, config.aspectRatio);
                } 
                else if (currentMode === MotionMode.DATA) {
                    if (!config.chartData) throw new Error("Insira os dados do gráfico.");
                    finalPrompt = generateDataPrompt(config.chartType || 'Bar', config.chartData, config.visualTheme);
                    setLoadingStep('Veo: Animando dados com Easy-ease...');
                    videoResult = await generateVeoVideo(finalPrompt, config.style, config.aspectRatio);
                }
                else if (currentMode === MotionMode.TYPOGRAPHY) {
                     if (!config.typoText) throw new Error("Insira o texto para animar.");
                     finalPrompt = generateTypographyPrompt(config.typoText);
                     setLoadingStep('Veo: Aplicando Kinetic Typography...');
                     videoResult = await generateVeoVideo(finalPrompt, MotionStyle.KINETIC_TYPO, config.aspectRatio);
                } 
                else {
                    // STUDIO MODE: The "Director Agent" Logic
                    
                    // Construct history for the AI
                    const historyForAI = chatHistory.concat(userMsg).map(m => ({ 
                        role: m.role, 
                        content: m.content, 
                        attachment: m.attachment,
                        attachmentType: m.attachmentType
                    }));

                    // Call the Smart Router
                    finalPrompt = await refineMotionChat(historyForAI, config);
                    
                    if (currentAttachment && currentMediaType === 'image') {
                         // Image-to-Video
                         setLoadingStep('Veo 3.1: Animate Image (Fast Preview)...');
                         videoResult = await generateVeoFromImage(currentAttachment, finalPrompt, config.aspectRatio);
                    } else {
                         // Text-to-Video
                         setLoadingStep(`Veo 3.1: Gerando cena (${config.aspectRatio})...`);
                         videoResult = await generateVeoVideo(finalPrompt, config.style, config.aspectRatio);
                    }
                }
            }
            
            if (videoResult) {
                setCurrentVideoData(videoResult);
                // 4. Add Assistant Response with Video
                setChatHistory(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `🎬 Renderização concluída.\nPrompt Técnico: "${finalPrompt.substring(0, 80)}..."`,
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
            setIsExtendingMode(false); // Reset on error
        } finally {
            setIsGenerating(false);
            setLoadingStep('');
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
            
            {/* TOP BAR: MODES */}
            <div className="flex items-center justify-between mb-4 shrink-0 bg-black/40 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
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
                        >
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                        </select>
                     </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
                
                {/* LEFT: PREVIEW & CONTEXT */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                    {/* Main Canvas */}
                    <div className="flex-1 bg-black rounded-3xl border border-white/10 relative overflow-hidden flex items-center justify-center group shadow-2xl">
                        {isGenerating ? (
                            <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center gap-4">
                                <div className="size-20 rounded-full border-4 border-neon-cyan/20 border-t-neon-cyan animate-spin"></div>
                                <div className="text-center">
                                    <h3 className="text-white font-display font-bold animate-pulse">MOTION DIRECTOR</h3>
                                    <p className="text-neon-cyan text-xs font-mono mt-1">{loadingStep}</p>
                                </div>
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
                        {currentVideoData && !isGenerating && (
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                {/* EXTEND VIDEO BUTTON */}
                                <button 
                                    onClick={handleExtensionClick}
                                    className="bg-primary/80 hover:bg-primary backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/10 text-xs font-bold flex items-center gap-1 shadow-lg"
                                    title="Estender o vídeo atual"
                                >
                                    <span className="material-symbols-outlined text-sm">playlist_add</span>
                                    Estender (+5s)
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
                    
                    {/* Context Panel (Inputs based on Mode) */}
                    <div className="h-48 glass-panel rounded-2xl p-6 overflow-y-auto custom-scrollbar shrink-0">
                        {currentMode === MotionMode.MAPS && (
                             <div className="flex flex-col gap-4 animate-in fade-in">
                                 <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                                     <span className="material-symbols-outlined text-neon-cyan">public</span> Configuração de Mapa (Explosivo)
                                 </h3>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-1">
                                         <label className="text-[10px] text-slate-400 font-bold uppercase">Origem</label>
                                         <input 
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon-cyan outline-none"
                                            placeholder="Ex: Paris, France"
                                            value={config.mapStart || ''}
                                            onChange={(e) => setConfig({...config, mapStart: e.target.value})}
                                         />
                                     </div>
                                     <div className="space-y-1">
                                         <label className="text-[10px] text-slate-400 font-bold uppercase">Destino</label>
                                         <input 
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon-cyan outline-none"
                                            placeholder="Ex: Berlin, Germany"
                                            value={config.mapEnd || ''}
                                            onChange={(e) => setConfig({...config, mapEnd: e.target.value})}
                                         />
                                     </div>
                                 </div>
                                 <div className="flex items-center justify-between">
                                     <div className="flex gap-2">
                                        {['Satellite', 'Vector', '3D Relief'].map(s => (
                                            <button 
                                                key={s}
                                                onClick={() => setConfig({...config, mapStyle: s as any})}
                                                className={`px-3 py-1 rounded text-xs border ${config.mapStyle === s ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'border-white/10 text-slate-400'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                     </div>
                                     
                                     {/* EXPLOSION TOGGLE */}
                                     <label className="flex items-center gap-2 cursor-pointer group">
                                         <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase transition-colors">Explosão de Dados (VFX)</span>
                                         <div className="relative">
                                             <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={config.mapDataExplosion}
                                                onChange={(e) => setConfig({...config, mapDataExplosion: e.target.checked})}
                                             />
                                             <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-cyan"></div>
                                         </div>
                                     </label>
                                 </div>
                             </div>
                        )}

                        {currentMode === MotionMode.DATA && (
                             <div className="flex flex-col gap-4 animate-in fade-in">
                                <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                                     <span className="material-symbols-outlined text-purple-400">analytics</span> Dados do Gráfico
                                 </h3>
                                 <div className="flex gap-4">
                                     <div className="w-1/3 space-y-2">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">Tipo</label>
                                        <select 
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                                            value={config.chartType}
                                            onChange={(e) => setConfig({...config, chartType: e.target.value as any})}
                                        >
                                            <option value="Bar">Barras Animadas</option>
                                            <option value="Line">Linha Evolutiva</option>
                                            <option value="Pie">Pizza 3D</option>
                                            <option value="Floating UI">Interface Flutuante</option>
                                        </select>
                                     </div>
                                     <div className="flex-1 space-y-2">
                                         <label className="text-[10px] text-slate-400 font-bold uppercase">Dados (Resumo)</label>
                                         <input 
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-purple-500 outline-none"
                                            placeholder="Ex: Crescimento de 20% em 2023..."
                                            value={config.chartData || ''}
                                            onChange={(e) => setConfig({...config, chartData: e.target.value})}
                                         />
                                     </div>
                                 </div>
                             </div>
                        )}
                        
                        {currentMode === MotionMode.TYPOGRAPHY && (
                             <div className="flex flex-col gap-4 animate-in fade-in">
                                <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                                     <span className="material-symbols-outlined text-pink-400">text_fields</span> Kinetic Typography
                                 </h3>
                                 <div className="space-y-2">
                                     <label className="text-[10px] text-slate-400 font-bold uppercase">Texto para Animar (Max 5 palavras)</label>
                                     <input 
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-lg font-bold text-white focus:border-pink-500 outline-none"
                                        placeholder="Ex: O FUTURO É AGORA"
                                        value={config.typoText || ''}
                                        onChange={(e) => setConfig({...config, typoText: e.target.value})}
                                     />
                                 </div>
                             </div>
                        )}

                        {currentMode === MotionMode.STUDIO && (
                            <div className="flex flex-col gap-2 h-full justify-center text-center opacity-50">
                                <span className="material-symbols-outlined text-3xl">chat</span>
                                <p className="text-sm">Envie um frame, vídeo para análise ou instrua o Diretor.</p>
                            </div>
                        )}
                        
                        {currentMode === MotionMode.TEMPLATES && (
                             <div className="grid grid-cols-4 gap-4 h-full">
                                 {TEMPLATES.map((t) => (
                                     <button 
                                        key={t.label}
                                        onClick={() => { handleModeSwitch(t.mode); }}
                                        className="flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/20 transition-all group"
                                     >
                                         <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">{t.icon}</span>
                                         <span className="text-xs font-bold">{t.label}</span>
                                         <span className="text-[9px] text-slate-500">{t.desc}</span>
                                     </button>
                                 ))}
                             </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: CHAT INTERFACE (The "Director") */}
                <div className="w-full lg:w-[400px] bg-[#020617] border-l border-white/10 flex flex-col shadow-2xl">
                    <div className="p-4 border-b border-white/5 bg-black/20 flex flex-col gap-2">
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
                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                            {/* Overlay */}
                                        </div>
                                    </div>
                                )}
                                <div 
                                    className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap relative group ${
                                        msg.role === 'user' 
                                            ? 'bg-primary text-white rounded-tr-sm' 
                                            : msg.role === 'system'
                                            ? 'bg-transparent text-slate-500 text-xs italic border border-white/5'
                                            : 'bg-white/10 text-slate-200 rounded-tl-sm border border-white/5'
                                    }`}
                                >
                                    {msg.content}
                                    {msg.role !== 'system' && (
                                        <button 
                                            onClick={() => handleSpeak(msg.id, msg.content)}
                                            disabled={!!speakingId}
                                            className={`absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 ${speakingId === msg.id ? 'text-green-400 animate-pulse' : 'text-slate-500 hover:text-white'}`}
                                            title="Ler mensagem (TTS)"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">volume_up</span>
                                        </button>
                                    )}
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
                    <div className="p-4 bg-black/40 border-t border-white/5 flex flex-col gap-2">
                        {isExtendingMode && (
                             <div className="flex items-center justify-between bg-purple-500/20 text-purple-200 text-xs px-3 py-1.5 rounded-lg border border-purple-500/30 animate-in fade-in">
                                 <span className="font-bold flex items-center gap-1">
                                     <span className="material-symbols-outlined text-[14px] animate-pulse">playlist_add</span>
                                     Estendendo Vídeo...
                                 </span>
                                 <button onClick={handleCancelExtension} className="hover:text-white"><span className="material-symbols-outlined text-[14px]">close</span></button>
                             </div>
                        )}

                        {attachedMedia && (
                            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
                                {mediaType === 'video' ? (
                                    <span className="material-symbols-outlined text-slate-400">videocam</span>
                                ) : (
                                    <img src={attachedMedia} className="size-8 rounded object-cover" alt="ref" />
                                )}
                                <span className="text-[10px] text-slate-400 flex-1 truncate">
                                    {mediaType === 'video' ? 'Vídeo para Análise' : 'Frame de Referência'}
                                </span>
                                <button onClick={() => { setAttachedMedia(null); setMediaType(null); }} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>
                            </div>
                        )}
                        
                        <div className="relative flex items-center gap-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isExtendingMode}
                                className={`p-3 rounded-xl border transition-colors ${attachedMedia ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'} ${isExtendingMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Anexar Imagem ou Vídeo"
                            >
                                <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*,video/*" 
                                onChange={handleMediaUpload}
                            />

                            <div className="relative flex-1">
                                <input 
                                    className={`w-full bg-[#1e293b] text-white text-sm rounded-xl pl-4 pr-12 py-3 border focus:ring-1 outline-none transition-colors ${isExtendingMode ? 'border-purple-500 focus:border-purple-500 focus:ring-purple-500' : 'border-white/10 focus:border-neon-cyan focus:ring-neon-cyan'}`}
                                    placeholder={isExtendingMode ? "O que acontece a seguir?" : (currentMode === MotionMode.MAPS ? "Gerar mapa..." : "Instruir Diretor...")}
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
                                    onClick={handleSendMessage}
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
        </div>
    );
};

export default MotionGeneratorView;
