
import React from 'react';
import { Project } from '../types';

const ProjectsView: React.FC = () => {
    const projects: Project[] = [
        { id: '1', name: 'E-commerce Redesign', client: 'Moda Fashion', progress: 75, status: 'active', deadline: '15/12/2024', members: ['Lucas', 'Ana'] },
        { id: '2', name: 'App Delivery MVP', client: 'FastFood X', progress: 30, status: 'active', deadline: '20/01/2025', members: ['Ricardo'] },
        { id: '3', name: 'Identidade Visual', client: 'Advocacia Silva', progress: 90, status: 'review', deadline: 'Hoje', members: ['Ana'] },
        { id: '4', name: 'Automação CRM', client: 'Imobiliária Top', progress: 10, status: 'blocked', deadline: 'Indefinido', members: ['Lucas', 'Ricardo'] },
        { id: '5', name: 'Landing Page Black Friday', client: 'Tech Store', progress: 100, status: 'completed', deadline: 'Entregue', members: ['Ana', 'Lucas'] },
    ];

    const getStatusColor = (status: Project['status']) => {
        switch (status) {
            case 'active': return 'bg-blue-500 text-blue-100 border-blue-500/20';
            case 'review': return 'bg-yellow-500 text-yellow-100 border-yellow-500/20';
            case 'completed': return 'bg-emerald-500 text-emerald-100 border-emerald-500/20';
            case 'blocked': return 'bg-red-500 text-red-100 border-red-500/20';
            default: return 'bg-slate-500';
        }
    };

    const getStatusLabel = (status: Project['status']) => {
        switch (status) {
            case 'active': return 'Em Execução';
            case 'review': return 'Em Revisão';
            case 'completed': return 'Concluído';
            case 'blocked': return 'Bloqueado';
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#0f172a] text-slate-200">
            <header className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#1e293b]/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-lg">folder_open</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Meus Projetos</h2>
                        <p className="text-[10px] text-slate-400">Acompanhamento de entregas</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                        <input type="text" placeholder="Filtrar projetos..." className="bg-[#0f172a] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none w-48" />
                    </div>
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all">
                        <span className="material-symbols-outlined text-sm align-middle mr-1">filter_list</span>
                        Filtros
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <div key={project.id} className="bg-[#1e293b] rounded-xl border border-white/5 p-5 hover:border-white/20 transition-all group relative overflow-hidden">
                            {/* Status Badge */}
                            <div className={`absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded border ${getStatusColor(project.status)} bg-opacity-10 border-opacity-30`}>
                                {getStatusLabel(project.status)}
                            </div>

                            <div className="mb-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center mb-3 shadow-lg">
                                    <span className="material-symbols-outlined text-white">rocket_launch</span>
                                </div>
                                <h3 className="font-bold text-white text-lg leading-tight group-hover:text-blue-400 transition-colors">{project.name}</h3>
                                <p className="text-xs text-slate-400">{project.client}</p>
                            </div>

                            {/* Progress */}
                            <div className="mb-4">
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                    <span>Progresso</span>
                                    <span>{project.progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${project.status === 'blocked' ? 'bg-red-500' : project.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                <div className="flex -space-x-2">
                                    {project.members.map((member, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border border-[#1e293b] flex items-center justify-center text-[8px] text-white" title={member}>
                                            {member[0]}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                    {project.deadline}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add New Project Card */}
                    <div className="border-2 border-dashed border-white/5 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 hover:border-white/10 transition-all group">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <span className="material-symbols-outlined text-slate-500 group-hover:text-primary">add</span>
                        </div>
                        <span className="text-sm font-bold text-slate-500 group-hover:text-white">Novo Projeto</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectsView;
