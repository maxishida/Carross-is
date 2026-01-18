import React, { useState, useRef, useMemo } from 'react';
import { AgencyProposal, AgencyTask, DirectorAction, CalendarEvent, Project } from '../types';
import { generateAgencyProposal, extractTextFromFile, parseAgencyCommand } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import { useAgency } from '../context/AgencyContext';

interface DashboardViewProps {
    onCreateClick: () => void;
}

export default function DashboardView({ onCreateClick }: DashboardViewProps) {
  const { tasks, addTask, updateTask, deleteTask, team, projects, addProject, addToast, leads, events, addEvent } = useAgency();
  const [activeTab, setActiveTab] = useState<'backlog' | 'progress' | 'done'>('backlog');
  
  // --- KPI MODAL STATE ---
  const [activeKpiModal, setActiveKpiModal] = useState<'tasks' | 'deadlines' | 'projects' | 'revenue' | null>(null);

  // --- TASK CREATION STATE ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskClient, setNewTaskClient] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskMembers, setNewTaskMembers] = useState<string[]>([]);

  // --- AI PROPOSAL & DIRECTOR STATE ---
  const [directorInput, setDirectorInput] = useState('');
  const [isDirectorThinking, setIsDirectorThinking] = useState(false);
  const [directorResponse, setDirectorResponse] = useState('');
  
  const [proposalInput, setProposalInput] = useState('');
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<AgencyProposal | null>(null);
  const [ragContext, setRagContext] = useState<string>('');
  const [ragFileName, setRagFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---
  const handleCreateTask = () => {
      if(!newTaskTitle.trim()) return;
      const task: AgencyTask = {
          id: Date.now().toString(),
          title: newTaskTitle,
          client: newTaskClient,
          status: 'backlog',
          priority: newTaskPriority,
          teamMembers: newTaskMembers,
          deadline: newTaskDeadline ? new Date(newTaskDeadline).toISOString() : undefined,
          notificationSent: false,
          estimatedHours: 4, // Default estimate
          isBlocked: false
      };
      addTask(task);
      setIsTaskModalOpen(false);
      setNewTaskTitle('');
      setNewTaskClient('');
      setNewTaskMembers([]);
      addToast('Tarefa criada e alarme agendado!', 'success');
  };

  const handleDirectorCommand = async (overridePrompt?: string) => {
      const promptToUse = overridePrompt || directorInput;
      if(!promptToUse.trim()) return;
      
      setIsDirectorThinking(true);
      setDirectorResponse('');
      
      try {
          // Prepare Enhanced Context for AI
          const contextSummary = `
          TASKS: ${tasks.filter(t => t.status !== 'done').map(t => `- ${t.title} (Due: ${t.deadline || 'None'})`).join('\n')}
          EVENTS: ${events.map(e => `- ${e.title} (Start: ${e.start})`).join('\n')}
          PROJECTS: ${projects.map(p => `- ${p.name} (Deadline: ${p.deadline})`).join('\n')}
          `;

          const crmSummary = `
          LEADS/CLIENTS: ${leads.map(l => `- ${l.companyName} (${l.status})`).join('\n')}
          `;

          const result: DirectorAction | null = await parseAgencyCommand(promptToUse, contextSummary, crmSummary);
          
          if (result) {
              setDirectorResponse(result.reply);
              
              // EXECUTE ACTION
              if (result.action === 'create_task') {
                  const task: AgencyTask = {
                      id: Date.now().toString(),
                      title: result.data.title || "Nova Tarefa IA",
                      client: "Auto-Assigned",
                      status: 'backlog',
                      priority: 'medium',
                      teamMembers: [],
                      deadline: result.data.deadline,
                      notificationSent: false,
                      estimatedHours: 2,
                      isBlocked: false
                  };
                  addTask(task);
                  addToast('Diretor IA criou uma tarefa.', 'success');
              } 
              else if (result.action === 'create_project') {
                  addProject({
                      id: Date.now().toString(),
                      name: result.data.name || "Novo Projeto",
                      client: result.data.client || "Cliente",
                      deadline: "A definir",
                      progress: 0,
                      status: 'active',
                      members: [],
                      phases: [{name: 'Start', status: 'active', progress: 0}]
                  });
                  addToast('Diretor IA criou um projeto.', 'success');
              }
              else if (result.action === 'create_event' || result.action === 'schedule_meeting') {
                  if (result.data && result.data.start) {
                      const newEvent: CalendarEvent = {
                          id: Date.now().toString(),
                          title: result.data.title || "Novo Evento",
                          start: result.data.start,
                          end: result.data.end || new Date(new Date(result.data.start).getTime() + 3600000).toISOString(),
                          type: 'meeting',
                          description: result.data.description || "Agendado via Director AI"
                      };
                      addEvent(newEvent);
                      addToast(`📅 Evento agendado: ${newEvent.title}`, 'success');
                  }
              }
              else if (result.action === 'audit_schedule') {
                  addToast('Briefing estratégico gerado!', 'info');
              }
          } else {
              setDirectorResponse("Não entendi o comando. Tente 'Agendar reunião amanhã às 14h'.");
          }
      } catch (e) {
          console.error(e);
          setDirectorResponse("Erro ao processar comando.");
      } finally {
          setIsDirectorThinking(false);
          setDirectorInput('');
      }
  };

  const toggleTaskMember = (memberId: string) => {
      setNewTaskMembers(prev => 
          prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
      );
  };

  const handleTaskStatusChange = (task: AgencyTask, newStatus: AgencyTask['status']) => {
      updateTask({ ...task, status: newStatus });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const text = await extractTextFromFile(file);
              setRagContext(text);
              setRagFileName(file.name);
          } catch (error) {
              alert("Erro ao ler arquivo. Tente um PDF ou TXT.");
          }
      }
  };

  const handleGenerateProposal = async () => {
      if (!proposalInput.trim()) return;
      setIsGeneratingProposal(true);
      try {
          const result = await generateAgencyProposal(proposalInput, ragContext);
          setGeneratedProposal(result);
          addToast('Orçamento gerado com sucesso!', 'success');
      } catch (e) {
          console.error(e);
          alert("Falha ao gerar proposta.");
      } finally {
          setIsGeneratingProposal(false);
      }
  };

  const handleSaveProposalAsProject = () => {
      if(!generatedProposal) return;
      addProject({
          id: Date.now().toString(),
          name: generatedProposal.clientName,
          client: generatedProposal.clientName,
          deadline: "A definir",
          progress: 0,
          status: 'active',
          members: [],
          phases: [
              { name: 'Planejamento', status: 'active', progress: 0 },
              { name: 'Execução', status: 'pending', progress: 0 },
              { name: 'Entrega', status: 'pending', progress: 0 }
          ],
          description: generatedProposal.executiveSummary
      });
      addToast('Projeto criado a partir do orçamento!', 'success');
      setGeneratedProposal(null);
  };

  const handleExportPDF = () => {
    if (!generatedProposal) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Proposta: ${generatedProposal.clientName}`, 20, 20);
    doc.setFontSize(12);
    const splitSummary = doc.splitTextToSize(generatedProposal.executiveSummary, 170);
    doc.text(splitSummary, 20, 40);
    doc.save(`Proposta_${generatedProposal.clientName}.pdf`);
  };

  // --- DATA CALCULATIONS ---
  const totalRevenue = leads.reduce((acc, lead) => acc + (lead.value * (lead.probability/100)), 0);
  
  // Upcoming Deadlines (Combined Tasks & Projects)
  const upcomingDeadlines = useMemo(() => {
      const items: { type: 'task' | 'project', name: string, date: Date, id: string }[] = [];
      tasks.forEach(t => {
          if (t.deadline && t.status !== 'done') items.push({ type: 'task', name: t.title, date: new Date(t.deadline), id: t.id });
      });
      projects.forEach(p => {
          if (p.deadline && p.deadline !== 'Indefinido') {
              const d = new Date(p.deadline);
              if(!isNaN(d.getTime())) items.push({ type: 'project', name: p.name, date: d, id: p.id });
          }
      });
      return items.sort((a,b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  }, [tasks, projects]);

  return (
    <div className="flex flex-col h-full">
        {/* KPI MODALS */}
        {activeKpiModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div 
                    className="glass-panel border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={() => setActiveKpiModal(null)} 
                        className="absolute top-4 right-4 text-slate-400 hover:text-white"
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>

                    {/* MODAL: TASKS */}
                    {activeKpiModal === 'tasks' && (
                        <>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-list-check text-purple-400"></i>
                                Status: Tarefas Pendentes
                            </h3>
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {tasks.filter(t => t.status !== 'done').sort((a,b) => (a.priority === 'high' ? -1 : 1)).map(task => (
                                    <div key={task.id} className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {task.priority === 'high' && <span className="bg-red-500/20 text-red-400 text-[9px] px-1.5 py-0.5 rounded font-bold">ALTA</span>}
                                                <span className="text-sm text-white font-medium">{task.title}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 block mt-0.5">{task.client}</span>
                                        </div>
                                        <button 
                                            onClick={() => updateTask({...task, status: 'done'})}
                                            className="text-slate-500 hover:text-emerald-400 p-2 transition-colors"
                                            title="Concluir"
                                        >
                                            <i className="fa-solid fa-check-circle text-lg"></i>
                                        </button>
                                    </div>
                                ))}
                                {tasks.filter(t => t.status !== 'done').length === 0 && (
                                    <p className="text-center text-slate-500 py-8">Tudo limpo! Nenhuma tarefa pendente.</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* MODAL: DEADLINES */}
                    {activeKpiModal === 'deadlines' && (
                        <>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <i className="fa-regular fa-clock text-fuchsia-400"></i>
                                Próximas Entregas
                            </h3>
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar relative">
                                {/* Vertical Line */}
                                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-white/10"></div>
                                
                                {upcomingDeadlines.map((item, idx) => (
                                    <div key={item.id} className="relative pl-10 flex flex-col">
                                        <div className={`absolute left-[11px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#1e1b2e] z-10 ${item.type === 'task' ? 'bg-blue-500' : 'bg-fuchsia-500'}`}></div>
                                        <span className="text-xs text-slate-400 font-mono mb-0.5">
                                            {item.date.toLocaleDateString()} • {item.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        <span className="text-sm font-bold text-white">{item.name}</span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{item.type === 'task' ? 'Tarefa' : 'Projeto'}</span>
                                    </div>
                                ))}
                                {upcomingDeadlines.length === 0 && (
                                    <p className="text-center text-slate-500 py-8 ml-4">Sem prazos próximos definidos.</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* MODAL: PROJECTS */}
                    {activeKpiModal === 'projects' && (
                        <>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-layer-group text-indigo-400"></i>
                                Saúde dos Projetos
                            </h3>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {projects.map(proj => (
                                    <div key={proj.id} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-white">{proj.name}</span>
                                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${proj.status === 'active' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-300'}`}>{proj.status}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-2">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{width: `${proj.progress}%`}}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-400">
                                            <span>Progresso: {proj.progress}%</span>
                                            <span>Fase: {proj.phases.find(p => p.status === 'active')?.name || 'Concluído'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* MODAL: REVENUE */}
                    {activeKpiModal === 'revenue' && (
                        <>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-sack-dollar text-emerald-400"></i>
                                Composição de Receita
                            </h3>
                            <div className="space-y-6">
                                <div className="p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-xl text-center">
                                    <span className="text-xs text-emerald-300 uppercase tracking-wider block mb-1">Total Ponderado (Pipeline)</span>
                                    <span className="text-3xl font-bold text-emerald-400">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase border-b border-white/10 pb-1">Top Oportunidades</h4>
                                    {leads.sort((a,b) => b.value - a.value).slice(0, 3).map(lead => (
                                        <div key={lead.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                            <div>
                                                <span className="block text-sm text-white font-medium">{lead.companyName}</span>
                                                <span className="text-[10px] text-slate-500">Probabilidade: {lead.probability}%</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-xs font-mono text-emerald-300">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="text-[10px] text-slate-500 bg-black/20 p-2 rounded text-center">
                                    * Cálculo baseado no valor do lead multiplicado pela probabilidade da etapa do funil.
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}

        {/* TASK CREATION MODAL */}
        {isTaskModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#1e1b2e] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Nova Tarefa & Alarme</h3>
                        <button onClick={() => setIsTaskModalOpen(false)}><i className="fa-solid fa-xmark text-gray-400 hover:text-white"></i></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Título da Tarefa</label>
                            <input 
                                className="w-full glass-input rounded-lg p-2.5 text-sm" 
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                placeholder="Ex: Criar Landing Page"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Cliente / Projeto</label>
                                <input 
                                    className="w-full glass-input rounded-lg p-2.5 text-sm" 
                                    value={newTaskClient}
                                    onChange={e => setNewTaskClient(e.target.value)}
                                    placeholder="Nome do Cliente"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Prioridade</label>
                                <select 
                                    className="w-full glass-input rounded-lg p-2.5 text-sm bg-[#0f0c1d]"
                                    value={newTaskPriority}
                                    onChange={e => setNewTaskPriority(e.target.value as any)}
                                >
                                    <option value="low">Baixa</option>
                                    <option value="medium">Média</option>
                                    <option value="high">Alta</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Data & Hora (Ativa Alarme)</label>
                            <input 
                                type="datetime-local"
                                className="w-full glass-input rounded-lg p-2.5 text-sm invert-calendar-icon" 
                                value={newTaskDeadline}
                                onChange={e => setNewTaskDeadline(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 mb-2 block">Atribuir Equipe (CV Skills)</label>
                            <div className="flex gap-2 flex-wrap">
                                {team.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => toggleTaskMember(member.id)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${newTaskMembers.includes(member.id) ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                    >
                                        <div className="w-4 h-4 rounded-full bg-gray-700 overflow-hidden">
                                            <img src={member.avatar} className="w-full h-full object-cover" />
                                        </div>
                                        {member.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleCreateTask}
                            disabled={!newTaskTitle}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 mt-4"
                        >
                            Criar Tarefa
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 z-10 shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-fuchsia-500/20 p-2 rounded-lg text-fuchsia-400">
                    <i className="fa-solid fa-rocket"></i>
                </div>
                <h1 className="font-bold text-white tracking-tight text-2xl">Painel da Agência</h1>
            </div>
            
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsTaskModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2"
                >
                    <i className="fa-solid fa-plus"></i> Nova Tarefa
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                    LD
                </div>
            </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 scroll-smooth custom-scrollbar">
            
            {/* KPI Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* KPI 1: TASKS */}
                <article 
                    onClick={() => setActiveKpiModal('tasks')}
                    className="glass-panel rounded-2xl p-5 flex items-start justify-between relative overflow-hidden group cursor-pointer hover:border-purple-500/50 hover:bg-white/5 transition-all"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
                            <i className="fa-solid fa-clipboard-check"></i> Tarefas Pendentes
                        </div>
                        <div className="font-bold text-white mb-1 text-4xl">{tasks.filter(t => t.status !== 'done').length}</div>
                        <div className="text-xs text-gray-500">
                             {tasks.filter(t => t.priority === 'high' && t.status !== 'done').length} Alta Prioridade
                        </div>
                    </div>
                    <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-list-check text-xl"></i>
                    </div>
                </article>

                {/* KPI 2: DEADLINES */}
                <article 
                    onClick={() => setActiveKpiModal('deadlines')}
                    className="glass-panel rounded-2xl p-5 flex items-start justify-between relative overflow-hidden group cursor-pointer hover:border-fuchsia-500/50 hover:bg-white/5 transition-all"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
                            <i className="fa-regular fa-calendar"></i> Próxima Entrega
                        </div>
                        <div className="text-xl font-bold text-white mb-1 mt-1">
                            {upcomingDeadlines[0]?.date 
                                ? upcomingDeadlines[0].date.toLocaleDateString()
                                : "Sem prazos"
                            }
                        </div>
                        <div className="text-xs text-gray-500 mt-2 truncate">Ative o alarme</div>
                    </div>
                    <div className="bg-fuchsia-500/10 p-3 rounded-xl border border-fuchsia-500/20 text-fuchsia-400 group-hover:scale-110 transition-transform">
                        <i className="fa-regular fa-bell text-xl"></i>
                    </div>
                </article>
                
                 {/* KPI 3: PROJECTS */}
                <article 
                    onClick={() => setActiveKpiModal('projects')}
                    className="glass-panel rounded-2xl p-5 flex items-start justify-between relative overflow-hidden group cursor-pointer hover:border-indigo-500/50 hover:bg-white/5 transition-all"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
                            <i className="fa-solid fa-folder-open"></i> Projetos
                        </div>
                        <div className="font-bold text-white mb-1 text-4xl">{projects.length}</div>
                        <div className="text-xs text-gray-500">Ativos no sistema</div>
                    </div>
                    <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-layer-group text-xl"></i>
                    </div>
                </article>

                {/* KPI 4: REVENUE */}
                <article 
                    onClick={() => setActiveKpiModal('revenue')}
                    className="glass-panel rounded-2xl p-5 flex items-start justify-between relative overflow-hidden group cursor-pointer hover:border-emerald-500/50 hover:bg-white/5 transition-all"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
                            <i className="fa-solid fa-money-bill-wave"></i> Receita Estimada
                        </div>
                        <div className="font-bold text-white mb-1 text-2xl truncate" title={totalRevenue.toString()}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumSignificantDigits: 3 }).format(totalRevenue)}
                        </div>
                        <div className="text-xs text-emerald-400">Baseado em Leads</div>
                    </div>
                    <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-sack-dollar text-xl"></i>
                    </div>
                </article>
            </section>

            {/* AI DIRECTOR WIDGET */}
            <section className="mb-8">
                <div className="glass-panel rounded-2xl p-1 flex items-center gap-2 bg-gradient-to-r from-purple-900/40 to-slate-900/40 border border-purple-500/30">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                        <span className={`material-symbols-outlined text-purple-400 ${isDirectorThinking ? 'animate-spin' : ''}`}>smart_toy</span>
                    </div>
                    <div className="flex-1">
                        <input 
                            className="w-full bg-transparent border-none text-sm text-white placeholder:text-slate-500 focus:ring-0"
                            placeholder="Ex: 'Agendar reunião com Cliente X amanhã às 14h' ou 'Gerar briefing do dia'..."
                            value={directorInput}
                            onChange={e => setDirectorInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleDirectorCommand()}
                            disabled={isDirectorThinking}
                        />
                    </div>
                    <button 
                        onClick={() => handleDirectorCommand("Gerar briefing do dia com base na minha agenda e tarefas.")}
                        disabled={isDirectorThinking} 
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold whitespace-nowrap transition-colors"
                    >
                        Briefing do Dia
                    </button>
                    {directorResponse && (
                        <div className="text-xs text-emerald-400 font-bold px-3 animate-pulse">
                            {directorResponse}
                        </div>
                    )}
                    <button onClick={() => handleDirectorCommand()} disabled={isDirectorThinking} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </section>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Tasks */}
                    <div className="glass-panel rounded-2xl p-6 min-h-[400px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-white">Gestão de Tarefas (Kanban)</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 italic">Arraste ou clique para mover</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 border-b border-white/10 mb-4 pb-2 text-sm">
                            <button onClick={() => setActiveTab('backlog')} className={`font-medium pb-2 -mb-2.5 ${activeTab === 'backlog' ? 'text-white border-b-2 border-fuchsia-500' : 'text-gray-500 hover:text-white'}`}>Backlog</button>
                            <button onClick={() => setActiveTab('progress')} className={`font-medium pb-2 -mb-2.5 ${activeTab === 'progress' ? 'text-white border-b-2 border-fuchsia-500' : 'text-gray-500 hover:text-white'}`}>Em Progresso</button>
                            <button onClick={() => setActiveTab('done')} className={`font-medium pb-2 -mb-2.5 ${activeTab === 'done' ? 'text-white border-b-2 border-fuchsia-500' : 'text-gray-500 hover:text-white'}`}>Concluído</button>
                        </div>
                        <div className="space-y-3">
                            {tasks.filter(t => t.status === activeTab).map(task => (
                                <div key={task.id} className="glass-panel-light p-3 rounded-lg flex items-center justify-between group hover:bg-white/5 transition-colors border-l-2 border-l-transparent hover:border-l-fuchsia-500 relative">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => handleTaskStatusChange(task, activeTab === 'done' ? 'backlog' : 'done')}
                                            className={`rounded border border-gray-600 w-5 h-5 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-fuchsia-500 border-fuchsia-500' : 'bg-transparent'}`}
                                        >
                                            {task.status === 'done' && <i className="fa-solid fa-check text-white text-xs"></i>}
                                        </button>
                                        <div>
                                            <h4 className={`text-sm font-medium transition-colors ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-white group-hover:text-fuchsia-200'}`}>{task.title}</h4>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">{task.client}</span>
                                            {task.deadline && (
                                                <div className={`text-[10px] flex items-center gap-1 mt-1 ${new Date(task.deadline) < new Date() && task.status !== 'done' ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                                                    <i className="fa-regular fa-clock"></i> 
                                                    {new Date(task.deadline).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {task.priority === 'high' && <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/20">ALTA</span>}
                                        <div className="flex -space-x-2">
                                            {task.teamMembers.map((mId, i) => {
                                                const member = team.find(tm => tm.id === mId);
                                                return member ? (
                                                    <div key={i} className="w-6 h-6 rounded-full overflow-hidden border border-[#0f0c1d]" title={member.name}>
                                                        <img src={member.avatar} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                        <button onClick={() => deleteTask(task.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                        
                                        {/* Simple Move Controls */}
                                        <div className="flex flex-col gap-1">
                                            {task.status !== 'backlog' && <button onClick={() => handleTaskStatusChange(task, 'backlog')} className="text-[10px] text-gray-500 hover:text-white"><i className="fa-solid fa-arrow-left"></i></button>}
                                            {task.status !== 'done' && <button onClick={() => handleTaskStatusChange(task, task.status === 'backlog' ? 'progress' : 'done')} className="text-[10px] text-gray-500 hover:text-white"><i className="fa-solid fa-arrow-right"></i></button>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {tasks.filter(t => t.status === activeTab).length === 0 && (
                                <div className="text-center py-10 text-gray-500 text-sm">
                                    Nenhuma tarefa nesta etapa.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Budget Generator */}
                    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs">
                                    <i className="fa-solid fa-robot text-white"></i>
                                </div>
                                <h2 className="text-base font-bold text-white">Gerador de Orçamentos IA</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`bg-white/10 px-2 py-1 rounded text-[10px] ${ragFileName ? 'text-emerald-400' : 'text-gray-300'} hover:bg-white/20 transition-colors`}
                                >
                                    {ragFileName ? 'Contexto OK' : 'Add Contexto (PDF)'}
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
                            </div>
                        </div>

                        {!generatedProposal ? (
                            <>
                                <div className="mb-6">
                                    <label className="text-xs text-gray-400 mb-2 block flex items-center gap-2">
                                        <i className="fa-regular fa-message"></i> Descreve o projeto do cliente e eu ajuda a montar a proposta!
                                    </label>
                                    <textarea 
                                        className="w-full glass-input rounded-xl p-3 text-sm h-20 resize-none placeholder-gray-600 focus:ring-0" 
                                        placeholder="Ex: Crie um projeto de um site institucional de 5 páginas e gestão de instagram..."
                                        value={proposalInput}
                                        onChange={(e) => setProposalInput(e.target.value)}
                                        disabled={isGeneratingProposal}
                                    ></textarea>
                                </div>
                                <button 
                                    onClick={handleGenerateProposal}
                                    disabled={isGeneratingProposal || !proposalInput.trim()}
                                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-fuchsia-900/40 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isGeneratingProposal ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                                    {isGeneratingProposal ? 'Gerando Proposta...' : 'Gerar Orçamento Detalhado'}
                                </button>
                            </>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-white">Proposta: {generatedProposal.clientName}</h3>
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveProposalAsProject} className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors rounded" title="Salvar como Projeto"><i className="fa-solid fa-floppy-disk"></i></button>
                                        <button onClick={handleExportPDF} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="PDF"><i className="fa-solid fa-file-pdf"></i></button>
                                        <button onClick={() => setGeneratedProposal(null)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Novo"><i className="fa-solid fa-rotate-right"></i></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    {generatedProposal.options.map((opt, idx) => (
                                        <div key={idx} className={`glass-panel-light rounded-xl p-4 border transition-all ${opt.isRecommended ? 'border-yellow-500/30 bg-gradient-to-b from-yellow-500/5 to-transparent relative' : 'border-white/5'}`}>
                                            {opt.isRecommended && <div className="absolute -top-2.5 right-2 bg-yellow-500 text-black text-[9px] font-bold px-2 py-0.5 rounded shadow-lg">RECOMENDADO</div>}
                                            <div className={`text-[10px] font-bold uppercase mb-1 ${opt.isRecommended ? 'text-yellow-400' : 'text-purple-400'}`}>{opt.name}</div>
                                            <div className={`text-xl font-bold text-white mb-1 ${opt.isRecommended ? 'text-yellow-400' : ''}`}>{opt.price}</div>
                                            <div className="text-[10px] text-gray-400 mb-3">{opt.timeline}</div>
                                            <div className="flex flex-wrap gap-1">
                                                {opt.techStack.slice(0,2).map((t,i) => <span key={i} className="bg-white/5 text-[9px] px-1 rounded text-gray-400">{t}</span>)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Team List */}
                    <div className="glass-panel rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white">Minha Equipe</h3>
                            <i className="fa-solid fa-users text-gray-500"></i>
                        </div>
                        <div className="space-y-4">
                            {team.slice(0, 3).map(member => (
                                <div key={member.id} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden"><img src={member.avatar} className="w-full h-full object-cover" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-white">{member.name}</span>
                                        <span className="text-[10px] text-gray-500">{member.role}</span>
                                    </div>
                                    <div className={`ml-auto w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Recent Projects */}
                    <div className="glass-panel rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white">Projetos Ativos</h3>
                        </div>
                        <ul className="space-y-3">
                            {projects.slice(0, 3).map(proj => (
                                <li key={proj.id} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{proj.name}</span>
                                        <span className="text-[9px] text-gray-500">{proj.phases[0]?.name || 'Inicio'}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-emerald-400 font-bold">{proj.progress}%</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};