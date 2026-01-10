
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
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
          return this.props.fallback;
      }
      return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-red-900/10 border border-red-500/20 rounded-2xl text-center">
          <div className="bg-red-500/20 p-4 rounded-full mb-4">
              <span className="material-symbols-outlined text-4xl text-red-400">bug_report</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Ops! Algo deu errado.</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md">
            Ocorreu um erro ao renderizar este componente. Isso pode acontecer devido a falhas na geração de imagem ou dados corrompidos.
          </p>
          <div className="bg-black/30 p-4 rounded-lg border border-white/5 w-full max-w-lg mb-6 overflow-auto max-h-32 text-left">
              <code className="text-[10px] font-mono text-red-300">
                  {this.state.error?.message || "Erro desconhecido"}
              </code>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-sm transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
