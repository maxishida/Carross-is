import React, { useState } from 'react';
import { CreativeData, GenerationConfig, ToneType, VisualStyleType } from '../types';
import { generateCreativeVariations } from '../services/geminiService';
import ConfigPanel from './ConfigPanel';

interface CreativeGeneratorViewProps {
    onBack: () => void;
}

const CreativeGeneratorView: React.FC<CreativeGeneratorViewProps> = ({ onBack }) => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<CreativeData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [config, setConfig] = useState<GenerationConfig>({
        slideCount: 1, // Irrelevant for creatives but needed for type
        tone: ToneType.PERSUASIVE,
        style: VisualStyleType.GRADIENT_TECH,
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

        try {
            const result = await generateCreativeVariations(topic, config);
            setData(result);
        } catch (err) {
            setError('Erro ao gerar criativos. Tente novamente.');
            console.error(err);
        } finally {
            setIsLoading(false);
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

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-6 fade-in h-full relative">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-surface-dark transition-colors">
                        <span className="material-symbols-outlined dark:text-white">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold dark:text-white font-display">Gerador de Criativos</h1>
                        <span className="text-xs text-slate-500">6 Variações de Design Único</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
                {/* Configuration Sidebar - Reuse ConfigPanel but maybe simplify or just use it as is */}
                <div className="lg:col-span-4 order-2 lg:order-1">
                    <ConfigPanel config={config} setConfig={setConfig} disabled={isLoading} />
                    
                    {/* Aspect Ratio Selector (Custom for this view) */}
                    <div className="mt-6 bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/5">
                        <label className="font-bold text-sm dark:text-white mb-4 block">Formato do Criativo</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button 
                                onClick={() => setConfig(prev => ({...prev, aspectRatio: '1:1'}))}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${config.aspectRatio === '1:1' ? 'bg-primary/10 border-primary text-primary' : 'border-slate-200 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <div className="size-6 border-2 border-current rounded-sm"></div>
                                <span className="text-xs font-bold">Post (1:1)</span>
                            </button>
                            <button 
                                onClick={() => setConfig(prev => ({...prev, aspectRatio: '9:16'}))}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${config.aspectRatio === '9:16' ? 'bg-primary/10 border-primary text-primary' : 'border-slate-200 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <div className="w-3.5 h-6 border-2 border-current rounded-sm"></div>
                                <span className="text-xs font-bold">Story (9:16)</span>
                            </button>
                            <button 
                                onClick={() => setConfig(prev => ({...prev, aspectRatio: '16:9'}))}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${config.aspectRatio === '16:9' ? 'bg-primary/10 border-primary text-primary' : 'border-slate-200 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <div className="w-6 h-3.5 border-2 border-current rounded-sm"></div>
                                <span className="text-xs font-bold">Capa (16:9)</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-8 order-1 lg:order-2 flex flex-col gap-6 pb-24">
                    {/* Input Area */}
                    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 shadow-xl shadow-primary/5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-500">photo_library</span>
                            O que você quer criar?
                        </label>
                        <div className="relative">
                            <input 
                                className="w-full h-14 pl-4 pr-36 rounded-xl bg-slate-100 dark:bg-[#161a2c] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-primary focus:border-primary text-lg" 
                                placeholder="Ex: Anúncio de Tênis de Corrida, Capa de Vídeo sobre IA..." 
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                disabled={isLoading}
                            />
                            <button 
                                onClick={handleGenerate}
                                disabled={isLoading || !topic.trim()}
                                className="absolute right-2 top-2 h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30"
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
                    </div>

                    {/* Results Grid */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-200">
                            {error}
                        </div>
                    )}

                    {isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className={`w-full rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-300 dark:border-slate-700 relative overflow-hidden ${getAspectRatioClass()}`}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && data && (
                        <div className="flex flex-col gap-4">
                            <h3 className="font-bold text-xl dark:text-white">6 Variações Geradas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.variations.map((item) => (
                                    <div key={item.id} className="group relative flex flex-col bg-white dark:bg-[#161a2c] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-1">
                                        {/* Preview Area (Abstract Representation) */}
                                        <div className={`w-full relative bg-gray-100 dark:bg-black/40 overflow-hidden ${getAspectRatioClass()}`}>
                                            <div className="absolute inset-0 opacity-30 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(135deg, ${item.colorPaletteSuggestion})` }}></div>
                                            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                                                <h4 className="text-xl font-black text-slate-900 dark:text-white/80 uppercase tracking-tighter leading-none opacity-20 transform -rotate-12 scale-150 select-none">
                                                    {item.conceptTitle.split(' ')[0]}
                                                </h4>
                                            </div>
                                            <div className="absolute top-3 left-3">
                                                <span className="bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase">
                                                    {item.conceptTitle}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Info & Prompt */}
                                        <div className="p-4 flex flex-col gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="material-symbols-outlined text-purple-400 text-sm">psychology</span>
                                                    <span className="text-xs font-bold text-purple-600 dark:text-purple-300">Ângulo de Marketing</span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {item.marketingAngle}
                                                </p>
                                            </div>
                                            
                                            <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-lg border border-slate-200 dark:border-white/5">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400">Prompt Visual</span>
                                                    <button 
                                                        onClick={() => navigator.clipboard.writeText(item.visualPrompt)}
                                                        className="text-primary hover:text-white hover:bg-primary rounded p-1 transition-colors"
                                                        title="Copiar Prompt"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                                    </button>
                                                </div>
                                                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 line-clamp-4 leading-tight">
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