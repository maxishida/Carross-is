
# SDKs e Bibliotecas Utilizadas

| Nome | Versão Aprox. | Finalidade | Onde é usado | Alternativas |
| :--- | :--- | :--- | :--- | :--- |
| **@google/genai** | ^1.0.0 | SDK oficial para comunicação com Gemini, Imagen e Veo. | `services/geminiService.ts` | `langchain`, `fetch` direto |
| **react** | ^18/19 | Biblioteca de UI principal. | Todo o projeto | `vue`, `svelte` |
| **html-to-image** | ^1.11 | Converter nós DOM (slides HTML) em imagens PNG. | `GeneratorView.tsx`, `Creative...View.tsx` | `html2canvas` |
| **jspdf** | ^2.5 | Gerar arquivos PDF a partir das imagens geradas. | `GeneratorView.tsx` | `react-pdf` |
| **jszip** | ^3.10 | Compactar múltiplas imagens em um arquivo .zip para download. | `GeneratorView.tsx` | Nativa do OS (não via web) |
| **tailwindcss** | CDN/PostCSS | Estilização utilitária rápida. | Todo o projeto (`index.html`, classes) | `styled-components`, `sass` |

## Notas sobre Dependências
*   A dependência crítica é `@google/genai`. O projeto está fortemente acoplado aos modelos do Google.
*   `html-to-image` é vital para a funcionalidade de "Exportação" pois permite que o CSS complexo (Glassmorphism) seja capturado visualmente.
