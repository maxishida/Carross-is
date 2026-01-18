
import React, { useState, useEffect, useRef } from 'react';
import { MotionConfig, MotionMode, MotionStyle, MotionVisualTheme, MotionAspectRatio, MotionChatMessage } from '../types';
import { generateVeoVideo, enhanceMotionPrompt, generateMapPrompt, generateDataPrompt, refineMotionChat, generateTypographyPrompt, generateVeoFromImage, generateAndPlaySpeech } from '../services/geminiService';

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
        mapDataExplosion: false, // Default off
        // Data Defaults
        chartType: 'Bar',
        // Typo Defaults
        typoText: ''
    });

    // Chat State
    const [chatHistory, setChatHistory] = useState<MotionChatMessage[]>([
        { 
            id: 'init', 
            role: 'assistant', 
            content: 'Olá! Sou o Motion Director AI. Posso simular dados de satélite 3D e criar efeitos de "Explosão de Dados" (Hera Evolution).', 
            timestamp: Date.now() 
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [attachedImage, setAttachedImage] = useState<string | null>(null); // New: Reference Frame
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentVideoUri, setCurrentVideoUri] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState('');

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [chatHistory]);

    // --- HANDLERS ---

    const handleModeSwitch = (mode: MotionMode) => {
        setCurrentMode(mode);
        setConfig(prev => ({ ...prev, mode }));
        // Add system message to chat
        const content = mode === MotionMode.MAPS 
            ? `Modo Mapas Ativado. Posso gerar zooms espaciais com dados.`
            : `Modo alterado para: ${mode}`;
            
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() && !attachedImage && currentMode === MotionMode.STUDIO) return;

        // 1. Add User Message
        const userMsg: MotionChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage || (attachedImage ? 'Analisar imagem anexada...' : `Gerar vídeo no modo ${currentMode}`),
            timestamp: Date.now(),
            attachment: attachedImage || undefined
        };
        setChatHistory(prev => [...prev, userMsg]);
        
        // Reset Inputs
        setInputMessage('');
        const currentAttachment = attachedImage;
        setAttachedImage(null);
        
        setIsGenerating(true);
        setLoadingStep('Motion Director: Analisando composição e dados...');

        try {
            let finalPrompt = '';
            let videoUri: string | null = null;

            // 2. Build Prompt based on Mode or Use Director for Studio
            if (currentMode === MotionMode.MAPS) {
                if (!config.mapStart || !config.mapEnd) throw new Error("Defina origem e destino.");
                finalPrompt = generateMapPrompt(config.mapStart, config.mapEnd, config.mapStyle || 'Satellite', config.mapDataExplosion || false);
                setLoadingStep(config.mapDataExplosion ? 'Veo: Criando Explosão de Dados VFX...' : 'Veo: Renderizando topografia 3D...');
                videoUri = await generateVeoVideo(finalPrompt, config.style, config.aspectRatio);
            } 
            else if (currentMode === MotionMode.DATA) {
                if (!config.chartData) throw new Error("Insira os dados do gráfico.");
                finalPrompt = generateDataPrompt(config.chartType || 'Bar', config.chartData, config.visualTheme);
                setLoadingStep('Veo: Animando dados com Easy-ease...');
                videoUri = await generateVeoVideo(finalPrompt, config.style, config.aspectRatio);
            }
            else if (currentMode === MotionMode.TYPOGRAPHY) {
                 if (!config.typoText) throw new Error("Insira o texto para animar.");
                 finalPrompt = generateTypographyPrompt(config.typoText);
                 setLoadingStep('Veo: Aplicando Kinetic Typography...');
                 videoUri = await generateVeoVideo(finalPrompt, MotionStyle.KINETIC_TYPO, config.aspectRatio);
            } 
            else {
                // STUDIO MODE: The "Director Agent" Logic
                if (currentAttachment) {
                     // If image provided, use Image-to-Video with Director's instructions
                     const historyForAI = chatHistory.concat(userMsg).map(m => ({ 
                         role: m.role, 
                         content: m.content, 
                         attachment: m.attachment 
                     }));
                     // Ask Director for a prompt that describes HOW to move this image
                     finalPrompt = await refineMotionChat(historyForAI);
                     setLoadingStep('Veo: Transformando frame em vídeo (Image-to-Video)...');
                     videoUri = await generateVeoFromImage(currentAttachment, finalPrompt);
                } else {
                     // Text-to-Video with Refinement
                     const historyForAI = chatHistory.concat(userMsg).map(m => ({ role: m.role, content: m.content }));
                     finalPrompt = await refineMotionChat(historyForAI);
                     setLoadingStep(`Veo: Gerando cena (Hera Style)...`);
                     videoUri = await generateVeoVideo(finalPrompt, config.style, config.aspectRatio);
                }
            }
            
            if (videoUri) {
                setCurrentVideoUri(videoUri);
                // 4. Add Assistant Response with Video
                setChatHistory(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `🎬 Renderização concluída.\nPrompt Técnico Utilizado: "${finalPrompt.substring(0, 50)}..."\nSugestão de Áudio: Trilha cinematográfica deep bass com SFX de glitch.`,
                    timestamp: Date.now(),
                    videoUri: videoUri
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
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Export</span>
                        <select 
                            className="bg-transparent text-white text-[10px] font-bold outline-none cursor-pointer"
                            value={config.resolution}
                            onChange={(e) => setConfig({...config, resolution: e.target.value as any})}
                        >
                            <option value="1080p">1080p</option>
                            <option value="4K">4K Pro</option>
                        </select>
                        <div className="w-px h-3 bg-white/20"></div>
                        <select 
                            className="bg-transparent text-white text-[10px] font-bold outline-none cursor-pointer"
                            value={config.fps}
                            onChange={(e) => setConfig({...config, fps: e.target.value as any})}
                        >
                            <option value="30">30 FPS</option>
                            <option value="60">60 FPS</option>
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
                        ) : currentVideoUri ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-[#050511]">
                                <video 
                                    src={currentVideoUri} 
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
                        {currentVideoUri && !isGenerating && (
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleDownload(currentVideoUri)}
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
                                <p className="text-sm">Envie um frame de referência ou descreva a cena para o Diretor.</p>
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
                    <div className="p-4 border-b border-white/5 bg-black/20">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                            Director AI Agent
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                        {chatHistory.map((msg) => (
                            <div key={msg.id} className={`flex flex-col gap-1 max-w-[90%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                                {msg.attachment && (
                                    <div className="w-20 h-20 mb-1 rounded-lg border border-white/20 overflow-hidden relative">
                                        <img src={msg.attachment} className="w-full h-full object-cover" alt="attachment" />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-sm">image</span>
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
                                {msg.videoUri && (
                                    <div className="mt-1 w-32 aspect-video bg-black rounded-lg border border-white/10 overflow-hidden relative group cursor-pointer" onClick={() => setCurrentVideoUri(msg.videoUri!)}>
                                        <video src={msg.videoUri} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white drop-shadow-md">play_circle</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isGenerating && (
                             <div className="self-start bg-white/5 p-3 rounded-2xl rounded-tl-sm border border-white/5">
                                <div className="flex gap-1">
                                    <span className="size-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="size-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                    <span className="size-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* REFERENCE FRAME UPLOAD & INPUT */}
                    <div className="p-4 bg-black/40 border-t border-white/5 flex flex-col gap-2">
                        {attachedImage && (
                            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
                                <img src={attachedImage} className="size-8 rounded object-cover" alt="ref" />
                                <span className="text-[10px] text-slate-400 flex-1 truncate">Frame de Referência.png</span>
                                <button onClick={() => setAttachedImage(null)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>
                            </div>
                        )}
                        
                        <div className="relative flex items-center gap-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-3 rounded-xl border transition-colors ${attachedImage ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                                title="Anexar Frame de Referência"
                            >
                                <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleImageUpload}
                            />

                            <div className="relative flex-1">
                                <input 
                                    className="w-full bg-[#1e293b] text-white text-sm rounded-xl pl-4 pr-12 py-3 border border-white/10 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none"
                                    placeholder={currentMode === MotionMode.MAPS ? "Gerar mapa..." : "Instruir Diretor..."}
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleSendMessage()}
                                    disabled={isGenerating}
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
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan hover:text-black transition-colors disabled:opacity-50"
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
