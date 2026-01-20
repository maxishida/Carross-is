import React, { useState, useMemo } from 'react';
import { AgencyTask, TeamMember } from '../types';
import { useAgency } from '../context/AgencyContext';

const TasksView: React.FC = () => {
    const { tasks, team, addTask, updateTask, deleteTask, addToast } = useAgency();
    
    // View State
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<AgencyTask | null>(null);

    // Form State
    const [formTitle, setFormTitle] = useState('');
    const [formClient, setFormClient] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [formStatus, setFormStatus] = useState<'backlog' | 'progress' | 'done'>('backlog');
    const [formDeadline, setFormDeadline] = useState('');
    const [formMembers, setFormMembers] = useState<string[]>([]);

    // --- HANDLERS ---

    const handleOpenCreate = () => {
        setEditingTask(null);
        setFormTitle('');
        setFormClient('');
        setFormDesc('');
        setFormPriority('medium');
        setFormStatus('backlog');
        setFormDeadline('');
        setFormMembers([]);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (task: AgencyTask) => {
        setEditingTask(task);
        setFormTitle(task.title);
        setFormClient(task.client);
        setFormDesc(task.description || '');
        setFormPriority(task.priority);
        setFormStatus(task.status);
        setFormDeadline(task.deadline || '');
        setFormMembers(task.teamMembers);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            deleteTask(id);
            addToast('Tarefa removida.', 'success');
        }
    };

    const handleSave = () => {
        if (!formTitle.trim()) {
            addToast('O título é obrigatório.', 'error');
            return;
        }

        const taskData: AgencyTask = {
            id: editingTask ? editingTask.id : Date.now().toString(),
            title: formTitle,
            client: formClient || 'Interno',
            description: formDesc,
            priority: formPriority,
            status: formStatus,
            deadline: formDeadline || undefined,
            teamMembers: formMembers,
            notificationSent: editingTask ? editingTask.notificationSent : false,
            estimatedHours: editingTask ? editingTask.estimatedHours : 4,
            isBlocked: editingTask ? editingTask.isBlocked : false
        };

        if (editingTask) {
            updateTask(taskData);
            addToast('Tarefa atualizada!', 'success');
        } else {
            addTask(taskData);
            addToast('Nova tarefa criada!', 'success');
        }
        setIsModalOpen(false);
    };

    const toggleMember = (memberId: string) => {
        setFormMembers(prev => 
            prev.includes(memberId) 
                ? prev.filter(id => id !== memberId) 
                : [...prev, memberId]
        );
    };

    // --- FILTERS & SORTING ---

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  t.client.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
            return matchesSearch && matchesPriority;
        });
    }, [tasks, searchQuery, filterPriority]);

    // --- HELPERS ---

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'high': return <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Alta</span>;
            case 'medium': return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Média</span>;
            case 'low': return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Baixa</span>;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden text-slate-200">
            
            {/* --- MODAL DE CRIAÇÃO/EDIÇÃO --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1e1b2e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#151221] shrink-0">
                            <h3 className="text-xl font-bold text-white">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-lg"></i></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                            {/* Title & Client */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Título</label>
                                    <input className="w-full glass-input rounded-lg p-3 text-sm" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Criar Landing Page" autoFocus />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Cliente / Projeto</label>
                                    <input className="w-full glass-input rounded-lg p-3 text-sm" value={formClient} onChange={e => setFormClient(e.target.value)} placeholder="Ex: GreenEnergy" />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
                                <textarea className="w-full glass-input rounded-lg p-3 text-sm h-24 resize-none" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Detalhes da tarefa..." />
                            </div>

                            {/* Config Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Prioridade</label>
                                    <select className="w-full glass-input rounded-lg p-3 text-sm bg-[#0f0c1d]" value={formPriority} onChange={e => setFormPriority(e.target.value as any)}>
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high">Alta</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Status</label>
                                    <select className="w-full glass-input rounded-lg p-3 text-sm bg-[#0f0c1d]" value={formStatus} onChange={e => setFormStatus(e.target.value as any)}>
                                        <option value="backlog">Backlog</option>
                                        <option value="progress">Em Progresso</option>
                                        <option value="done">Concluído</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Prazo</label>
                                    <input type="datetime-local" className="w-full glass-input rounded-lg p-3 text-sm invert-calendar-icon" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} />
                                </div>
                            </div>

                            {/* Team Assignment */}
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block">Responsáveis</label>
                                <div className="flex flex-wrap gap-2 bg-black/20 p-3 rounded-xl border border-white/5">
                                    {team.map(member => (
                                        <button
                                            key={member.id}
                                            onClick={() => toggleMember(member.id)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${formMembers.includes(member.id) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                        >
                                            <img src={member.avatar} className="w-4 h-4 rounded-full" />
                                            {member.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-[#151221] flex justify-end gap-3 shrink-0">
                            {editingTask && (
                                <button onClick={() => { handleDelete(editingTask.id); setIsModalOpen(false); }} className="text-red-400 hover:text-red-300 text-xs font-bold px-4 py-2 mr-auto">
                                    <i className="fa-solid fa-trash mr-2"></i> Excluir
                                </button>
                            )}
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm font-bold">Cancelar</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold shadow-lg">Salvar Tarefa</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4 border-b border-white/5 bg-transparent backdrop-blur-sm shrink-0 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                        <span className="material-symbols-outlined text-white text-lg">task_alt</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Gestão de Tarefas</h2>
                        <p className="text-[10px] text-slate-400">{tasks.filter(t => t.status !== 'done').length} pendentes</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="flex items-center bg-black/20 rounded-lg border border-white/5 px-2 flex-1 md:w-48">
                        <i className="fa-solid fa-search text-slate-500 text-xs ml-1"></i>
                        <input 
                            className="bg-transparent border-none text-xs text-white p-2 focus:ring-0 w-full placeholder:text-slate-600"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter Priority */}
                    <select 
                        className="bg-black/20 text-white text-xs border border-white/5 rounded-lg px-3 py-2 outline-none focus:border-white/20"
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
                    >
                        <option value="all">Todas Prioridades</option>
                        <option value="high">Alta</option>
                        <option value="medium">Média</option>
                        <option value="low">Baixa</option>
                    </select>

                    {/* View Toggle */}
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
                        <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded transition-colors ${viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                            <i className="fa-solid fa-border-all"></i>
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                            <i className="fa-solid fa-list"></i>
                        </button>
                    </div>

                    <button onClick={handleOpenCreate} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2">
                        <i className="fa-solid fa-plus"></i> Nova Tarefa
                    </button>
                </div>
            </header>

            {/* --- CONTENT --- */}
            <div className="flex-1 overflow-hidden p-6">
                
                {viewMode === 'kanban' ? (
                    <div className="flex gap-6 h-full overflow-x-auto pb-2">
                        {['backlog', 'progress', 'done'].map(status => (
                            <div key={status} className="flex-1 min-w-[300px] flex flex-col bg-white/[0.02] rounded-xl border border-white/5">
                                {/* Column Header */}
                                <div className={`p-3 border-b border-white/5 flex justify-between items-center ${status === 'done' ? 'bg-emerald-500/5' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${status === 'backlog' ? 'bg-slate-500' : status === 'progress' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                        <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                                            {status === 'backlog' ? 'A Fazer' : status === 'progress' ? 'Em Andamento' : 'Concluído'}
                                        </h3>
                                    </div>
                                    <span className="text-xs bg-black/30 px-2 py-0.5 rounded text-slate-400 font-mono">
                                        {filteredTasks.filter(t => t.status === status).length}
                                    </span>
                                </div>

                                {/* Cards */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                    {filteredTasks.filter(t => t.status === status).map(task => (
                                        <div 
                                            key={task.id} 
                                            onClick={() => handleOpenEdit(task)}
                                            className={`glass-panel-light p-4 rounded-lg cursor-pointer hover:bg-white/10 transition-all group border-l-2 ${task.priority === 'high' ? 'border-l-red-500' : task.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs text-slate-400 font-bold uppercase">{task.client}</span>
                                                <button className="text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-pencil"></i></button>
                                            </div>
                                            <h4 className={`text-sm font-bold text-white mb-3 ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>{task.title}</h4>
                                            
                                            <div className="flex justify-between items-center">
                                                <div className="flex -space-x-2">
                                                    {task.teamMembers.map(mId => {
                                                        const member = team.find(m => m.id === mId);
                                                        return member ? (
                                                            <img key={mId} src={member.avatar} className="w-6 h-6 rounded-full border border-[#1e1b2e]" title={member.name} />
                                                        ) : null;
                                                    })}
                                                </div>
                                                {task.deadline && (
                                                    <span className={`text-[10px] flex items-center gap-1 ${new Date(task.deadline) < new Date() && task.status !== 'done' ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                                                        <i className="fa-regular fa-clock"></i>
                                                        {new Date(task.deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => { setFormStatus(status as any); handleOpenCreate(); }}
                                        className="w-full py-2 border border-dashed border-white/10 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        + Adicionar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-xs text-slate-400 uppercase font-bold border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Tarefa</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Prioridade</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Responsáveis</th>
                                    <th className="px-6 py-4 text-right">Prazo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {filteredTasks.map(task => (
                                    <tr key={task.id} onClick={() => handleOpenEdit(task)} className="hover:bg-white/5 transition-colors cursor-pointer">
                                        <td className="px-6 py-4 font-bold text-white">{task.title}</td>
                                        <td className="px-6 py-4 text-slate-400">{task.client}</td>
                                        <td className="px-6 py-4">{getPriorityBadge(task.priority)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-opacity-10 border-opacity-30 ${task.status === 'done' ? 'bg-emerald-500 text-emerald-400 border-emerald-500' : task.status === 'progress' ? 'bg-blue-500 text-blue-400 border-blue-500' : 'bg-slate-500 text-slate-300 border-slate-500'}`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {task.teamMembers.map(mId => {
                                                    const member = team.find(m => m.id === mId);
                                                    return member ? (
                                                        <img key={mId} src={member.avatar} className="w-6 h-6 rounded-full border border-white/10" title={member.name} />
                                                    ) : null;
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs font-mono text-slate-400">
                                            {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TasksView;