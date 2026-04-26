// Configurações Globais
const PROTECTED_FILES = ['index.html', 'app.js', 'README.md'];
const STORAGE_LIMIT_SUGGESTED = 50 * 1024 * 1024 * 1024; // 50GB para referência visual

let state = {
    token: localStorage.getItem('gh_token') || '',
    owner: '',
    repo: '',
    currentPath: '',
    files: [],
    allFilesRecursive: [], // Para cálculo de armazenamento total
    totalSize: 0,
    totalCount: 0,
    modalAction: null, // 'folder' ou 'rename'
    itemToRename: null
};

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
    searchInput: document.getElementById('search-input'),
    btnRefresh: document.getElementById('btn-refresh'),
    dropZone: document.getElementById('drop-zone'),
    // Modal
    modalInput: document.getElementById('modal-input'),
    modalTitle: document.getElementById('modal-title'),
    modalSubtitle: document.getElementById('modal-subtitle'),
    modalIcon: document.getElementById('modal-icon'),
    modalIconBg: document.getElementById('modal-icon-bg'),
    genericInput: document.getElementById('generic-input'),
    btnModalConfirm: document.getElementById('btn-modal-confirm'),
    btnModalCancel: document.getElementById('btn-modal-cancel'),
    // Stats
    totalStorageUsage: document.getElementById('total-storage-usage'),
    totalFileCount: document.getElementById('total-file-count'),
    storageProgress: document.getElementById('storage-progress'),
    folderFileCount: document.getElementById('folder-file-count'),
    folderStorageUsage: document.getElementById('folder-storage-usage')
};

// --- INICIALIZAÇÃO ---
async function init() {
    if (state.token) {
        elements.tokenInput.value = state.token;
        await login();
    }
}

async function login() {
    const token = elements.tokenInput.value.trim();
    if (!token) return;

    try {
        updateStatus('A autenticar...');
        const res = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${token}` }
        });
        if (!res.ok) throw new Error('Token inválido.');
        const data = await res.json();
        state.owner = data.login;

        // Detectar repo
        const urlParts = window.location.hostname.split('.');
        if (urlParts[1] === 'github' && urlParts[2] === 'io') {
            state.repo = window.location.pathname.split('/')[1];
        } else {
            state.repo = localStorage.getItem('gh_repo') || prompt("Nome do repositório:", "github-cloud-storage");
        }

        if (!state.repo) return;
        state.token = token;
        localStorage.setItem('gh_token', token);
        localStorage.setItem('gh_repo', state.repo);

        showApp();
        await refreshAll();
    } catch (e) {
        alert(e.message);
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

// --- GESTÃO DE DADOS & ESTATÍSTICAS ---

async function refreshAll() {
    await loadFiles();
    await calculateTotalStorage();
}

async function loadFiles(path = state.currentPath) {
    state.currentPath = path;
    updateStatus('A ler pasta...');
    renderBreadcrumbs();
    
    try {
        const res = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, {
            headers: { 'Authorization': `token ${state.token}` },
            cache: 'no-store'
        });
        
        state.files = res.ok ? await res.json() : [];
        renderFileList();
        updateFolderStats();
        updateStatus('');
    } catch (e) {
        updateStatus('Erro na leitura.');
    }
}

async function calculateTotalStorage() {
    try {
        // Usar a API de Recursão (Trees) para obter todos os ficheiros de uma vez
        // Primeiro precisamos do SHA do branch principal
        const branchRes = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/branches/main`, {
            headers: { 'Authorization': `token ${state.token}` }
        });
        const branchData = await branchRes.json();
        const treeSha = branchData.commit.commit.tree.sha;

        const treeRes = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/git/trees/${treeSha}?recursive=1`, {
            headers: { 'Authorization': `token ${state.token}` }
        });
        const treeData = await treeRes.json();
        
        const filesOnly = treeData.tree.filter(item => item.type === 'blob');
        state.totalCount = filesOnly.length;
        
        // Infelizmente a Tree API não devolve o tamanho. Precisamos de somar os tamanhos da listagem se quisermos precisão,
        // ou aceitar que o armazenamento total é a soma dos ficheiros conhecidos.
        // Como a Tree API não dá size, vamos estimar ou fazer fetch se necessário. 
        // Para performance, vamos somar apenas o que temos na pasta atual + cache se tivéssemos.
        // Alternativa: A API de Repositório dá o "size" do repo em KB.
        const repoRes = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}`, {
            headers: { 'Authorization': `token ${state.token}` }
        });
        const repoData = await repoRes.json();
        state.totalSize = repoData.size * 1024; // Repo size é em KB

        updateTotalStatsUI();
    } catch (e) {
        console.error("Erro ao calcular storage total:", e);
    }
}

function updateTotalStatsUI() {
    elements.totalStorageUsage.textContent = formatBytes(state.totalSize);
    elements.totalFileCount.textContent = `${state.totalCount} ficheiros no total`;
    const percent = Math.min((state.totalSize / STORAGE_LIMIT_SUGGESTED) * 100, 100);
    elements.storageProgress.style.width = `${percent}%`;
}

function updateFolderStats() {
    const folderFiles = state.files.filter(f => f.type === 'file');
    const folderSize = folderFiles.reduce((acc, f) => acc + f.size, 0);
    elements.folderFileCount.textContent = folderFiles.length;
    elements.folderStorageUsage.textContent = formatBytes(folderSize);
}

// --- RENDERIZAÇÃO ---

function renderFileList() {
    elements.fileList.innerHTML = '';
    
    if (state.files.length === 0) {
        elements.fileList.innerHTML = '<div class="p-20 text-center text-slate-300 font-bold">Pasta Vazia</div>';
        return;
    }

    const sorted = [...state.files].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
    });

    sorted.forEach(file => {
        const isDir = file.type === 'dir';
        const isProtected = PROTECTED_FILES.includes(file.name) && state.currentPath === '';
        
        const item = document.createElement('div');
        item.className = `file-item grid grid-cols-12 gap-4 px-8 py-5 items-center transition cursor-pointer border-b border-slate-50 ${isProtected ? 'system-file' : ''}`;
        
        item.innerHTML = `
            <div class="col-span-7 md:col-span-8 flex items-center gap-4 overflow-hidden">
                <div class="w-12 h-12 rounded-2xl ${isDir ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'} flex items-center justify-center flex-shrink-0 border border-white shadow-sm">
                    <i class="fas ${isDir ? 'fa-folder' : 'fa-file-alt'} text-xl"></i>
                </div>
                <div class="flex flex-col overflow-hidden">
                    <span class="truncate font-bold text-slate-700 text-sm">${file.name}</span>
                    ${isProtected ? '<span class="text-[9px] font-black text-amber-600 uppercase tracking-tighter"><i class="fas fa-lock mr-1"></i>Sistema Protegido</span>' : ''}
                </div>
            </div>
            <div class="col-span-3 md:col-span-2 text-right text-xs font-black text-slate-400">${isDir ? '--' : formatBytes(file.size)}</div>
            <div class="col-span-2 text-right flex justify-end gap-1">
                ${!isProtected ? `
                    <button class="btn-rename p-2.5 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition">
                        <i class="fas fa-pen text-xs"></i>
                    </button>
                    <button class="btn-delete p-2.5 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition">
                        <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                ` : `
                    <div class="p-2.5 text-slate-200"><i class="fas fa-shield-alt text-xs"></i></div>
                `}
            </div>
        `;

        item.onclick = (e) => {
            if (e.target.closest('button')) return;
            if (isDir) loadFiles(file.path);
            else window.open(file.download_url || file.html_url, '_blank');
        };

        if (!isProtected) {
            item.querySelector('.btn-rename').onclick = (e) => { e.stopPropagation(); openModal('rename', file); };
            item.querySelector('.btn-delete').onclick = (e) => { e.stopPropagation(); deleteItem(file); };
        }

        elements.fileList.appendChild(item);
    });
}

// --- OPERAÇÕES CRUD ---

async function deleteItem(file) {
    if (PROTECTED_FILES.includes(file.name) && state.currentPath === '') {
        return alert("Este ficheiro é crítico para o funcionamento da aplicação e não pode ser eliminado.");
    }

    if (!confirm(`Deseja eliminar permanentemente "${file.name}"?`)) return;

    try {
        updateStatus('A eliminar...');
        const res = await fetch(file.url, {
            method: 'DELETE',
            headers: { 'Authorization': `token ${state.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Delete ${file.name}`, sha: file.sha })
        });

        if (!res.ok) throw new Error('Erro ao eliminar.');
        await refreshAll();
    } catch (e) { alert(e.message); }
}

async function handleFileUpload(e) {
    const files = e.target.files || e.dataTransfer.files;
    if (!files.length) return;

    for (const file of files) {
        if (PROTECTED_FILES.includes(file.name) && state.currentPath === '') {
            if (!confirm(`O ficheiro "${file.name}" é um ficheiro de sistema. Deseja substituí-lo? (Não recomendado)`)) continue;
        }

        try {
            updateStatus(`A enviar ${file.name}...`);
            const content = await readFileAsBase64(file);
            const path = `${state.currentPath ? state.currentPath + '/' : ''}${file.name}`;
            await uploadToGithub(path, content, `Upload: ${file.name}`, true);
        } catch (e) { alert(`Erro em ${file.name}: ${e.message}`); }
    }
    await refreshAll();
    elements.fileUpload.value = '';
}

async function uploadToGithub(path, content, message, isBase64 = false) {
    let sha = null;
    const check = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, {
        headers: { 'Authorization': `token ${state.token}` }
    });
    if (check.ok) {
        const data = await check.json();
        sha = data.sha;
    }

    const res = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${state.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: isBase64 ? content : btoa(content), sha })
    });
    if (!res.ok) throw new Error('Falha no upload.');
}

// --- MODAL & RENOMEAÇÃO ---

function openModal(type, item = null) {
    state.modalAction = type;
    state.itemToRename = item;
    elements.modalInput.classList.remove('hidden');
    elements.genericInput.focus();

    if (type === 'folder') {
        elements.modalTitle.textContent = "Nova Pasta";
        elements.modalSubtitle.textContent = "Criação de Diretório";
        elements.modalIcon.className = "fas fa-folder-plus text-amber-600";
        elements.modalIconBg.className = "bg-amber-100 p-4 rounded-2xl";
        elements.genericInput.value = "";
        elements.genericInput.placeholder = "Ex: Documentos";
    } else {
        elements.modalTitle.textContent = "Renomear";
        elements.modalSubtitle.textContent = "Alteração de Ficheiro";
        elements.modalIcon.className = "fas fa-edit text-indigo-600";
        elements.modalIconBg.className = "bg-indigo-100 p-4 rounded-2xl";
        elements.genericInput.value = item.name;
    }
}

async function handleModalConfirm() {
    const value = elements.genericInput.value.trim();
    if (!value) return;

    if (state.modalAction === 'folder') {
        const path = `${state.currentPath ? state.currentPath + '/' : ''}${value}/.keep`;
        try {
            updateStatus('A criar pasta...');
            await uploadToGithub(path, 'Pasta criada', 'Created via UI');
            closeModal();
            await refreshAll();
        } catch (e) { alert(e.message); }
    } else {
        const file = state.itemToRename;
        if (value === file.name) return closeModal();
        
        try {
            updateStatus('A renomear...');
            // 1. Get content
            const getRes = await fetch(file.url, { headers: { 'Authorization': `token ${state.token}` } });
            const data = await getRes.json();
            // 2. Create new
            const newPath = file.path.replace(file.name, value);
            await uploadToGithub(newPath, data.content, `Renamed ${file.name} to ${value}`, true);
            // 3. Delete old
            await fetch(file.url, {
                method: 'DELETE',
                headers: { 'Authorization': `token ${state.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Rename cleanup`, sha: file.sha })
            });
            closeModal();
            await refreshAll();
        } catch (e) { alert(e.message); }
    }
}

function closeModal() {
    elements.modalInput.classList.add('hidden');
    state.modalAction = null;
    state.itemToRename = null;
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
    elements.breadcrumbs.innerHTML = `<li><a href="#" class="text-indigo-600 hover:text-indigo-800 transition" onclick="loadFiles('')">Raiz</a></li>`;
    if (!state.currentPath) return;
    const parts = state.currentPath.split('/');
    let acc = '';
    parts.forEach((p, i) => {
        acc += (i === 0 ? '' : '/') + p;
        const current = acc;
        elements.breadcrumbs.innerHTML += `
            <li class="flex items-center gap-2">
                <i class="fas fa-chevron-right text-slate-300 text-[10px]"></i>
                <a href="#" class="${i === parts.length - 1 ? 'text-slate-400 cursor-default' : 'text-indigo-600 hover:text-indigo-800 transition'}" 
                   onclick="${i === parts.length - 1 ? '' : `loadFiles('${current}')`}">${p}</a>
            </li>`;
    });
}

// --- LISTENERS ---
elements.btnLogin.onclick = login;
elements.btnLogout.onclick = logout;
elements.btnRefresh.onclick = refreshAll;
elements.btnNewFolder.onclick = () => openModal('folder');
elements.btnModalCancel.onclick = closeModal;
elements.btnModalConfirm.onclick = handleModalConfirm;
elements.fileUpload.onchange = handleFileUpload;

elements.searchInput.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.file-item');
    items.forEach(item => {
        const name = item.querySelector('span').textContent.toLowerCase();
        item.style.display = name.includes(term) ? 'grid' : 'none';
    });
};

elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add('bg-indigo-50/30'); };
elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('bg-indigo-50/30');
elements.dropZone.ondrop = (e) => { e.preventDefault(); elements.dropZone.classList.remove('bg-indigo-50/30'); handleFileUpload(e); };

init();
