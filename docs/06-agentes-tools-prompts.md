
# Agentes, Tools e Prompts

O sistema utiliza uma abordagem "Multi-Agente" onde cada módulo possui um especialista IA dedicado.

## 1. Agente "Agency Director" (Dashboard)
*   **Arquivo:** `services/geminiService.ts` (Função `parseAgencyCommand`)
*   **Modelo:** `gemini-3-flash-preview` (Alta velocidade, baixa latência).
*   **Responsabilidade:** Atuar como um Assistente Executivo que gerencia o estado da aplicação.
*   **Contexto (RAG Leve):** Recebe no prompt o estado atual das Tarefas, Eventos do Calendário e Leads do CRM para tomar decisões informadas.
*   **Output Estruturado:** Retorna um JSON `DirectorAction` que o frontend executa.

### Schema de Ação (DirectorAction)
```typescript
{
  action: 'create_task' | 'create_event' | 'create_project' | 'audit_schedule',
  data: {
    title: string,
    priority?: 'high' | 'medium',
    deadline?: string (ISO),
    // ... outros parâmetros
  },
  reply: string // Resposta em linguagem natural para o usuário
}
```

## 2. Agente "Motion Director" (Vídeo)
*   **Modelo:** Dinâmico. Usa `gemini-3-pro` se o "Thinking Mode" estiver ativo para planejamento de cenas complexas.
*   **Persona:** Especialista em Motion Design, estilo "Hera Evolution".
*   **Tools:**
    *   `googleMaps`: Para obter coordenadas e visual de locais reais.
    *   `googleSearch`: Para buscar tendências e notícias.

## 3. Gemini Live (Áudio Real-Time)
*   **Modelo:** `gemini-2.5-flash-native-audio-preview-12-2025`
*   **Uso:** Habilita o microfone no Dashboard e no Co-piloto.
*   **Fluxo:** O áudio é streamado via WebSocket. O modelo processa e devolve áudio (PCM) e texto.
*   **Integração:** Permite brainstorming "mãos livres" enquanto o usuário navega pelo painel.

## 4. Prompts de Engenharia

### Geração de Proposta Comercial
O sistema gera propostas completas baseadas em um briefing simples:
> "ROLE: Operations Director. TASK: Structure a commercial proposal based on client briefing. OUTPUT: JSON with executive summary, pricing tiers (MVP, Growth, Enterprise), and team structure."

### Análise Financeira
O agente financeiro recebe o JSON de transações e responde perguntas complexas:
> "DATA: [JSON Transactions]. QUERY: 'Qual minha margem de lucro este mês?'. INSTRUCTION: Analyze data, calculate margins, identify trends."
