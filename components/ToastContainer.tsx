import React, { useEffect } from 'react';
import { ToastNotification } from '../types';

interface ToastContainerProps {
    toasts: ToastNotification[];
    removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: ToastNotification; onRemove: () => void }> = ({ toast, onRemove }) => {
    
    useEffect(() => {
        if (toast.type !== 'loading') {
            const timer = setTimeout(() => {
                onRemove();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [toast, onRemove]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success': return 'check_circle';
            case 'error': return 'error';
            case 'loading': return 'progress_activity';
            default: return 'info';
        }
    };

    const getColors = () => {
        switch (toast.type) {
            case 'success': return 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
            case 'error': return 'bg-red-500/10 border-red-500/50 text-red-400';
            case 'loading': return 'bg-primary/10 border-primary/50 text-primary';
            default: return 'bg-slate-800 border-white/10 text-white';
        }
    };

    return (
        <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-full duration-300 min-w-[300px] ${getColors()}`}>
            <span className={`material-symbols-outlined text-[20px] ${toast.type === 'loading' ? 'animate-spin' : ''}`}>
                {getIcon()}
            </span>
            <p className="text-sm font-bold flex-1">{toast.message}</p>
            <button onClick={onRemove} className="opacity-50 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
        </div>
    );
};

export default ToastContainer;