
import React from 'react';
import { TeamMember } from '../types';

const TeamView: React.FC = () => {
    const team: TeamMember[] = [
        { id: '1', name: 'Lucas Dev', role: 'Engenheiro Full Stack', avatar: 'https://ui-avatars.com/api/?name=Lucas&background=random', activeProjects: 3, workload: 85, status: 'busy' },
        { id: '2', name: 'Ana Designer', role: 'UX / UI Lead', avatar: 'https://ui-avatars.com/api/?name=Ana&background=random', activeProjects: 4, workload: 92, status: 'online' },
        { id: '3', name: 'Ricardo Ops', role: 'DevOps & Cloud', avatar: 'https://ui-avatars.com/api/?name=Ricardo&background=random', activeProjects: 2, workload: 40, status: 'offline' },
        { id: '4', name: 'Mariana Copy', role: 'Copywriter Sênior', avatar: 'https://ui-avatars.com/api/?name=Mariana&background=random', activeProjects: 1, workload: 25, status: 'online' },
    ];

    const getStatusColor = (status: TeamMember['status']) => {
        switch(status) {
            case 'online': return 'bg-emerald-500';
            case 'busy': return 'bg-red-500';
            case 'offline': return 'bg-slate-500';
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#0f172a] text-slate-200">
            <header className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#1e293b]/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-lg">diversity_3</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Equipe</h2>
                        <p className="text-[10px] text-slate-400">Gestão de talentos e capacidade</p>
                    </div>
                </div>
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    Convidar
                </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {team.map(member => (
                        <div key={member.id} className="bg-[#1e293b] rounded-xl border border-white/5 p-6 flex flex-col items-center text-center hover:border-white/20 transition-all group">
                            <div className="relative mb-3">
                                <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full border-4 border-[#0f172a]" />
                                <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#1e293b] ${getStatusColor(member.status)}`}></div>
                            </div>
                            
                            <h3 className="font-bold text-white text-lg">{member.name}</h3>
                            <p className="text-sm text-slate-400 mb-4">{member.role}</p>
                            
                            <div className="w-full bg-[#0f172a] rounded-lg p-3 flex flex-col gap-3">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Projetos Ativos</span>
                                    <span className="text-white font-bold">{member.activeProjects}</span>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Ocupação (Workload)</span>
                                        <span className={`${member.workload > 80 ? 'text-red-400' : 'text-emerald-400'}`}>{member.workload}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${member.workload > 80 ? 'bg-red-500' : member.workload > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${member.workload}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <button className="mt-4 w-full py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-bold text-slate-300 transition-colors">
                                Ver Perfil
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeamView;
