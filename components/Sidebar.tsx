
import React from 'react';

interface SidebarProps {
  onNavigate: (view: 'dashboard' | 'create' | 'creative' | 'motion' | 'crm' | 'projects' | 'finance' | 'team') => void;
  currentView: string;
  isOpen: boolean; // Control visibility on mobile
  onClose: () => void; // Close handler for mobile overlay
  credits: number; // Dynamic credits
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentView, isOpen, onClose, credits }) => {
  
  // Base classes for sidebar container
  const sidebarClasses = `
    absolute md:relative top-0 left-0 h-full w-[260px] 
    bg-[#0f172a] md:bg-[#0f172a]/90 backdrop-blur-xl
    border-r border-white/5 z-50 
    transition-transform duration-300 ease-in-out flex flex-col
    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  const navItemClass = (isActive: boolean) => `
    flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium mb-1
    ${isActive 
        ? 'bg-gradient-to-r from-[#2563eb]/20 to-[#2563eb]/5 text-white border-l-2 border-[#2563eb]' 
        : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}
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
          <div className="p-6 pb-2 flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="material-symbols-outlined text-white text-lg">grid_view</span>
             </div>
             <div>
                <h1 className="font-bold text-white text-base leading-none">AgencyOS</h1>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pro Workspace</span>
             </div>
             <button onClick={onClose} className="md:hidden ml-auto text-white/50 hover:text-white">
                <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="px-6 py-4">
              <div className="bg-[#1e293b] rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                      <img src="https://ui-avatars.com/api/?name=Lucas+Dev&background=random" className="w-8 h-8 rounded-full" alt="User" />
                      <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">Lucas Dev</span>
                          <span className="text-[10px] text-slate-400">Admin</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col px-4 overflow-y-auto custom-scrollbar">
            
            <div className="mb-6">
                <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Gestão</p>
                <button 
                    onClick={() => { onNavigate('dashboard'); onClose(); }}
                    className={navItemClass(currentView === 'dashboard')}
                >
                    <span className="material-symbols-outlined text-[20px]">dashboard</span>
                    <span>Dashboard</span>
                </button>
                <button 
                    onClick={() => { onNavigate('projects'); onClose(); }}
                    className={navItemClass(currentView === 'projects')}
                >
                    <span className="material-symbols-outlined text-[20px]">folder_open</span>
                    <span>Projetos</span>
                    <span className="ml-auto bg-amber-500/20 text-amber-400 text-[10px] px-1.5 rounded">5</span>
                </button>
                <button 
                    onClick={() => { onNavigate('crm'); onClose(); }}
                    className={navItemClass(currentView === 'crm')}
                >
                    <span className="material-symbols-outlined text-[20px]">group</span>
                    <span>CRM & Leads</span>
                </button>
                <button 
                    onClick={() => { onNavigate('finance'); onClose(); }}
                    className={navItemClass(currentView === 'finance')}
                >
                    <span className="material-symbols-outlined text-[20px]">attach_money</span>
                    <span>Financeiro</span>
                </button>
                 <button 
                    onClick={() => { onNavigate('team'); onClose(); }}
                    className={navItemClass(currentView === 'team')}
                >
                    <span className="material-symbols-outlined text-[20px]">diversity_3</span>
                    <span>Equipe</span>
                </button>
            </div>

            <div>
                <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Estúdio Criativo (IA)</p>
                <button 
                    onClick={() => { onNavigate('create'); onClose(); }}
                    className={navItemClass(currentView === 'create')}
                >
                    <span className="material-symbols-outlined text-[20px] text-fuchsia-400">view_carousel</span>
                    <span>Carrossel Glass</span>
                </button>

                <button 
                    onClick={() => { onNavigate('creative'); onClose(); }}
                    className={navItemClass(currentView === 'creative')}
                >
                    <span className="material-symbols-outlined text-[20px] text-purple-400">photo_library</span>
                    <span>Criativos Ads</span>
                </button>

                <button 
                    onClick={() => { onNavigate('motion'); onClose(); }}
                    className={navItemClass(currentView === 'motion')}
                >
                    <span className="material-symbols-outlined text-[20px] text-cyan-400">movie_filter</span>
                    <span>Motion Studio</span>
                </button>
            </div>
          </nav>

          {/* Sidebar Footer: Tokens */}
          <div className="p-4 mt-auto border-t border-white/5 bg-[#0f172a]">
            <div className="flex justify-between items-end mb-2">
                <span className="text-xs text-slate-400 font-medium">Tokens IA</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">{credits} / 1000</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${(credits / 1000) * 100}%` }}
                ></div>
            </div>
          </div>
        </aside>
    </>
  );
};

export default Sidebar;
