
import React from 'react';

interface SidebarProps {
  onNavigate: (view: 'dashboard' | 'create' | 'creative' | 'motion') => void;
  currentView: 'dashboard' | 'create' | 'creative' | 'motion';
  isOpen: boolean; // Control visibility on mobile
  onClose: () => void; // Close handler for mobile overlay
  credits: number; // Dynamic credits
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentView, isOpen, onClose, credits }) => {
  
  // Base classes for sidebar container
  const sidebarClasses = `
    absolute md:relative top-0 left-0 h-full w-[260px] 
    bg-[#050511]/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none
    border-r border-white/10 z-50 
    transition-transform duration-300 ease-in-out flex flex-col
    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  return (
    <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
                onClick={onClose}
            ></div>
        )}

        <aside className={sidebarClasses}>
          {/* Sidebar Header */}
          <div className="p-6 pb-2">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-600 to-purple-700 flex items-center justify-center shadow-[0_0_15px_rgba(192,38,211,0.4)] border border-white/10 shrink-0">
                    <i className="fa-solid fa-layer-group text-xl text-white"></i>
                </div>
                <div className="leading-tight">
                    <h1 className="text-sm font-semibold text-white font-sans">Painel de<br/>Experiências</h1>
                </div>
                <button onClick={onClose} className="md:hidden ml-auto text-white/50 hover:text-white">
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div className="text-xs font-medium text-white/50 mb-2 uppercase tracking-wide px-1">Criador Pro</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col gap-1 w-full">
            <button 
                onClick={() => { onNavigate('dashboard'); onClose(); }}
                className={`flex items-center gap-3 px-6 py-3 transition-all duration-300 text-left ${currentView === 'dashboard' ? 'nav-item-active text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
            >
                <i className={`fa-solid fa-border-all text-lg w-6 ${currentView === 'dashboard' ? 'text-fuchsia-300' : ''}`}></i>
                <span className="text-sm font-medium">Dashboard</span>
            </button>

            <button 
                onClick={() => { onNavigate('create'); onClose(); }}
                className={`flex items-center gap-3 px-6 py-3 transition-all duration-300 text-left ${currentView === 'create' ? 'nav-item-active text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
            >
                <i className={`fa-regular fa-clone text-lg w-6 ${currentView === 'create' ? 'text-fuchsia-300' : ''}`}></i>
                <span className="text-sm font-medium">Carrossel Glass</span>
            </button>

            <button 
                onClick={() => { onNavigate('creative'); onClose(); }}
                className={`flex items-center gap-3 px-6 py-3 transition-all duration-300 text-left ${currentView === 'creative' ? 'nav-item-active text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
            >
                <i className={`fa-regular fa-image text-lg w-6 ${currentView === 'creative' ? 'text-fuchsia-300' : ''}`}></i>
                <span className="text-sm font-medium">Criativos (6x)</span>
            </button>

            <button 
                onClick={() => { onNavigate('motion'); onClose(); }}
                className={`flex items-center gap-3 px-6 py-3 transition-all duration-300 text-left ${currentView === 'motion' ? 'nav-item-active text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
            >
                <i className={`fa-solid fa-satellite-dish text-lg w-6 ${currentView === 'motion' ? 'text-fuchsia-300' : ''}`}></i>
                <span className="text-sm font-medium">Motion Studio</span>
            </button>
          </nav>

          {/* Sidebar Footer: Tokens */}
          <div className="p-6 mt-auto">
            <div className="glass-panel p-4 rounded-2xl bg-white/5 border-t border-white/10">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs text-white/90 font-medium">Tokens Restantes</span>
                    <span className="text-[10px] text-fuchsia-300 font-mono">{credits}</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(247,37,133,0.5)] transition-all duration-500"
                        style={{ width: `${(credits / 1000) * 100}%` }}
                    ></div>
                </div>
            </div>
          </div>
        </aside>
    </>
  );
};

export default Sidebar;
