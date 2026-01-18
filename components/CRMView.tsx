
import React, { useState } from 'react';
import { useAgency } from '../context/AgencyContext';
import { Lead } from '../types';

const CRMView: React.FC = () => {
    const { leads, addLead, updateLead } = useAgency();
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formCompany, setFormCompany] = useState('');
    const [formContact, setFormContact] = useState('');
    const [formValue, setFormValue] = useState('');
    const [formStatus, setFormStatus] = useState<Lead['status']>('new');

    const columns = [
        { id: 'new', label: 'Novos Leads', color: 'bg-blue-500' },
        { id: 'contacted', label: 'Em Contato', color: 'bg-purple-500' },
        { id: 'proposal', label: 'Proposta Enviada', color: 'bg-yellow-500' },
        { id: 'negotiation', label: 'Em Negociação', color: 'bg-orange-500' },
        { id: 'closed', label: 'Fechado', color: 'bg-emerald-500' },
    ];

    const handleCreateLead = () => {
        if(!formCompany) return;
        const newLead: Lead = {
            id: Date.now().toString(),
            companyName: formCompany,
            contactPerson: formContact,
            value: parseFloat(formValue) || 0,
            status: formStatus,
            lastContact: 'Agora',
            probability: formStatus === 'new' ? 10 : formStatus === 'proposal' ? 50 : 80
        };
        addLead(newLead);
        setIsModalOpen(false);
        setFormCompany('');
        setFormContact('');
        setFormValue('');
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("leadId", id);
    };

    const handleDrop = (e: React.DragEvent, status: Lead['status']) => {
        const id = e.dataTransfer.getData("leadId");
        const lead = leads.find(l => l.id === id);
        if(lead) {
            updateLead({ ...lead, status });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const exportCSV = () => {
        const headers = ["Empresa", "Contato", "Valor", "Status", "Último Contato"];
        const rows = leads.map(l => [l.companyName, l.contactPerson, l.value.toString(), l.status, l.lastContact]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = "crm_leads.csv";
        link.click();
    };

    return (
        <div className="flex flex-col h-full overflow-hidden text-slate-200">
            
            {/* New Lead Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1e1b2e] border border-white/10 rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Novo Lead</h3>
                        <div className="space-y-3">
                            <input className="w-full glass-input rounded-lg p-2 text-sm" placeholder="Nome da Empresa" value={formCompany} onChange={e => setFormCompany(e.target.value)} />
                            <input className="w-full glass-input rounded-lg p-2 text-sm" placeholder="Pessoa de Contato" value={formContact} onChange={e => setFormContact(e.target.value)} />
                            <input className="w-full glass-input rounded-lg p-2 text-sm" type="number" placeholder="Valor Estimado (R$)" value={formValue} onChange={e => setFormValue(e.target.value)} />
                            <select className="w-full glass-input rounded-lg p-2 text-sm bg-[#0f0c1d]" value={formStatus} onChange={e => setFormStatus(e.target.value as any)}>
                                <option value="new">Novo</option>
                                <option value="contacted">Contatado</option>
                                <option value="proposal">Proposta</option>
                            </select>
                            <button onClick={handleCreateLead} className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded-lg font-bold text-white mt-2">Criar Lead</button>
                            <button onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 hover:text-white text-xs mt-2">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

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
                <div className="flex gap-2">
                    <button onClick={exportCSV} className="glass-panel-light hover:bg-white/10 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all">
                        <span className="material-symbols-outlined text-sm align-middle mr-1">download</span>
                        CSV
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20">
                        <span className="material-symbols-outlined text-sm">add</span>
                        Novo Lead
                    </button>
                </div>
            </header>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
                <div className="flex gap-4 h-full min-w-max">
                    {columns.map(col => (
                        <div 
                            key={col.id} 
                            className="w-[300px] flex flex-col h-full glass-panel rounded-xl border border-white/5"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id as any)}
                        >
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
                                    <div 
                                        key={lead.id} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, lead.id)}
                                        className="glass-panel-light p-3 rounded-lg hover:bg-white/10 transition-all cursor-grab active:cursor-grabbing group shadow-sm border border-transparent hover:border-white/10"
                                    >
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
                                <button onClick={() => setIsModalOpen(true)} className="w-full py-2 border border-dashed border-white/10 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-1">
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
