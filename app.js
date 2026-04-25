// Estado Global da Aplicação
let state = {
    token: localStorage.getItem('gh_token') || '',
    owner: '',
    repo: '',
    currentPath: '',
    files: [],
    filteredFiles: [],
    itemToRename: null
};

// Mapeamento de Elementos DOM
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
    modalRename: document.getElementById('modal-rename'),
    renameInput: document.getElementById('rename-input'),
    btnConfirmRename: document.getElementById('btn-confirm-rename'),
    btnCancelRename: document.getElementById('btn-cancel-rename'),
    searchInput: document.getElementById('search-input'),
    btnRefresh: document.getElementById('btn-refresh'),
    dropZone: document.getElementById('drop-zone')
};

// --- INICIALIZAÇÃO ---
async function init() {
    if (state.token) {
        elements.tokenInput.value = state.token;
        await login();
    }
}

// --- AUTENTICAÇÃO ---
async function login() {
    const token = elements.tokenInput.value.trim();
    if (!token) return;

    try {
        updateStatus('A conectar...');
        const userRes = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${token}` }
        });
        
        if (!userRes.ok) throw new Error('Token inválido ou expirado.');
        const userData = await userRes.json();
        state.owner = userData.login;

        // Tentar obter repo do URL ou pedir
        const urlParts = window.location.hostname.split('.');
        if (urlParts[1] === 'github' && urlParts[2] === 'io') {
            state.repo = window.location.pathname.split('/')[1] || prompt("Introduza o nome do repositório:");
        } else {
            state.repo = localStorage.getItem('gh_repo') || prompt("Introduza o nome do repositório para armazenamento:", "github-cloud-storage");
        }

        if (!state.repo) return logout();
        
        state.token = token;
        localStorage.setItem('gh_token', token);
        localStorage.setItem('gh_repo', state.repo);
        
        showAppUI();
        await loadFiles();
    } catch (error) {
        alert(error.message);
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

function showAppUI() {
    elements.authSection.classList.add('hidden');
    elements.userSection.classList.remove('hidden');
    elements.welcomeScreen.classList.add('hidden');
    elements.appContent.classList.remove('hidden');
    elements.repoInfo.textContent = `${state.owner}/${state.repo}`;
}

// --- OPERAÇÕES DE FICHEIROS (CRUD) ---

// 1. READ (Listar e Pesquisar)
async function loadFiles(path = state.currentPath) {
    state.currentPath = path;
    updateStatus('A ler diretório...');
    renderBreadcrumbs();
    
    try {
        const res = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, {
            headers: { 'Authorization': `token ${state.token}` },
            cache: 'no-store'
        });
        
        if (res.status === 404) {
            state.files = [];
        } else if (!res.ok) {
            throw new Error('Erro ao aceder ao repositório.');
        } else {
            state.files = await res.json();
        }
        
        state.filteredFiles = [...state.files];
        renderFileList();
        updateStatus('');
    } catch (error) {
        updateStatus('Erro na leitura.');
        console.error(error);
    }
}

function renderFileList() {
    elements.fileList.innerHTML = '';
    
    if (state.filteredFiles.length === 0) {
        elements.fileList.innerHTML = `
            <div class="p-20 text-center">
                <i class="fas fa-folder-open text-gray-200 text-6xl mb-4"></i>
                <p class="text-gray-400 font-medium">Nenhum ficheiro encontrado nesta pasta.</p>
            </div>`;
        return;
    }

    const sorted = state.filteredFiles.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
    });

    sorted.forEach(file => {
        const isDir = file.type === 'dir';
        const item = document.createElement('div');
        item.className = 'file-item grid grid-cols-12 gap-4 px-6 py-4 items-center transition cursor-pointer border-b border-gray-50';
        
        item.innerHTML = `
            <div class="col-span-7 md:col-span-8 flex items-center gap-4 overflow-hidden">
                <div class="w-10 h-10 rounded-xl ${isDir ? 'bg-yellow-50 text-yellow-500' : 'bg-blue-50 text-blue-500'} flex items-center justify-center flex-shrink-0">
                    <i class="fas ${isDir ? 'fa-folder' : 'fa-file'} text-lg"></i>
                </div>
                <span class="truncate font-semibold text-gray-700">${file.name}</span>
            </div>
            <div class="col-span-3 md:col-span-2 text-right text-xs font-bold text-gray-400">${isDir ? '--' : formatBytes(file.size)}</div>
            <div class="col-span-2 text-right flex justify-end gap-1">
                <button class="btn-rename p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition" title="Renomear">
                    <i class="fas fa-pen text-xs"></i>
                </button>
                <button class="btn-delete p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition" title="Eliminar">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </div>
        `;

        item.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            if (isDir) loadFiles(file.path);
            else window.open(file.download_url || file.html_url, '_blank');
        });

        item.querySelector('.btn-rename').onclick = (e) => { e.stopPropagation(); openRenameModal(file); };
        item.querySelector('.btn-delete').onclick = (e) => { e.stopPropagation(); deleteItem(file); };

        elements.fileList.appendChild(item);
    });
}

// 2. CREATE (Pastas e Uploads)
async function createFolder() {
    const name = elements.folderNameInput.value.trim();
    if (!name) return;

    const path = `${state.currentPath ? state.currentPath + '/' : ''}${name}/.keep`;
    try {
        updateStatus('A criar pasta...');
        await uploadToGithub(path, 'Pasta criada', 'Created via UI');
        elements.modalFolder.classList.add('hidden');
        elements.folderNameInput.value = '';
        await loadFiles();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

async function handleFileUpload(e) {
    const files = e.target.files || e.dataTransfer.files;
    if (!files.length) return;

    for (const file of files) {
        try {
            updateStatus(`A enviar ${file.name}...`);
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

// 3. UPDATE (Renomear)
// Nota: No GitHub API, "renomear" é um DELETE seguido de um PUT (Create)
function openRenameModal(file) {
    state.itemToRename = file;
    elements.renameInput.value = file.name;
    elements.modalRename.classList.remove('hidden');
    elements.renameInput.focus();
}

async function confirmRename() {
    const newName = elements.renameInput.value.trim();
    const file = state.itemToRename;
    if (!newName || !file || newName === file.name) {
        elements.modalRename.classList.add('hidden');
        return;
    }

    try {
        updateStatus('A renomear...');
        elements.modalRename.classList.add('hidden');

        if (file.type === 'dir') {
            alert("A renomeação de pastas requer a movimentação de todos os ficheiros internos. Esta funcionalidade está limitada na API REST simples. Por favor, renomeie os ficheiros individualmente.");
            updateStatus('');
            return;
        }

        // 1. Obter conteúdo do ficheiro atual
        const getRes = await fetch(file.url, {
            headers: { 'Authorization': `token ${state.token}` }
        });
        const data = await getRes.json();
        
        // 2. Criar novo ficheiro com o novo nome
        const newPath = file.path.replace(file.name, newName);
        await uploadToGithub(newPath, data.content, `Renamed ${file.name} to ${newName}`, true);
        
        // 3. Eliminar o antigo
        await fetch(file.url, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Removed old file after rename`,
                sha: file.sha
            })
        });

        await loadFiles();
    } catch (error) {
        alert('Erro ao renomear: ' + error.message);
    }
}

// 4. DELETE
async function deleteItem(file) {
    if (!confirm(`Tem a certeza que deseja eliminar "${file.name}"?`)) return;

    try {
        updateStatus(`A eliminar ${file.name}...`);
        
        if (file.type === 'dir') {
            // Para pastas, precisamos de eliminar o conteúdo recursivamente ou o .keep
            // Esta é uma simplificação: eliminamos o que a API nos der (geralmente ficheiros individuais)
            alert("Para eliminar pastas no GitHub via API, deve eliminar todos os ficheiros dentro dela primeiro.");
            updateStatus('');
            return;
        }

        const res = await fetch(file.url, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Deleted ${file.name}`,
                sha: file.sha
            })
        });

        if (!res.ok) throw new Error('Não foi possível eliminar o ficheiro.');
        await loadFiles();
    } catch (error) {
        alert(error.message);
    }
}

// --- AUXILIARES DA API ---
async function uploadToGithub(path, content, message, isBase64 = false) {
    let sha = null;
    try {
        const check = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, {
            headers: { 'Authorization': `token ${state.token}` }
        });
        if (check.ok) {
            const data = await check.json();
            sha = data.sha;
        }
    } catch (e) {}

    const res = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${state.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message,
            content: isBase64 ? content : btoa(content),
            sha
        })
    });

    if (!res.ok) throw new Error('Falha na comunicação com o GitHub.');
}

// --- UTILITÁRIOS ---
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

function renderBreadcrumbs() {
    elements.breadcrumbs.innerHTML = `
        <li><a href="#" class="text-blue-600 hover:underline" onclick="loadFiles('')">Raiz</a></li>`;
    
    if (!state.currentPath) return;

    const parts = state.currentPath.split('/');
    let pathAcc = '';
    parts.forEach((part, i) => {
        pathAcc += (i === 0 ? '' : '/') + part;
        const current = pathAcc;
        elements.breadcrumbs.innerHTML += `
            <li class="flex items-center">
                <i class="fas fa-chevron-right text-gray-300 mx-2 text-[10px]"></i>
                <a href="#" class="${i === parts.length - 1 ? 'text-gray-400' : 'text-blue-600 hover:underline'}" 
                   onclick="${i === parts.length - 1 ? '' : `loadFiles('${current}')`}">${part}</a>
            </li>`;
    });
}

// --- EVENT LISTENERS ---
elements.btnLogin.onclick = login;
elements.btnLogout.onclick = logout;
elements.btnRefresh.onclick = () => loadFiles();
elements.btnNewFolder.onclick = () => elements.modalFolder.classList.remove('hidden');
elements.btnCancelFolder.onclick = () => elements.modalFolder.classList.add('hidden');
elements.btnConfirmFolder.onclick = createFolder;
elements.btnCancelRename.onclick = () => elements.modalRename.classList.add('hidden');
elements.btnConfirmRename.onclick = confirmRename;
elements.fileUpload.onchange = handleFileUpload;

elements.searchInput.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    state.filteredFiles = state.files.filter(f => f.name.toLowerCase().includes(term));
    renderFileList();
};

// Drag and Drop
elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add('bg-blue-50/50'); };
elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('bg-blue-50/50');
elements.dropZone.ondrop = (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('bg-blue-50/50');
    handleFileUpload(e);
};

init();
