
import React, { useState, useRef } from 'react';
import { AgencyTask, AgencyMetric, AgencyProposal } from '../types';
import { generateAgencyProposal, extractTextFromFile } from '../services/geminiService';
import { jsPDF } from 'jspdf';

interface DashboardViewProps {
    onCreateClick: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onCreateClick }) => {
  const [activeTab, setActiveTab] = useState<'backlog' | 'progress' | 'done'>('backlog');
  
  // --- AI PROPOSAL STATE ---
  const [proposalInput, setProposalInput] = useState('');
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<AgencyProposal | null>(null);
  const [ragContext, setRagContext] = useState<string>('');
  const [ragFileName, setRagFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock Data mimicking the image
  const tasks: AgencyTask[] = [
      { id: '1', title: 'Design de Login', client: 'GreenEnergy', status: 'backlog', priority: 'high', teamMembers: ['Ana'] },
      { id: '2', title: 'API de Pagamento', client: 'E-Shop', status: 'progress', priority: 'medium', teamMembers: ['Lucas', 'Ricardo'] },
      { id: '3', title: 'Integração Tumaca', client: 'Logistica X', status: 'done', priority: 'low', teamMembers: ['Lucas', 'Ana', 'Ricardo'] },
      { id: '4', title: 'Teste de Segurança', client: 'Fintech Y', status: 'progress', priority: 'high', teamMembers: ['Ricardo'] },
      { id: '5', title: 'API de pagamento', client: 'Loja Z', status: 'backlog', priority: 'medium', teamMembers: ['Lucas'] },
  ];

  // --- HANDLERS ---

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
      } catch (e) {
          console.error(e);
          alert("Falha ao gerar proposta. Tente novamente.");
      } finally {
          setIsGeneratingProposal(false);
      }
  };

  const handleExportPDF = () => {
      if (!generatedProposal) return;
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text(`Proposta Comercial: ${generatedProposal.clientName}`, 20, 20);
      
      doc.setFontSize(12);
      doc.text("Resumo Executivo:", 20, 40);
      const splitSummary = doc.splitTextToSize(generatedProposal.executiveSummary, 170);
      doc.text(splitSummary, 20, 50);
      
      let yPos = 80;
      doc.text("Equipe Sugerida:", 20, yPos);
      generatedProposal.teamStructure.forEach((role, i) => {
          yPos += 10;
          doc.text(`- ${role.role} (${role.seniority}): ${role.allocation}`, 30, yPos);
      });

      yPos += 20;
      doc.text("Opções de Investimento:", 20, yPos);
      generatedProposal.options.forEach((opt, i) => {
          yPos += 15;
          doc.setFont("helvetica", "bold");
          doc.text(`${opt.name} - ${opt.price}`, 30, yPos);
          doc.setFont("helvetica", "normal");
          yPos += 7;
          doc.text(`Prazo: ${opt.timeline}`, 35, yPos);
          yPos += 7;
          doc.text(`Escopo: ${opt.features.slice(0,3).join(', ')}...`, 35, yPos);
      });

      doc.save(`Proposta_${generatedProposal.clientName.replace(/\s/g, '_')}.pdf`);
  };

  const handleExportCSV = () => {
      if (!generatedProposal) return;
      
      const headers = ["Opção", "Preço", "Prazo", "Stack", "Features"];
      const rows = generatedProposal.options.map(opt => [
          opt.name,
          opt.price,
          opt.timeline,
          opt.techStack.join('; '),
          opt.features.join('; ')
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Orcamento_${generatedProposal.clientName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative z-10 bg-[#0f172a] text-slate-200">
        
        {/* Header Search & User */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#1e293b]/50">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#10b981] flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-lg">dashboard</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Painel da Agência</h2>
            </div>
            
            <div className="flex-1 max-w-xl mx-8 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                <input 
                    type="text" 
                    placeholder="Procurar projetos, clientes ou tarefas..." 
                    className="w-full bg-[#0f172a] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-[#2563eb] focus:border-[#2563eb] outline-none transition-all"
                />
            </div>

            <div className="flex items-center gap-3">
                <img src="https://ui-avatars.com/api/?name=Lucas+Dev&background=random" className="w-9 h-9 rounded-full border-2 border-[#1e293b]" alt="Profile" />
            </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Red Card - Tasks */}
                <div className="rounded-xl p-5 bg-gradient-to-br from-[#ea580c] to-[#c2410c] text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-6xl">list_alt</span></div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined">assignment_late</span>
                        <span className="font-semibold text-sm">Tarefas de Hoje</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">4 Pendentes</div>
                    <div className="text-xs opacity-80">2 Alta Prioridade</div>
                </div>

                {/* Green Card - Meeting */}
                <div className="rounded-xl p-5 bg-gradient-to-br from-[#16a34a] to-[#15803d] text-white shadow-lg relative overflow-hidden group">
                     <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-6xl">calendar_month</span></div>
                     <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined">event</span>
                        <span className="font-semibold text-sm">Próxima Reunião</span>
                    </div>
                    <div className="text-lg font-bold mb-1">Amanhã <span className="text-xs bg-white/20 px-1 rounded">10:00</span></div>
                    <div className="text-sm opacity-90">Meeting com Cliente GreenEnergy</div>
                </div>

                {/* Orange Card - Budgets */}
                <div className="rounded-xl p-5 bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-6xl">request_quote</span></div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined">inventory</span>
                        <span className="font-semibold text-sm">Orçamentos Ativos</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">3 <span className="text-lg font-normal opacity-80">Em Andamento</span></div>
                    <div className="text-xs opacity-80 flex gap-2">
                        <span>Aprovado 1</span>
                        <span>Rejeitado 1</span>
                    </div>
                </div>

                {/* Blue Card - Cost/Revenue */}
                <div className="rounded-xl p-5 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-6xl">attach_money</span></div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined">payments</span>
                        <span className="font-semibold text-sm">Receita Estimada Mês</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">R$ 2.950,00</div>
                    <div className="text-xs opacity-80">Aprovado 1 • Enviado 1</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COLUMN (Wide) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* Active Project Progress Bar */}
                    <div className="bg-[#1e293b] rounded-xl p-4 border border-white/5 flex flex-col md:flex-row items-center gap-4 relative overflow-hidden">
                         <div className="bg-[#16a34a] px-4 py-2 rounded-lg flex items-center gap-2 text-white font-bold text-sm shrink-0 z-10 shadow-lg">
                             <span className="material-symbols-outlined">engineering</span>
                             Projeto em Execução
                         </div>
                         
                         {/* Phase Steps */}
                         <div className="flex-1 w-full flex items-center justify-between relative z-10">
                             <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                Fase 2 Ajustes
                             </div>
                             <div className="flex-1 h-1 bg-white/5 mx-4 rounded-full overflow-hidden">
                                 <div className="h-full bg-[#16a34a] w-[70%]"></div>
                             </div>
                             <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                Fase 3 Escala
                             </div>
                         </div>

                         <div className="flex gap-1 z-10 text-slate-400">
                             <span className="material-symbols-outlined text-lg">person</span>
                             <span className="material-symbols-outlined text-lg">more_horiz</span>
                         </div>
                         
                         {/* Background Pattern */}
                         <div className="absolute inset-0 bg-gradient-to-r from-[#16a34a]/10 to-transparent pointer-events-none"></div>
                    </div>

                    {/* TASKS PANEL */}
                    <div className="bg-[#1e293b] rounded-xl border border-white/5 p-5 min-h-[300px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                Minhas Tarefas
                            </h3>
                            <div className="flex gap-2 text-slate-400">
                                <span className="material-symbols-outlined cursor-pointer hover:text-white">settings</span>
                                <span className="material-symbols-outlined cursor-pointer hover:text-white">chevron_right</span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-8 border-b border-white/10 mb-4 text-sm font-medium">
                            <button onClick={() => setActiveTab('backlog')} className={`pb-2 ${activeTab === 'backlog' ? 'text-white border-b-2 border-[#2563eb]' : 'text-slate-500 hover:text-slate-300'}`}>Backlog</button>
                            <button onClick={() => setActiveTab('progress')} className={`pb-2 ${activeTab === 'progress' ? 'text-white border-b-2 border-[#2563eb]' : 'text-slate-500 hover:text-slate-300'}`}>Em Progresso</button>
                            <button onClick={() => setActiveTab('done')} className={`pb-2 ${activeTab === 'done' ? 'text-white border-b-2 border-[#2563eb]' : 'text-slate-500 hover:text-slate-300'}`}>Concluído</button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {tasks.filter(t => t.status === activeTab).map(task => (
                                <div key={task.id} className="flex items-center justify-between bg-[#0f172a] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded border ${task.status === 'done' ? 'bg-[#2563eb] border-[#2563eb]' : 'border-slate-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{task.title}</p>
                                            <p className="text-[10px] text-slate-500 uppercase">{task.client}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {task.priority === 'high' && <span className="text-[10px] font-bold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded">ALTA</span>}
                                        <div className="flex -space-x-2">
                                            {task.teamMembers.map((m, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border border-[#0f172a] flex items-center justify-center text-[8px] text-white">
                                                    {m[0]}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="material-symbols-outlined text-slate-600 group-hover:text-white text-lg cursor-pointer">more_horiz</span>
                                    </div>
                                </div>
                            ))}
                            {tasks.filter(t => t.status === activeTab).length === 0 && (
                                <p className="text-slate-500 text-sm text-center py-4">Nenhuma tarefa nesta etapa.</p>
                            )}
                        </div>
                    </div>

                    {/* AI PROPOSAL GENERATOR - ENHANCED */}
                    <div className="bg-[#1e293b] rounded-xl border border-white/5 p-1 relative overflow-hidden flex flex-col">
                        <div className="bg-[#242c3d] p-3 rounded-t-lg flex justify-between items-center border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <img src="https://ui-avatars.com/api/?name=Director+AI&background=0ea5e9&color=fff" className="w-8 h-8 rounded-full shadow-lg" alt="AI" />
                                <div>
                                    <span className="font-bold text-white text-sm block">Diretor de Operações IA</span>
                                    <span className="text-[10px] text-slate-400">Especialista em Agências • RAG Ativo</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`px-2 py-1 rounded text-xs border transition-colors flex items-center gap-1 ${ragFileName ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/10 border-white/10 text-slate-300 hover:bg-white/20'}`}
                                    title="Carregar Tabela de Preços/Contexto (PDF/TXT)"
                                >
                                    <span className="material-symbols-outlined text-[14px]">{ragFileName ? 'check' : 'upload_file'}</span>
                                    {ragFileName ? 'Contexto OK' : 'Add Contexto'}
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
                            </div>
                        </div>
                        
                        <div className="p-4 bg-[#18212f]">
                             {!generatedProposal ? (
                                <>
                                    <div className="flex gap-2 mb-2">
                                        <span className="material-symbols-outlined text-slate-400 text-lg">chat_bubble</span>
                                        <p className="text-sm text-slate-300">Descreva o briefing do cliente. Se tiver uma tabela de preços, faça o upload acima para eu usar como base!</p>
                                    </div>
                                    <textarea 
                                        className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-slate-600 resize-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none"
                                        rows={4}
                                        placeholder="Ex: Cliente 'TechSolution' precisa de um site institucional, SEO e gestão de redes sociais. Orçamento flexível."
                                        value={proposalInput}
                                        onChange={(e) => setProposalInput(e.target.value)}
                                        disabled={isGeneratingProposal}
                                    />
                                    <button 
                                        onClick={handleGenerateProposal} 
                                        disabled={isGeneratingProposal || !proposalInput.trim()}
                                        className="w-full mt-3 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isGeneratingProposal ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin text-sm">settings</span>
                                                Montando Equipe & Orçamento...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                Gerar Proposta Detalhada
                                            </>
                                        )}
                                    </button>
                                </>
                             ) : (
                                 <div className="animate-in fade-in slide-in-from-bottom-4">
                                     <div className="flex justify-between items-center mb-3">
                                         <h4 className="text-sm font-bold text-white">Proposta: <span className="text-[#2563eb]">{generatedProposal.clientName}</span></h4>
                                         <div className="flex gap-2">
                                             <button onClick={handleExportCSV} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Exportar CSV"><span className="material-symbols-outlined text-sm">csv</span></button>
                                             <button onClick={handleExportPDF} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Exportar PDF"><span className="material-symbols-outlined text-sm">picture_as_pdf</span></button>
                                             <button onClick={() => setGeneratedProposal(null)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Nova"><span className="material-symbols-outlined text-sm">refresh</span></button>
                                         </div>
                                     </div>
                                     
                                     {/* Summary */}
                                     <p className="text-xs text-slate-400 mb-4 italic border-l-2 border-[#2563eb] pl-2">{generatedProposal.executiveSummary}</p>
                                     
                                     {/* Team */}
                                     <div className="mb-4">
                                         <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Squad Sugerido</span>
                                         <div className="flex flex-wrap gap-2 mt-1">
                                             {generatedProposal.teamStructure.map((role, idx) => (
                                                 <div key={idx} className="bg-[#0f172a] px-2 py-1 rounded border border-white/5 flex items-center gap-2">
                                                     <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] text-white font-bold">{role.role[0]}</div>
                                                     <div className="flex flex-col">
                                                         <span className="text-[10px] font-bold text-white">{role.role}</span>
                                                         <span className="text-[8px] text-slate-500">{role.seniority} • {role.allocation}</span>
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>

                                     {/* Options */}
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                         {generatedProposal.options.map((opt, idx) => (
                                             <div key={idx} className={`bg-[#0f172a] p-3 rounded-lg border relative overflow-hidden ${opt.isRecommended ? 'border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.1)]' : 'border-white/5'}`}>
                                                 {opt.isRecommended && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-bl">RECOMENDADO</div>}
                                                 <span className={`text-[10px] font-bold uppercase mb-1 block ${opt.isRecommended ? 'text-yellow-500' : 'text-slate-400'}`}>{opt.name}</span>
                                                 <div className="text-lg font-bold text-white">{opt.price}</div>
                                                 <div className="text-[10px] text-slate-500">{opt.timeline}</div>
                                                 <div className="mt-2 flex flex-wrap gap-1">
                                                     {opt.techStack.slice(0,3).map((t, i) => (
                                                         <span key={i} className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-slate-400">{t}</span>
                                                     ))}
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN (Narrow) */}
                <div className="flex flex-col gap-6">
                    
                    {/* Service Costs */}
                    <div className="bg-[#1e293b] rounded-xl border border-white/5 p-5">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white text-sm">Tabela de Preços (Base)</h3>
                            <span className="material-symbols-outlined text-slate-500 text-lg">more_horiz</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center p-2 bg-[#0f172a] rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-orange-500">campaign</span>
                                    <span className="text-sm text-slate-200">Gestão Ads</span>
                                </div>
                                <span className="text-xs font-mono text-slate-400">R$ 1.5k/mês</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-[#0f172a] rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-500">brush</span>
                                    <span className="text-sm text-slate-200">Branding</span>
                                </div>
                                <span className="text-xs font-mono text-slate-400">R$ 4.0k</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-[#0f172a] rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-500">smart_toy</span>
                                    <span className="text-sm text-slate-200">Automação IA</span>
                                </div>
                                <span className="text-xs font-mono text-slate-400">R$ 2.5k</span>
                            </div>
                        </div>
                    </div>

                    {/* Team */}
                    <div className="bg-[#1e293b] rounded-xl border border-white/5 p-5">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white text-sm">Equipe do Projeto</h3>
                            <span className="material-symbols-outlined text-slate-500 text-lg">more_horiz</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                <img src="https://ui-avatars.com/api/?name=Lucas&background=random" className="w-8 h-8 rounded-full" />
                                <div>
                                    <p className="text-sm font-bold text-white">Lucas</p>
                                    <p className="text-[10px] text-slate-400">Engenheiro Full Stack</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                <img src="https://ui-avatars.com/api/?name=Ana&background=random" className="w-8 h-8 rounded-full" />
                                <div>
                                    <p className="text-sm font-bold text-white">Ana</p>
                                    <p className="text-[10px] text-slate-400">UX / UI Designer</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                <img src="https://ui-avatars.com/api/?name=Ricardo&background=random" className="w-8 h-8 rounded-full" />
                                <div>
                                    <p className="text-sm font-bold text-white">Ricardo</p>
                                    <p className="text-[10px] text-slate-400">DevOps</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-3 bg-[#1e293b] border border-white/10 hover:bg-[#283548] text-slate-300 font-bold rounded-xl flex items-center justify-between px-4 transition-all">
                        <div className="flex items-center gap-2">
                             <span className="material-symbols-outlined text-sm">download</span>
                             <span className="text-sm">Exportar Relatórios CSV</span>
                        </div>
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>

                     {/* Recent Budgets */}
                     <div className="bg-[#1e293b] rounded-xl border border-white/5 p-5">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white text-sm">Orçamentos Recentes</h3>
                            <div className="flex gap-1">
                                <span className="bg-[#0f172a] text-[9px] px-1.5 py-0.5 rounded text-slate-400 border border-white/10">Mes</span>
                                <span className="bg-[#0f172a] text-[9px] px-1.5 py-0.5 rounded text-slate-400 border border-white/10">Ano</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                             <div className="flex justify-between items-start">
                                 <div className="flex gap-2">
                                     <div className="w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center text-yellow-500"><span className="material-symbols-outlined text-sm">shopping_bag</span></div>
                                     <div>
                                         <p className="text-xs text-white font-bold">E-commerce Fulano</p>
                                         <p className="text-[9px] text-slate-500">Em definição...</p>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-xs text-[#16a34a] font-bold">R$ 12.500,00</p>
                                     <p className="text-[9px] text-slate-500">Aprovado Hoje</p>
                                 </div>
                             </div>
                             
                             <div className="flex justify-between items-start">
                                 <div className="flex gap-2">
                                     <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-500"><span className="material-symbols-outlined text-sm">api</span></div>
                                     <div>
                                         <p className="text-xs text-white font-bold">Hub API Empresa</p>
                                         <p className="text-[9px] text-slate-500">Tps Balanceado</p>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-xs text-[#16a34a] font-bold">Rejeitado</p>
                                     <p className="text-[9px] text-slate-500">Securado Hoje</p>
                                 </div>
                             </div>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    </div>
  );
};

export default DashboardView;
