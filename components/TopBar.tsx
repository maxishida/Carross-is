import React from 'react';

interface TopBarProps {
    onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  return (
    <header className="h-16 flex items-center justify-between whitespace-nowrap border-b border-white/10 bg-[#020617]/50 backdrop-blur-xl px-6 z-20 sticky top-0 shrink-0 shadow-lg relative">
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>
      
      <div className="flex items-center gap-6">
        <div className="md:hidden text-white cursor-pointer hover:text-primary transition-colors" onClick={onMenuClick}>
          <span className="material-symbols-outlined">menu</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
            <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
          </div>
          <h2 className="text-white text-lg font-bold font-display leading-tight tracking-tight hidden sm:block">
            Painel de Experiências
          </h2>
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-slate-300 text-xs font-medium gap-2">
            <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
            </span>
            Sistema Online
        </div>
        
        {/* Icons */}
        <div className="flex items-center gap-2">
          <button className="relative flex items-center justify-center size-9 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-400 hover:text-white transition-all">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-background-dark shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;