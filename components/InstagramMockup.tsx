
import React from 'react';
import { Slide } from '../types';

interface InstagramMockupProps {
    isOpen: boolean;
    onClose: () => void;
    slides: Slide[];
    topic: string;
    profileImage?: string;
    profileName?: string;
}

const InstagramMockup: React.FC<InstagramMockupProps> = ({ isOpen, onClose, slides, topic, profileImage, profileName = "Criador Pro" }) => {
    if (!isOpen) return null;

    // We use the first slide generated background as cover, or fallback
    const coverImage = slides[0]?.generatedBackground || 'https://via.placeholder.com/1080x1080?text=Cover';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="relative bg-white text-black w-full max-w-[380px] rounded-[30px] overflow-hidden shadow-2xl border-4 border-gray-900"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Status Bar Mockup */}
                <div className="flex justify-between items-center px-6 pt-3 pb-2 text-xs font-bold">
                    <span>9:41</span>
                    <div className="flex gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
                        <span className="material-symbols-outlined text-[14px]">wifi</span>
                        <span className="material-symbols-outlined text-[14px]">battery_full</span>
                    </div>
                </div>

                {/* App Bar */}
                <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100">
                    <span className="font-display font-bold text-lg">Instagram</span>
                    <div className="flex gap-4">
                        <span className="material-symbols-outlined text-2xl">favorite_border</span>
                        <span className="material-symbols-outlined text-2xl">chat_bubble_outline</span>
                    </div>
                </div>

                {/* Post Header */}
                <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-white border-2 border-white overflow-hidden">
                                <img src={profileImage || "https://ui-avatars.com/api/?name=Criador+Pro&background=random"} className="w-full h-full object-cover" alt="profile"/>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold">{profileName}</span>
                            <span className="text-[10px] text-gray-500">Localização Original</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-xl">more_horiz</span>
                </div>

                {/* Post Content (Carousel Preview) */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <img src={coverImage} className="w-full h-full object-cover" alt="Post content" />
                    
                    {/* Carousel Indicators */}
                    {slides.length > 1 && (
                        <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                            1/{slides.length}
                        </div>
                    )}
                </div>

                {/* Action Bar */}
                <div className="px-3 py-2">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex gap-4">
                            <span className="material-symbols-outlined text-2xl">favorite_border</span>
                            <span className="material-symbols-outlined text-2xl">mode_comment</span>
                            <span className="material-symbols-outlined text-2xl">send</span>
                        </div>
                        <span className="material-symbols-outlined text-2xl">bookmark_border</span>
                    </div>
                    <p className="text-sm font-bold mb-1">2.453 curtidas</p>
                    <p className="text-xs leading-relaxed">
                        <span className="font-bold mr-1">{profileName}</span>
                        {topic} ✨ Mais um conteúdo gerado com IA para acelerar sua produção. 🚀
                        <br/>
                        <span className="text-blue-900">#marketing #ia #gemini #conteudo</span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase">Há 2 horas</p>
                </div>

                {/* Footer Navigation */}
                <div className="flex justify-between items-center px-6 py-3 border-t border-gray-100 bg-white">
                    <span className="material-symbols-outlined text-2xl">home</span>
                    <span className="material-symbols-outlined text-2xl">search</span>
                    <span className="material-symbols-outlined text-2xl">add_box</span>
                    <span className="material-symbols-outlined text-2xl">movie</span>
                    <div className="w-6 h-6 rounded-full bg-gray-300 overflow-hidden">
                         <img src={profileImage || "https://ui-avatars.com/api/?name=Criador+Pro&background=random"} className="w-full h-full object-cover" alt="profile"/>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstagramMockup;
