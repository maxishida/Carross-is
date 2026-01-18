
import React from 'react';
import { FinanceItem } from '../types';

const FinanceView: React.FC = () => {
    const transactions: FinanceItem[] = [
        { id: '1', description: 'Entrada: Projeto E-commerce', amount: 12500, type: 'income', status: 'paid', date: '10/10/2024', category: 'Projeto' },
        { id: '2', description: 'Assinatura API Gemini', amount: 150, type: 'expense', status: 'paid', date: '12/10/2024', category: 'Software' },
        { id: '3', description: 'Pagamento: Ana (Designer)', amount: 4000, type: 'expense', status: 'pending', date: '15/10/2024', category: 'Equipe' },
        { id: '4', description: 'Entrada: Consultoria SEO', amount: 3500, type: 'income', status: 'overdue', date: '05/10/2024', category: 'Consultoria' },
        { id: '5', description: 'Servidor AWS', amount: 800, type: 'expense', status: 'paid', date: '01/10/2024', category: 'Infra' },
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#0f172a] text-slate-200">
            <header className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#1e293b]/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-lg">attach_money</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Financeiro</h2>
                        <p className="text-[10px] text-slate-400">Fluxo de caixa e lançamentos</p>
                    </div>
                </div>
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                    <span className="material-symbols-outlined text-sm">download</span>
                    Relatório
                </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#1e293b] rounded-xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
                        <p className="text-xs font-bold text-slate-400 uppercase">Receita (Mês)</p>
                        <h3 className="text-2xl font-bold text-white mt-1">R$ 42.500,00</h3>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-2">
                            <span className="material-symbols-outlined text-sm">trending_up</span> +12% vs mês anterior
                        </span>
                        <div className="absolute right-0 top-0 p-4 opacity-10"><span className="material-symbols-outlined text-6xl text-emerald-500">payments</span></div>
                    </div>
                    
                    <div className="bg-[#1e293b] rounded-xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
                        <p className="text-xs font-bold text-slate-400 uppercase">Despesas (Mês)</p>
                        <h3 className="text-2xl font-bold text-white mt-1">R$ 18.200,00</h3>
                        <span className="text-[10px] text-red-400 flex items-center gap-1 mt-2">
                            <span className="material-symbols-outlined text-sm">trending_up</span> +5% vs mês anterior
                        </span>
                        <div className="absolute right-0 top-0 p-4 opacity-10"><span className="material-symbols-outlined text-6xl text-red-500">money_off</span></div>
                    </div>

                    <div className="bg-[#1e293b] rounded-xl p-5 border border-white/5 shadow-lg relative overflow-hidden bg-gradient-to-br from-indigo-900/20 to-blue-900/20">
                        <p className="text-xs font-bold text-blue-300 uppercase">Lucro Líquido</p>
                        <h3 className="text-2xl font-bold text-white mt-1">R$ 24.300,00</h3>
                        <span className="text-[10px] text-blue-300 flex items-center gap-1 mt-2">
                            Margem de 57%
                        </span>
                        <div className="absolute right-0 top-0 p-4 opacity-10"><span className="material-symbols-outlined text-6xl text-blue-500">savings</span></div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-[#1e293b] rounded-xl border border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-white/5">
                        <h3 className="font-bold text-white text-sm">Últimos Lançamentos</h3>
                        <button className="text-xs text-primary hover:text-white font-bold">Ver Todos</button>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0f172a] text-xs text-slate-400 uppercase font-bold">
                            <tr>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3">Categoria</th>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.map(item => (
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
    );
};

export default FinanceView;
