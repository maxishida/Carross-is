import React from 'react';
import { HistoryItem, VisualStyleType } from '../types';

const MOCK_HISTORY: HistoryItem[] = [
    { id: '1', topic: 'Dicas de Saúde Mental para Devs', slideCount: 5, createdAt: '2 horas atrás', style: VisualStyleType.MINIMAL_DARK },
    { id: '2', topic: 'Funil de Vendas B2B', slideCount: 8, createdAt: 'Ontem', style: VisualStyleType.GRADIENT_TECH },
    { id: '3', topic: 'Marca Pessoal no LinkedIn', slideCount: 4, createdAt: '3 dias atrás', style: VisualStyleType.CLEAN_LIGHT },
    { id: '4', topic: 'Top 5 Ferramentas de IA', slideCount: 6, createdAt: 'Semana passada', style: VisualStyleType.MINIMAL_DARK },
];

const HistoryGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {MOCK_HISTORY.map((item) => (
        <div key={item.id} className="group flex flex-col gap-3 cursor-pointer">
          <div className="aspect-video w-full rounded-lg bg-gray-100 dark:bg-white/5 overflow-hidden relative border border-transparent dark:border-white/5 group-hover:border-primary transition-all">
            {/* Abstract visual representation based on ID/Style */}
            <div 
                className={`absolute inset-0 bg-cover bg-center opacity-80 group-hover:scale-105 transition-transform duration-500`}
                style={{ 
                    backgroundImage: `linear-gradient(45deg, ${item.style === VisualStyleType.CLEAN_LIGHT ? '#e2e8f0, #f8fafc' : '#1e293b, #0f172a'})` 
                }}
            >
                <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl opacity-20">collections</span>
                </div>
            </div>
            
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-[10px] text-white font-bold backdrop-blur-sm">
                {item.slideCount} Slides
            </div>
          </div>
          <div className="flex flex-col">
            <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors dark:text-gray-200">{item.topic}</h4>
            <span className="text-xs text-text-secondary">Criado {item.createdAt}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryGrid;
