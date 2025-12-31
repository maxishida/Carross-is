import React from 'react';

interface SidebarProps {
  onNavigate: (view: 'dashboard' | 'create' | 'creative') => void;
  currentView: 'dashboard' | 'create' | 'creative';
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentView }) => {
  return (
    <aside className="w-[280px] hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark h-full shrink-0">
      <div className="flex flex-col h-full justify-between p-4">
        <div className="flex flex-col gap-6">
          {/* User Profile */}
          <div className="flex items-center gap-3 px-2">
            <div className="bg-center bg-no-repeat bg-cover rounded-full size-12 shrink-0 border-2 border-primary" 
                 style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA9nA-3U0hBm-n8lwOsBjFSRIiHtv4o5FiNDUIFwySkJ9L7wNkr5e_BOcLbAsCAjZj0JE0sNH1V7hyovL5QldP4mYcBSYyhPOfT4EwFTDm0YgctWoUGk4uGqZXmVzCB9dOkhIMlsawDFxYqLlE-6pWEKvPs020u-0n-1HnWttuZxBD86lPlJ0KuI9jQOeGZjcLzKFmkot5JZTiOO8mQHPP8KY195g6B3N-kEGPwTUuy6cjEkLfVl31-5foGo7Lsz_WqPbM40gvaNNv_")'}}>
            </div>
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-slate-900 dark:text-white text-lg font-bold font-display leading-tight truncate">Criador Pro</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal truncate">Plano Profissional</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <button 
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-left ${currentView === 'dashboard' ? 'bg-primary/10 dark:bg-surface-dark text-primary dark:text-white border border-primary/20 dark:border-transparent' : 'hover:bg-slate-100 dark:hover:bg-surface-dark text-slate-600 dark:text-slate-400'}`}
            >
              <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${currentView === 'dashboard' ? 'text-primary dark:text-white' : ''}`}>dashboard</span>
              <p className="text-sm font-medium leading-normal">Dashboard</p>
            </button>
            <div className="h-px bg-slate-200 dark:bg-white/5 my-2 mx-4"></div>
            <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ferramentas</h3>
            <button 
                onClick={() => onNavigate('create')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-left ${currentView === 'create' ? 'bg-primary/10 dark:bg-surface-dark text-primary dark:text-white border border-primary/20 dark:border-transparent' : 'hover:bg-slate-100 dark:hover:bg-surface-dark text-slate-600 dark:text-slate-400'}`}
            >
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">view_carousel</span>
              <p className="text-sm font-medium leading-normal">Carrossel IA</p>
            </button>
            <button 
                onClick={() => onNavigate('creative')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-left ${currentView === 'creative' ? 'bg-purple-500/10 dark:bg-surface-dark text-purple-600 dark:text-purple-300 border border-purple-500/20 dark:border-transparent' : 'hover:bg-slate-100 dark:hover:bg-surface-dark text-slate-600 dark:text-slate-400'}`}
            >
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">photo_library</span>
              <p className="text-sm font-medium leading-normal">Criativos (6x)</p>
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-dark text-slate-600 dark:text-slate-400 transition-all text-left">
            <span className="material-symbols-outlined">settings</span>
            <p className="text-sm font-medium leading-normal">Configurações</p>
          </button>
          <div className="px-4 pb-2">
            <div className="p-3 bg-gradient-to-br from-primary to-blue-700 rounded-xl shadow-lg shadow-blue-900/20 text-center">
                <p className="text-white text-xs font-bold mb-1">Tokens Restantes</p>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-1">
                    <div className="w-[75%] h-full bg-white rounded-full"></div>
                </div>
                <p className="text-blue-100 text-[10px]">750 / 1000 créditos</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;