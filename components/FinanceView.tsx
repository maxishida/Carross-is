
import React, { useState, useRef } from 'react';
import { useAgency } from '../context/AgencyContext';
import { analyzeFinanceData, extractTextFromFile, parseFinanceFile } from '../services/geminiService';

const FinanceView: React.FC = () => {
    const { finance, addTransaction, addToast } = useAgency();
    
    // UI State
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Derived Stats
    const income = finance.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = finance.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = income - expense;
    const margin = income > 0 ? ((balance / income) * 100).toFixed(1) : '0';

    const handleExportCSV = () => {
        const headers = ["Descrição", "Categoria", "Data", "Status", "Tipo", "Valor"];
        const rows = finance.map(f => [f.description, f.category, f.date, f.status, f.type, f.amount.toString()]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = "financeiro_agencia.csv";
        link.click();
    };

    const handleAskAI = async () => {
        if(!aiQuery.trim()) return;
        setIsAnalyzing(true);
        setAiResponse('');
        try {
            const response = await analyzeFinanceData(finance, aiQuery);
            setAiResponse(response);
        } catch(e) {
            setAiResponse("Erro ao analisar dados.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        
        addToast('Lendo arquivo financeiro...', 'info');
        try {
            const text = await extractTextFromFile(file);
            const newItems = await parseFinanceFile(text);
            if(newItems.length > 0) {
                newItems.forEach(item => addTransaction(item));
                addToast(`${newItems.length} transações importadas!`, 'success');
            } else {
                addToast('Nenhuma transação encontrada no arquivo.', 'error');
            }
        } catch(e) {
            addToast('Erro ao processar arquivo.', 'error');
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden text-slate-200 relative">
            
            {/* AI CHAT OVERLAY */}
            {isAiChatOpen && (
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#1e1b2e] border-l border-white/10 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-emerald-900/20">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-400">smart_toy</span>
                            <h3 className="font-bold text-white">Analista Financeiro</h3>
                        </div>
                        <button onClick={() => setIsAiChatOpen(false)}><span className="material-symbols-outlined text-slate-400 hover:text-white">close</span></button>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {aiResponse ? (
                            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{aiResponse}</div>
                        ) : (
                            <div className="text-center text-slate-500 mt-10">
                                <span className="material-symbols-outlined text-4xl mb-2">query_stats</span>
                                <p className="text-xs">Pergunte sobre lucros, gastos por categoria ou tendências.</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-white/5">
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 glass-input rounded-lg p-2 text-xs" 
                                placeholder="Ex: Qual o lucro deste mês?"
                                value={aiQuery}
                                onChange={e => setAiQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                            />
                            <button 
                                onClick={handleAskAI}
                                disabled={isAnalyzing}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-colors"
                            >
                                {isAnalyzing ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">send</span>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-transparent backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <span className="material-symbols-outlined text-white text-lg">attach_money</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Financeiro</h2>
                        <p className="text-[10px] text-slate-400">Fluxo de caixa inteligente</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsAiChatOpen(!isAiChatOpen)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${isAiChatOpen ? 'bg-emerald-500 text-white border-emerald-500' : 'glass-panel-light text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'}`}
                    >
                        <span className="material-symbols-outlined text-sm align-middle mr-1">smart_toy</span>
                        IA Analyst
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="glass-panel-light hover:bg-white/10 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center"
                    >
                        <span className="material-symbols-outlined text-sm align-middle mr-1">upload_file</span>
                        Importar
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt,.pdf" onChange={handleFileUpload} />
                    
                    <button onClick={handleExportCSV} className="glass-panel-light hover:bg-white/10 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center">
                        <span className="material-symbols-outlined text-sm align-middle mr-1">download</span>
                        CSV
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="glass-panel rounded-xl p-5 border border-white/5 shadow-lg relative overflow-hidden group">
                        <p className="text-xs font-bold text-slate-400 uppercase relative z-10">Receita Total</p>
                        <h3 className="text-2xl font-bold text-white mt-1 relative z-10">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income)}
                        </h3>
                        <div className="absolute right-[-10px] top-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity"><span className="material-symbols-outlined text-8xl text-emerald-500">payments</span></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
                    </div>
                    
                    <div className="glass-panel rounded-xl p-5 border border-white/5 shadow-lg relative overflow-hidden group">
                        <p className="text-xs font-bold text-slate-400 uppercase relative z-10">Despesas</p>
                        <h3 className="text-2xl font-bold text-white mt-1 relative z-10">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense)}
                        </h3>
                        <div className="absolute right-[-10px] top-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity"><span className="material-symbols-outlined text-8xl text-red-500">money_off</span></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"></div>
                    </div>

                    <div className="glass-panel rounded-xl p-5 border border-white/5 shadow-lg relative overflow-hidden group">
                        <p className="text-xs font-bold text-blue-300 uppercase relative z-10">Lucro Líquido</p>
                        <h3 className="text-2xl font-bold text-white mt-1 relative z-10">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                        </h3>
                        <span className="text-[10px] text-blue-300 flex items-center gap-1 mt-2 relative z-10">
                            Margem de {margin}%
                        </span>
                        <div className="absolute right-[-10px] top-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity"><span className="material-symbols-outlined text-8xl text-blue-500">savings</span></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-white/5">
                        <h3 className="font-bold text-white text-sm">Lançamentos</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-xs text-slate-400 uppercase font-bold">
                                <tr>
                                    <th className="px-4 py-3">Descrição</th>
                                    <th className="px-4 py-3">Categoria</th>
                                    <th className="px-4 py-3">Data</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {finance.map(item => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-medium text-white">{item.description}</td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">{item.category}</td>
                                        <td className="px-4 py-3 text-slate-400 text-xs font-mono">{item.date}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-opacity-10 border-opacity-30 
                                                ${item.status === 'paid' ? 'bg-emerald-500 text-emerald-400 border-emerald-500' : 
                                                item.status === 'pending' ? 'bg-yellow-500 text-yellow-400 border-yellow-500' : 
                                                'bg-red-500 text-red-400 border-red-500'}`}>
                                                {item.status === 'paid' ? 'Pago' : item.status === 'pending' ? 'Pendente' : 'Atrasado'}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 text-right font-mono font-bold ${item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {item.type === 'expense' ? '- ' : '+ '}
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FinanceView;
