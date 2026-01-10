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
    fixed md:relative top-0 left-0 h-full w-[280px] 
    bg-[#050511]/95 md:bg-[#050511]/70 backdrop-blur-2xl 
    border-r border-white/10 shadow-2xl z-50 
    transition-transform duration-300 ease-in-out
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
          <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>
          
          <div className="flex flex-col h-full justify-between p-5">
            <div className="flex flex-col gap-8">
              {/* User Profile & Mobile Close */}
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer group">
                    <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 shrink-0 border-2 border-primary/50 shadow-neon-primary group-hover:scale-105 transition-transform" 
                         style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA9nA-3U0hBm-n8lwOsBjFSRIiHtv4o5FiNDUIFwySkJ9L7wNkr5e_BOcLbAsCAjZj0JE0sNH1V7hyovL5QldP4mYcBSYyhPOfT4EwFTDm0YgctWoUGk4uGqZXmVzCB9dOkhIMlsawDFxYqLlE-6pWEKvPs020u-0n-1HnWttuZxBD86lPlJ0KuI9jQOeGZjcLzKFmkot5JZTiOO8mQHPP8KY195g6B3N-kEGPwTUuy6cjEkLfVl31-5foGo7Lsz_WqPbM40gvaNNv_")'}}>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <h1 className="text-white text-sm font-bold font-display leading-tight truncate group-hover:text-primary transition-colors">Criador Pro</h1>
                      <p className="text-slate-500 text-[10px] font-normal leading-normal truncate">Plano Profissional</p>
                    </div>
                  </div>
                  
                  {/* Close Button Mobile Only */}
                  <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white">
                      <span className="material-symbols-outlined">close</span>
                  </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-2">
                <button 
                    onClick={() => { onNavigate('dashboard'); onClose(); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-left relative overflow-hidden ${currentView === 'dashboard' ? 'glass-button-active' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <span className={`material-symbols-outlined transition-transform group-hover:scale-110 ${currentView === 'dashboard' ? 'text-primary' : ''}`}>dashboard</span>
                  <p className="text-sm font-medium leading-normal relative z-10">Dashboard</p>
                </button>
                
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>
                
                <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ferramentas IA</h3>
                
                <button 
                    onClick={() => { onNavigate('create'); onClose(); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-left relative overflow-hidden ${currentView === 'create' ? 'glass-button-active' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <span className="material-symbols-outlined transition-transform group-hover:scale-110">view_carousel</span>
                  <p className="text-sm font-medium leading-normal relative z-10">Carrossel Glass</p>
                </button>
                
                <button 
                    onClick={() => { onNavigate('creative'); onClose(); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-left relative overflow-hidden ${currentView === 'creative' ? 'glass-button-active border-accent/60 bg-accent/20 text-accent shadow-[0_0_15px_rgba(168,85,247,0.25)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <span className="material-symbols-outlined transition-transform group-hover:scale-110">photo_library</span>
                  <p className="text-sm font-medium leading-normal relative z-10">Criativos (6x)</p>
                </button>

                <button 
                    onClick={() => { onNavigate('motion'); onClose(); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-left relative overflow-hidden ${currentView === 'motion' ? 'glass-button-active border-neon-cyan/60 bg-neon-cyan/20 text-neon-cyan shadow-[0_0_15px_rgba(6,182,212,0.25)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <span className="material-symbols-outlined transition-transform group-hover:scale-110">movie_filter</span>
                  <p className="text-sm font-medium leading-normal relative z-10">Motion Studio</p>
                </button>
              </nav>
            </div>

            <div className="flex flex-col gap-4">
              <div className="px-1">
                <div className="p-4 bg-gradient-to-br from-primary/20 to-blue-900/40 rounded-xl border border-primary/30 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-end mb-2 relative z-10">
                        <p className="text-white text-xs font-bold">Tokens Restantes</p>
                        <p className="text-primary text-[10px] font-mono">{credits}/1k</p>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-1 border border-white/5 relative z-10">
                        <div 
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000"
                            style={{ width: `${(credits / 1000) * 100}%` }}
                        ></div>
                    </div>
                </div>
              </div>
              
              <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all text-left">
                <span className="material-symbols-outlined">settings</span>
                <p className="text-sm font-medium leading-normal">Configurações</p>
              </button>
            </div>
          </div>
        </aside>
    </>
  );
};

export default Sidebar;