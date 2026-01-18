
# Especificação Funcional do Backend (Dashboard)

Este documento descreve como as funcionalidades visuais do `DashboardView.tsx` devem ser conectadas a um backend real (ex: Next.js API Routes).

## 1. Endpoints da Dashboard API

### A. Estatísticas (KPIs)
Para alimentar os cards superiores do Dashboard.

*   **Rota:** `GET /api/dashboard/stats`
*   **Lógica de Negócios:**
    1.  **Tarefas Pendentes:** `COUNT(Task)` onde `status != DONE` e `assigneeId = current_user`.
    2.  **Próxima Reunião:** Integração com Google Calendar API ou tabela interna `Events`.
    3.  **Orçamentos Ativos:** `COUNT(Proposal)` onde `lead.status` está em negociação.
    4.  **Receita Estimada:** `SUM(Lead.value)` onde `status` é PROPOSAL ou NEGOTIATION * (probability / 100).

**Exemplo de Resposta JSON:**
```json
{
  "tasksCount": 4,
  "highPriorityTasks": 2,
  "nextMeeting": { "time": "10:40", "title": "Meeting com GreenEnergy" },
  "activeBudgets": 3,
  "estimatedRevenue": 2950.00
}
```

### B. Gestão de Tarefas (Kanban Simplificado)
*   **Rota:** `GET /api/tasks?status={backlog|progress|done}`
*   **Rota:** `PATCH /api/tasks/:id` (Para mover cards ou marcar check).
*   **Integração Frontend:** Substituir o array estático `tasks` no `DashboardView` por um `useQuery` ou `useEffect` que chama este endpoint.

### C. Gerador de Orçamentos IA (Backend Action)
Atualmente a lógica está no frontend (`geminiService.ts`). Para segurança da API Key, isso deve mover para o servidor.

*   **Rota:** `POST /api/ai/generate-proposal`
*   **Body:**
    ```json
    {
      "briefing": "Crie um site para...",
      "ragContext": "Texto extraído do PDF..."
    }
    ```
*   **Fluxo Backend:**
    1.  Recebe o briefing.
    2.  Inicializa `GoogleGenAI` com a chave de servidor (`process.env.GOOGLE_API_KEY`).
    3.  Executa o prompt de sistema (Definido em `geminiService.ts`).
    4.  Opcional: Salva o resultado automaticamente na tabela `Proposal` com status `DRAFT`.
    5.  Retorna o JSON da proposta estruturada.

## 2. Integração RAG (Upload de Contexto)
Para o funcionamento do botão "Add Contexto (PDF)".

*   **Fluxo Atual (Client-side):** O PDF é lido no navegador via `pdfjs-dist` e o texto bruto é enviado para a IA.
*   **Fluxo Recomendado (Server-side):**
    1.  **Rota:** `POST /api/upload/context`
    2.  Upload do arquivo para blob storage (S3/Vercel Blob).
    3.  Processamento do texto no servidor (mais performático e seguro).
    4.  Armazenamento de Embeddings (Opcional para RAG avançado) ou retorno do texto bruto para sessão temporária.

## 3. Webhooks e Atualizações em Tempo Real
Para manter os KPIs atualizados (ex: "4 Pendentes"):

*   **Abordagem Pull:** O Dashboard faz *revalidate* a cada 60 segundos.
*   **Abordagem Push (Ideal):** Usar WebSockets (Socket.io ou Pusher) para que, quando uma tarefa for concluída por outro membro da equipe, o contador do usuário atualize instantaneamente sem refresh.

## 4. Segurança
*   **Middleware de Autenticação:** Todas as rotas `/api/*` devem verificar o token de sessão (JWT/NextAuth) para garantir que o usuário só veja seus próprios projetos/tarefas ou os da sua organização.
*   **Rate Limiting:** Aplicar limites na rota `/api/ai/*` para evitar abuso dos tokens da API do Gemini, já que é uma operação custosa.
