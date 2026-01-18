
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import GeneratorView from './components/GeneratorView';
import CreativeGeneratorView from './components/CreativeGeneratorView';
import MotionGeneratorView from './components/MotionGeneratorView';
import CRMView from './components/CRMView';
import ProjectsView from './components/ProjectsView';
import FinanceView from './components/FinanceView';
import TeamView from './components/TeamView';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastNotification } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'creative' | 'motion' | 'crm' | 'projects' | 'finance' | 'team'>('dashboard');
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
                    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-[#0f0518]">
                        <GeneratorView 
                            onBack={() => setCurrentView('dashboard')} 
                        />
                    </div>
                  </ErrorBoundary>
              );
          case 'creative':
              return (
                  <ErrorBoundary>
                    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-[#0f0518]">
                        <CreativeGeneratorView onBack={() => setCurrentView('dashboard')} />
                    </div>
                  </ErrorBoundary>
              );
          case 'motion':
              return (
                  <ErrorBoundary>
                    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-[#0f0518]">
                        <MotionGeneratorView onBack={() => setCurrentView('dashboard')} />
                    </div>
                  </ErrorBoundary>
              );
          case 'crm':
              return (
                  <ErrorBoundary>
                      <CRMView />
                  </ErrorBoundary>
              );
          case 'projects':
              return (
                  <ErrorBoundary>
                      <ProjectsView />
                  </ErrorBoundary>
              );
          case 'finance':
              return (
                  <ErrorBoundary>
                      <FinanceView />
                  </ErrorBoundary>
              );
          case 'team':
              return (
                  <ErrorBoundary>
                      <TeamView />
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
    <div className="h-screen w-full flex items-center justify-center bg-[#020617] relative overflow-hidden">
      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Main Container */}
      <main className="w-full h-full flex overflow-hidden relative">
          
          {/* Sidebar */}
          <Sidebar 
            onNavigate={(view: any) => setCurrentView(view)} 
            currentView={currentView}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            credits={credits}
          />

          {/* Main Content Area */}
          <section className="flex-1 flex flex-col relative overflow-hidden bg-[#0f172a]">
            {/* Render Content */}
            <div className="relative z-10 w-full h-full flex flex-col">
                {/* Mobile Menu Trigger (Only visible on small screens) */}
                <div className="md:hidden p-4 flex items-center gap-2 bg-[#1e293b] border-b border-white/5">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-white p-2 rounded-lg hover:bg-white/10">
                        <i className="fa-solid fa-bars"></i>
                    </button>
                    <span className="font-bold text-white">AgencyOS</span>
                </div>

                {renderContent()}
            </div>
          </section>
      </main>
    </div>
  );
}

export default App;
