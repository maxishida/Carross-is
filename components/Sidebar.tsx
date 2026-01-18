import React from 'react';

interface SidebarProps {
  onNavigate: (view: 'dashboard' | 'create' | 'creative' | 'motion' | 'crm' | 'projects' | 'finance' | 'team' | 'calendar' | 'tasks') => void;
  currentView: string;
  isOpen: boolean;
  onClose: () => void;
  credits: number;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentView, isOpen, onClose, credits }) => {
  
  const sidebarClasses = `
    w-64 glass-panel flex-shrink-0 flex flex-col h-full border-r border-white/10 z-50
    fixed md:relative transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  // Helper for active link styles from AgencyOS design
  const getLinkClass = (viewName: string) => {
      const isActive = currentView === viewName;
      if (isActive) {
          return "flex items-center gap-3 px-3 py-2.5 rounded-lg text-white font-medium shadow-lg shadow-purple-900/20 border border-white/10 bg-gradient-to-r from-purple-500/50 to-pink-500/50";
      }
      return "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors group";
  };

  const getIconClass = (isActive: boolean, groupHoverClass: string) => {
      return `w-5 text-center ${isActive ? '' : groupHoverClass}`;
  };

  return (
    <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                onClick={onClose}
            ></div>
        )}

        <aside className={sidebarClasses}>
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <i className="fa-solid fa-layer-group text-white text-sm"></i>
                </div>
                <span className="font-bold text-lg tracking-wide text-white">AgencyOS</span>
                <button onClick={onClose} className="md:hidden ml-auto text-white/50 hover:text-white">
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>

            {/* User Profile Dropdown */}
            <div className="px-4 mb-6">
                <div className="glass-panel-light rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                            <img alt="User Profile" className="w-full h-full object-cover" src="https://ui-avatars.com/api/?name=Lusse+Dev&background=random" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-white text-xs">Lusse Dev</span>
                            <span className="text-[10px] text-gray-400">Admin</span>
                        </div>
                    </div>
                    <i className="fa-solid fa-chevron-down text-gray-500 text-xs"></i>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar">
                {/* Group: GESTÃO */}
                <div>
                    <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2 px-2">Gestão</h3>
                    <ul className="space-y-1">
                        <li>
                            <button onClick={() => { onNavigate('dashboard'); onClose(); }} className={getLinkClass('dashboard')}>
                                <i className={`fa-solid fa-grid-2 ${getIconClass(currentView === 'dashboard', '')}`}></i>
                                Dashboard
                            </button>
                        </li>
                        <li>
                            <button onClick={() => { onNavigate('tasks'); onClose(); }} className={getLinkClass('tasks')}>
                                <i className={`fa-solid fa-list-check ${getIconClass(currentView === 'tasks', 'group-hover:text-purple-400')}`}></i>
                                Tarefas
                            </button>
                        </li>
                        <li>
                            <button onClick={() => { onNavigate('calendar'); onClose(); }} className={getLinkClass('calendar')}>
                                <i className={`fa-regular fa-calendar-days ${getIconClass(currentView === 'calendar', 'group-hover:text-purple-400')}`}></i>
                                Calendário
                            </button>
                        </li>
                        <li>
                            <button onClick={() => { onNavigate('projects'); onClose(); }} className={getLinkClass('projects')}>
                                <i className={`fa-regular fa-folder ${getIconClass(currentView === 'projects', 'group-hover:text-purple-400')}`}></i>
                                Projetos <span className="ml-auto bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">4</span>
                            </button>
                        </li>
                        <li>
                            <button onClick={() => { onNavigate('crm'); onClose(); }} className={getLinkClass('crm')}>
                                <i className={`fa-solid fa-users ${getIconClass(currentView === 'crm', 'group-hover:text-purple-400')}`}></i>
                                CRM & Leads
                            </button>
                        </li>
                        <li>
                            <button onClick={() => { onNavigate('finance'); onClose(); }} className={getLinkClass('finance')}>
                                <i className={`fa-solid fa-dollar-sign ${getIconClass(currentView === 'finance', 'group-hover:text-purple-400')}`}></i>
                                Financeiro
                            </button>
                        </li>
                        <li>
                            <button onClick={() => { onNavigate('team'); onClose(); }} className={getLinkClass('team')}>
                                <i className={`fa-solid fa-user-group ${getIconClass(currentView === 'team', 'group-hover:text-purple-400')}`}></i>
                                Equipe
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Group: ESTÚDIO CRIATIVO */}
                <div>
                    <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2 px-2">Estúdio Criativo (IA)</h3>
                    <ul className="space-y-1">
                        <li>
                            <button onClick={() => { onNavigate('create'); onClose(); }} className={getLinkClass('create')}>
                                <i className={`fa-solid fa-layer-group ${getIconClass(currentView === 'create', 'group-hover:text-purple-400')}`}></i>
                                Carrossel Glass
                            </button>
                        </li>
                        <li>
                            <button onClick={() => { onNavigate('creative'); onClose(); }} className={getLinkClass('creative')}>
                                <i className={`fa-regular fa-image ${getIconClass(currentView === 'creative', 'group-hover:text-purple-400')}`}></i>
                                Criativos Ads
                            </button>
                        </li>
                        <li>
                            <button onClick={() => { onNavigate('motion'); onClose(); }} className={getLinkClass('motion')}>
                                <i className={`fa-solid fa-video ${getIconClass(currentView === 'motion', 'group-hover:text-purple-400')}`}></i>
                                Motion Studio
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Credits Footer */}
             <div className="p-4 mt-auto border-t border-white/10">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs text-gray-400 font-medium">Tokens IA</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">{credits} / 1000</span>
                </div>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${(credits / 1000) * 100}%` }}
                    ></div>
                </div>
            </div>
        </aside>
    </>
  );
};

export default Sidebar;