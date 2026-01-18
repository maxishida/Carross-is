
import React, { useState, useRef } from 'react';
import { AgencyTask, AgencyProposal } from '../types';
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

  // Mock Data
  const tasks: AgencyTask[] = [
      { id: '1', title: 'Design de Login', client: 'GreenEnergy', status: 'backlog', priority: 'high', teamMembers: ['Ana'] },
      { id: '2', title: 'API de Pagamento', client: 'E-Shop', status: 'progress', priority: 'medium', teamMembers: ['Lucas', 'Ricardo'] },
      { id: '3', title: 'Integração Tumaca', client: 'Logistica X', status: 'done', priority: 'low', teamMembers: ['Lucas', 'Ana', 'Ricardo'] },
      { id: '4', title: 'API de pagamento', client: 'Loja Z', status: 'backlog', priority: 'medium', teamMembers: ['Lucas'] },
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
          alert("Falha ao gerar proposta.");
      } finally {
          setIsGeneratingProposal(false);
      }
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

  const handleExportCSV = () => {
      if (!generatedProposal) return;
      const headers = ["Opção", "Preço", "Prazo", "Stack"];
      const rows = generatedProposal.options.map(opt => [opt.name, opt.price, opt.timeline, opt.techStack.join(';')]);
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `Orcamento.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 z-10 shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-fuchsia-500/20 p-2 rounded-lg text-fuchsia-400">
                    <i className="fa-solid fa-rocket"></i>
                </div>
                <h1 className="font-bold text-white tracking-tight text-2xl">Painel da Agência</h1>
            </div>
            
            <div className="flex-1 max-w-lg mx-8 relative">
                <i className="fa-solid fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
                <input 
                    className="w-full pl-10 pr-4 py-2.5 rounded-full bg-black/30 border border-white/10 text-sm placeholder-gray-400 focus:ring-1 focus:ring-fuchsia-500 transition-all text-white outline-none" 
                    placeholder="Procurar projetos, clientes ou tarefas..." 
                    type="text"
                />
            </div>

            <div className="flex items-center gap-4">
                <button className="w-10 h-10 rounded-full glass-panel-light flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <i className="fa-regular fa-circle-question"></i>
                </button>
                <button className="w-10 h-10 rounded-full glass-panel-light flex items-center justify-center text-gray-400 hover:text-white transition-colors relative">
                    <i className="fa-regular fa-bell"></i>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0f0c1d]"></span>
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
                {/* KPI 1 */}
                <article className="glass-panel rounded-2xl p-5 flex items-start justify-between relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
                            <i className="fa-solid fa-clipboard-check"></i> Tarefas de Hoje
                        </div>
                        <div className="font-bold text-white mb-1 text-4xl">4 Pendentes</div>
                        <div className="text-xs text-gray-500">4 Alta Prioridade</div>
                    </div>
                    <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20 text-purple-400">
                        <i className="fa-solid fa-list-check text-xl"></i>
                    </div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl group-hover:bg-purple-600/30 transition-all"></div>
                </article>

                {/* KPI 2 */}
                <article className="glass-panel rounded-2xl p-5 flex items-start justify-between relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
                            <i className="fa-regular fa-calendar"></i> Próxima Reunião
                        </div>
                        <div className="text-xl font-bold text-white mb-1 mt-1">Amanhã <span className="text-sm bg-white/10 px-2 py-0.5 rounded text-gray-300 ml-1">10:40</span></div>
                        <div className="text-xs text-gray-500 mt-2 truncate">Meeting com Cliente GreenEnergy</div>
                    </div>
                    <div className="bg-fuchsia-500/10 p-3 rounded-xl border border-fuchsia-500/20 text-fuchsia-400">
                        <i className="fa-regular fa-calendar text-xl"></i>
                    </div>
                </article>

                {/* KPI 3 */}
                <article className="glass-panel rounded-2xl p-5 flex items-start justify-between relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
                            <i className="fa-solid fa-folder-open"></i> Orçamentos Ativos
                        </div>
                        <div className="font-bold text-white mb-1 text-4xl">3 <span className="text-base font-normal text-gray-400">Em Andamento</span></div>
                        <div className="text-xs text-gray-500">Aprovado 1 | Aguardando 1</div>
                    </div>
                    <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 text-indigo-400">
                        <i className="fa-solid fa-file-invoice-dollar text-xl"></i>
                    </div>
                </article>

                {/* KPI 4 */}
                <article className="glass-panel rounded-2xl p-5 flex items-start justify-between relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
                            <i className="fa-solid fa-money-bill-wave"></i> Receita Estimada Mês
                        </div>
                        <div className="font-bold text-white mb-1 text-4xl">R$ 2.950,00</div>
                        <div className="text-xs text-emerald-400">Aprovado 1 + Enviado 1</div>
                    </div>
                    <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400">
                        <i className="fa-solid fa-sack-dollar text-xl"></i>
                    </div>
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none"></div>
                </article>
            </section>

            {/* Project Progress */}
            <section className="glass-panel rounded-2xl p-1 mb-8 flex items-center gap-4 relative overflow-hidden">
                <button className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 rounded-xl text-white font-semibold text-sm shadow-lg shadow-purple-500/20 z-10 flex items-center gap-2 hover:brightness-110 transition-all">
                    <i className="fa-solid fa-bolt"></i> Projeto em Execução
                </button>
                <div className="flex-1 flex items-center gap-4 pr-6 z-10">
                    <span className="text-gray-400 text-xs font-medium">Fase 2 Ajustes</span>
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full mx-4 relative">
                        <div className="absolute top-0 left-0 h-full w-2/3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                    </div>
                    <span className="text-gray-500 text-xs"><i className="fa-solid fa-lock mr-1"></i> Fase 3 Final</span>
                    <i className="fa-solid fa-ellipsis text-gray-500 cursor-pointer hover:text-white"></i>
                </div>
            </section>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Tasks */}
                    <div className="glass-panel rounded-2xl p-6 min-h-[300px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-white">Minhas Tarefas</h2>
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-gear text-gray-400 hover:text-white cursor-pointer transition-colors"></i>
                                <i className="fa-solid fa-chevron-right text-gray-400 hover:text-white cursor-pointer transition-colors"></i>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 border-b border-white/10 mb-4 pb-2 text-sm">
                            <button onClick={() => setActiveTab('backlog')} className={`font-medium pb-2 -mb-2.5 ${activeTab === 'backlog' ? 'text-white border-b-2 border-fuchsia-500' : 'text-gray-500 hover:text-white'}`}>Backlog</button>
                            <button onClick={() => setActiveTab('progress')} className={`font-medium pb-2 -mb-2.5 ${activeTab === 'progress' ? 'text-white border-b-2 border-fuchsia-500' : 'text-gray-500 hover:text-white'}`}>Em Progresso</button>
                            <button onClick={() => setActiveTab('done')} className={`font-medium pb-2 -mb-2.5 ${activeTab === 'done' ? 'text-white border-b-2 border-fuchsia-500' : 'text-gray-500 hover:text-white'}`}>Concluído</button>
                        </div>
                        <div className="space-y-3">
                            {tasks.filter(t => t.status === activeTab).map(task => (
                                <div key={task.id} className="glass-panel-light p-3 rounded-lg flex items-center justify-between group hover:bg-white/5 transition-colors cursor-pointer border-l-2 border-l-transparent hover:border-l-fuchsia-500">
                                    <div className="flex items-center gap-4">
                                        <input className="rounded border-gray-600 bg-transparent text-fuchsia-500 focus:ring-0 focus:ring-offset-0 w-4 h-4" type="checkbox"/>
                                        <div>
                                            <h4 className="text-sm font-medium text-white group-hover:text-fuchsia-200 transition-colors">{task.title}</h4>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">{task.client}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {task.priority === 'high' && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">ALTA</span>}
                                        <div className="flex -space-x-2">
                                            {task.teamMembers.map((m, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold border border-[#0f0c1d]">{m[0]}</div>
                                            ))}
                                        </div>
                                        <i className="fa-solid fa-ellipsis text-gray-500"></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Budget Generator (Functional) */}
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
                                        <button onClick={handleExportCSV} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="CSV"><i className="fa-solid fa-file-csv"></i></button>
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
                    {/* Pricing Table */}
                    <div className="glass-panel rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white">Tabela de Preços (Base)</h3>
                            <i className="fa-solid fa-ellipsis text-gray-500"></i>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-2 text-gray-300"><i className="fa-solid fa-bullhorn text-orange-400 w-4"></i> Gestão Ads</div>
                                <span className="text-gray-400">R$ 1.5k/mês</span>
                            </li>
                            <li className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-2 text-gray-300"><i className="fa-solid fa-pen-nib text-blue-400 w-4"></i> Branding</div>
                                <span className="text-gray-400">R$ 4.0k</span>
                            </li>
                            <li className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-2 text-gray-300"><i className="fa-solid fa-microchip text-purple-400 w-4"></i> Automação IA</div>
                                <span className="text-gray-400">R$ 2.5k</span>
                            </li>
                        </ul>
                    </div>

                    {/* Team List */}
                    <div className="glass-panel rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white">Equipe do Projeto</h3>
                            <i className="fa-solid fa-ellipsis text-gray-500"></i>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden"><img alt="Lucas" className="w-full h-full object-cover" src="https://ui-avatars.com/api/?name=Lucas&background=random"/></div>
                                <div className="flex flex-col"><span className="text-xs font-medium text-white">Lucas</span><span className="text-[10px] text-gray-500">Engenheiro Full Stack</span></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden"><img alt="Ana" className="w-full h-full object-cover" src="https://ui-avatars.com/api/?name=Ana&background=random"/></div>
                                <div className="flex flex-col"><span className="text-xs font-medium text-white">Ana</span><span className="text-[10px] text-gray-500">UX / UI Designer</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Export Button */}
                    <button onClick={handleExportCSV} className="w-full glass-panel-light py-3 rounded-xl flex items-center justify-between px-4 text-xs font-medium text-white hover:bg-white/10 transition-colors border border-white/10">
                        <span className="flex items-center gap-2"><i className="fa-solid fa-download"></i> Exportar Relatórios CSV</span>
                        <i className="fa-solid fa-chevron-right text-gray-500"></i>
                    </button>

                    {/* Recent Budgets */}
                    <div className="glass-panel rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white">Orçamentos Recentes</h3>
                            <div className="flex gap-1">
                                <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px] text-white">Mês</span>
                                <span className="text-[9px] text-gray-500 px-1.5 py-0.5">Ano</span>
                            </div>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-[10px]"><i className="fa-solid fa-store"></i></div>
                                    <div className="flex flex-col"><span className="text-white font-medium">Ecommerce Fulano</span><span className="text-[9px] text-gray-500">Opção Premium</span></div>
                                </div>
                                <div className="text-right"><div className="text-emerald-400 font-bold">R$ 15.000</div><div className="text-[9px] text-gray-500">Aprovado (12)</div></div>
                            </li>
                            <li className="flex items-center justify-between text-xs pt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]"><i className="fa-solid fa-building"></i></div>
                                    <div className="flex flex-col"><span className="text-white font-medium">Web App Empresa</span><span className="text-[9px] text-gray-500">Tio Engenheiro</span></div>
                                </div>
                                <div className="text-right"><div className="text-gray-400 font-bold">Pendente</div><div className="text-[9px] text-gray-500">Secsode bot</div></div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;
