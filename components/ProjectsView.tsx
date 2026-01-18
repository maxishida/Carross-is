import React, { useState, useRef, useMemo } from 'react';
import { Project, ProjectPhase, LibraryItem } from '../types';
import { useAgency } from '../context/AgencyContext';
import { extractTextFromFile } from '../services/geminiService';

const ProjectsView: React.FC = () => {
    const { projects, addProject, updateProject, team, addToast } = useAgency();
    
    // View Controls
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [sortConfig, setSortConfig] = useState<{ key: 'deadline' | 'progress' | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    // Edit/Create State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'library' | 'settings'>('overview');
    
    // Form State
    const [formName, setFormName] = useState('');
    const [formClient, setFormClient] = useState('');
    const [formDeadline, setFormDeadline] = useState('');
    const [formMembers, setFormMembers] = useState<string[]>([]);
    const [formPhases, setFormPhases] = useState<ProjectPhase[]>([]);
    
    // Finance Form
    const [formBudget, setFormBudget] = useState(0);
    const [formPaymentStatus, setFormPaymentStatus] = useState<'paid' | 'partial' | 'pending'>('pending');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSort = (key: 'deadline' | 'progress') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedProjects = useMemo(() => {
        let sortableItems = [...projects];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (sortConfig.key === 'progress') {
                    return sortConfig.direction === 'asc' 
                        ? a.progress - b.progress 
                        : b.progress - a.progress;
                }
                if (sortConfig.key === 'deadline') {
                    const dateA = new Date(a.deadline).getTime() || 0;
                    const dateB = new Date(b.deadline).getTime() || 0;
                    return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [projects, sortConfig]);

    const handleOpenCreate = () => {
        setEditingProject(null);
        setFormName('');
        setFormClient('');
        setFormDeadline('');
        setFormMembers([]);
        setFormPhases([
            { name: 'Fase 1: Planejamento', status: 'active', progress: 0 },
            { name: 'Fase 2: Desenvolvimento', status: 'pending', progress: 0 }
        ]);
        setFormBudget(0);
        setIsModalOpen(true);
        setActiveTab('overview');
    };

    const handleOpenEdit = (project: Project) => {
        setEditingProject(project);
        setFormName(project.name);
        setFormClient(project.client);
        setFormDeadline(project.deadline);
        setFormMembers(project.members);
        setFormPhases(project.phases || []);
        setFormBudget(project.finance?.totalValue || 0);
        setFormPaymentStatus(project.finance?.paymentStatus || 'pending');
        setIsModalOpen(true);
        setActiveTab('overview');
    };

    const handleSave = () => {
        if (!formName || !formClient) return;

        const projectData: Project = {
            id: editingProject ? editingProject.id : Date.now().toString(),
            name: formName,
            client: formClient,
            deadline: formDeadline || 'Indefinido',
            progress: editingProject ? editingProject.progress : 0,
            status: editingProject ? editingProject.status : 'active',
            members: formMembers,
            phases: formPhases,
            contextFile: editingProject?.contextFile,
            contextFileName: editingProject?.contextFileName,
            library: editingProject?.library || [],
            finance: {
                totalValue: formBudget,
                paymentStatus: formPaymentStatus,
                installments: 1
            }
        };

        if (editingProject) {
            updateProject(projectData);
            addToast('Projeto atualizado!', 'success');
        } else {
            addProject(projectData);
            addToast('Novo projeto criado!', 'success');
        }
        setIsModalOpen(false);
    };

    const handlePhaseChange = (index: number, field: keyof ProjectPhase, value: any) => {
        const newPhases = [...formPhases];
        newPhases[index] = { ...newPhases[index], [field]: value };
        setFormPhases(newPhases);
    };

    const addPhase = () => {
        setFormPhases([...formPhases, { name: `Fase ${formPhases.length + 1}`, status: 'pending', progress: 0 }]);
    };

    const toggleMember = (id: string) => {
        setFormMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Logic for PDF Context (Existing)
        if (!editingProject) return;
        const file = e.target.files?.[0];
        if (file) {
            try {
                const text = await extractTextFromFile(file);
                updateProject({
                    ...editingProject,
                    contextFile: text,
                    contextFileName: file.name
                });
                addToast('PDF anexado ao contexto!', 'success');
            } catch (e) {
                addToast('Erro ao ler arquivo', 'error');
            }
        }
    };

    const handleLibraryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Logic to simulate adding to Library
        if (!editingProject) return;
        const file = e.target.files?.[0];
        if (file) {
            const newItem: LibraryItem = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type.includes('image') ? 'image' : 'doc',
                createdAt: new Date().toISOString().split('T')[0],
                size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
                url: URL.createObjectURL(file)
            };
            const updatedProject = {
                ...editingProject,
                library: [...(editingProject.library || []), newItem]
            };
            updateProject(updatedProject);
            setEditingProject(updatedProject);
            addToast('Arquivo salvo na biblioteca!', 'success');
        }
    };

    const getStatusColor = (status: Project['status']) => {
        switch (status) {
            case 'active': return 'bg-blue-500 text-blue-100 border-blue-500/20';
            case 'review': return 'bg-yellow-500 text-yellow-100 border-yellow-500/20';
            case 'completed': return 'bg-emerald-500 text-emerald-100 border-emerald-500/20';
            case 'blocked': return 'bg-red-500 text-red-100 border-red-500/20';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden text-slate-200">
            
            {/* PROJECT DETAILED MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1e1b2e] border border-white/10 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#151221]">
                            <div>
                                <h3 className="text-xl font-bold text-white">{editingProject ? formName : 'Novo Projeto'}</h3>
                                <p className="text-xs text-slate-400">{formClient}</p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={handleSave} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg">
                                    Salvar Alterações
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white">
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex px-6 bg-[#151221] border-b border-white/5">
                            {['overview', 'tasks', 'library', 'settings'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === tab ? 'border-purple-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                >
                                    {tab === 'overview' ? 'Visão Geral' : tab === 'tasks' ? 'Tarefas' : tab === 'library' ? 'Biblioteca' : 'Configurações'}
                                </button>
                            ))}
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#1e1b2e]">
                            
                            {/* TAB: OVERVIEW */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">Nome do Projeto</label>
                                            <input className="w-full glass-input rounded-lg p-3 text-sm" value={formName} onChange={e => setFormName(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">Cliente</label>
                                            <input className="w-full glass-input rounded-lg p-3 text-sm" value={formClient} onChange={e => setFormClient(e.target.value)} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs text-gray-400 block">Fases de Entrega</label>
                                            <button onClick={addPhase} className="text-[10px] text-emerald-400 hover:text-white"><i className="fa-solid fa-plus"></i> Add</button>
                                        </div>
                                        <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                                            {formPhases.map((phase, idx) => (
                                                <div key={idx} className="flex gap-3 items-center">
                                                    <span className="text-xs text-slate-500 w-4">{idx + 1}.</span>
                                                    <input className="flex-1 glass-input rounded p-2 text-xs" value={phase.name} onChange={e => handlePhaseChange(idx, 'name', e.target.value)} />
                                                    <select className="glass-input rounded p-2 text-xs bg-[#0f0c1d] w-24" value={phase.status} onChange={e => handlePhaseChange(idx, 'status', e.target.value)}>
                                                        <option value="pending">Pendente</option>
                                                        <option value="active">Ativo</option>
                                                        <option value="completed">Feito</option>
                                                    </select>
                                                    <input type="number" className="w-16 glass-input rounded p-2 text-xs text-center" value={phase.progress} onChange={e => handlePhaseChange(idx, 'progress', parseInt(e.target.value))} max={100} />
                                                    <span className="text-xs text-slate-500">%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Context PDF Area */}
                                    <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/10 flex justify-between items-center">
                                        <div>
                                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                <i className="fa-solid fa-file-pdf text-purple-400"></i>
                                                Documentação & Contexto (RAG)
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {editingProject?.contextFileName || 'Nenhum briefing carregado.'}
                                            </p>
                                        </div>
                                        <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors">
                                            Upload PDF
                                        </button>
                                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
                                    </div>
                                </div>
                            )}

                            {/* TAB: LIBRARY */}
                            {activeTab === 'library' && (
                                <div className="h-full flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-white">Arquivos do Projeto</h4>
                                        <div className="relative">
                                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2">
                                                <i className="fa-solid fa-cloud-arrow-up"></i> Upload
                                            </button>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLibraryUpload} />
                                        </div>
                                    </div>
                                    
                                    {/* Files Grid */}
                                    <div className="grid grid-cols-4 gap-4">
                                        {/* Folder Mock */}
                                        <div className="aspect-square bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
                                            <i className="fa-solid fa-folder text-4xl text-yellow-500 mb-2 group-hover:scale-110 transition-transform"></i>
                                            <span className="text-xs text-slate-300 font-medium">Briefings</span>
                                            <span className="text-[10px] text-slate-500">3 arquivos</span>
                                        </div>

                                        {editingProject?.library?.map((item, idx) => (
                                            <div key={idx} className="aspect-square bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col relative group hover:border-purple-500/50 transition-all">
                                                {item.type === 'image' && item.url ? (
                                                    <img src={item.url} className="w-full h-24 object-cover rounded-lg mb-2 opacity-80 group-hover:opacity-100" />
                                                ) : (
                                                    <div className="w-full h-24 bg-black/20 rounded-lg mb-2 flex items-center justify-center">
                                                        <i className={`fa-solid ${item.type === 'doc' ? 'fa-file-lines text-blue-400' : 'fa-image text-purple-400'} text-2xl`}></i>
                                                    </div>
                                                )}
                                                <span className="text-xs text-white truncate font-medium">{item.name}</span>
                                                <span className="text-[10px] text-slate-500">{item.size} • {item.createdAt}</span>
                                                
                                                <button className="absolute top-2 right-2 bg-black/60 p-1.5 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <i className="fa-solid fa-download text-xs"></i>
                                                </button>
                                            </div>
                                        ))}
                                        
                                        {(!editingProject?.library || editingProject.library.length === 0) && (
                                            <div className="col-span-4 text-center py-10 text-slate-500 border-2 border-dashed border-white/5 rounded-xl">
                                                Nenhum arquivo na biblioteca. Faça upload de entregáveis aqui.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB: SETTINGS (Finance & Team) */}
                            {activeTab === 'settings' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    
                                    {/* Team Management */}
                                    <div className="bg-black/20 p-5 rounded-xl border border-white/5">
                                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-users text-blue-400"></i> Gerenciar Equipe
                                        </h4>
                                        <div className="flex gap-2 flex-wrap mb-4">
                                            {team.map(member => (
                                                <button 
                                                    key={member.id}
                                                    onClick={() => toggleMember(member.id)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${formMembers.includes(member.id) ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                                >
                                                    <img src={member.avatar} className="w-5 h-5 rounded-full" />
                                                    {member.name}
                                                    {formMembers.includes(member.id) && <i className="fa-solid fa-check ml-1"></i>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Finance Management */}
                                    <div className="bg-black/20 p-5 rounded-xl border border-white/5">
                                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-coins text-yellow-400"></i> Financeiro do Projeto
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-400 mb-1 block">Valor Total (R$)</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full glass-input rounded-lg p-3 text-lg font-mono text-emerald-400 font-bold" 
                                                    value={formBudget} 
                                                    onChange={e => setFormBudget(Number(e.target.value))} 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400 mb-1 block">Status do Pagamento</label>
                                                <select 
                                                    className="w-full glass-input rounded-lg p-3 bg-[#0f0c1d]"
                                                    value={formPaymentStatus}
                                                    onChange={e => setFormPaymentStatus(e.target.value as any)}
                                                >
                                                    <option value="pending">Pendente</option>
                                                    <option value="partial">Parcial</option>
                                                    <option value="paid">Pago</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                                            <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-xs mt-0.5"></i>
                                            <p className="text-[10px] text-yellow-200">
                                                Alterações aqui impactam o módulo financeiro e a previsão de receita no Dashboard.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="pt-4 border-t border-white/5">
                                        <button className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-2">
                                            <i className="fa-solid fa-trash"></i> Arquivar Projeto
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: TASKS (Placeholder for now) */}
                            {activeTab === 'tasks' && (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                                    <i className="fa-solid fa-list-check text-4xl mb-3 opacity-50"></i>
                                    <p className="text-sm">Integração com quadro Kanban em breve.</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4 border-b border-white/5 bg-transparent backdrop-blur-sm shrink-0 gap-4 md:gap-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="material-symbols-outlined text-white text-lg">folder_open</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Meus Projetos</h2>
                        <p className="text-[10px] text-slate-400">Acompanhamento de entregas</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* View Toggle */}
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <i className="fa-solid fa-grid-2"></i>
                        </button>
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <i className="fa-solid fa-list"></i>
                        </button>
                    </div>

                    <button onClick={handleOpenCreate} className="glass-panel-light hover:bg-white/10 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center bg-blue-600/20 border-blue-500/30">
                        <span className="material-symbols-outlined text-sm align-middle mr-1">add</span>
                        Novo Projeto
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                
                {viewMode === 'table' ? (
                    <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-xs text-slate-400 uppercase font-bold border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Projeto</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('progress')}>
                                        Progresso <i className={`fa-solid fa-sort${sortConfig.key === 'progress' ? (sortConfig.direction === 'asc' ? '-up' : '-down') : ''} ml-1`}></i>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('deadline')}>
                                        Deadline <i className={`fa-solid fa-sort${sortConfig.key === 'deadline' ? (sortConfig.direction === 'asc' ? '-up' : '-down') : ''} ml-1`}></i>
                                    </th>
                                    <th className="px-6 py-4 text-right">Equipe</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {sortedProjects.map(project => (
                                    <tr key={project.id} onClick={() => handleOpenEdit(project)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4 font-bold text-white">
                                            {project.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {project.client}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getStatusColor(project.status)} bg-opacity-10 border-opacity-30`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 w-48">
                                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                <span>{project.progress}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full bg-blue-500`} style={{ width: `${project.progress}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                                            {project.deadline}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex -space-x-2 justify-end">
                                                {project.members.map((mId, i) => {
                                                    const mem = team.find(t => t.id === mId);
                                                    return mem ? (
                                                        <div key={i} className="w-6 h-6 rounded-full border border-white/10 overflow-hidden" title={mem.name}>
                                                             <img src={mem.avatar} className="w-full h-full object-cover"/>
                                                        </div>
                                                    ) : null;
                                                })}
                                                {project.members.length === 0 && <span className="text-slate-600 text-xs">-</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {sortedProjects.map(project => (
                            <div key={project.id} onClick={() => handleOpenEdit(project)} className="glass-panel rounded-xl p-5 hover:border-white/20 transition-all group relative overflow-hidden hover:translate-y-[-2px] cursor-pointer">
                                {/* Status Badge */}
                                <div className={`absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded border ${getStatusColor(project.status)} bg-opacity-10 border-opacity-30`}>
                                    {project.status}
                                </div>

                                <div className="mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center mb-3 shadow-lg border border-white/10">
                                        <span className="material-symbols-outlined text-white">rocket_launch</span>
                                    </div>
                                    <h3 className="font-bold text-white text-lg leading-tight group-hover:text-blue-400 transition-colors">{project.name}</h3>
                                    <p className="text-xs text-slate-400">{project.client}</p>
                                </div>

                                {/* Phases Progress */}
                                <div className="mb-4 space-y-2">
                                    {project.phases.slice(0, 2).map((phase, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                                <span>{phase.name}</span>
                                                <span>{phase.progress}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full bg-blue-500`} style={{ width: `${phase.progress}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                    <div className="flex -space-x-2">
                                        {project.members.map((mId, i) => {
                                            const mem = team.find(t => t.id === mId);
                                            return mem ? (
                                                <div key={i} className="w-6 h-6 rounded-full border border-white/10 overflow-hidden">
                                                     <img src={mem.avatar} className="w-full h-full object-cover"/>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                        {project.deadline}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Add New Project Card */}
                        <div onClick={handleOpenCreate} className="border-2 border-dashed border-white/5 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 hover:border-white/10 transition-all group min-h-[200px]">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <span className="material-symbols-outlined text-slate-500 group-hover:text-primary">add</span>
                            </div>
                            <span className="text-sm font-bold text-slate-500 group-hover:text-white">Novo Projeto</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsView;