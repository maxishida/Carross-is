
# Agentes, Tools e Prompts

O sistema utiliza uma abordagem "Multi-Agente" orquestrada pelo frontend.

## 1. Agente "Motion Director AI"
*   **Arquivo:** `services/geminiService.ts` (Função `refineMotionChat`)
*   **Modelo:** Dinâmico (Router). Usa `gemini-3-pro` se Thinking ativado, `gemini-2.5-flash` se Maps ativado, etc.
*   **Persona:** Especialista em Motion Design, estilo "Hera Evolution", focado em prompts técnicos para vídeo (Veo).
*   **System Instruction:** 
    > "ATUE COMO: 'Motion Director AI'... MISSÃO: Criar prompts de vídeo cinematográficos... ESTILO: 'Hera Evolution'..."

## 2. Ferramentas (Tools) Configuradas

### Google Maps Grounding
*   **Trigger:** `config.useGrounding === 'googleMaps'`
*   **Código:** `tools: [{ googleMaps: {} }]`
*   **Uso:** Quando o usuário pede um vídeo de viagem ou localização. A IA consulta o Maps para obter coordenadas e estética real do local antes de gerar o prompt do vídeo.

### Google Search Grounding
*   **Trigger:** `config.useGrounding === 'googleSearch'`
*   **Código:** `tools: [{ googleSearch: {} }]`
*   **Uso:** Para obter informações factuais recentes (ex: "Quem ganhou o jogo ontem?") e incorporar isso no conteúdo do carrossel ou vídeo.

### Thinking Mode (Raciocínio)
*   **Trigger:** `config.useThinking === true`
*   **Configuração:** `thinkingConfig: { thinkingBudget: 32768 }`
*   **Uso:** Consultas complexas que exigem planejamento de cena ou roteiros muito detalhados. O modelo "pensa" (gera tokens ocultos de raciocínio) antes de responder.

## 3. Prompts Específicos

### Geração de Carrossel (AIDA Strategy)
O sistema injeta estratégias de marketing no prompt dependendo do objetivo escolhido:
*   *Vendas:* "STRATEGY: Aggressive Sales (AIDA). Slide 1: Pain Point..."
*   *Viral:* "STRATEGY: Relatability. 'Me in real life'..."

### Prompt de Imagem (Technical Enhancer)
Todos os prompts de imagem recebem um sufixo de qualidade automática:
> "8k resolution, cinematic lighting, depth of field, photorealistic, highly detailed, ray tracing..."
