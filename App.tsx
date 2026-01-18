
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import GeneratorView from './components/GeneratorView';
import CreativeGeneratorView from './components/CreativeGeneratorView';
import MotionGeneratorView from './components/MotionGeneratorView';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastNotification } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'creative' | 'motion'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [credits, setCredits] = useState(750);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // --- GLOBAL ACTIONS ---

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'loading' = 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
      return id; // Return ID so loading toasts can be removed programmatically
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  const deductCredits = (amount: number) => {
      setCredits(prev => Math.max(0, prev - amount));
      addToast(`${amount} tokens utilizados`, 'info');
  };

  // Wrapper to inject toast/credit logic into views
  const renderContent = () => {
      switch(currentView) {
          case 'create':
              return (
                  <ErrorBoundary>
                    <div className="h-full overflow-y-auto custom-scrollbar p-6">
                        <GeneratorView 
                            onBack={() => setCurrentView('dashboard')} 
                        />
                    </div>
                  </ErrorBoundary>
              );
          case 'creative':
              return (
                  <ErrorBoundary>
                    <div className="h-full overflow-y-auto custom-scrollbar p-6">
                        <CreativeGeneratorView onBack={() => setCurrentView('dashboard')} />
                    </div>
                  </ErrorBoundary>
              );
          case 'motion':
              return (
                  <ErrorBoundary>
                    <div className="h-full overflow-y-auto custom-scrollbar p-6">
                        <MotionGeneratorView onBack={() => setCurrentView('dashboard')} />
                    </div>
                  </ErrorBoundary>
              );
          case 'dashboard':
          default:
              return (
                  <ErrorBoundary>
                    <DashboardView onCreateClick={() => setCurrentView('create')} />
                  </ErrorBoundary>
              );
      }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center p-2 md:p-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="mesh-background"></div>
      <div className="glow-spot w-96 h-96 bg-accent-purple/30 top-0 left-0"></div>
      <div className="glow-spot w-[500px] h-[500px] bg-accent-cyan/20 bottom-0 right-0"></div>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Main Glass Dashboard Container */}
      <main className="glass-panel w-full max-w-[1400px] h-[95vh] md:h-[90vh] rounded-[30px] flex overflow-hidden relative shadow-2xl">
          
          {/* Sidebar */}
          <Sidebar 
            onNavigate={setCurrentView} 
            currentView={currentView}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            credits={credits}
          />

          {/* Main Content Area */}
          <section className="flex-1 flex flex-col relative overflow-hidden bg-black/10">
            {/* Gradient mesh specifically for the content area */}
            <div className="absolute inset-0 pointer-events-none opacity-30 z-0" style={{background: 'linear-gradient(120deg, transparent 40%, rgba(76, 201, 240, 0.2) 60%, rgba(114, 9, 183, 0.2) 80%)'}}></div>
            
            {/* Render Content */}
            <div className="relative z-10 w-full h-full flex flex-col">
                {/* Mobile Menu Trigger (Only visible on small screens) */}
                <div className="md:hidden p-4 flex items-center gap-2">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-white p-2 glass-card rounded-lg">
                        <i className="fa-solid fa-bars"></i>
                    </button>
                    <span className="font-bold">Painel</span>
                </div>

                {renderContent()}
            </div>
          </section>
      </main>
    </div>
  );
}

export default App;
