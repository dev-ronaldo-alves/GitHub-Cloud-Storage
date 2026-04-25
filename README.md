# GitHub Cloud Storage

Uma aplicação fullstack simples para transformar um repositório GitHub num sistema de armazenamento em nuvem pessoal, hospedado via GitHub Pages.

## 🚀 Funcionalidades

- **Gestão de Ficheiros:** Upload, download e eliminação de ficheiros diretamente no repositório.
- **Pastas:** Criação de pastas (utilizando o padrão `.keep`).
- **Navegação:** Interface intuitiva com breadcrumbs.
- **Segurança:** Autenticação via Personal Access Token (PAT) armazenado localmente no browser.
- **Hospedagem:** Pronto para ser servido via GitHub Pages.

## 🛠️ Como configurar

1. **Crie um Repositório:** Crie um novo repositório no GitHub (ex: `meu-cloud-storage`).
2. **Suba os Ficheiros:** Adicione o `index.html` e o `app.js` à raiz do repositório.
3. **Ative o GitHub Pages:**
   - Vá a **Settings** > **Pages**.
   - Em "Build and deployment", escolha a branch `main` e a pasta `/ (root)`.
   - Clique em **Save**.
4. **Crie um Token de Acesso (PAT):**
   - Vá a **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
   - Clique em **Generate new token**.
   - Selecione o escopo `repo` (necessário para ler e escrever ficheiros).
   - Copie o token gerado.

## 🖥️ Utilização

1. Aceda ao URL do seu GitHub Pages (ex: `https://utilizador.github.io/meu-cloud-storage/`).
2. Insira o seu **Personal Access Token**.
3. Comece a gerir os seus ficheiros!

## ⚠️ Notas Importantes

- **Limites da API:** O GitHub impõe limites de taxa para a API. Para uso pessoal, os limites do PAT são geralmente suficientes.
- **Tamanho de Ficheiros:** A API de conteúdos do GitHub tem um limite de 25MB para ficheiros via REST API. Para ficheiros maiores, recomenda-se o uso de Git LFS ou outras abordagens.
- **Segurança:** Nunca partilhe o seu Token. A aplicação guarda-o apenas no `localStorage` do seu browser.
