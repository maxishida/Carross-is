
# Funcionalidades Detalhadas por Ferramenta

Este documento serve como um guia de referência funcional para os três módulos principais do sistema. Ele detalha o fluxo de trabalho, os modelos de IA utilizados e fornece um checklist de capacidades.

---

## 1. Glass Carousel (Gerador de Carrosséis)
**Motor Principal:** `gemini-3-flash-preview` (Texto/Lógica) + `gemini-2.5-flash-image` (Imagens).

### Descrição
Uma ferramenta completa para transformar tópicos simples ou URLs em apresentações visuais de múltiplos slides. O foco é a retenção de atenção em redes sociais (LinkedIn/Instagram) utilizando layouts "Glassmorphism" gerados via CSS e imagens de fundo via IA.

### Fluxo de Execução
1.  **Input:** Usuário insere um Tópico ("Como investir") ou Conteúdo ("Texto base...").
2.  **Pesquisa (Grounding):** O sistema usa `googleSearch` para buscar fatos recentes se necessário.
3.  **Estruturação:** A IA define a quantidade de slides baseada no objetivo (Vendas, Viral, Educativo) e gera os textos (Títulos/Conteúdos).
4.  **Visualização:** Para cada slide, um prompt de imagem otimizado ("8k, cinematic...") é gerado e enviado ao modelo `imagen` para criar o fundo.
5.  **Refinamento:** O usuário edita textos, regenera imagens específicas ou muda o layout.

### Checklist de Funcionalidades
- [x] **Criação via Tópico:** Gera carrossel completo apenas com uma frase.
- [x] **Transformação de Conteúdo:** Aceita textos longos ou transcrições e resume em slides.
- [x] **Agente de Pesquisa:** Enriquece o conteúdo com dados reais da web (Google Search).
- [x] **Clonagem de Tom de Voz:** Analisa um texto de exemplo e imita o estilo de escrita.
- [x] **Engenharia Reversa de Estilo:** Analisa uma imagem de referência (upload) e extrai o prompt visual para replicar o estilo.
- [x] **Magic Rewrite:** Botão para reescrever o texto de um slide específico para ser mais "Conciso" ou "Impactante".
- [x] **TTS (Text-to-Speech):** Leitura em áudio do conteúdo do slide para acessibilidade ou revisão.
- [x] **Regeneração Individual:** Permite trocar a imagem de fundo de apenas um slide sem perder o resto.
- [x] **Exportação Híbrida:**
    - [x] PDF (Documento pronto para LinkedIn).
    - [x] ZIP (Imagens PNG separadas para Instagram).
    - [x] Roteiro TXT (Texto puro).

---

## 2. Creative Lab (Laboratório de Criativos)
**Motor Principal:** `gemini-3-flash-preview` (Conceitos) + `gemini-2.5-flash-image` (Geração) + `veo-3.1-fast` (Animação).

### Descrição
Focado em performance de anúncios (Ads) e testes A/B. Esta ferramenta gera 6 variações visuais e textuais sobre um mesmo tema ou produto, atribuindo uma nota preditiva de performance (CTR) para cada uma. Possui um modo específico para E-commerce.

### Fluxo de Execução
1.  **Modo Tópico:** Usuário insere um tema de campanha.
2.  **Modo Produto:** Usuário faz upload da foto do produto (sem fundo) e insere a URL.
3.  **Geração em Lote:** A IA cria 6 ângulos de marketing diferentes (ex: Dor/Solução, Prova Social, Urgência).
4.  **Scoring:** A IA avalia qual criativo tem maior potencial de clique (Score 0-100).
5.  **Edição Nano:** Um editor modal permite alterar a imagem gerada (Inpainting/Outpainting).

### Checklist de Funcionalidades
- [x] **Geração de Variações (6x):** Criação simultânea de 6 conceitos distintos.
- [x] **Modo E-commerce (Product Overlay):** Compõe a imagem gerada pela IA com a foto real do produto (PNG) sobreposta.
- [x] **AI Prediction Score:** Nota de 0 a 100 estimando a viralidade/conversão do criativo.
- [x] **Ordenação Inteligente:** Filtra os resultados pelo Score da IA.
- [x] **Nano Editor (Inpainting):**
    - [x] Remover Fundo.
    - [x] Adicionar Pessoa/Objeto.
    - [x] Upscale (Aumentar resolução para 2K).
    - [x] Outpainting (Expandir imagem quadrada 1:1 para Story 9:16).
- [x] **Motion (Image-to-Video):** Transforma o criativo estático vencedor em um vídeo de 8 segundos usando Veo.

---

## 3. Motion Director (Estúdio de Vídeo)
**Motor Principal:** `veo-3.1-generate-preview` (Vídeo) + `gemini-3-pro` (Raciocínio) + `gemini-2.5-flash` (Mapas).

### Descrição
Uma interface de chat avançada onde o usuário conversa com um "Diretor de IA". O sistema é capaz de planejar cenas complexas, visualizar o mundo real (Mapas) e gerar vídeos de alta fidelidade.

### Modos de Operação
1.  **Chat Studio:** Conversa livre para criar qualquer vídeo.
2.  **Geo Maps:** Especializado em "Travel Maps" (Zoom de satélite estilo Google Earth).
3.  **Data Motion:** Especializado em gráficos 3D animados para apresentações corporativas.
4.  **Kinetic Typo:** Animação de texto rítmica (estilo Apple/Nike).

### Checklist de Funcionalidades
- [x] **Geração de Vídeo (Text-to-Video):** Cria vídeos nativos em 1080p ou 4K (upscaled).
- [x] **Thinking Mode:** Usa o Gemini 3 Pro com "Thinking Budget" de 32k tokens para planejar roteiros complexos antes de gerar.
- [x] **Maps Grounding:** Consulta o Google Maps para obter coordenadas e estética real de locais antes de renderizar o vídeo.
- [x] **Search Grounding:** Busca tendências atuais para criar vídeos sobre notícias quentes.
- [x] **Análise de Vídeo:** Permite upload de um vídeo de referência para que a IA entenda o estilo e tente replicar no Veo.
- [x] **Controle de Aspect Ratio:** Suporte nativo para 16:9 (Youtube) e 9:16 (TikTok/Reels).
- [x] **Playback Nativo:** Player de vídeo integrado com loop e download.

---

## Resumo Técnico dos Modelos

| Funcionalidade | Modelo Google Utilizado | Custo/Latência |
| :--- | :--- | :--- |
| **Texto Geral / Chat** | `gemini-3-flash-preview` | Baixo / Muito Rápido |
| **Raciocínio Complexo** | `gemini-3-pro-preview` | Médio / Lento (Thinking) |
| **Geração de Imagem** | `gemini-2.5-flash-image` | Baixo / Rápido |
| **Edição de Imagem (Pro)** | `gemini-3-pro-image-preview` | Alto / Médio |
| **Geração de Vídeo** | `veo-3.1-generate-preview` | Alto / Muito Lento (~1-2 min) |
| **Vídeo Rápido (Img-to-Vid)**| `veo-3.1-fast-generate-preview`| Médio / Rápido |
| **Síntese de Voz (TTS)** | `gemini-2.5-flash-preview-tts` | Baixo / Tempo Real |
| **Dados de Mapa** | `gemini-2.5-flash` (Tools) | Baixo / Rápido |
