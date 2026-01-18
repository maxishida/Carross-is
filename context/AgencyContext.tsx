import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AgencyTask, Project, TeamMember, ToastNotification, FinanceItem, Lead, CalendarEvent } from '../types';

// --- STATE DEFINITIONS ---

interface AgencyState {
    tasks: AgencyTask[];
    projects: Project[];
    team: TeamMember[];
    finance: FinanceItem[];
    leads: Lead[];
    events: CalendarEvent[];
    toasts: ToastNotification[];
}

type AgencyAction =
    | { type: 'LOAD_DATA'; payload: Partial<AgencyState> }
    // Tasks
    | { type: 'ADD_TASK'; payload: AgencyTask }
    | { type: 'UPDATE_TASK'; payload: AgencyTask }
    | { type: 'DELETE_TASK'; payload: string }
    // Projects
    | { type: 'ADD_PROJECT'; payload: Project }
    | { type: 'UPDATE_PROJECT'; payload: Project }
    // Team
    | { type: 'ADD_TEAM_MEMBER'; payload: TeamMember }
    | { type: 'UPDATE_TEAM_MEMBER'; payload: TeamMember }
    // Finance
    | { type: 'ADD_TRANSACTION'; payload: FinanceItem }
    | { type: 'UPDATE_TRANSACTION'; payload: FinanceItem }
    // Leads
    | { type: 'ADD_LEAD'; payload: Lead }
    | { type: 'UPDATE_LEAD'; payload: Lead }
    // Events
    | { type: 'ADD_EVENT'; payload: CalendarEvent }
    | { type: 'UPDATE_EVENT'; payload: CalendarEvent }
    | { type: 'DELETE_EVENT'; payload: string }
    // Toasts
    | { type: 'ADD_TOAST'; payload: ToastNotification }
    | { type: 'REMOVE_TOAST'; payload: string };

interface AgencyContextType extends AgencyState {
    // Actions
    addTask: (task: AgencyTask) => void;
    updateTask: (task: AgencyTask) => void;
    deleteTask: (id: string) => void;
    
    addProject: (project: Project) => void;
    updateProject: (project: Project) => void;
    
    addTeamMember: (member: TeamMember) => void;
    updateTeamMember: (member: TeamMember) => void;
    
    addTransaction: (item: FinanceItem) => void;
    updateTransaction: (item: FinanceItem) => void;
    
    addLead: (lead: Lead) => void;
    updateLead: (lead: Lead) => void;

    addEvent: (event: CalendarEvent) => void;
    updateEvent: (event: CalendarEvent) => void;
    deleteEvent: (id: string) => void;

    // Toast
    addToast: (message: string, type: 'success' | 'error' | 'info' | 'loading') => string;
    removeToast: (id: string) => void;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

// --- INITIAL MOCK DATA ---
const INITIAL_TEAM: TeamMember[] = [
    { 
        id: '1', 
        name: 'Lucas Dev', 
        role: 'Engenheiro Full Stack', 
        avatar: 'https://ui-avatars.com/api/?name=Lucas&background=random', 
        activeProjects: 1, 
        capacity: 40,
        workload: 0, 
        allocations: [
            { id: 'a1', projectId: '1', projectName: 'E-commerce Redesign', role: 'Lead Dev', hoursPerWeek: 10 }
        ],
        status: 'busy', 
        skills: ['React', 'Node.js', 'Postgres'] 
    },
    { 
        id: '2', 
        name: 'Ana Designer', 
        role: 'UX / UI Lead', 
        avatar: 'https://ui-avatars.com/api/?name=Ana&background=random', 
        activeProjects: 1, 
        capacity: 30,
        workload: 0, 
        allocations: [
            { id: 'a2', projectId: '1', projectName: 'E-commerce Redesign', role: 'Product Designer', hoursPerWeek: 15 }
        ],
        status: 'online', 
        skills: ['Figma', 'UI Design', 'User Research'] 
    },
];

const INITIAL_PROJECTS: Project[] = [
    { 
        id: '1', 
        name: 'E-commerce Redesign', 
        client: 'Moda Fashion', 
        progress: 75, 
        status: 'active', 
        deadline: '2024-12-15', 
        members: ['1', '2'],
        phases: [
            { name: 'Discovery', status: 'completed', progress: 100 },
            { name: 'Design', status: 'active', progress: 50 },
            { name: 'Dev', status: 'pending', progress: 0 }
        ],
        finance: {
            totalValue: 15000,
            paymentStatus: 'partial',
            installments: 3,
            nextPaymentDate: '2024-12-01'
        },
        library: [
            { id: 'f1', name: 'Briefing.pdf', type: 'doc', createdAt: '2024-10-01', size: '2MB' },
            { id: 'f2', name: 'Logo_Vetores', type: 'folder', createdAt: '2024-10-02' },
            { id: 'f3', name: 'Layout_v1.png', type: 'image', createdAt: '2024-10-10', size: '4.5MB', url: 'https://placehold.co/600x400/png' }
        ]
    }
];

const INITIAL_TASKS: AgencyTask[] = [
    { 
        id: '1', 
        title: 'Design de Login', 
        client: 'GreenEnergy', 
        status: 'backlog', 
        priority: 'high', 
        teamMembers: ['2'], 
        deadline: new Date(Date.now() + 3600000).toISOString(),
        estimatedHours: 4,
        isBlocked: false 
    }, 
];

const INITIAL_FINANCE: FinanceItem[] = [
    { id: '1', description: 'Entrada: Projeto E-commerce', amount: 12500, type: 'income', status: 'paid', date: '2024-10-10', category: 'Projeto' },
    { id: '2', description: 'Assinatura API Gemini', amount: 150, type: 'expense', status: 'paid', date: '2024-10-12', category: 'Software' },
];

const INITIAL_LEADS: Lead[] = [
    { id: '1', companyName: 'TechStart Inc', contactPerson: 'Roberto Almeida', value: 12500, status: 'new', lastContact: '2h atrás', probability: 20 },
    { id: '2', companyName: 'Dr. Consultório', contactPerson: 'Ana Silva', value: 4800, status: 'proposal', lastContact: '1d atrás', probability: 60 },
];

const INITIAL_EVENTS: CalendarEvent[] = [
    { 
        id: '1', 
        title: 'Kickoff Meeting', 
        start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        end: new Date(Date.now() + 90000000).toISOString(), 
        type: 'meeting',
        projectId: '1',
        description: 'Alinhamento inicial com cliente'
    }
];

const initialState: AgencyState = {
    tasks: [],
    projects: [],
    team: [],
    finance: [],
    leads: [],
    events: [],
    toasts: []
};

// --- REDUCER ---
const agencyReducer = (state: AgencyState, action: AgencyAction): AgencyState => {
    switch (action.type) {
        case 'LOAD_DATA':
            return { ...state, ...action.payload };
        
        // Tasks
        case 'ADD_TASK':
            return { ...state, tasks: [...state.tasks, action.payload] };
        case 'UPDATE_TASK':
            return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
        case 'DELETE_TASK':
            return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
        
        // Projects
        case 'ADD_PROJECT':
            return { ...state, projects: [...state.projects, action.payload] };
        case 'UPDATE_PROJECT':
            return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p) };
        
        // Team
        case 'ADD_TEAM_MEMBER':
            return { ...state, team: [...state.team, action.payload] };
        case 'UPDATE_TEAM_MEMBER':
            return { ...state, team: state.team.map(m => m.id === action.payload.id ? action.payload : m) };
        
        // Finance
        case 'ADD_TRANSACTION':
            return { ...state, finance: [...state.finance, action.payload] };
        case 'UPDATE_TRANSACTION':
            return { ...state, finance: state.finance.map(f => f.id === action.payload.id ? action.payload : f) };
        
        // Leads
        case 'ADD_LEAD':
            return { ...state, leads: [...state.leads, action.payload] };
        case 'UPDATE_LEAD':
            return { ...state, leads: state.leads.map(l => l.id === action.payload.id ? action.payload : l) };
        
        // Events
        case 'ADD_EVENT':
            return { ...state, events: [...state.events, action.payload] };
        case 'UPDATE_EVENT':
            return { ...state, events: state.events.map(e => e.id === action.payload.id ? action.payload : e) };
        case 'DELETE_EVENT':
            return { ...state, events: state.events.filter(e => e.id !== action.payload) };
        
        // Toasts
        case 'ADD_TOAST':
            return { ...state, toasts: [...state.toasts, action.payload] };
        case 'REMOVE_TOAST':
            return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
            
        default:
            return state;
    }
};

export const AgencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(agencyReducer, initialState);

    // --- SIDE EFFECTS: LOAD DATA ---
    useEffect(() => {
        const loadData = () => {
            const sTasks = localStorage.getItem('agency_tasks');
            const sProjects = localStorage.getItem('agency_projects');
            const sTeam = localStorage.getItem('agency_team');
            const sFinance = localStorage.getItem('agency_finance');
            const sLeads = localStorage.getItem('agency_leads');
            const sEvents = localStorage.getItem('agency_events');

            dispatch({
                type: 'LOAD_DATA',
                payload: {
                    tasks: sTasks ? JSON.parse(sTasks) : INITIAL_TASKS,
                    projects: sProjects ? JSON.parse(sProjects) : INITIAL_PROJECTS,
                    team: sTeam ? JSON.parse(sTeam) : INITIAL_TEAM,
                    finance: sFinance ? JSON.parse(sFinance) : INITIAL_FINANCE,
                    leads: sLeads ? JSON.parse(sLeads) : INITIAL_LEADS,
                    events: sEvents ? JSON.parse(sEvents) : INITIAL_EVENTS,
                }
            });
        };
        loadData();
    }, []);

    // --- SIDE EFFECTS: SAVE DATA ---
    useEffect(() => { localStorage.setItem('agency_tasks', JSON.stringify(state.tasks)); }, [state.tasks]);
    useEffect(() => { localStorage.setItem('agency_projects', JSON.stringify(state.projects)); }, [state.projects]);
    useEffect(() => { localStorage.setItem('agency_team', JSON.stringify(state.team)); }, [state.team]);
    useEffect(() => { localStorage.setItem('agency_finance', JSON.stringify(state.finance)); }, [state.finance]);
    useEffect(() => { localStorage.setItem('agency_leads', JSON.stringify(state.leads)); }, [state.leads]);
    useEffect(() => { localStorage.setItem('agency_events', JSON.stringify(state.events)); }, [state.events]);

    // --- SIDE EFFECTS: ALARMS ---
    const playAlarmSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
            oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    useEffect(() => {
        const checkAlarms = () => {
            const now = new Date();
            state.tasks.forEach(task => {
                if (task.deadline && !task.notificationSent && task.status !== 'done') {
                    const deadline = new Date(task.deadline);
                    const diff = deadline.getTime() - now.getTime();
                    
                    // Notify if deadline is within 30 minutes
                    if (diff > 0 && diff < 30 * 60 * 1000) {
                        playAlarmSound();
                        addToast(`⏰ Tarefa "${task.title}" vence em breve!`, 'info');
                        dispatch({ type: 'UPDATE_TASK', payload: { ...task, notificationSent: true } });
                    }
                    // Notify if Overdue
                    else if (diff < 0 && !task.notificationSent) {
                         playAlarmSound();
                         addToast(`⚠️ Tarefa "${task.title}" está atrasada!`, 'error');
                         dispatch({ type: 'UPDATE_TASK', payload: { ...task, notificationSent: true } });
                    }
                }
            });
        };

        const interval = setInterval(checkAlarms, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [state.tasks]);

    // --- ACTIONS WRAPPERS ---

    const addToast = (message: string, type: 'success' | 'error' | 'info' | 'loading' = 'info') => {
        const id = Date.now().toString();
        dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
        return id;
    };

    const removeToast = (id: string) => {
        dispatch({ type: 'REMOVE_TOAST', payload: id });
    };

    const addTask = (task: AgencyTask) => dispatch({ type: 'ADD_TASK', payload: task });
    const updateTask = (task: AgencyTask) => dispatch({ type: 'UPDATE_TASK', payload: task });
    const deleteTask = (id: string) => dispatch({ type: 'DELETE_TASK', payload: id });

    const addProject = (project: Project) => dispatch({ type: 'ADD_PROJECT', payload: project });
    const updateProject = (project: Project) => dispatch({ type: 'UPDATE_PROJECT', payload: project });

    const addTeamMember = (member: TeamMember) => dispatch({ type: 'ADD_TEAM_MEMBER', payload: member });
    const updateTeamMember = (member: TeamMember) => dispatch({ type: 'UPDATE_TEAM_MEMBER', payload: member });

    const addTransaction = (item: FinanceItem) => dispatch({ type: 'ADD_TRANSACTION', payload: item });
    const updateTransaction = (item: FinanceItem) => dispatch({ type: 'UPDATE_TRANSACTION', payload: item });

    const addLead = (lead: Lead) => dispatch({ type: 'ADD_LEAD', payload: lead });
    const updateLead = (lead: Lead) => dispatch({ type: 'UPDATE_LEAD', payload: lead });

    const addEvent = (event: CalendarEvent) => dispatch({ type: 'ADD_EVENT', payload: event });
    const updateEvent = (event: CalendarEvent) => dispatch({ type: 'UPDATE_EVENT', payload: event });
    const deleteEvent = (id: string) => dispatch({ type: 'DELETE_EVENT', payload: id });

    return (
        <AgencyContext.Provider value={{
            ...state,
            addTask, updateTask, deleteTask,
            addProject, updateProject,
            addTeamMember, updateTeamMember,
            addTransaction, updateTransaction,
            addLead, updateLead,
            addToast, removeToast,
            addEvent, updateEvent, deleteEvent
        }}>
            {children}
        </AgencyContext.Provider>
    );
};

export const useAgency = () => {
    const context = useContext(AgencyContext);
    if (!context) throw new Error("useAgency must be used within AgencyProvider");
    return context;
};
