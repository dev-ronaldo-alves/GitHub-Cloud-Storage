// Configurações e Estado
let state = {
    token: localStorage.getItem('gh_token') || '',
    owner: '',
    repo: '',
    currentPath: '',
    files: []
};

// Elementos DOM
const elements = {
    authSection: document.getElementById('auth-section'),
    userSection: document.getElementById('user-section'),
    welcomeScreen: document.getElementById('welcome-screen'),
    appContent: document.getElementById('app-content'),
    tokenInput: document.getElementById('github-token'),
    btnLogin: document.getElementById('btn-login'),
    btnLogout: document.getElementById('btn-logout'),
    repoInfo: document.getElementById('repo-info'),
    fileList: document.getElementById('file-list'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    btnNewFolder: document.getElementById('btn-new-folder'),
    fileUpload: document.getElementById('file-upload'),
    statusMsg: document.getElementById('status-msg'),
    modalFolder: document.getElementById('modal-folder'),
    folderNameInput: document.getElementById('folder-name'),
    btnConfirmFolder: document.getElementById('btn-confirm-folder'),
    btnCancelFolder: document.getElementById('btn-cancel-folder'),
    dropZone: document.getElementById('drop-zone')
};

// Inicialização
async function init() {
    if (state.token) {
        elements.tokenInput.value = state.token;
        await login();
    }
}

// Autenticação e Login
async function login() {
    const token = elements.tokenInput.value.trim();
    if (!token) return alert('Por favor, insira um token.');

    try {
        updateStatus('A autenticar...');
        // Obter info do utilizador e repositório
        const userRes = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${token}` }
        });
        
        if (!userRes.ok) throw new Error('Token inválido');
        const userData = await userRes.json();
        state.owner = userData.login;

        // Tentar detectar o repositório atual a partir do URL (se estiver no GH Pages)
        // Caso contrário, podemos pedir ao utilizador ou usar um fixo se soubermos
        const urlParts = window.location.hostname.split('.');
        if (urlParts[1] === 'github' && urlParts[2] === 'io') {
            state.repo = window.location.pathname.split('/')[1];
        } else {
            // Fallback para desenvolvimento local: Assume que o utilizador quer usar um repo específico
            // Num caso real, poderíamos listar os repos do utilizador e deixá-lo escolher
            const repoInput = prompt("Introduza o nome do repositório para armazenamento:", "github-cloud-storage");
            if (!repoInput) return;
            state.repo = repoInput;
        }

        state.token = token;
        localStorage.setItem('gh_token', token);
        
        showApp();
        await loadFiles();
    } catch (error) {
        console.error(error);
        alert('Erro ao conectar: ' + error.message);
        logout();
    }
}

function logout() {
    state.token = '';
    localStorage.removeItem('gh_token');
    elements.authSection.classList.remove('hidden');
    elements.userSection.classList.add('hidden');
    elements.welcomeScreen.classList.remove('hidden');
    elements.appContent.classList.add('hidden');
}

function showApp() {
    elements.authSection.classList.add('hidden');
    elements.userSection.classList.remove('hidden');
    elements.welcomeScreen.classList.add('hidden');
    elements.appContent.classList.remove('hidden');
    elements.repoInfo.textContent = `${state.owner}/${state.repo}`;
}

// Gestão de Ficheiros
async function loadFiles(path = state.currentPath) {
    state.currentPath = path;
    updateStatus('A carregar ficheiros...');
    renderBreadcrumbs();
    
    try {
        const res = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, {
            headers: { 'Authorization': `token ${state.token}` }
        });
        
        if (!res.ok) {
            if (res.status === 404) {
                state.files = [];
            } else {
                throw new Error('Erro ao carregar ficheiros');
            }
        } else {
            state.files = await res.json();
        }
        
        renderFileList();
        updateStatus('');
    } catch (error) {
        updateStatus('Erro ao carregar.');
        console.error(error);
    }
}

function renderFileList() {
    elements.fileList.innerHTML = '';
    
    if (state.files.length === 0) {
        elements.fileList.innerHTML = '<div class="p-8 text-center text-gray-400">Pasta vazia</div>';
        return;
    }

    // Ordenar: pastas primeiro, depois ficheiros
    const sortedFiles = [...state.files].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
    });

    sortedFiles.forEach(file => {
        const isDir = file.type === 'dir';
        const item = document.createElement('div');
        item.className = 'file-item grid grid-cols-12 gap-4 px-6 py-3 items-center transition cursor-pointer';
        
        const size = isDir ? '--' : formatBytes(file.size);
        const icon = isDir ? 'fa-folder text-yellow-500' : 'fa-file text-blue-400';

        item.innerHTML = `
            <div class="col-span-7 flex items-center gap-3 overflow-hidden">
                <i class="fas ${icon} text-lg"></i>
                <span class="truncate font-medium text-gray-700">${file.name}</span>
            </div>
            <div class="col-span-3 text-right text-sm text-gray-500">${size}</div>
            <div class="col-span-2 text-right flex justify-end gap-2">
                <button class="btn-download p-2 hover:bg-gray-200 rounded-full text-gray-500" title="Download">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn-delete p-2 hover:bg-red-100 rounded-full text-red-500" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Eventos
        item.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            if (isDir) loadFiles(file.path);
        });

        item.querySelector('.btn-download').onclick = () => window.open(file.download_url || file.html_url, '_blank');
        item.querySelector('.btn-delete').onclick = () => deleteFile(file);

        elements.fileList.appendChild(item);
    });
}

function renderBreadcrumbs() {
    elements.breadcrumbs.innerHTML = `
        <li class="inline-flex items-center">
            <a href="#" class="text-blue-600 hover:text-blue-800" onclick="loadFiles('')">Raiz</a>
        </li>
    `;
    
    if (!state.currentPath) return;

    const parts = state.currentPath.split('/');
    let pathAcc = '';
    parts.forEach((part, index) => {
        pathAcc += (index === 0 ? '' : '/') + part;
        const isLast = index === parts.length - 1;
        const currentPathCopy = pathAcc;
        
        elements.breadcrumbs.innerHTML += `
            <li>
                <div class="flex items-center">
                    <i class="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
                    <a href="#" class="${isLast ? 'text-gray-500 cursor-default' : 'text-blue-600 hover:text-blue-800'}" 
                       onclick="${isLast ? '' : `loadFiles('${currentPathCopy}')`}">
                        ${part}
                    </a>
                </div>
            </li>
        `;
    });
}

// Ações
async function createFolder() {
    const name = elements.folderNameInput.value.trim();
    if (!name) return;

    // No GitHub, "pastas" não existem sozinhas. Criamos um ficheiro .keep dentro
    const path = `${state.currentPath ? state.currentPath + '/' : ''}${name}/.keep`;
    
    try {
        updateStatus('A criar pasta...');
        await uploadToGithub(path, 'Pasta criada via GitHub Cloud', 'Created via UI');
        elements.modalFolder.classList.add('hidden');
        elements.folderNameInput.value = '';
        await loadFiles();
    } catch (error) {
        alert('Erro ao criar pasta: ' + error.message);
    }
}

async function handleFileUpload(e) {
    const files = e.target.files;
    if (!files.length) return;

    for (const file of files) {
        try {
            updateStatus(`A carregar ${file.name}...`);
            const content = await readFileAsBase64(file);
            const path = `${state.currentPath ? state.currentPath + '/' : ''}${file.name}`;
            await uploadToGithub(path, content, `Upload: ${file.name}`, true);
        } catch (error) {
            alert(`Erro no upload de ${file.name}: ` + error.message);
        }
    }
    await loadFiles();
    elements.fileUpload.value = '';
}

async function uploadToGithub(path, content, message, isBase64 = false) {
    // Verificar se ficheiro já existe para obter o SHA (necessário para update)
    let sha = null;
    try {
        const checkRes = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, {
            headers: { 'Authorization': `token ${state.token}` }
        });
        if (checkRes.ok) {
            const data = await checkRes.json();
            sha = data.sha;
        }
    } catch (e) {}

    const body = {
        message: message,
        content: isBase64 ? content : btoa(content)
    };
    if (sha) body.sha = sha;

    const res = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${state.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro no upload');
    }
}

async function deleteFile(file) {
    if (!confirm(`Tem a certeza que deseja eliminar ${file.name}?`)) return;

    try {
        updateStatus(`A eliminar ${file.name}...`);
        const res = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${file.path}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Delete ${file.name}`,
                sha: file.sha
            })
        });

        if (!res.ok) throw new Error('Erro ao eliminar');
        await loadFiles();
    } catch (error) {
        alert(error.message);
    }
}

// Helpers
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function updateStatus(msg) {
    elements.statusMsg.textContent = msg;
}

// Event Listeners
elements.btnLogin.onclick = login;
elements.btnLogout.onclick = logout;
elements.btnNewFolder.onclick = () => elements.modalFolder.classList.remove('hidden');
elements.btnCancelFolder.onclick = () => elements.modalFolder.classList.add('hidden');
elements.btnConfirmFolder.onclick = createFolder;
elements.fileUpload.onchange = handleFileUpload;

// Drag and Drop
elements.dropZone.ondragover = (e) => {
    e.preventDefault();
    elements.dropZone.classList.add('dragover');
};
elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
elements.dropZone.ondrop = (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length) {
        handleFileUpload({ target: { files } });
    }
};

// Start
init();
