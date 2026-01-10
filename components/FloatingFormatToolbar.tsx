
import React, { useEffect, useState, useRef } from 'react';

interface FloatingFormatToolbarProps {
    brandColor: string;
}

const FloatingFormatToolbar: React.FC<FloatingFormatToolbarProps> = ({ brandColor }) => {
    const [position, setPosition] = useState<{ top: number, left: number } | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const toolbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || !selection.rangeCount) {
                setIsVisible(false);
                return;
            }

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Only show if selection is inside a slide contenteditable
            const container = range.commonAncestorContainer.parentElement;
            if (!container?.closest('[contenteditable="true"]')) {
                setIsVisible(false);
                return;
            }

            // Calculate position specifically relative to viewport to avoid scroll issues
            // but we use fixed positioning for the toolbar
            setPosition({
                top: rect.top - 50, // 50px above selection
                left: rect.left + (rect.width / 2) // Center horizontally
            });
            setIsVisible(true);
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    const execFormat = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        // Keep focus? Usually execCommand keeps it, but sometimes we might need to re-select
    };

    if (!isVisible || !position) return null;

    return (
        <div 
            ref={toolbarRef}
            className="fixed z-[9999] flex items-center gap-1 p-1.5 rounded-lg bg-[#1e293b] border border-white/20 shadow-xl animate-in fade-in zoom-in-95 duration-200"
            style={{ 
                top: position.top, 
                left: position.left, 
                transform: 'translateX(-50%)' 
            }}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing focus on text
        >
            <button 
                onClick={() => execFormat('bold')}
                className="p-1.5 rounded hover:bg-white/10 text-white transition-colors"
                title="Negrito"
            >
                <span className="material-symbols-outlined text-[18px]">format_bold</span>
            </button>
            <button 
                onClick={() => execFormat('italic')}
                className="p-1.5 rounded hover:bg-white/10 text-white transition-colors"
                title="Itálico"
            >
                <span className="material-symbols-outlined text-[18px]">format_italic</span>
            </button>
            <div className="w-px h-4 bg-white/20 mx-1"></div>
            <button 
                onClick={() => execFormat('foreColor', brandColor)}
                className="p-1.5 rounded hover:bg-white/10 text-white transition-colors flex items-center gap-1"
                title="Cor da Marca"
            >
                <span className="material-symbols-outlined text-[18px]" style={{color: brandColor}}>format_color_text</span>
            </button>
             <button 
                onClick={() => execFormat('foreColor', '#ffffff')}
                className="p-1.5 rounded hover:bg-white/10 text-white transition-colors"
                title="Cor Branca (Reset)"
            >
                <span className="material-symbols-outlined text-[18px]">format_clear</span>
            </button>
            
            {/* Arrow down */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1e293b]"></div>
        </div>
    );
};

export default FloatingFormatToolbar;
