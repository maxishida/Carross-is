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
    
    // Assistant State
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    
    // Auto-scroll to bottom of results when refined
    const resultsEndRef = useRef<HTMLDivElement>(null);

    const [config, setConfig] = useState<GenerationConfig>({
        slideCount: 5,
        tone: ToneType.PROFESSIONAL,
        style: VisualStyleType.GRADIENT_TECH,
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
        <div className="max-w-7xl mx-auto flex flex-col gap-6 fade-in h-full relative">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-surface-dark transition-colors">
                        <span className="material-symbols-outlined dark:text-white">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold dark:text-white font-display">Nova Criação</h1>
                        <span className="text-xs text-slate-500">Agente de Ultra Design Ativo</span>
                    </div>
                </div>
                
                {/* Assistant Toggle Button */}
                <button 
                    onClick={() => setIsAssistantOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-full shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                >
                    <span className="material-symbols-outlined">smart_toy</span>
                    <span className="text-sm font-bold hidden sm:inline">Co-piloto IA</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
                {/* Configuration Sidebar */}
                <div className="lg:col-span-4 order-2 lg:order-1">
                    <ConfigPanel config={config} setConfig={setConfig} disabled={isLoading || isRefining} />
                </div>

                {/* Main Content */}
                <div className="lg:col-span-8 order-1 lg:order-2 flex flex-col gap-6 pb-24">
                    
                    {/* Input Type Tabs */}
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-surface-dark rounded-xl w-fit">
                        <button 
                            onClick={() => setConfig(prev => ({...prev, inputType: 'topic'}))}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${config.inputType === 'topic' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            Criar do Zero
                        </button>
                        <button 
                            onClick={() => setConfig(prev => ({...prev, inputType: 'content'}))}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${config.inputType === 'content' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">youtube_activity</span>
                            Transformar Conteúdo
                        </button>
                    </div>

                    {/* Prompt Input Area */}
                    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 shadow-xl shadow-primary/5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">
                                {config.inputType === 'topic' ? 'auto_awesome' : 'link'}
                            </span>
                            {config.inputType === 'topic' ? 'Sobre o que é seu carrossel?' : 'Cole o Link do YouTube ou Texto do Artigo'}
                        </label>
                        <div className="relative">
                            {config.inputType === 'topic' ? (
                                <input 
                                    className="w-full h-14 pl-4 pr-36 rounded-xl bg-slate-100 dark:bg-[#161a2c] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-primary focus:border-primary text-lg" 
                                    placeholder="Ex: 5 Dicas para Liderança Remota..." 
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading || isRefining}
                                />
                            ) : (
                                <textarea 
                                    className="w-full h-24 pl-4 pr-36 py-3 rounded-xl bg-slate-100 dark:bg-[#161a2c] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-primary focus:border-primary text-sm resize-none" 
                                    placeholder="Cole aqui a transcrição do vídeo, link (simulado) ou texto completo que deseja resumir em carrossel..." 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading || isRefining}
                                />
                            )}
                            <button 
                                onClick={handleGenerate}
                                disabled={isLoading || isRefining || !inputValue.trim()}
                                className="absolute right-2 top-2 h-10 px-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
                            >
                                {isLoading ? (
                                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                ) : (
                                    <>
                                        <span>Gerar</span>
                                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                    </>
                                )}
                            </button>
                        </div>
                        {config.inputType === 'topic' && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {["Marketing Digital", "Vendas B2B", "Saúde Mental"].map(t => (
                                    <button key={t} onClick={() => setInputValue(t)} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#161a2c] hover:bg-primary/10 hover:text-primary text-slate-600 dark:text-slate-400 text-sm font-medium transition-colors border border-transparent hover:border-primary/20">
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Results Area */}
                    <div className="flex flex-col gap-4">
                         <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xl dark:text-white flex items-center gap-2">
                                {isLoading ? 'Agentes trabalhando...' : 'Resultado'}
                                {data && <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded border border-green-500/20">Pronto</span>}
                            </h3>
                            {data && !isLoading && !isRefining && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleExportTxt}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold glass-button transition-all hover:bg-primary/90"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">description</span>
                                        Baixar Roteiro e Prompts (.txt)
                                    </button>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-200">
                                {error}
                            </div>
                        )}

                        <div className="w-full overflow-x-auto pb-8 pt-2 custom-scrollbar min-h-[350px]">
                            <div className="flex gap-6 min-w-max px-1">
                                {isLoading && Array.from({ length: config.slideCount }).map((_, i) => (
                                    <div key={i} className="w-[300px] aspect-[4/5] rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-300 dark:border-slate-700 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                                    </div>
                                ))}

                                {!isLoading && !data && (
                                    <div className="w-full h-[350px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-transparent/30">
                                        <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined text-4xl opacity-50">view_carousel</span>
                                        </div>
                                        <p className="font-medium">Seus slides de Ultra Design aparecerão aqui</p>
                                        <p className="text-sm opacity-60">Configure o estilo ao lado e clique em Gerar</p>
                                    </div>
                                )}

                                {!isLoading && data && data.slides.map((slide) => (
                                    <SlideCard 
                                        key={slide.slideNumber} 
                                        slide={slide} 
                                        totalSlides={data.slides.length}
                                        style={config.style}
                                    />
                                ))}
                                <div ref={resultsEndRef} />
                            </div>
                        </div>

                        {/* Interactive Refinement Bar (Chat with Agent) */}
                        {data && (
                            <div className="flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-400">chat_spark</span>
                                    Fale com o Agente para refinar
                                </label>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                                    <div className="relative flex items-center bg-white dark:bg-[#161a2c] rounded-xl border border-slate-200 dark:border-slate-700 p-1 pl-4 focus-within:border-purple-500 transition-colors">
                                        <input 
                                            className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400"
                                            placeholder="Ex: Mude a cor para azul neon, coloque um astronauta no slide 2..."
                                            value={refinementPrompt}
                                            onChange={(e) => setRefinementPrompt(e.target.value)}
                                            onKeyDown={handleRefineKeyDown}
                                            disabled={isRefining}
                                        />
                                        <button 
                                            onClick={handleRefine}
                                            disabled={isRefining || !refinementPrompt.trim()}
                                            className="h-10 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isRefining ? (
                                                <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-[20px]">send</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-xs text-slate-500">Sugestões:</span>
                                    <button onClick={() => setRefinementPrompt("Faça os textos mais curtos e diretos")} className="text-xs text-primary hover:underline">"Encurtar textos"</button>
                                    <button onClick={() => setRefinementPrompt("Troque o estilo visual para Cyberpunk")} className="text-xs text-primary hover:underline">"Estilo Cyberpunk"</button>
                                    <button onClick={() => setRefinementPrompt("Adicione um avatar 3D explicando o conceito no slide 1")} className="text-xs text-primary hover:underline">"Adicionar Avatar"</button>
                                </div>
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