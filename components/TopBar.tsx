import React from 'react';

interface TopBarProps {
    onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 z-20 sticky top-0 shrink-0">
      <div className="flex items-center gap-6">
        <div className="md:hidden text-slate-900 dark:text-white cursor-pointer" onClick={onMenuClick}>
          <span className="material-symbols-outlined">menu</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="size-8 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold font-display leading-tight tracking-tight hidden sm:block">Painel de Experiências</h2>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="hidden md:flex items-center w-64 lg:w-96 rounded-xl bg-slate-100 dark:bg-surface-dark border border-transparent focus-within:border-primary/50 transition-all h-10 px-3">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
          <input className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 ml-2" placeholder="Pesquisar projetos..." type="text"/>
        </div>
        {/* Icons */}
        <div className="flex items-center gap-2">
          <button className="relative flex items-center justify-center size-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
