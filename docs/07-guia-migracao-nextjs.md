
# Guia de Migração para Next.js

Este guia descreve os passos para migrar a aplicação atual (Vite/React SPA) para Next.js 14+ (App Router).

## 1. O que muda fundamentalmente?
1.  **Roteamento:** Deixa de ser um estado React (`currentView`) e passa a ser baseado em arquivos (`app/dashboard/page.tsx`, `app/create/page.tsx`).
2.  **Segurança da API Key:** Atualmente a chave está exposta no cliente (`process.env.API_KEY` injetado pelo Vite). No Next.js, moveremos as chamadas do Gemini para **Server Actions** ou **API Routes**, mantendo a chave segura no servidor.
3.  **Renderização:** De CSR (Client Side Rendering) total para uma mistura de Server Components (Shell, Configuração) e Client Components (Canvas interativos, Chat).

## 2. Estrutura Recomendada (App Router)

```
/app
  /layout.tsx           # Sidebar e TopBar globais
  /page.tsx             # Redireciona para /dashboard
  /dashboard/
      page.tsx          # DashboardView
  /create/
      page.tsx          # GeneratorView (Client Component)
  /creative/
      page.tsx          # CreativeGeneratorView
  /motion/
      page.tsx          # MotionGeneratorView
  /api/
      /generate/route.ts # (Opcional) Rotas de API se não usar Server Actions
/components             # Componentes de UI (mantém a maioria)
/lib/
  gemini.ts             # Lógica do geminiService.ts adaptada para rodar no servidor
```

## 3. Estratégia de Migração Segura

### Fase 1: Setup e Roteamento
1.  Inicie um novo projeto Next.js: `npx create-next-app@latest`.
2.  Copie a pasta `components` e `types.ts`.
3.  Instale dependências (`@google/genai`, tailwind, etc.).
4.  Crie as rotas no diretório `/app` correspondentes às Views atuais.
5.  Adicione `use client` no topo dos arquivos de View (`GeneratorView`, etc.), pois eles dependem muito de `window`, `document` e estado local.

### Fase 2: Refatoração de Serviços (Crítico)
1.  O arquivo `services/geminiService.ts` não pode ser importado diretamente por componentes de cliente se contiver a API Key secreta.
2.  **Ação:** Transformar funções como `generateCarousel` e `generateVeoVideo` em **Server Actions** (`'use server'`).
3.  Isso permite que o Frontend chame a função como uma promessa normal, mas a execução ocorre no servidor Google Cloud/Vercel, protegendo a chave.

### Fase 3: Adaptação de SSR/SSG
*   O `ConfigPanel` pode ser renderizado no servidor (Server Component) se os dados de configuração forem estáticos ou vindos de um DB.
*   O histórico de gerações (Dashboard) deve ser buscado via Server Component e passado para a lista de cliente.

## 4. Riscos e Atenção
*   **AudioContext:** APIs de navegador como `AudioContext` (usado no TTS) e `html-to-image` **quebram** se executadas no servidor. Certifique-se de que essas lógicas estejam dentro de `useEffect` ou em componentes marcados com `use client` e carregados dinamicamente (`next/dynamic`).
*   **Variáveis de Ambiente:** Mude `process.env.API_KEY` (Vite) para `process.env.GOOGLE_API_KEY` (Next.js server-side).
