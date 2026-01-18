
# Manual Técnico de Instalação e Setup

Este documento guia o desenvolvedor desde a configuração inicial do ambiente até a execução da aplicação, com foco específico na integração do SDK **Google GenAI** (`@google/genai`).

## 1. Pré-requisitos de Sistema

Antes de iniciar, certifique-se de ter instalado:
*   **Node.js**: Versão 18.0.0 ou superior (Recomendado: LTS v20+).
*   **Gerenciador de Pacotes**: `npm` (vem com Node) ou `yarn`.
*   **Editor de Código**: VS Code (recomendado com extensão ES7+ React/Redux/React-Native snippets).
*   **Chave de API do Google**: Uma chave válida obtida no [Google AI Studio](https://aistudio.google.com/).

---

## 2. Instalação do Projeto

### Passo 1: Clonar e Entrar no Diretório
```bash
git clone <url-do-repositorio>
cd nome-do-projeto
```

### Passo 2: Instalar Dependências Gerais
Instale as bibliotecas base (React, Vite, Tailwind, etc.):
```bash
npm install
# ou
yarn install
```

---

## 3. Instalação e Configuração do Google GenAI (Pacote G)

Esta é a etapa crítica para o funcionamento da IA. O projeto utiliza o SDK oficial mais recente do Google para JavaScript/TypeScript.

### Passo 1: Instalar o Pacote
Execute o comando abaixo para adicionar a dependência ao projeto:

```bash
npm install @google/genai
```

### Passo 2: Verificar Dependências
Certifique-se de que o `package.json` contém a versão correta:

```json
"dependencies": {
  "@google/genai": "^1.0.0", 
  "react": "^19.2.3",
  ...
}
```

### Passo 3: Configurar Variáveis de Ambiente
O SDK exige uma API Key para autenticação.

1.  Crie um arquivo chamado `.env` na raiz do projeto (ao lado do `package.json`).
2.  Adicione a seguinte linha (substitua pelo sua chave real):

```env
API_KEY=AIzaSy...SuaChaveAqui...
```

> **Nota de Segurança:** Nunca comite o arquivo `.env` no Git. Adicione-o ao `.gitignore`.

### Passo 4: Implementação no Código
O projeto já possui uma camada de abstração em `services/geminiService.ts`. O padrão de inicialização utilizado é:

```typescript
import { GoogleGenAI } from "@google/genai";

// Inicialização segura
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Exemplo de chamada (Texto)
const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: 'Seu prompt aqui',
});
```

---

## 4. Executando a Aplicação

### Modo de Desenvolvimento
Para iniciar o servidor local com Hot Reload (Vite):

```bash
npm run dev
```
O terminal exibirá o endereço local, geralmente `http://localhost:5173`.

### Modo de Produção (Build)
Para gerar os arquivos estáticos otimizados na pasta `/dist`:

```bash
npm run build
```

---

## 5. Solução de Problemas Comuns (Google GenAI)

### Erro: `API Key not found`
*   **Causa:** O arquivo `.env` não foi criado ou a variável `API_KEY` não está sendo lida.
*   **Solução:** Verifique se o arquivo `.env` está na raiz. Se estiver usando Vite, certifique-se de que a configuração de `define` no `vite.config.js` está expondo `process.env.API_KEY` ou use `import.meta.env.VITE_API_KEY` (se refatorar).

### Erro: `429 Too Many Requests`
*   **Causa:** Você excedeu a cota gratuita do modelo Gemini.
*   **Solução:** Aguarde alguns minutos ou faça upgrade para o plano pago no Google Cloud Console se estiver usando modelos de alta demanda (como o Veo).

### Erro: `Model not found` (ex: Veo ou Imagen)
*   **Causa:** Você está tentando acessar um modelo (ex: `veo-3.1-generate-preview`) que requer acesso pago/aprovado ou a chave de API não tem permissão nesse projeto do Google Cloud.
*   **Solução:** Verifique se sua chave de API está vinculada a um projeto com faturamento ativado para uso de geração de vídeo/imagem.

---

## 6. Estrutura de Importação Recomendada

Ao criar novos arquivos que usam IA, siga estritamente este padrão de importação para evitar erros de tipagem:

**Correto:**
```typescript
import { GoogleGenAI, Schema, Type } from "@google/genai";
```

**Incorreto (APIs Depreciadas):**
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"; // Pacote antigo
import { models } from "@google/genai"; // Importação direta de sub-módulos não recomendada
```
