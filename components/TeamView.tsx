import React, { useState } from 'react';
import { TeamMember, Allocation } from '../types';
import { useAgency } from '../context/AgencyContext';
import { chatWithAssistant } from '../services/geminiService';

const TeamView: React.FC = () => {
    const { team, tasks, projects, addTeamMember, updateTeamMember, updateTask, addToast } = useAgency();
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // View Controls
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    
    // Modal Tab State
    const [activeModalTab, setActiveModalTab] = useState<'overview' | 'projects' | 'tasks' | 'skills'>('overview');

    // Form State (New Member)
    const [formName, setFormName] = useState('');
    const [formRole, setFormRole] = useState('');
    const [formBio, setFormBio] = useState('');
    const [formCapacity, setFormCapacity] = useState(40);
    const [formSkills, setFormSkills] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Allocation Form
    const [allocProject, setAllocProject] = useState('');
    const [allocRole, setAllocRole] = useState('');
    const [allocHours, setAllocHours] = useState('');

    const handleOpenMember = (member: TeamMember) => {
        setSelectedMember(member);
        setFormName(member.name);
        setFormRole(member.role);
        setFormBio(member.bio || '');
        setFormSkills(member.skills || []);
        setFormCapacity(member.capacity || 40);
        setIsEditing(false);
        setActiveModalTab('overview');
    };

    const handleNewMember = () => {
        setSelectedMember(null);
        setFormName('');
        setFormRole('');
        setFormBio('');
        setFormCapacity(40);
        setFormSkills([]);
        setIsEditing(true);
    };

    const handleAnalyzeBio = async () => {
        if (!formBio) return;
        setIsAnalyzing(true);
        try {
            const prompt = `Analise este CV/Bio e extraia uma lista de hard skills técnicas (apenas as tags, separadas por virgula): "${formBio}"`;
            const response = await chatWithAssistant(prompt, []);
            const skills = response.split(',').map(s => s.trim().replace('.', ''));
            setFormSkills(skills);
            addToast('Habilidades extraídas com IA!', 'success');
        } catch (e) {
            addToast('Erro na análise de IA', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = () => {
        const memberData: TeamMember = {
            id: selectedMember ? selectedMember.id : Date.now().toString(),
            name: formName,
            role: formRole,
            bio: formBio,
            skills: formSkills,
            avatar: selectedMember?.avatar || `https://ui-avatars.com/api/?name=${formName}&background=random`,
            activeProjects: selectedMember?.activeProjects || 0,
            capacity: formCapacity,
            allocations: selectedMember?.allocations || [],
            workload: 0, // Calculated dynamically
            status: selectedMember?.status || 'offline'
        };

        if (selectedMember && selectedMember.id) {
            updateTeamMember(memberData);
        } else {
            addTeamMember(memberData);
        }
        setIsEditing(false);
        setSelectedMember(null);
    };

    // --- LOGIC HELPERS ---
    
    const getMemberTasks = (memberId: string) => tasks.filter(t => t.teamMembers.includes(memberId) && t.status !== 'done');
    
    const calculateWorkload = (member: TeamMember) => {
        const assignedTasks = getMemberTasks(member.id);
        const taskHours = assignedTasks.reduce((acc, t) => acc + (t.estimatedHours || 4), 0); // Default 4h per task if not set
        const allocHours = member.allocations?.reduce((acc, a) => acc + a.hoursPerWeek, 0) || 0;
        
        const totalHours = taskHours + allocHours;
        const capacity = member.capacity || 40;
        
        return Math.min(Math.round((totalHours / capacity) * 100), 100);
    };

    const getStatusColor = (status: TeamMember['status']) => {
        switch(status) {
            case 'online': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
            case 'busy': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
            case 'offline': return 'bg-slate-500';
        }
    };

    const getWorkloadColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-purple-600 text-purple-400'; // Estourado
        if (percentage >= 80) return 'bg-red-500 text-red-400'; // Cheio
        if (percentage >= 50) return 'bg-yellow-500 text-yellow-400'; // Atenção
        return 'bg-emerald-500 text-emerald-400'; // Livre
    };

    // --- ALLOCATION LOGIC ---
    const handleAddAllocation = () => {
        if (!selectedMember || !allocProject) return;
        const project = projects.find(p => p.id === allocProject);
        if (!project) return;

        const newAlloc: Allocation = {
            id: Date.now().toString(),
            projectId: project.id,
            projectName: project.name,
            role: allocRole || selectedMember.role,
            hoursPerWeek: Number(allocHours) || 5
        };

        const updatedMember = {
            ...selectedMember,
            allocations: [...(selectedMember.allocations || []), newAlloc]
        };
        updateTeamMember(updatedMember);
        setSelectedMember(updatedMember); // Update local state for modal
        setAllocProject(''); setAllocHours(''); setAllocRole('');
        addToast('Alocação adicionada!', 'success');
    };

    const handleRemoveAllocation = (allocId: string) => {
        if (!selectedMember) return;
        const updatedMember = {
            ...selectedMember,
            allocations: selectedMember.allocations.filter(a => a.id !== allocId)
        };
        updateTeamMember(updatedMember);
        setSelectedMember(updatedMember);
    };

    const handleToggleTaskBlock = (task: any) => {
        updateTask({ ...task, isBlocked: !task.isBlocked });
    };

    const filteredTeam = team.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (filterRole ? m.role === filterRole : true)
    );

    const uniqueRoles = Array.from(new Set(team.map(t => t.role)));

    return (
        <div className="flex flex-col h-full overflow-hidden text-slate-200">
            
            {/* --- DETAILED MEMBER MODAL --- */}
            {(selectedMember || isEditing) && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1e1b2e] border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden shadow-2xl relative">
                        <button 
                            onClick={() => { setSelectedMember(null); setIsEditing(false); }} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>

                        {/* LEFT SIDEBAR (Profile Summary) */}
                        <div className="w-1/4 bg-black/20 border-r border-white/5 p-6 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full border-4 border-white/10 mb-4 overflow-hidden relative shadow-lg">
                                <img src={selectedMember?.avatar || `https://ui-avatars.com/api/?name=${formName || 'New'}&background=random`} className="w-full h-full object-cover" />
                            </div>
                            
                            {isEditing ? (
                                <input className="w-full glass-input text-center rounded mb-2 text-sm font-bold" placeholder="Nome" value={formName} onChange={e => setFormName(e.target.value)} />
                            ) : (
                                <h3 className="text-lg font-bold text-white text-center leading-tight mb-1">{selectedMember?.name}</h3>
                            )}
                            
                            {isEditing ? (
                                <input className="w-full glass-input text-center rounded text-xs mb-4" placeholder="Cargo" value={formRole} onChange={e => setFormRole(e.target.value)} />
                            ) : (
                                <p className="text-xs text-purple-400 font-bold mb-6 text-center px-2 bg-purple-500/10 rounded py-1 border border-purple-500/20">{selectedMember?.role}</p>
                            )}

                            {!isEditing && selectedMember && (
                                <div className="w-full space-y-4 mt-2">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-white mb-1">{calculateWorkload(selectedMember)}%</div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest">Workload</div>
                                    </div>
                                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all ${getWorkloadColor(calculateWorkload(selectedMember)).split(' ')[0]}`} 
                                            style={{width: `${calculateWorkload(selectedMember)}%`}}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500 px-1">
                                        <span>Livre</span>
                                        <span>Cheio</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT CONTENT (Tabs) */}
                        <div className="flex-1 flex flex-col bg-[#1e1b2e]">
                            {/* Tabs Header */}
                            {!isEditing && (
                                <div className="flex items-center px-6 border-b border-white/5">
                                    {['overview', 'tasks', 'projects', 'skills'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveModalTab(tab as any)}
                                            className={`px-4 py-4 text-xs font-bold uppercase tracking-wide border-b-2 transition-all ${activeModalTab === tab ? 'border-purple-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                        >
                                            {tab === 'overview' && 'Visão Geral'}
                                            {tab === 'tasks' && 'Tarefas'}
                                            {tab === 'projects' && 'Projetos'}
                                            {tab === 'skills' && 'Skills'}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                {isEditing ? (
                                    /* EDIT FORM */
                                    <div className="space-y-5 max-w-lg mx-auto">
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">Capacidade Semanal (Horas)</label>
                                            <input type="number" className="w-full glass-input rounded-lg p-3" value={formCapacity} onChange={e => setFormCapacity(Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <label className="text-xs text-gray-400">Bio / Resumo</label>
                                                <button onClick={handleAnalyzeBio} disabled={!formBio || isAnalyzing} className="text-xs text-purple-400 hover:text-white flex items-center gap-1">
                                                    {isAnalyzing ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                                                    Auto-Scan
                                                </button>
                                            </div>
                                            <textarea className="w-full glass-input rounded-lg p-3 h-32 resize-none" value={formBio} onChange={e => setFormBio(e.target.value)} />
                                        </div>
                                        <button onClick={handleSave} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-lg">Salvar Perfil</button>
                                    </div>
                                ) : (
                                    /* TABS CONTENT */
                                    <>
                                        {/* OVERVIEW TAB */}
                                        {activeModalTab === 'overview' && selectedMember && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="glass-panel-light p-4 rounded-xl text-center">
                                                        <span className="text-2xl font-bold text-white block">{selectedMember.allocations?.length || 0}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase">Projetos</span>
                                                    </div>
                                                    <div className="glass-panel-light p-4 rounded-xl text-center">
                                                        <span className="text-2xl font-bold text-white block">{getMemberTasks(selectedMember.id).length}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase">Tarefas Ativas</span>
                                                    </div>
                                                    <div className="glass-panel-light p-4 rounded-xl text-center">
                                                        <span className="text-2xl font-bold text-white block">{selectedMember.capacity}h</span>
                                                        <span className="text-[10px] text-slate-400 uppercase">Capacidade</span>
                                                    </div>
                                                </div>

                                                <div className="glass-panel-light p-5 rounded-xl">
                                                    <h4 className="text-sm font-bold text-white mb-2">Bio</h4>
                                                    <p className="text-sm text-slate-400 leading-relaxed">{selectedMember.bio || 'Sem bio.'}</p>
                                                </div>

                                                {selectedMember.allocations && selectedMember.allocations.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white mb-3">Principais Alocações</h4>
                                                        <div className="space-y-2">
                                                            {selectedMember.allocations.slice(0, 3).map(alloc => (
                                                                <div key={alloc.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                                                                    <div>
                                                                        <span className="text-sm text-white font-medium block">{alloc.projectName}</span>
                                                                        <span className="text-[10px] text-slate-400">{alloc.role}</span>
                                                                    </div>
                                                                    <span className="text-xs font-mono text-emerald-400">{alloc.hoursPerWeek}h/sem</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <button onClick={() => setIsEditing(true)} className="text-xs text-slate-500 hover:text-white underline w-full text-center mt-4">Editar Informações Básicas</button>
                                            </div>
                                        )}

                                        {/* PROJECTS TAB (ALLOCATION) */}
                                        {activeModalTab === 'projects' && selectedMember && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                                <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Nova Alocação</h4>
                                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                                        <select className="glass-input rounded text-xs bg-[#0f0c1d]" value={allocProject} onChange={e => setAllocProject(e.target.value)}>
                                                            <option value="">Selecionar Projeto...</option>
                                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                        </select>
                                                        <input className="glass-input rounded text-xs" placeholder="Papel (Ex: Lead)" value={allocRole} onChange={e => setAllocRole(e.target.value)} />
                                                        <input className="glass-input rounded text-xs" type="number" placeholder="Horas/Sem" value={allocHours} onChange={e => setAllocHours(e.target.value)} />
                                                    </div>
                                                    <button onClick={handleAddAllocation} disabled={!allocProject} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded transition-colors disabled:opacity-50">
                                                        Alocar no Projeto
                                                    </button>
                                                </div>

                                                <div className="space-y-2">
                                                    {selectedMember.allocations?.map(alloc => (
                                                        <div key={alloc.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg group hover:border-white/20 border border-transparent transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><i className="fa-regular fa-folder"></i></div>
                                                                <div>
                                                                    <span className="text-sm font-bold text-white block">{alloc.projectName}</span>
                                                                    <span className="text-[10px] text-slate-400 uppercase">{alloc.role} • {alloc.hoursPerWeek}h/sem</span>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleRemoveAllocation(alloc.id)} className="text-slate-500 hover:text-red-400 px-2">
                                                                <i className="fa-solid fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {(!selectedMember.allocations || selectedMember.allocations.length === 0) && (
                                                        <p className="text-center text-slate-500 text-xs py-4">Nenhuma alocação ativa.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* TASKS TAB */}
                                        {activeModalTab === 'tasks' && selectedMember && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                                {getMemberTasks(selectedMember.id).map(task => (
                                                    <div key={task.id} className={`glass-panel-light p-3 rounded-lg flex items-center justify-between border-l-2 ${task.isBlocked ? 'border-l-red-500 bg-red-900/10' : 'border-l-purple-500'}`}>
                                                        <div>
                                                            <span className={`text-sm font-medium text-white block ${task.isBlocked ? 'line-through opacity-70' : ''}`}>{task.title}</span>
                                                            <div className="flex gap-2 text-[10px] mt-1">
                                                                <span className="text-slate-400">{task.client}</span>
                                                                {task.isBlocked && <span className="text-red-400 font-bold bg-red-500/10 px-1 rounded">BLOQUEADA</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleToggleTaskBlock(task)}
                                                                className={`p-1.5 rounded hover:bg-white/10 ${task.isBlocked ? 'text-red-400' : 'text-slate-500'}`}
                                                                title="Marcar Bloqueio"
                                                            >
                                                                <i className="fa-solid fa-ban"></i>
                                                            </button>
                                                            <button onClick={() => updateTask({...task, status: 'done'})} className="p-1.5 rounded hover:bg-white/10 text-emerald-400" title="Concluir">
                                                                <i className="fa-solid fa-check"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {getMemberTasks(selectedMember.id).length === 0 && (
                                                    <p className="text-center text-slate-500 text-xs py-8">Nenhuma tarefa pendente. Good job! 🎉</p>
                                                )}
                                            </div>
                                        )}

                                        {/* SKILLS TAB */}
                                        {activeModalTab === 'skills' && selectedMember && (
                                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedMember.skills?.map((skill, i) => (
                                                        <span key={i} className="bg-white/10 px-3 py-1.5 rounded-full text-xs text-white border border-white/10">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-4 italic">Skills são atualizadas na edição do perfil.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER CONTROLS */}
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center px-6 py-4 border-b border-white/5 bg-transparent backdrop-blur-sm shrink-0 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <span className="material-symbols-outlined text-white text-lg">diversity_3</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Equipe & Capacidade</h2>
                        <p className="text-[10px] text-slate-400">{team.length} membros ativos</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
                    {/* Search & Filter */}
                    <div className="flex items-center bg-black/20 rounded-lg border border-white/5 px-2 flex-1 xl:flex-none xl:w-64">
                        <i className="fa-solid fa-search text-slate-500 text-xs ml-1"></i>
                        <input 
                            className="bg-transparent border-none text-xs text-white p-2 focus:ring-0 w-full placeholder:text-slate-600"
                            placeholder="Buscar membro..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        className="bg-black/20 text-white text-xs border border-white/5 rounded-lg px-3 py-2 outline-none focus:border-white/20"
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                    >
                        <option value="">Todas Funções</option>
                        {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>

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

                    <button onClick={handleNewMember} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-orange-900/20 whitespace-nowrap">
                        <i className="fa-solid fa-plus mr-2"></i> Convidar
                    </button>
                </div>
            </header>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                
                {/* --- MATRIX TABLE VIEW --- */}
                {viewMode === 'table' ? (
                    <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-xs text-slate-400 uppercase font-bold border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Membro</th>
                                    <th className="px-6 py-4">Função</th>
                                    <th className="px-6 py-4">Alocações</th>
                                    <th className="px-6 py-4 w-48">Workload</th>
                                    <th className="px-6 py-4 text-center">Tasks</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {filteredTeam.map(member => {
                                    const wl = calculateWorkload(member);
                                    const wlColor = getWorkloadColor(wl);
                                    return (
                                        <tr key={member.id} onClick={() => handleOpenMember(member)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={member.avatar} className="w-8 h-8 rounded-full border border-white/10" />
                                                    <span className="font-bold text-white">{member.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-xs">{member.role}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {member.allocations?.map(a => (
                                                        <div key={a.id} className="w-6 h-6 rounded-full bg-blue-900 border border-black flex items-center justify-center text-[8px] text-white font-bold" title={a.projectName}>
                                                            {a.projectName.charAt(0)}
                                                        </div>
                                                    ))}
                                                    {(!member.allocations || member.allocations.length === 0) && <span className="text-slate-600 text-xs">-</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-1">
                                                    <div className={`h-full rounded-full ${wlColor.split(' ')[0]}`} style={{width: `${wl}%`}}></div>
                                                </div>
                                                <span className={`text-[10px] font-bold ${wlColor.split(' ')[1]}`}>{wl}% Capacity</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-white/5 px-2 py-1 rounded text-xs font-mono">{getMemberTasks(member.id).length}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={`inline-block w-2.5 h-2.5 rounded-full ${getStatusColor(member.status)}`}></div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* --- GRID CARD VIEW --- */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filteredTeam.map(member => {
                            const wl = calculateWorkload(member);
                            const wlColorClass = getWorkloadColor(wl); // returns "bg-color text-color"
                            const [bgColor, textColor] = wlColorClass.split(' ');

                            return (
                                <div key={member.id} onClick={() => handleOpenMember(member)} className="glass-panel rounded-xl p-5 flex flex-col hover:border-white/20 hover:bg-white/5 transition-all group relative overflow-hidden cursor-pointer h-full">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="relative">
                                            <img src={member.avatar} alt={member.name} className="w-14 h-14 rounded-full border-2 border-white/10 group-hover:border-white/20 transition-colors object-cover" />
                                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#1e293b] ${getStatusColor(member.status)}`}></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-base truncate">{member.name}</h3>
                                            <p className="text-xs text-slate-400 truncate">{member.role}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Workload Bar */}
                                    <div className="bg-black/30 rounded-lg p-3 border border-white/5 mb-3">
                                        <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 uppercase tracking-wide font-bold">
                                            <span>Capacidade ({member.capacity}h)</span>
                                            <span className={textColor}>{wl}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden relative">
                                            <div className={`h-full rounded-full transition-all duration-500 ${bgColor}`} style={{ width: `${wl}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Mini Allocations List */}
                                    <div className="flex-1">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Projetos ({member.allocations?.length || 0})</p>
                                        <div className="space-y-1.5">
                                            {member.allocations?.slice(0, 2).map(alloc => (
                                                <div key={alloc.id} className="flex justify-between items-center text-xs text-slate-300 bg-white/5 px-2 py-1.5 rounded">
                                                    <span className="truncate max-w-[120px]">{alloc.projectName}</span>
                                                    <span className="text-[10px] text-slate-500">{alloc.hoursPerWeek}h</span>
                                                </div>
                                            ))}
                                            {(!member.allocations || member.allocations.length === 0) && (
                                                <p className="text-[10px] text-slate-600 italic">Disponível para alocação</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                                        <span className="text-slate-400">{getMemberTasks(member.id).length} Tasks</span>
                                        <span className="text-purple-400 group-hover:text-white transition-colors font-bold">Ver Perfil <i className="fa-solid fa-arrow-right ml-1"></i></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamView;