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
    <div className="flex h-screen w-full overflow-hidden bg-background-dark text-slate-100 relative selection:bg-primary/30 selection:text-white">
      {/* Ambient Background Glows */}
      <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen"></div>
      <div className="absolute bottom-[0%] right-[0%] w-[40vw] h-[40vw] bg-accent/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen"></div>

      {/* SideNavBar */}
      <Sidebar 
        onNavigate={setCurrentView} 
        currentView={currentView}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative z-10 overflow-hidden backdrop-blur-[2px]">
        <TopBar onMenuClick={() => {}} />

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 grid-bg">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;