
# Funcionalidades Detalhadas por Ferramenta

Este documento serve como um guia de referência funcional para os módulos do AgencyOS.

---

## 1. Glass Carousel (Gerador de Carrosséis)
**(Conteúdo mantido - focado em geração de slides e imagens)**

---

## 2. Creative Lab (Laboratório de Criativos)
**(Conteúdo mantido - focado em ads e edição)**

---

## 3. Motion Director (Estúdio de Vídeo)
**(Conteúdo mantido - focado em Veo e Maps)**

---

## 4. Agency Dashboard (Gestão Operacional)
**Motor Principal:** `gemini-3-flash-preview` (Comandos) + `gemini-2.5-flash-native-audio` (Voz).

### Descrição
O centro de comando da agência. Diferente de dashboards estáticos, este é "vivo". Ele integra dados de várias fontes (Tarefas, Finanças, CRM) e permite manipulação direta através de uma IA contextual.

### Fluxo de Uso do "Diretor IA"
1.  **Comando de Voz:** Usuário clica no microfone e diz: *"Agende uma reunião de kickoff com a TechStart para amanhã às 14h e crie uma tarefa para preparar a apresentação."*
2.  **Processamento:**
    *   O áudio é transcrito e processado pelo Gemini.
    *   O agente analisa o contexto (quem é "TechStart"? Data de "amanhã"?).
    *   Ele identifica duas intenções: `create_event` e `create_task`.
3.  **Execução:**
    *   O sistema cria o evento no Calendário.
    *   O sistema cria o card no Kanban de Tarefas.
    *   O Diretor responde em áudio: *"Feito. Reunião agendada e tarefa criada com prioridade média."*

### Funcionalidades de Gestão
*   **Kanban de Tarefas:** Arraste e solte tarefas entre Backlog, Em Progresso e Concluído. Filtros por prioridade e busca instantânea.
*   **CRM Visual:** Pipeline de vendas. Arraste leads para mudar o status (de "Novo" para "Proposta"). Cálculo automático de receita prevista baseada na probabilidade.
*   **Financeiro:** Importação de extratos (PDF/CSV) via IA para categorização automática. Chat com "Analista Financeiro" para tirar dúvidas sobre o fluxo de caixa.
*   **Projetos:** Gestão de fases de entrega e biblioteca de arquivos. O "Gerador de Orçamentos" pode transformar uma proposta aprovada diretamente em um novo Projeto estruturado.
*   **Calendário Unificado:** Visualização combinada de Reuniões, Prazos de Projetos (Deadlines) e Vencimento de Tarefas.
