import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
          return this.props.fallback;
      }
      return (
        <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-[#0f172a] border border-red-500/20 rounded-2xl text-center z-50 relative shadow-2xl">
          <div className="bg-red-500/20 p-4 rounded-full mb-4 animate-pulse">
              <span className="material-symbols-outlined text-4xl text-red-400">bug_report</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Ops! Ocorreu um erro visual.</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md">
            Ocorreu um erro ao renderizar este componente. Isso geralmente acontece devido a problemas de memória com imagens pesadas ou falha na resposta da IA.
          </p>
          <div className="bg-black/50 p-4 rounded-lg border border-white/10 w-full max-w-lg mb-6 overflow-auto max-h-32 text-left shadow-inner">
              <code className="text-[10px] font-mono text-red-300 break-all">
                  {this.state.error?.message || "Erro desconhecido de renderização"}
              </code>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20"
          >
            Tentar Restaurar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;