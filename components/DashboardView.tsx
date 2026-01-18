
import React from 'react';

interface DashboardViewProps {
    onCreateClick: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onCreateClick }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Header Section */}
        <header className="flex justify-between items-center px-8 py-6 relative z-10 shrink-0">
            <h2 className="text-3xl font-medium tracking-tight text-white drop-shadow-md font-display">Meus Carrosséis</h2>
            {/* Action Button */}
            <button 
                onClick={onCreateClick}
                className="px-6 py-2.5 rounded-xl bg-white/10 border border-white/30 text-sm font-semibold text-white hover:bg-white/20 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(76,201,240,0.4)] transition-all flex items-center gap-2 backdrop-blur-md"
            >
                <i className="fa-solid fa-plus text-xs"></i>
                Criar Novo
            </button>
        </header>

        {/* Toolbar: Tabs and Search */}
        <div className="px-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 shrink-0">
            {/* Tabs */}
            <div className="flex p-1 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">
                <button className="px-6 py-1.5 rounded-lg text-sm font-medium text-white bg-white/10 border border-white/10 shadow-sm relative overflow-hidden group">
                    <span className="relative z-10">Todos</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/40 to-purple-600/40 opacity-100 group-hover:opacity-80 transition-opacity"></div>
                </button>
                <button className="px-6 py-1.5 rounded-lg text-sm font-medium text-white/60 hover:text-white transition-colors">
                    Publicados
                </button>
                <button className="px-6 py-1.5 rounded-lg text-sm font-medium text-white/60 hover:text-white transition-colors">
                    Rascunhos
                </button>
            </div>
            {/* Search Bar */}
            <div className="relative group w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-magnifying-glass text-white/50 group-focus-within:text-white/80 transition-colors text-xs"></i>
                </div>
                <input 
                    className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-white/20 focus:ring-1 focus:ring-white/20 sm:text-sm transition-all" 
                    placeholder="Filtrar por nome" 
                    type="text"
                />
            </div>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 px-8 pt-2 overflow-y-auto custom-scrollbar relative z-10 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Card 1: LinkedIn Guide */}
                <article className="glass-panel glass-card rounded-3xl p-6 relative overflow-hidden group h-64 flex flex-col justify-between cursor-pointer">
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/40 via-purple-600/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    {/* Top Row */}
                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                            <i className="fa-brands fa-linkedin-in text-2xl text-white"></i>
                        </div>
                        <button className="text-white/70 hover:text-white">
                            <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
                        </button>
                    </div>
                    {/* Bottom Row */}
                    <div className="relative z-10 mt-auto">
                        <h3 className="text-xl font-bold tracking-wide text-white mb-1 leading-snug">Guia LinkedIn<br/>2024</h3>
                        <div className="flex justify-between items-end">
                            <span className="text-xs text-white/60 font-light">Guilets ago</span>
                            <div className="flex gap-1">
                                <span className="w-1 h-1 rounded-full bg-white/50"></span>
                                <span className="w-1 h-1 rounded-full bg-white/50"></span>
                                <span className="w-1 h-1 rounded-full bg-white/50"></span>
                            </div>
                        </div>
                    </div>
                </article>

                {/* Card 2: Productivity Tips */}
                <article className="glass-panel glass-card rounded-3xl p-6 relative overflow-hidden group h-64 flex flex-col justify-between cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/40 via-indigo-600/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                            <i className="fa-regular fa-lightbulb text-2xl text-white"></i>
                        </div>
                        <button className="text-white/70 hover:text-white">
                            <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
                        </button>
                    </div>
                    <div className="relative z-10 mt-auto">
                        <h3 className="text-xl font-bold tracking-wide text-white mb-1 leading-snug">Dicas de<br/>Produtividade</h3>
                        <div className="flex justify-between items-end">
                            <span className="text-xs text-white/60 font-light">Gullars ago</span>
                            <div className="flex gap-1">
                                <span className="w-1 h-1 rounded-full bg-white/50"></span>
                                <span className="w-1 h-1 rounded-full bg-white/50"></span>
                                <span className="w-1 h-1 rounded-full bg-white/50"></span>
                            </div>
                        </div>
                    </div>
                </article>

                {/* Card 3: Create from Prompt (Action Card) */}
                <article 
                    onClick={onCreateClick}
                    className="glass-panel glass-card rounded-3xl p-6 relative overflow-hidden group h-64 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/10 transition-colors" 
                    style={{background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'}}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <i className="fa-solid fa-plus text-2xl text-white"></i>
                    </div>
                    <h3 className="text-lg font-medium text-white/90">Criar a partir<br/>de Prompt</h3>
                </article>

            </div>
        </div>
    </div>
  );
};

export default DashboardView;
