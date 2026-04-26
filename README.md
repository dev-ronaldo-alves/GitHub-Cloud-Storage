# ☁️ GitHub Cloud Storage - Ultimate

![GitHub Cloud Storage Screenshot](https://via.placeholder.com/800x400?text=GitHub+Cloud+Storage+Interface)

Uma aplicação web **fullstack** robusta e intuitiva que transforma qualquer repositório GitHub num sistema de armazenamento em nuvem pessoal. Hospedado diretamente via GitHub Pages, permite a gestão completa de ficheiros e pastas com estatísticas em tempo real e proteção de dados críticos.

## ✨ Funcionalidades Principais

Esta aplicação oferece um conjunto abrangente de funcionalidades para gerir o seu armazenamento no GitHub:

*   **Gestão Completa de Ficheiros (CRUD)**:
    *   **Criar**: Crie novas pastas (utilizando o padrão `.keep` para compatibilidade com Git) e faça upload de múltiplos ficheiros através de seleção ou arrastar e largar (*drag and drop*).
    *   **Ler**: Visualize o conteúdo do seu repositório com navegação por *breadcrumbs* e uma barra de pesquisa instantânea para encontrar ficheiros rapidamente.
    *   **Atualizar**: Renomeie ficheiros e pastas diretamente na interface, com o sistema a gerir a complexidade da API do GitHub (DELETE + PUT).
    *   **Eliminar**: Remova ficheiros e pastas com confirmação de segurança.
*   **Estatísticas de Armazenamento em Tempo Real**:
    *   **Uso Total**: Visualize o espaço total ocupado no seu repositório e a contagem global de ficheiros.
    *   **Uso por Pasta**: Obtenha estatísticas detalhadas (número de ficheiros e tamanho) para o diretório atualmente visualizado.
    *   **Barra de Progresso**: Acompanhe visualmente o seu consumo de armazenamento em relação a um limite configurável de 50 GB.
*   **Proteção de Ficheiros Críticos**:
    *   Ficheiros essenciais como `index.html`, `app.js` e `README.md` são protegidos contra eliminação ou renomeação acidental na raiz do repositório, garantindo a continuidade da aplicação.
*   **Interface Moderna e Responsiva**:
    *   Desenvolvida com Tailwind CSS para um design limpo, moderno e adaptável a qualquer dispositivo.
*   **Segurança Robusta**:
    *   Autenticação segura via **Personal Access Token (PAT)** do GitHub, armazenado localmente no seu navegador (`localStorage`) e nunca enviado para outros servidores além da API oficial do GitHub.

## 🚀 Como Configurar e Implementar

Siga estes passos para ter a sua própria nuvem pessoal no GitHub Pages:

1.  **Crie um Repositório GitHub**: Crie um novo repositório público ou privado no GitHub (ex: `meu-cloud-storage`).
2.  **Faça Upload dos Ficheiros**: Adicione os ficheiros `index.html`, `app.js` e `README.md` (este mesmo ficheiro) à raiz do seu novo repositório.
3.  **Ative o GitHub Pages**:
    *   No seu repositório, vá a **Settings** (Configurações) > **Pages**.
    *   Em "Build and deployment", selecione a branch `main` (ou a que estiver a usar) e a pasta `/ (root)`.
    *   Clique em **Save**.
    *   Aguarde alguns minutos para que o GitHub Pages construa e publique o seu site. O URL será algo como `https://<seu-utilizador>.github.io/<seu-repositorio>/`.
4.  **Gere um Personal Access Token (PAT)**:
    *   No GitHub, clique na sua foto de perfil (canto superior direito) > **Settings** (Configurações).
    *   No menu lateral esquerdo, role até ao fim e clique em **Developer settings**.
    *   Selecione **Personal access tokens** > **Tokens (classic)**.
    *   Clique em **Generate new token** e depois **Generate new token (classic)**.
    *   **Note**: Dê um nome descritivo ao token (ex: `GitHub Cloud Storage App`).
    *   **Expiration**: Defina uma validade adequada (para uso pessoal, "No expiration" pode ser conveniente, mas com cautela).
    *   **Select scopes**: **MUITO IMPORTANTE**: Marque a caixa **`repo`**. Isto concede as permissões necessárias para a aplicação ler, criar, atualizar e eliminar ficheiros no seu repositório.
    *   Clique em **Generate token**.
    *   **Copie o token imediatamente!** Ele não será mostrado novamente. Guarde-o num local seguro.

## 🖥️ Como Utilizar

1.  **Aceda à Aplicação**: Abra o URL do seu GitHub Pages no navegador (ex: `https://<seu-utilizador>.github.io/<seu-repositorio>/`).
2.  **Conecte com o Token**: Cole o **Personal Access Token** que gerou no campo "Insira o seu Token" e clique em **Conectar**.
3.  **Comece a Gerir**: A aplicação irá carregar os seus ficheiros e pastas. Pode agora:
    *   Navegar entre pastas clicando nelas.
    *   Criar novas pastas usando o botão "Nova Pasta".
    *   Fazer upload de ficheiros clicando em "Upload" ou arrastando-os para a área de ficheiros.
    *   Renomear ficheiros clicando no ícone de lápis ao lado do nome do ficheiro.
    *   Eliminar ficheiros clicando no ícone de lixo.
    *   Pesquisar ficheiros usando a barra de pesquisa.
    *   Monitorizar o seu uso de armazenamento no painel lateral.

## ⚠️ Notas Importantes e Limitações

*   **Limites da API do GitHub**: A API de Conteúdos do GitHub tem um limite de 25 MB para ficheiros enviados via REST API. Para ficheiros maiores, considere usar Git LFS ou outras soluções de armazenamento de objetos.
*   **Limite Visual de 50 GB**: A aplicação está configurada para exibir um limite visual de 50 GB para as estatísticas de armazenamento. Embora o GitHub permita repositórios maiores, é recomendado manter o tamanho abaixo de 1 GB a 5 GB para um desempenho ideal.
*   **Segurança do Token**: O seu Personal Access Token é armazenado apenas no `localStorage` do seu navegador. Ele nunca é enviado para qualquer servidor de terceiros, apenas para a API oficial do GitHub. No entanto, tenha sempre cuidado ao usar PATs e considere as permissões que lhes atribui.
*   **Renomeação de Pastas**: A API do GitHub não suporta a renomeação direta de pastas. A funcionalidade de renomeação na aplicação aplica-se a ficheiros. Para "renomear" uma pasta, seria necessário mover todos os seus conteúdos para uma nova pasta e depois eliminar a antiga, o que é uma operação mais complexa e não implementada diretamente para pastas nesta versão.

## 🛠️ Tecnologias Utilizadas

*   **Frontend**: HTML5, Tailwind CSS, JavaScript (Vanilla JS)
*   **Backend**: GitHub REST API
*   **Hospedagem**: GitHub Pages

--- 

Desenvolvido com ❤️ por Manus AI.
