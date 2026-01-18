
# Boas Práticas e Padrões

## 1. Performance
*   **Lazy Loading:** As ferramentas de geração de vídeo e imagem são pesadas. No futuro, carregar os players de vídeo e bibliotecas de visualização apenas quando necessário.
*   **Otimização de Assets:** Imagens geradas são base64 strings grandes. Em produção, deve-se fazer upload delas para um Cloud Storage (S3/Firebase) e usar apenas URLs no frontend para evitar travar a memória do navegador.
*   **Debounce:** Nos inputs de texto (como o chat do agente), use debounce para evitar chamadas de API desnecessárias enquanto o usuário digita.

## 2. Segurança
*   **API Key:** Atualmente, o projeto assume uma chave injetada no ambiente do cliente. **Isso não é seguro para produção pública.** Migrar para um backend proxy (Next.js API Route) é mandatório para deploy público.
*   **Sanitização:** Ao renderizar HTML gerado pela IA (nos slides), sempre use bibliotecas de sanitização (como `dompurify`) antes de injetar via `dangerouslySetInnerHTML` (embora o código atual confie na saída da IA, é um risco de XSS).

## 3. Escalabilidade
*   **Separação de Contexto:** O `geminiService.ts` está ficando grande ("God Object"). Recomenda-se quebrá-lo em `services/videoService.ts`, `services/textService.ts`, etc.
*   **Componentização:** O `GeneratorView` contém muita lógica de estado. Mover a lógica de geração para um Custom Hook (ex: `useCarouselGenerator`) limparia a visualização.

## 4. Organização de Código
*   **Nomenclatura:** Manter nomes em inglês para código (variáveis, funções) e português apenas para textos de UI visíveis ao usuário.
*   **Tipagem:** Evitar `any`. As interfaces em `types.ts` devem ser a única fonte de verdade para os formatos de dados da IA.
