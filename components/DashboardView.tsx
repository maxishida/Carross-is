import React from 'react';

interface DashboardViewProps {
    onCreateClick: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onCreateClick }) => {
  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 fade-in">
      {/* Page Heading & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-bold font-display tracking-tight">Meus Carrosséis</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">Gerencie, edite e publique suas criações de conteúdo.</p>
        </div>
        <button 
            onClick={onCreateClick}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl h-11 px-5 bg-surface-dark hover:bg-slate-700 dark:bg-surface-dark dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Criar Novo</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center bg-white dark:bg-surface-dark p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 w-full xl:w-auto no-scrollbar">
          <button className="flex h-9 shrink-0 items-center justify-center px-4 rounded-lg bg-primary text-white text-sm font-medium transition-colors shadow-lg shadow-primary/20">
            Todos
          </button>
          <button className="flex h-9 shrink-0 items-center justify-center px-4 rounded-lg bg-slate-100 dark:bg-[#161a2c] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors border border-transparent dark:border-slate-700">
            Publicados
          </button>
          <button className="flex h-9 shrink-0 items-center justify-center px-4 rounded-lg bg-slate-100 dark:bg-[#161a2c] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors border border-transparent dark:border-slate-700">
            Rascunhos
          </button>
        </div>
        {/* Inputs */}
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-50 dark:bg-[#161a2c] border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-slate-500 dark:placeholder:text-slate-500" placeholder="Filtrar por nome" type="text"/>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="group flex flex-col bg-white dark:bg-surface-dark rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 cursor-pointer">
          <div className="relative aspect-[4/3] bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBxNWm5Ng1OtfI_v1_QzJZFzNV8L9shkC5LIJWDhCyPn8FWhrxg3AybBcG-XWdnzwlUIxZBtadOOmCLtLCPqs4dYrqjuNbOouSThvqYWWpI0aQvqpoz_Oh1nVzf7s8syHC-poT1-K_dNb6U35NnrXSJd-xCeSJ3ZfjzEyKkmuX5bNN9icM6uInJd1ACzy4bLx_1hWC4prKaPr_CsEnAGPbzxaI3u4aDBF2_VbjEP1XFziKaXgUy0T4toWfdTOqHZsOTsa6Eq_6X8FWe")'}}></div>
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-semibold border border-white/10">Slide 1/8</span>
            </div>
          </div>
          <div className="flex flex-col p-4 gap-3">
            <div className="flex justify-between items-start">
              <div className="overflow-hidden">
                <h3 className="text-slate-900 dark:text-white font-bold font-display text-lg leading-tight truncate">Guia LinkedIn 2024</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Atualizado há 2 horas</p>
              </div>
              <button className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-colors">
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                Publicado
              </span>
              <div className="flex -space-x-2">
                <div className="size-6 rounded-full bg-blue-600 border-2 border-white dark:border-[#1e2130] flex items-center justify-center text-[10px] text-white font-bold">In</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="group flex flex-col bg-white dark:bg-surface-dark rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 cursor-pointer">
          <div className="relative aspect-[4/3] bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCX1yWpxA8v00Uyssgs_b6QWcZcUisFKdkp9h54xufoJ6p0I5Mz-6mU4fgvb3wSBMq1KU2GWlxThZv4ndfVwNd0XytAmTOIpJkeax2YKlvUzxFqnfhpuBVIHDMSCBkCxeSap_Eq8y6yp7Hkxwh679wem3ecZ8LafVpgvycfEOkL54gZGbjqSCSspISceFEMbZPaWE1J6-qF8CD90u1VXZbk0NNgX_WglQYAbRNimUZO27KgORWvHQIysqSQQEEvDJxx1D92hySj_HVz")'}}></div>
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-semibold border border-white/10">Slide 1/5</span>
            </div>
          </div>
          <div className="flex flex-col p-4 gap-3">
            <div className="flex justify-between items-start">
              <div className="overflow-hidden">
                <h3 className="text-slate-900 dark:text-white font-bold font-display text-lg leading-tight truncate">Dicas de Produtividade</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Criado ontem</p>
              </div>
              <button className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-colors">
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium border border-yellow-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5"></span>
                Rascunho
              </span>
            </div>
          </div>
        </div>

        {/* Create New Placeholder */}
        <div 
            onClick={onCreateClick}
            className="group flex flex-col justify-center items-center bg-white dark:bg-surface-dark rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-all cursor-pointer min-h-[300px]"
        >
          <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-primary transition-colors">
            <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[32px]">add_circle</span>
            </div>
            <span className="font-bold text-lg font-display">Criar a partir de Prompt</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
