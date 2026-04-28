# ☁️ GitHub Cloud Storage - Enterprise Edition

Uma solução de armazenamento em nuvem de nível empresarial, construída inteiramente sobre a infraestrutura do GitHub. Esta aplicação transforma o seu repositório num gestor de ficheiros avançado com segurança reforçada e capacidades de organização profissional.

## 🚀 Funcionalidades Enterprise

### 📁 Gestão Avançada de Ficheiros
*   **Movimentação entre Pastas**: Mova ficheiros de forma instantânea entre qualquer diretório do seu repositório através de um novo seletor de destino inteligente.
*   **CRUD Completo**: Criar, ler, renomear e eliminar ficheiros e pastas com uma interface fluida.
*   **Upload Inteligente**: Suporte para múltiplos ficheiros com sistema de arrastar e largar (*drag and drop*).

### 🛡️ Segurança e Proteção de Dados
*   **Proteção de Diretórios**: A pasta `assets/` e o seu conteúdo estão agora protegidos contra eliminação ou alteração acidental.
*   **Ficheiros de Sistema Blindados**: `index.html`, `app.js` e `README.md` na raiz estão bloqueados para garantir a estabilidade da aplicação.
*   **Autenticação Local**: O seu Personal Access Token nunca sai do seu navegador, sendo armazenado apenas no `localStorage`.

### 📊 Monitorização de Recursos
*   **Capacidade de 50 GB**: Interface e lógica preparadas para gerir grandes volumes de dados (limite visual de 50 GB).
*   **Estatísticas Recursivas**: Cálculo em tempo real do armazenamento total do repositório e contagem global de ficheiros.
*   **Métricas de Pasta**: Veja instantaneamente quantos ficheiros e quanto espaço cada diretório ocupa.

## 🛠️ Como Configurar

1.  **Repositório**: Crie um repositório no GitHub.
2.  **Upload**: Adicione `index.html` e `app.js` à raiz.
3.  **GitHub Pages**: Ative o serviço nas definições do repositório (Settings > Pages).
4.  **Token**: Gere um *Personal Access Token (classic)* com a permissão `repo`.

## 📖 Instruções de Utilização

*   **Para Mover**: Clique no ícone de setas opostas (⇄) ao lado de um ficheiro, selecione a pasta de destino e confirme.
*   **Para Renomear**: Use o ícone de lápis (✎).
*   **Para Navegar**: Utilize a barra de *breadcrumbs* no topo para voltar rapidamente a pastas anteriores ou à raiz.
*   **Pesquisa**: Use a barra de pesquisa para filtrar ficheiros em tempo real.

---
*Nota: A renomeação e movimentação de ficheiros na API do GitHub são processadas como uma criação de um novo objeto seguida da eliminação do antigo. A aplicação gere este ciclo de vida automaticamente.*

Desenvolvido com ❤️ por Manus AI.
