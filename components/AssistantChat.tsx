
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithAssistant, generateAndPlaySpeech } from '../services/geminiService';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

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
                    className="fixed inset-0 bg-black/50 z-[55] md:hidden" 
                    onClick={onClose}
                ></div>
            )}
            
            <div 
                className={`fixed inset-y-0 right-0 z-[60] w-full sm:w-[350px] bg-white dark:bg-[#0f111a] border-l border-gray-200 dark:border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm dark:text-white leading-none">Co-piloto IA</h3>
                            <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                                <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Online
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">close</span>
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50/50 dark:bg-[#0f111a]">
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex flex-col gap-1 max-w-[90%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                        >
                            <div 
                                className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                    msg.role === 'user' 
                                        ? 'bg-primary text-white rounded-tr-sm' 
                                        : 'bg-white dark:bg-[#1e2336] border border-gray-200 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm'
                                }`}
                            >
                                {msg.text}
                            </div>
                            {msg.role === 'model' && (
                                <div className="flex items-center gap-2 pl-1 opacity-0 hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => onApplyIdea(msg.text)} 
                                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                        title="Copiar para o campo de tópico"
                                    >
                                        <span className="material-symbols-outlined text-[10px]">content_copy</span>
                                        Copiar
                                    </button>
                                    <button 
                                        onClick={() => handleSpeak(msg.id, msg.text)}
                                        disabled={!!speakingId}
                                        className={`text-[10px] flex items-center gap-1 transition-colors ${speakingId === msg.id ? 'text-green-400 animate-pulse' : 'text-slate-400 hover:text-white'}`}
                                        title="Ouvir resposta (TTS)"
                                    >
                                        <span className="material-symbols-outlined text-[12px]">{speakingId === msg.id ? 'graphic_eq' : 'volume_up'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {isTyping && (
                        <div className="self-start bg-white dark:bg-[#1e2336] p-3 rounded-2xl rounded-tl-sm border border-gray-200 dark:border-white/5">
                            <div className="flex gap-1">
                                <span className="size-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="size-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                                <span className="size-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-[#0f111a] border-t border-gray-200 dark:border-white/10 shrink-0">
                    <div className="relative flex items-center bg-gray-100 dark:bg-[#1e2336] rounded-xl border border-transparent focus-within:border-primary/50 transition-colors">
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pergunte algo..."
                            className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 max-h-24 resize-none dark:text-white placeholder:text-gray-500"
                            rows={1}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="p-2 mr-1 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AssistantChat;
