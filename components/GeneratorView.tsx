import React, { useState, useRef, useEffect } from 'react';
import { CarouselData, GenerationConfig, ToneType, VisualStyleType, CarouselGoal } from '../types';
import { generateCarousel, refineCarousel } from '../services/geminiService';
import SlideCard from './SlideCard';
import ConfigPanel from './ConfigPanel';
import AssistantChat from './AssistantChat';

interface GeneratorViewProps {
    onBack: () => void;
}

const GeneratorView: React.FC<GeneratorViewProps> = ({ onBack }) => {
    const [inputValue, setInputValue] = useState('');
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [data, setData] = useState<CarouselData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const resultsEndRef = useRef<HTMLDivElement>(null);

    const [config, setConfig] = useState<GenerationConfig>({
        slideCount: 5,
        tone: ToneType.PROFESSIONAL,
        style: VisualStyleType.GRADIENT_TECH,
        customStylePrompt: '', // Inicializando campo de estilo custom
        goal: CarouselGoal.AUTHORITY,
        inputType: 'topic',
        includePeople: false,
        customTheme: ''
    });

    const handleGenerate = async () => {
        if (!inputValue.trim()) return;
        setIsLoading(true);
        setError(null);
        setData(null);
        try {
            const result = await generateCarousel(inputValue, config);
            setData(result);
        } catch (err) {
            setError('Ocorreu um erro ao gerar o carrossel. Tente novamente.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

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
            `ANÁLISE DE REFERÊNCIA: ${data.referenceAnalysis || 'N/A'}`,
            "---------------------------------------------------",
            ""
        ];
        data.slides.forEach(slide => {
            lines.push(`SLIDE ${slide.slideNumber}: ${slide.title}`);
            lines.push(`TEXTO: ${slide.content}`);
            lines.push(`LAYOUT: ${slide.layoutSuggestion}`);
            lines.push(`PROMPT VISUAL: ${slide.imagePrompt}`);
            lines.push("");
            lines.push("---------------------------------------------------");
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };
    
    const handleRefineKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isRefining) {
            handleRefine();
        }
    };

    const handleApplyIdea = (idea: string) => {
        if (idea.length < 100) {
            setInputValue(idea);
        } else {
            setInputValue(idea.substring(0, 100) + "...");
        }
        setIsAssistantOpen(false); 
    };

    useEffect(() => {
        if (data && resultsEndRef.current) {
            resultsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [data]);

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6 fade-in h-full relative">
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
                
                <button 
                    onClick={() => setIsAssistantOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/50 text-white rounded-full shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-primary/30 transition-all group"
                >
                    <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">smart_toy</span>
                    <span className="text-sm font-bold hidden sm:inline">Co-piloto IA</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
                {/* Configuration Sidebar */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                    <ConfigPanel config={config} setConfig={setConfig} disabled={isLoading || isRefining} />
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9 order-1 lg:order-2 flex flex-col gap-8 pb-24">
                    
                    {/* Glass Input Panel */}
                    <div className="glass-panel p-1 rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/5">
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
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-200 text-center backdrop-blur-sm">
                                {error}
                            </div>
                        )}

                        <div className="w-full overflow-x-auto pb-8 pt-2 custom-scrollbar min-h-[420px]">
                            <div className="flex gap-6 min-w-max px-1">
                                {isLoading && Array.from({ length: config.slideCount }).map((_, i) => (
                                    <div key={i} className="w-[300px] aspect-[4/5] rounded-xl bg-slate-800/50 animate-pulse border border-white/5 relative overflow-hidden backdrop-blur-sm">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                                    </div>
                                ))}

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

                                {!isLoading && data && data.slides.map((slide) => (
                                    <SlideCard 
                                        key={slide.slideNumber} 
                                        slide={slide} 
                                        totalSlides={data.slides.length}
                                        style={config.style}
                                        referenceImage={config.referenceImage}
                                    />
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
                                    onKeyDown={handleRefineKeyDown}
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
                             <div className="flex justify-end">
                                <button 
                                    onClick={handleExportTxt}
                                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-white/30 transition-all bg-black/20"
                                >
                                    <span className="material-symbols-outlined text-sm">download</span>
                                    Baixar Roteiro (.txt)
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
                onApplyIdea={handleApplyIdea}
            />
        </div>
    );
};

export default GeneratorView;