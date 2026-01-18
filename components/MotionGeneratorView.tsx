
import React, { useState, useEffect, useRef } from 'react';
import { MotionConfig, MotionType, MotionStyle, MotionVisualTheme } from '../types';
import { generateMotionConcept, generateVeoVideo } from '../services/geminiService';

interface MotionGeneratorViewProps {
    onBack: () => void;
}

const MotionGeneratorView: React.FC<MotionGeneratorViewProps> = ({ onBack }) => {
    const [topic, setTopic] = useState('');
    const [config, setConfig] = useState<MotionConfig>({
        topic: '',
        type: MotionType.MIXED,
        style: MotionStyle.CINEMATIC,
        visualTheme: MotionVisualTheme.NEON_GLASS,
        platform: 'Instagram'
    });
    
    const [status, setStatus] = useState<'idle' | 'scripting' | 'rendering' | 'done'>('idle');
    const [directorScript, setDirectorScript] = useState<string>('');
    const [videoUri, setVideoUri] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [diagnosticInfo, setDiagnosticInfo] = useState<string | null>(null);
    const [hasApiKey, setHasApiKey] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Ref para o player de vídeo para forçar reload se necessário
    const videoRef = useRef<HTMLVideoElement>(null);

    // Verificar se a API Key foi selecionada ao montar
    useEffect(() => {
        const checkKey = async () => {
            const aistudio = (window as any).aistudio;
            if (aistudio) {
                const hasKey = await aistudio.hasSelectedApiKey();
                setHasApiKey(hasKey);
            } else {
                // Fallback para desenvolvimento local
                setHasApiKey(true);
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

    const handleDownloadVideo = async () => {
        if (!videoUri) return;
        setIsDownloading(true);

        try {
            // Fetch as blob to bypass CORS/Browser download restrictions
            const response = await fetch(videoUri);
            if (!response.ok) throw new Error(`Falha HTTP ${response.status}`);
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // Generate a cool filename
            const filename = `veo_motion_${topic.substring(0, 10).replace(/\s/g, '_')}_${Date.now()}.mp4`;
            a.download = filename;
            
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (err: any) {
            console.warn("Download direto falhou, tentando fallback...", err);
            // Fallback: Open in new tab
            window.open(videoUri, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

    const runDiagnostic = async (uri: string) => {
        setDiagnosticInfo("Rodando diagnóstico de rede...");
        try {
            const response = await fetch(uri, { method: 'HEAD' });
            if (!response.ok) {
                if (response.status === 403) return "Erro 403: Acesso Negado. Verifique se a API Key tem permissão para Vertex AI/Veo ou se o projeto tem billing ativo.";
                if (response.status === 404) return "Erro 404: Vídeo não encontrado. A URL pode ter expirado.";
                return `Erro HTTP ${response.status}: ${response.statusText}`;
            }
            return "Diagnóstico: O arquivo parece acessível via rede. Possível problema de codec no navegador.";
        } catch (e: any) {
            return `Erro de Conexão/CORS: ${e.message}. O servidor pode estar bloqueando acesso direto.`;
        }
    };

    const handleVideoError = async (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const videoError = e.currentTarget.error;
        let shortMsg = "Erro ao reproduzir.";
        if (videoError) {
             switch(videoError.code) {
                 case 1: shortMsg = "Aborted"; break;
                 case 2: shortMsg = "Network Error"; break;
                 case 3: shortMsg = "Decode Error"; break;
                 case 4: shortMsg = "Source Not Supported"; break;
             }
        }
        
        setError(`Falha no Player (${shortMsg}).`);
        
        if (videoUri) {
            const diag = await runDiagnostic(videoUri);
            setDiagnosticInfo(diag);
        }
    };

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        
        setStatus('scripting');
        setError(null);
        setDiagnosticInfo(null);
        setDirectorScript('');
        setVideoUri('');

        try {
            // Step 1: Motion Director (Script)
            const script = await generateMotionConcept({ ...config, topic });
            if (!script) throw new Error("Falha ao gerar o roteiro do diretor.");
            
            setDirectorScript(script);
            setStatus('rendering');

            // Step 2: Veo Renderer
            const uri = await generateVeoVideo(script, config.style);
            
            if (!uri) {
                 throw new Error("A API Veo não retornou uma URL válida.");
            }

            console.log("Video URI recebida:", uri); // Diagnostic log
            setVideoUri(uri);
            setStatus('done');
            
        } catch (err: any) {
            console.error(err);
            let msg = "Erro desconhecido no processo de criação.";
            
            if (err.message && err.message.includes("404")) {
                msg = "Modelo Veo não encontrado (404). Verifique projeto/API.";
                setHasApiKey(false); 
            } else if (err.message) {
                 msg = err.message;
            }
            
            setError(msg);
            setStatus('idle');
        }
    };

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-6 fade-in h-full relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined dark:text-white">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold dark:text-white font-display neon-text-glow">Motion Studio</h1>
                        <span className="text-xs text-primary font-medium tracking-wide">Powered by Veo 3.1</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* CONFIG PANEL */}
                <div className="lg:col-span-4 flex flex-col gap-6 glass-sidebar p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                        <span className="material-symbols-outlined text-primary">movie_filter</span>
                        <h3 className="font-bold text-lg text-white">Configuração de Cena</h3>
                    </div>

                    <div className="flex flex-col gap-4">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Motion</label>
                        <div className="grid grid-cols-1 gap-2">
                            {Object.values(MotionType).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setConfig({...config, type: t})}
                                    className={`p-3 rounded-xl border text-left text-sm transition-all ${config.type === t ? 'bg-primary/20 border-primary text-white shadow-neon-primary' : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5'}`}
                                >
                                    {t === MotionType.TEXT_ONLY && '📝 Texto Cinético (Kinetic)'}
                                    {t === MotionType.IMAGE_ONLY && '🖼️ Imagem Viva (Parallax)'}
                                    {t === MotionType.MIXED && '✨ Misto (Imagem + Texto)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estilo de Movimento</label>
                        <select 
                            className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-sm p-3 focus:border-primary focus:ring-primary"
                            value={config.style}
                            onChange={(e) => setConfig({...config, style: e.target.value as MotionStyle})}
                        >
                            {Object.values(MotionStyle).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                     <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tema Visual</label>
                        <select 
                            className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-sm p-3 focus:border-primary focus:ring-primary"
                            value={config.visualTheme}
                            onChange={(e) => setConfig({...config, visualTheme: e.target.value as MotionVisualTheme})}
                        >
                            {Object.values(MotionVisualTheme).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    
                    {!hasApiKey && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                             <p className="text-xs text-yellow-200 mb-2 font-bold">⚠️ Configuração Necessária</p>
                             <p className="text-xs text-yellow-200/80 mb-2">
                                Para usar o Veo, é necessário selecionar um projeto Google Cloud com faturamento ativado.
                             </p>
                             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[10px] text-yellow-400 underline block mb-3">Saiba mais sobre faturamento</a>
                        </div>
                    )}
                </div>

                {/* MAIN STAGE */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* INPUT */}
                    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 border-slate-200 dark:border-slate-800 shadow-xl shadow-primary/5">
                        <label className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                            <span className="material-symbols-outlined text-neon-cyan">videocam</span>
                            Descreva sua cena
                        </label>
                        <div className="relative">
                            <input 
                                className="w-full h-14 pl-4 pr-40 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 focus:ring-primary focus:border-primary text-lg" 
                                placeholder="Ex: Café sendo servido em slow motion, luz da manhã..." 
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                disabled={status === 'scripting' || status === 'rendering'}
                            />
                            
                            {!hasApiKey ? (
                                <button 
                                    onClick={handleSelectKey}
                                    className="absolute right-2 top-2 h-10 px-6 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-neon-glow"
                                >
                                    <span>Conectar Faturamento</span>
                                    <span className="material-symbols-outlined text-[18px]">key</span>
                                </button>
                            ) : (
                                <button 
                                    onClick={handleGenerate}
                                    disabled={status !== 'idle' && status !== 'done' || !topic.trim()}
                                    className="absolute right-2 top-2 h-10 px-6 bg-gradient-to-r from-primary to-neon-cyan text-white font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 shadow-neon-glow"
                                >
                                    {status === 'idle' || status === 'done' ? (
                                        <>
                                            <span>Renderizar</span>
                                            <span className="material-symbols-outlined text-[18px]">play_circle</span>
                                        </>
                                    ) : (
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* STATUS & DISPLAY */}
                    {status !== 'idle' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            
                            {/* PROGRESS STEPS */}
                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                                <div className={`flex items-center gap-2 ${status === 'scripting' ? 'text-primary animate-pulse' : 'text-slate-500'}`}>
                                    <span className="material-symbols-outlined text-sm">edit_note</span>
                                    Diretor Criativo
                                </div>
                                <div className="h-px w-8 bg-white/10"></div>
                                <div className={`flex items-center gap-2 ${status === 'rendering' ? 'text-neon-cyan animate-pulse' : status === 'done' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    <span className="material-symbols-outlined text-sm">movie</span>
                                    Renderização Veo
                                </div>
                            </div>

                            {/* DIRECTOR SCRIPT DISPLAY */}
                            {directorScript && (
                                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                                    <h4 className="text-[10px] text-primary font-bold uppercase mb-2">Prompt do Diretor (Gerado)</h4>
                                    <p className="text-xs text-slate-300 font-mono leading-relaxed">{directorScript}</p>
                                </div>
                            )}

                            {/* VIDEO PLAYER AREA */}
                            <div className="aspect-video w-full rounded-2xl bg-black/80 border border-white/10 relative overflow-hidden flex items-center justify-center shadow-2xl">
                                {status === 'rendering' && (
                                    <div className="flex flex-col items-center gap-4 text-slate-400">
                                        <div className="size-16 rounded-full border-2 border-white/10 border-t-neon-cyan animate-spin"></div>
                                        <p className="text-sm font-medium animate-pulse">Renderizando vídeo de alta qualidade...</p>
                                        <p className="text-xs opacity-50">Isso pode levar alguns minutos (1-2 min). Não feche esta tela.</p>
                                    </div>
                                )}

                                {status === 'done' && videoUri && !error && (
                                    <video 
                                        ref={videoRef}
                                        controls 
                                        autoPlay 
                                        loop 
                                        className="w-full h-full object-cover"
                                        onError={handleVideoError}
                                        key={videoUri} // Force re-render on URI change
                                    >
                                        <source src={videoUri} type="video/mp4" />
                                        Seu navegador não suporta a tag de vídeo.
                                    </video>
                                )}

                                {error && (
                                    <div className="text-red-400 flex flex-col items-center gap-2 text-center p-6 bg-red-900/10 rounded-xl m-4 border border-red-500/20 max-w-lg">
                                        <span className="material-symbols-outlined text-4xl">error_outline</span>
                                        <p className="font-bold">Falha na Reprodução</p>
                                        <p className="text-xs text-red-300">{error}</p>
                                        
                                        {diagnosticInfo && (
                                            <div className="mt-2 p-2 bg-black/30 rounded border border-white/5 w-full text-left">
                                                <p className="text-[10px] font-mono text-yellow-500">{diagnosticInfo}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-4">
                                            <button 
                                                onClick={() => setStatus('idle')}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg transition-colors border border-white/10"
                                            >
                                                Tentar Novamente
                                            </button>
                                            {videoUri && (
                                                <button 
                                                    onClick={() => window.open(videoUri, '_blank')}
                                                    className="px-4 py-2 bg-primary/20 hover:bg-primary/40 text-primary text-xs rounded-lg transition-colors border border-primary/20 flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                                    Abrir Link Direto
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {status === 'done' && videoUri && (
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all text-xs"
                                    >
                                        <span className="material-symbols-outlined text-sm">refresh</span>
                                        Novo Vídeo
                                    </button>
                                    
                                    <button 
                                        onClick={handleDownloadVideo}
                                        disabled={isDownloading}
                                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                                    >
                                        {isDownloading ? (
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined">download</span>
                                        )}
                                        {isDownloading ? 'Baixando...' : 'Baixar Vídeo (MP4)'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MotionGeneratorView;
