
# Estrutura de Pastas e Arquivos

A estrutura segue um padrão plano (flat) dentro da raiz `src` (conceitual), típico de projetos Vite/React simples, facilitando a navegação.

```
/
├── components/             # Componentes de UI reutilizáveis e Views
│   ├── App.tsx             # Componente Raiz e Roteador Lógico
│   ├── AssistantChat.tsx   # Drawer de chat lateral (Co-piloto)
│   ├── ConfigPanel.tsx     # Sidebar de configurações (Estilo, Tom, etc.)
│   ├── DashboardView.tsx   # Tela inicial (Listagem de projetos)
│   ├── GeneratorView.tsx   # Tela principal de criação de Carrosséis
│   ├── CreativeGen...tsx   # Tela de geração de variações criativas
│   ├── MotionGen...tsx     # Tela de criação de vídeo (Veo/Maps)
│   ├── SlideCard.tsx       # Componente individual de slide (Renderização)
│   ├── Sidebar.tsx         # Navegação lateral global
│   ├── TopBar.tsx          # Cabeçalho global
│   └── ... (Outros componentes auxiliares)
│
├── services/
│   └── geminiService.ts    # Módulo ÚNICO de comunicação com a API do Google
│
├── types.ts                # Definições de Tipos TypeScript globais (Interfaces/Enums)
├── index.html              # Ponto de entrada da aplicação web
├── index.tsx               # Ponto de entrada do React
└── metadata.json           # Configurações de permissões do ambiente
```

## Boas Práticas Aplicadas
1.  **Colocação (Colocation):** Componentes grandes (Views) estão na mesma pasta de componentes menores por enquanto, mas logicamente separados.
2.  **Tipagem Centralizada:** `types.ts` evita referências circulares e mantém os contratos de dados consistentes entre componentes e serviços.
3.  **Abstração de API:** Nenhum componente chama `new GoogleGenAI` diretamente; tudo passa pelo `geminiService`.
