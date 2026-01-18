
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
                    <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-6">
                        <GeneratorView 
                            onBack={() => setCurrentView('dashboard')} 
                        />
                    </div>
                  </ErrorBoundary>
              );
          case 'creative':
              return (
                  <ErrorBoundary>
                    <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-6">
                        <CreativeGeneratorView onBack={() => setCurrentView('dashboard')} />
                    </div>
                  </ErrorBoundary>
              );
          case 'motion':
              return (
                  <ErrorBoundary>
                    <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-6">
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
    <div className="flex h-[100dvh] w-full text-sm relative overflow-hidden bg-transparent">
      {/* Background Effects */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Sidebar */}
      <Sidebar 
        onNavigate={(view: any) => setCurrentView(view)} 
        currentView={currentView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        credits={credits}
      />

      {/* Main Content Wrapper */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Mobile Menu Trigger (Only visible on small screens) */}
          <div className="md:hidden p-4 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md z-30 shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setIsSidebarOpen(true)} className="text-white p-2 rounded-lg hover:bg-white/10">
                    <i className="fa-solid fa-bars"></i>
                </button>
                <span className="font-bold text-white">AgencyOS</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                    LD
              </div>
          </div>

          {/* View Content */}
          <div className="flex-1 overflow-hidden relative z-10">
            {renderContent()}
          </div>
      </main>
    </div>
  );
}

export default App;
