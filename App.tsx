
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
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
                    <GeneratorView 
                        onBack={() => setCurrentView('dashboard')} 
                        // In a real app, you'd pass addToast here via Context or Props
                    />
                  </ErrorBoundary>
              );
          case 'creative':
              return (
                  <ErrorBoundary>
                    <CreativeGeneratorView onBack={() => setCurrentView('dashboard')} />
                  </ErrorBoundary>
              );
          case 'motion':
              return (
                  <ErrorBoundary>
                    <MotionGeneratorView onBack={() => setCurrentView('dashboard')} />
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
    <div className="flex h-screen w-full overflow-hidden bg-background-dark text-slate-100 relative selection:bg-primary/30 selection:text-white">
      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Ambient Background Glows */}
      <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen"></div>
      <div className="absolute bottom-[0%] right-[0%] w-[40vw] h-[40vw] bg-accent/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen"></div>

      {/* SideNavBar with Mobile Drawer Logic */}
      <Sidebar 
        onNavigate={setCurrentView} 
        currentView={currentView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        credits={credits}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative z-10 overflow-hidden backdrop-blur-[2px]">
        <TopBar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 grid-bg">
            <ErrorBoundary>
                {renderContent()}
            </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

export default App;
