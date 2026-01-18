
# Arquitetura Técnica

## 1. Diagrama Lógico (Fluxo de Dados)

```mermaid
[Client (Browser)] 
      |
      v
[React Components (View Layer)]
      |
      v
[Gemini Service (Service Layer / Controller)] --+--> [Google Maps Tool]
      |                                         |--> [Google Search Tool]
      |                                         |--> [Veo Video Model]
      v                                         |--> [Imagen Model]
[Google GenAI SDK (@google/genai)] <------------+
      |
      v
[Google Gemini API Cloud]
```

## 2. Camadas do Sistema

### A. Frontend (Camada de Apresentação)
*   **Framework:** React 19 (SPA - Single Page Application).
*   **Estilização:** Tailwind CSS com design system "Glassmorphism" e "Neon".
*   **Gerenciamento de Estado:** `useState`, `useRef` (Local State) e `localStorage` para persistência simples.
*   **Roteamento:** Condicional simples (via estado `currentView` no `App.tsx`).

### B. Serviços (Camada de Lógica de Negócios)
*   **Centralização:** Toda a lógica de interação com a IA está centralizada em `services/geminiService.ts`.
*   **Responsabilidade:** Autenticação (API Key), construção de prompts, tratamento de erros, decodificação de áudio e manipulação de blobs.

### C. Integrações (Camada Externa)
*   **Google Gemini API:** Único provedor de IA para texto, imagem, vídeo, áudio e busca.
*   **HTML5 APIs:** AudioContext (para playback PCM), Canvas (para manipulação de imagem).

## 3. Padrões Utilizados
*   **Service Pattern:** Separação da lógica da API (`geminiService`) da UI (`components`).
*   **Container/Presentational Pattern (Híbrido):** Componentes como `GeneratorView` gerenciam lógica e dados, enquanto `SlideCard` foca mais em apresentação.
*   **Singleton:** Utilizado para o `AudioContext` no serviço de IA.
*   **Fail-Fast & Error Boundaries:** Tratamento de erros de renderização e falhas de API com feedback visual ao usuário.
