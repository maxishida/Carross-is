import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardView from './components/DashboardView';
import GeneratorView from './components/GeneratorView';
import CreativeGeneratorView from './components/CreativeGeneratorView';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'creative'>('dashboard');

  const renderContent = () => {
      switch(currentView) {
          case 'create':
              return <GeneratorView onBack={() => setCurrentView('dashboard')} />;
          case 'creative':
              return <CreativeGeneratorView onBack={() => setCurrentView('dashboard')} />;
          case 'dashboard':
          default:
              return <DashboardView onCreateClick={() => setCurrentView('create')} />;
      }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      {/* SideNavBar */}
      <Sidebar 
        onNavigate={setCurrentView} 
        currentView={currentView}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <TopBar onMenuClick={() => {}} />

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;