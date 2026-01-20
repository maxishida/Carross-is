
# Estrutura de Pastas e Arquivos

A estrutura segue um padrão plano (flat) dentro da raiz `src` (conceitual), típico de projetos Vite/React simples, facilitando a navegação.

```
/
├── components/             # Componentes de UI reutilizáveis e Views
│   ├── App.tsx             # Componente Raiz e Roteador Lógico
│   ├── Sidebar.tsx         # Navegação lateral global (Gestão + Estúdio)
│   ├── DashboardView.tsx   # Painel Principal com Diretor IA
│   ├── TasksView.tsx       # Gestão de Tarefas (Kanban/Lista) [NOVO]
│   ├── CRMView.tsx         # Gestão de Leads e Pipeline [NOVO]
│   ├── ProjectsView.tsx    # Gestão de Projetos e Fases [NOVO]
│   ├── FinanceView.tsx     # Fluxo de Caixa e Analista IA [NOVO]
│   ├── TeamView.tsx        # Gestão de Equipe e Capacidade [NOVO]
│   ├── CalendarView.tsx    # Calendário Unificado [NOVO]
│   ├── GeneratorView.tsx   # Tela principal de criação de Carrosséis
│   ├── CreativeGen...tsx   # Tela de geração de variações criativas
│   ├── MotionGen...tsx     # Tela de criação de vídeo (Veo/Maps)
│   ├── AssistantChat.tsx   # Drawer de chat lateral (Co-piloto)
│   └── ... (Outros componentes auxiliares)
│
├── services/
│   └── geminiService.ts    # Centralizador de chamadas IA
│   └── ai/                 # Sub-módulos de IA
│       ├── core.ts         # Configuração e Auth
│       ├── text.ts         # Geração de Texto/Json
│       ├── image.ts        # Imagen 3 / Edição
│       ├── video.ts        # Veo / Motion Prompts
│       ├── audio.ts        # TTS (Text-to-Speech)
│       └── live.ts         # Gemini Live (WebSockets/Áudio Real-time) [NOVO]
│
├── context/
│   └── AgencyContext.tsx   # Estado Global (Tasks, Projects, Team, etc.)
│
├── types.ts                # Definições de Tipos TypeScript globais
├── index.html              # Ponto de entrada da aplicação web
└── metadata.json           # Configurações de permissões (Microfone, etc.)
```

## Boas Práticas Aplicadas
1.  **Context API:** O `AgencyContext.tsx` atua como um "mini-banco de dados" local, gerenciando o estado de todas as entidades de gestão (CRUD de tarefas, projetos, etc.).
2.  **Modularização de Serviços:** A pasta `services/ai/` separa as responsabilidades por modalidade (texto, imagem, vídeo, live) para evitar arquivos gigantes.
3.  **Integração Híbrida:** O Dashboard conecta dados locais (Context) com inteligência de nuvem (Gemini) para permitir que a IA manipule o estado da aplicação.
