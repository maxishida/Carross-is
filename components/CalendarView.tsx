import React, { useState, useMemo } from 'react';
import { CalendarEvent } from '../types';
import { useAgency } from '../context/AgencyContext';

const CalendarView: React.FC = () => {
    const { events, tasks, projects, addEvent, team } = useAgency();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    
    // --- INTEGRATION LOGIC: MERGE EVENTS, TASKS, PROJECTS ---
    const mergedEvents = useMemo(() => {
        const rawEvents = [...events];
        
        // Convert Tasks with deadlines to Events
        tasks.forEach(task => {
            if (task.deadline) {
                rawEvents.push({
                    id: `task-${task.id}`,
                    title: `Entrega: ${task.title}`,
                    start: task.deadline,
                    end: new Date(new Date(task.deadline).getTime() + 3600000).toISOString(), // Assume 1h
                    type: 'task',
                    description: `Cliente: ${task.client} | Status: ${task.status}`
                });
            }
        });

        // Convert Project Deadlines/Payments
        projects.forEach(proj => {
            if (proj.deadline && proj.deadline !== 'Indefinido') {
                // Try parse
                const date = new Date(proj.deadline);
                if (!isNaN(date.getTime())) {
                    rawEvents.push({
                        id: `proj-${proj.id}`,
                        title: `Deadline: ${proj.name}`,
                        start: date.toISOString(),
                        end: new Date(date.getTime() + 3600000).toISOString(),
                        type: 'deadline',
                        projectId: proj.id
                    });
                }
            }
            if (proj.finance?.nextPaymentDate) {
                 const pDate = new Date(proj.finance.nextPaymentDate);
                 if (!isNaN(pDate.getTime())) {
                    rawEvents.push({
                        id: `pay-${proj.id}`,
                        title: `Pagamento: ${proj.name}`,
                        start: pDate.toISOString(),
                        end: new Date(pDate.getTime() + 3600000).toISOString(),
                        type: 'other',
                        description: 'Cobrança prevista'
                    });
                 }
            }
        });

        return rawEvents;
    }, [events, tasks, projects]);

    // Navigation
    const next = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
        if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const prev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
        if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    // --- FILTER EVENTS FOR CURRENT VIEW ---
    const getEventsForDay = (date: Date) => {
        return mergedEvents.filter(e => {
            const eDate = new Date(e.start);
            return eDate.getDate() === date.getDate() && 
                   eDate.getMonth() === date.getMonth() && 
                   eDate.getFullYear() === date.getFullYear();
        }).sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    };

    // --- HELPERS ---
    const getEventColor = (type: CalendarEvent['type']) => {
        switch(type) {
            case 'meeting': return 'bg-purple-600/30 border-purple-500 text-purple-200';
            case 'task': return 'bg-blue-600/30 border-blue-500 text-blue-200';
            case 'deadline': return 'bg-red-600/30 border-red-500 text-red-200';
            default: return 'bg-emerald-600/30 border-emerald-500 text-emerald-200';
        }
    };

    const getIcon = (type: CalendarEvent['type']) => {
        switch(type) {
            case 'meeting': return 'groups';
            case 'task': return 'check_circle';
            case 'deadline': return 'flag';
            default: return 'attach_money';
        }
    };

    return (
        <div className="flex flex-col h-full text-white overflow-hidden">
            {/* Header */}
            <header className="flex justify-between items-center px-6 py-4 border-b border-white/5 shrink-0 bg-[#1e1b2e]/50 backdrop-blur">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={prev} className="p-1 hover:bg-white/10 rounded"><i className="fa-solid fa-chevron-left"></i></button>
                        <h2 className="text-xl font-bold w-48 text-center">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={next} className="p-1 hover:bg-white/10 rounded"><i className="fa-solid fa-chevron-right"></i></button>
                    </div>
                    <button onClick={goToToday} className="text-xs bg-white/10 px-3 py-1.5 rounded hover:bg-white/20">Hoje</button>
                </div>

                <div className="flex bg-black/30 rounded-lg p-1 border border-white/5">
                    <button onClick={() => setViewMode('day')} className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${viewMode === 'day' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Dia</button>
                    <button onClick={() => setViewMode('week')} className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${viewMode === 'week' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Semana</button>
                    <button onClick={() => setViewMode('month')} className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${viewMode === 'month' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Mês</button>
                </div>
            </header>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                
                {/* --- DAY VIEW (DETAILED) --- */}
                {viewMode === 'day' && (
                    <div className="flex gap-6 h-full">
                        {/* LEFT: SUMMARY */}
                        <div className="w-1/3 flex flex-col gap-6">
                            <div className="glass-panel p-6 rounded-2xl">
                                <h3 className="text-4xl font-bold text-white mb-1">{currentDate.getDate()}</h3>
                                <p className="text-lg text-purple-400 font-medium uppercase tracking-wide mb-6">
                                    {currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                </p>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><i className="fa-solid fa-video"></i></div>
                                            <span className="text-sm font-bold">Reuniões</span>
                                        </div>
                                        <span className="text-xl font-bold">{getEventsForDay(currentDate).filter(e => e.type === 'meeting').length}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><i className="fa-solid fa-list-check"></i></div>
                                            <span className="text-sm font-bold">Tasks</span>
                                        </div>
                                        <span className="text-xl font-bold">{getEventsForDay(currentDate).filter(e => e.type === 'task').length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-panel p-5 rounded-2xl flex-1">
                                <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Equipe Disponível</h4>
                                <div className="space-y-3">
                                    {team.slice(0,4).map(member => (
                                        <div key={member.id} className="flex items-center gap-3">
                                            <div className="relative">
                                                <img src={member.avatar} className="w-8 h-8 rounded-full" />
                                                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#1e1b2e] ${member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-white">{member.name}</span>
                                                <span className="text-[10px] text-slate-500">{member.role}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: TIMELINE */}
                        <div className="flex-1 glass-panel rounded-2xl p-6 overflow-y-auto">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <i className="fa-regular fa-clock text-purple-400"></i> Timeline
                            </h3>
                            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                                {getEventsForDay(currentDate).map((event, idx) => (
                                    <div key={idx} className="relative pl-10 group">
                                        <div className="absolute left-[11px] top-4 w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-[#1e1b2e] z-10 group-hover:scale-125 transition-transform"></div>
                                        <div className={`p-4 rounded-xl border border-l-4 transition-all hover:translate-x-1 ${getEventColor(event.type)}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-sm">{event.title}</h4>
                                                <span className="material-symbols-outlined text-lg opacity-50">{getIcon(event.type)}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs opacity-80 mb-2">
                                                <span className="font-mono">
                                                    {new Date(event.start).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                                {event.description && <span>• {event.description}</span>}
                                            </div>
                                            {event.projectId && (
                                                <span className="inline-block text-[9px] font-bold bg-black/20 px-2 py-0.5 rounded uppercase tracking-wide">
                                                    Projeto Vinculado
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {getEventsForDay(currentDate).length === 0 && (
                                    <div className="pl-10 py-10 text-slate-500 italic text-sm">
                                        Agenda livre para hoje. Aproveite para criar!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MONTH VIEW --- */}
                {viewMode === 'month' && (
                    <div className="grid grid-cols-7 gap-1 h-full">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                            <div key={d} className="text-center text-xs font-bold text-slate-500 uppercase py-2">{d}</div>
                        ))}
                        {Array.from({length: 35}).map((_, i) => {
                            // Simple logic to fill grid (offset logic simplified for demo)
                            const day = i - new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 1;
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const isToday = date.toDateString() === new Date().toDateString();
                            const dayEvents = getEventsForDay(date);

                            return (
                                <div 
                                    key={i} 
                                    onClick={() => { setCurrentDate(date); setViewMode('day'); }}
                                    className={`min-h-[100px] border border-white/5 bg-white/[0.02] p-2 hover:bg-white/5 transition-colors cursor-pointer flex flex-col gap-1 rounded-lg ${day <= 0 ? 'opacity-30' : ''}`}
                                >
                                    <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>
                                        {date.getDate()}
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                        {dayEvents.slice(0, 3).map((ev, idx) => (
                                            <div key={idx} className={`text-[9px] px-1 py-0.5 rounded truncate border-l-2 ${getEventColor(ev.type)}`}>
                                                {ev.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <span className="text-[9px] text-slate-500 text-center">+ {dayEvents.length - 3}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* --- WEEK VIEW (Simplified Grid) --- */}
                {viewMode === 'week' && (
                    <div className="grid grid-cols-7 gap-4 h-full">
                        {Array.from({length: 7}).map((_, i) => {
                            // Calculate week start (Sunday)
                            const startOfWeek = new Date(currentDate);
                            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                            
                            const date = new Date(startOfWeek);
                            date.setDate(startOfWeek.getDate() + i);
                            
                            const isToday = date.toDateString() === new Date().toDateString();
                            const dayEvents = getEventsForDay(date);

                            return (
                                <div key={i} className="flex flex-col h-full bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                                    <div className={`p-3 text-center border-b border-white/5 ${isToday ? 'bg-purple-600/20' : ''}`}>
                                        <span className="text-xs text-slate-400 block uppercase">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                        <span className={`text-lg font-bold ${isToday ? 'text-purple-400' : 'text-white'}`}>{date.getDate()}</span>
                                    </div>
                                    <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                                        {dayEvents.map((ev, idx) => (
                                            <div key={idx} className={`p-2 rounded border-l-2 text-[10px] ${getEventColor(ev.type)}`}>
                                                <div className="font-bold truncate">{ev.title}</div>
                                                <div className="opacity-70">{new Date(ev.start).getHours()}h</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

            </div>
        </div>
    );
};

export default CalendarView;