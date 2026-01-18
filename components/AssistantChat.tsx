
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithAssistant, generateAndPlaySpeech, startLiveSession, stopLiveSession } from '../services/geminiService';

interface AssistantChatProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyIdea: (idea: string) => void;
}

const AssistantChat: React.FC<AssistantChatProps> = ({ isOpen, onClose, onApplyIdea }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'init',
            role: 'model',
            text: 'Olá! Sou seu Co-piloto Criativo. Precisa de ideias para um carrossel viral ou ajuda com prompts visuais?',
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    
    // Live API State
    const [isLive, setIsLive] = useState(false);
    const [liveStatus, setLiveStatus] = useState<'connected' | 'disconnected' | 'error' | 'connecting'>('disconnected');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Cleanup Live session on unmount
    useEffect(() => {
        return () => {
            if (isLive) {
                stopLiveSession();
            }
        };
    }, []);

    const toggleLive = async () => {
        if (isLive) {
            await stopLiveSession();
            setIsLive(false);
            setLiveStatus('disconnected');
        } else {
            setLiveStatus('connecting');
            await startLiveSession((status) => {
                setLiveStatus(status);
                if (status === 'connected') setIsLive(true);
                if (status === 'disconnected' || status === 'error') setIsLive(false);
            });
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Prepare history for API
        const apiHistory = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        const responseText = await chatWithAssistant(userMsg.text, apiHistory);

        const modelMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, modelMsg]);
        setIsTyping(false);
    };

    const handleSpeak = async (id: string, text: string) => {
        if (speakingId) return; // Prevent double click
        setSpeakingId(id);
        try {
            await generateAndPlaySpeech(text);
        } catch (e) {
            console.error(e);
        } finally {
            setSpeakingId(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Backdrop for small screens */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden" 
                    onClick={onClose}
                ></div>
            )}
            
            <div 
                className={`fixed inset-y-0 right-0 z-[60] w-full sm:w-[380px] bg-[#1e1b2e]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#1e1b2e] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
                            <span className="material-symbols-outlined text-white text-lg">smart_toy</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-white leading-none font-display">Co-piloto IA</h3>
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 mt-1">
                                <span className="size-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                                Gemini 3 Flash
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={toggleLive}
                            disabled={liveStatus === 'connecting'}
                            className={`size-8 flex items-center justify-center rounded-lg transition-colors border ${isLive ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'hover:bg-white/10 border-transparent text-slate-400 hover:text-white'}`}
                            title="Start Live Voice Chat"
                        >
                            <span className="material-symbols-outlined text-lg">{isLive || liveStatus === 'connecting' ? 'mic_off' : 'mic'}</span>
                        </button>
                        <button 
                            onClick={onClose}
                            className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* LIVE OVERLAY */}
                {isLive && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/50 backdrop-blur-sm z-10 animate-in fade-in">
                        <div className="relative mb-8">
                            <div className="size-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 animate-pulse flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                                <span className="material-symbols-outlined text-4xl text-white">graphic_eq</span>
                            </div>
                            <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-50"></div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Gemini Live Active</h3>
                        <p className="text-sm text-slate-400 max-w-[200px]">Listening... Speak naturally to discuss ideas.</p>
                        <button 
                            onClick={toggleLive}
                            className="mt-8 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-sm transition-colors shadow-lg"
                        >
                            End Session
                        </button>
                    </div>
                )}

                {/* Messages Area (Hidden if Live) */}
                {!isLive && (
                    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar bg-[#020617]/50">
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`flex flex-col gap-1 max-w-[90%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                            >
                                <div 
                                    className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                                        msg.role === 'user' 
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-sm' 
                                            : 'bg-[#1e1b2e] border border-white/10 text-slate-200 rounded-tl-sm'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                                {msg.role === 'model' && (
                                    <div className="flex items-center gap-3 pl-1 opacity-60 hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => onApplyIdea(msg.text)} 
                                            className="text-[10px] font-bold text-purple-400 hover:text-white flex items-center gap-1 transition-colors"
                                            title="Usar esta ideia"
                                        >
                                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                            Aplicar
                                        </button>
                                        <button 
                                            onClick={() => handleSpeak(msg.id, msg.text)}
                                            disabled={!!speakingId}
                                            className={`text-[10px] flex items-center gap-1 transition-colors ${speakingId === msg.id ? 'text-emerald-400 animate-pulse' : 'text-slate-500 hover:text-white'}`}
                                            title="Ouvir resposta"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">{speakingId === msg.id ? 'graphic_eq' : 'volume_up'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="self-start bg-[#1e1b2e] p-4 rounded-2xl rounded-tl-sm border border-white/5 shadow-sm">
                                <div className="flex gap-1.5">
                                    <span className="size-1.5 bg-purple-500 rounded-full animate-bounce"></span>
                                    <span className="size-1.5 bg-purple-500 rounded-full animate-bounce delay-100"></span>
                                    <span className="size-1.5 bg-purple-500 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Input Area (Hidden if Live) */}
                {!isLive && (
                    <div className="p-5 bg-[#1e1b2e] border-t border-white/5 shrink-0">
                        <div className="relative flex items-end bg-[#020617] rounded-xl border border-white/10 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all shadow-inner">
                            <textarea 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Descreva sua ideia..."
                                className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 max-h-32 resize-none text-white placeholder:text-slate-600"
                                rows={1}
                                style={{ minHeight: '44px' }}
                            />
                            <button 
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="p-2 mb-1 mr-1 rounded-lg text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[20px]">send</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AssistantChat;
