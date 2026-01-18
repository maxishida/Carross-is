
import React from 'react';
import { Lead } from '../types';

const CRMView: React.FC = () => {
    // Mock Leads
    const leads: Lead[] = [
        { id: '1', companyName: 'TechStart Inc', contactPerson: 'Roberto Almeida', value: 12500, status: 'new', lastContact: '2h atrás', probability: 20 },
        { id: '2', companyName: 'Dr. Consultório', contactPerson: 'Ana Silva', value: 4800, status: 'proposal', lastContact: '1d atrás', probability: 60 },
        { id: '3', companyName: 'Mega Varejo', contactPerson: 'Carlos Sousa', value: 25000, status: 'negotiation', lastContact: '30min atrás', probability: 85 },
        { id: '4', companyName: 'Café Gourmet', contactPerson: 'Mariana Costa', value: 3200, status: 'closed', lastContact: 'Ontem', probability: 100 },
        { id: '5', companyName: 'Logística Rápida', contactPerson: 'Pedro Santos', value: 15000, status: 'contacted', lastContact: '4h atrás', probability: 40 },
    ];

    const columns = [
        { id: 'new', label: 'Novos Leads', color: 'bg-blue-500' },
        { id: 'contacted', label: 'Em Contato', color: 'bg-purple-500' },
        { id: 'proposal', label: 'Proposta Enviada', color: 'bg-yellow-500' },
        { id: 'negotiation', label: 'Em Negociação', color: 'bg-orange-500' },
        { id: 'closed', label: 'Fechado', color: 'bg-emerald-500' },
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden text-slate-200">
            {/* Header */}
            <header className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-transparent backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <span className="material-symbols-outlined text-white text-lg">group</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">CRM & Pipeline</h2>
                        <p className="text-[10px] text-slate-400">Gerencie leads e negociações</p>
                    </div>
                </div>
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Novo Lead
                </button>
            </header>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
                <div className="flex gap-4 h-full min-w-max">
                    {columns.map(col => (
                        <div key={col.id} className="w-[300px] flex flex-col h-full glass-panel rounded-xl border border-white/5">
                            {/* Column Header */}
                            <div className={`p-3 border-b border-white/5 flex justify-between items-center ${col.id === 'closed' ? 'bg-emerald-500/5' : 'bg-white/5'}`}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${col.color} shadow-[0_0_8px_currentColor]`}></div>
                                    <h3 className="font-bold text-sm text-white">{col.label}</h3>
                                </div>
                                <span className="text-xs text-slate-400 font-mono bg-black/20 px-1.5 rounded">
                                    {leads.filter(l => l.status === col.id).length}
                                </span>
                            </div>

                            {/* Cards Container */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2">
                                {leads.filter(l => l.status === col.id).map(lead => (
                                    <div key={lead.id} className="glass-panel-light p-3 rounded-lg hover:bg-white/10 transition-all cursor-grab active:cursor-grabbing group shadow-sm border border-transparent hover:border-white/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">{lead.companyName}</span>
                                            <button className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-[14px]">more_horiz</span></button>
                                        </div>
                                        <div className="flex items-center gap-1 mb-3 text-slate-400">
                                            <span className="material-symbols-outlined text-[12px]">person</span>
                                            <span className="text-[10px]">{lead.contactPerson}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                                            <span className="text-xs font-mono font-bold text-emerald-400">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                                            </span>
                                            <div className="flex items-center gap-1" title="Probabilidade">
                                                <div className="w-10 h-1 bg-black/40 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${lead.probability > 70 ? 'bg-emerald-500' : lead.probability > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${lead.probability}%`}}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-slate-500 mt-1 text-right italic">{lead.lastContact}</p>
                                    </div>
                                ))}
                                <button className="w-full py-2 border border-dashed border-white/10 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">add</span> Adicionar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CRMView;
