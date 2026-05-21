// ==================== CONFIGURAÇÕES GLOBAIS ====================
const PROTECTED_FILES = ['index.html', 'app.js', 'README.md'];
const PROTECTED_FOLDERS = ['assets'];
const STORAGE_LIMIT_SUGGESTED = 50 * 1024 * 1024 * 1024; // 50GB

let state = {
    token: localStorage.getItem('gh_token') || '',
    owner: '',
    repo: '',
    currentPath: '',
    files: [],
    allFolders: [],
    allFilesTree: [],      // { path, sha }
    totalSize: 0,
    totalCount: 0,
    modalAction: null,
    activeItem: null,
    viewMode: 'list',
    iconSize: 'medium',
    multiSelectMode: false,
    selectedItems: new Set()
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
    searchInput: document.getElementById('search-input'),
    btnRefresh: document.getElementById('btn-refresh'),
    dropZone: document.getElementById('drop-zone'),
    modalInput: document.getElementById('modal-input'),
    modalTitle: document.getElementById('modal-title'),
    modalSubtitle: document.getElementById('modal-subtitle'),
    modalIcon: document.getElementById('modal-icon'),
    modalIconBg: document.getElementById('modal-icon-bg'),
    genericInput: document.getElementById('generic-input'),
    genericInputContainer: document.getElementById('generic-input-container'),
    moveFolderSelectContainer: document.getElementById('move-folder-select-container'),
    moveFolderSelect: document.getElementById('move-folder-select'),
    btnModalConfirm: document.getElementById('btn-modal-confirm'),
    btnModalCancel: document.getElementById('btn-modal-cancel'),
    totalStorageUsage: document.getElementById('total-storage-usage'),
    totalFileCount: document.getElementById('total-file-count'),
    storageProgress: document.getElementById('storage-progress'),
    folderFileCount: document.getElementById('folder-file-count'),
    folderStorageUsage: document.getElementById('folder-storage-usage')
};

// ==================== BOTÕES DE SELEÇÃO MÚLTIPLA ====================
let btnMultiSelect, btnDeleteSelected, btnMoveSelected;

function createMultiSelectControls() {
    if (document.getElementById('multi-select-bar')) return;
    const container = document.createElement('div');
    container.id = 'multi-select-bar';
    container.className = 'flex gap-2 p-2 border-b bg-white';
    container.innerHTML = `
        <button id="btn-multi-select" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-indigo-100 transition text-sm font-bold" title="Selecionar">
            <i class="fas fa-check-square"></i><span class="action-text ml-1">Selecionar</span>
        </button>
        <button id="btn-delete-selected" class="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-bold hidden" title="Excluir selecionados">
            <i class="fas fa-trash-alt"></i><span class="action-text ml-1">Excluir</span>
        </button>
        <button id="btn-move-selected" class="px-3 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition text-sm font-bold hidden" title="Mover selecionados">
            <i class="fas fa-exchange-alt"></i><span class="action-text ml-1">Mover</span>
        </button>
    `;
    const target = document.querySelector('.actions-bar') || elements.btnNewFolder?.parentNode;
    if (target) target.parentNode.insertBefore(container, target.nextSibling);
    else elements.breadcrumbs?.parentNode?.appendChild(container);
    
    btnMultiSelect = document.getElementById('btn-multi-select');
    btnDeleteSelected = document.getElementById('btn-delete-selected');
    btnMoveSelected = document.getElementById('btn-move-selected');
    btnMultiSelect.onclick = toggleMultiSelectMode;
    btnDeleteSelected.onclick = () => deleteMultipleItems(Array.from(state.selectedItems));
    btnMoveSelected.onclick = openMoveSelectedModal;
}

function toggleMultiSelectMode() {
    state.multiSelectMode = !state.multiSelectMode;
    state.selectedItems.clear();
    if (btnMultiSelect) {
        btnMultiSelect.innerHTML = state.multiSelectMode ? '<i class="fas fa-times"></i><span class="action-text ml-1">Cancelar</span>' : '<i class="fas fa-check-square"></i><span class="action-text ml-1">Selecionar</span>';
    }
    if (btnDeleteSelected) btnDeleteSelected.classList.add('hidden');
    if (btnMoveSelected) btnMoveSelected.classList.add('hidden');
    renderFileList();
}

function updateSelectedButtons() {
    if (!btnDeleteSelected || !btnMoveSelected) return;
    const count = state.selectedItems.size;
    if (count > 0) {
        btnDeleteSelected.classList.remove('hidden');
        btnMoveSelected.classList.remove('hidden');
        btnDeleteSelected.innerHTML = `<i class="fas fa-trash-alt"></i><span class="action-text ml-1">Excluir (${count})</span>`;
        btnMoveSelected.innerHTML = `<i class="fas fa-exchange-alt"></i><span class="action-text ml-1">Mover (${count})</span>`;
    } else {
        btnDeleteSelected.classList.add('hidden');
        btnMoveSelected.classList.add('hidden');
    }
}

// ==================== BOTÃO VOLTAR ====================
function createBackButton() {
    if (document.getElementById('back-button')) return;
    const backBtn = document.createElement('button');
    backBtn.id = 'back-button';
    backBtn.className = 'px-3 py-2 rounded-xl bg-slate-100 hover:bg-indigo-100 transition text-sm font-bold flex items-center gap-1';
    backBtn.innerHTML = '<i class="fas fa-arrow-left"></i><span class="action-text">Voltar</span>';
    backBtn.onclick = goBack;
    const newFolderBtn = elements.btnNewFolder;
    if (newFolderBtn && newFolderBtn.parentNode) newFolderBtn.parentNode.insertBefore(backBtn, newFolderBtn);
    updateBackButton();
}

function updateBackButton() {
    const backBtn = document.getElementById('back-button');
    if (!backBtn) return;
    if (!state.currentPath) {
        backBtn.disabled = true;
        backBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        backBtn.disabled = false;
        backBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function goBack() {
    if (!state.currentPath) return;
    const parts = state.currentPath.split('/');
    parts.pop();
    loadFiles(parts.join('/'));
}

// ==================== CONTROLO DE VISUALIZAÇÃO ====================
function createViewControls() {
    if (document.getElementById('view-controls')) return;
    const controlsHtml = `
        <div id="view-controls" class="p-4 border-b">
            <div class="flex gap-2 mb-3">
                <button id="view-list-btn" class="view-mode-btn flex-1 px-4 py-2 rounded-xl text-sm font-bold flex justify-center gap-2 bg-indigo-600 text-white shadow"><i class="fas fa-list-ul"></i><span>Lista</span></button>
                <button id="view-grid-btn" class="view-mode-btn flex-1 px-4 py-2 rounded-xl text-sm font-bold flex justify-center gap-2 bg-slate-100 text-slate-600"><i class="fas fa-th-large"></i><span>Grelha</span></button>
            </div>
            <div id="size-controls" class="flex gap-2 ${state.viewMode === 'list' ? 'hidden' : ''}">
                <button id="size-sm" class="size-btn flex-1 px-3 py-2 rounded-lg text-xs font-bold">P</button>
                <button id="size-md" class="size-btn flex-1 px-3 py-2 rounded-lg text-xs font-bold">M</button>
                <button id="size-lg" class="size-btn flex-1 px-3 py-2 rounded-lg text-xs font-bold">G</button>
                <button id="size-xl" class="size-btn flex-1 px-3 py-2 rounded-lg text-xs font-bold">XG</button>
            </div>
        </div>
    `;
    const container = document.getElementById('view-controls-container');
    if (container) container.innerHTML = controlsHtml;
    else document.getElementById('list-header')?.insertAdjacentHTML('afterend', controlsHtml);
    
    document.getElementById('view-list-btn')?.addEventListener('click', () => setViewMode('list'));
    document.getElementById('view-grid-btn')?.addEventListener('click', () => setViewMode('grid'));
    document.getElementById('size-sm')?.addEventListener('click', () => setIconSize('small'));
    document.getElementById('size-md')?.addEventListener('click', () => setIconSize('medium'));
    document.getElementById('size-lg')?.addEventListener('click', () => setIconSize('large'));
    document.getElementById('size-xl')?.addEventListener('click', () => setIconSize('xlarge'));
    updateSizeButtonsStyle();
}

function setViewMode(mode) {
    state.viewMode = mode;
    const listBtn = document.getElementById('view-list-btn');
    const gridBtn = document.getElementById('view-grid-btn');
    const sizeControls = document.getElementById('size-controls');
    const listHeader = document.getElementById('list-header');
    if (mode === 'list') {
        listBtn.className = "view-mode-btn flex-1 px-4 py-2 rounded-xl text-sm font-bold flex justify-center gap-2 bg-indigo-600 text-white shadow";
        gridBtn.className = "view-mode-btn flex-1 px-4 py-2 rounded-xl text-sm font-bold flex justify-center gap-2 bg-slate-100 text-slate-600";
        sizeControls?.classList.add('hidden');
        if (listHeader) listHeader.style.display = 'grid';
    } else {
        listBtn.className = "view-mode-btn flex-1 px-4 py-2 rounded-xl text-sm font-bold flex justify-center gap-2 bg-slate-100 text-slate-600";
        gridBtn.className = "view-mode-btn flex-1 px-4 py-2 rounded-xl text-sm font-bold flex justify-center gap-2 bg-indigo-600 text-white shadow";
        sizeControls?.classList.remove('hidden');
        if (listHeader) listHeader.style.display = 'none';
    }
    renderFileList();
}

function setIconSize(size) {
    state.iconSize = size;
    updateSizeButtonsStyle();
    renderFileList();
}

function updateSizeButtonsStyle() {
    const sizes = ['small', 'medium', 'large', 'xlarge'];
    const ids = { small:'sm', medium:'md', large:'lg', xlarge:'xl' };
    sizes.forEach(s => {
        const btn = document.getElementById(`size-${ids[s]}`);
        if (btn) {
            btn.className = `size-btn flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${s === state.iconSize ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`;
        }
    });
}

// ==================== PRÉ-VISUALIZAÇÃO ====================
function createPreviewModal() {
    if (document.getElementById('preview-modal')) return;
    const modalHTML = `<div id="preview-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/60 backdrop-blur-sm"><div class="bg-white rounded-3xl w-11/12 max-w-4xl max-h-[90vh] flex flex-col"><div class="flex justify-between p-5 border-b"><div><h3 id="preview-filename" class="font-black">Pré-visualização</h3><p id="preview-filesize" class="text-xs text-slate-400"></p></div><button id="close-preview" class="w-8 h-8 rounded-full hover:bg-slate-100"><i class="fas fa-times"></i></button></div><div id="preview-content" class="flex-1 overflow-auto p-6 bg-slate-50 flex items-center justify-center"><div class="text-center"><i class="fas fa-spinner fa-pulse"></i><p>A carregar...</p></div></div><div class="p-4 border-t flex justify-end gap-2"><a id="preview-download-link" href="#" target="_blank" class="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl">Abrir original</a><button id="preview-close-btn" class="px-4 py-2 bg-slate-100 rounded-xl">Fechar</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('preview-modal');
    document.getElementById('close-preview').onclick = () => modal.classList.add('hidden');
    document.getElementById('preview-close-btn').onclick = () => modal.classList.add('hidden');
    modal.onclick = e => { if (e.target === modal) modal.classList.add('hidden'); };
}

async function openPreview(file) {
    if (file.type !== 'file') return;
    createPreviewModal();
    const modal = document.getElementById('preview-modal');
    document.getElementById('preview-filename').innerText = file.name;
    document.getElementById('preview-filesize').innerText = formatBytes(file.size);
    document.getElementById('preview-download-link').href = file.download_url || file.html_url;
    const contentDiv = document.getElementById('preview-content');
    contentDiv.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-pulse"></i><p>A carregar...</p></div>';
    modal.classList.remove('hidden');
    
    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = ['jpg','jpeg','png','gif','webp','svg','bmp','ico'].includes(ext);
    if (isImage && file.download_url) {
        const img = document.createElement('img');
        img.src = file.download_url;
        img.className = 'max-w-full max-h-[70vh] object-contain';
        img.onload = () => { contentDiv.innerHTML = ''; contentDiv.appendChild(img); };
        img.onerror = () => { contentDiv.innerHTML = '<div class="text-red-500">Erro ao carregar imagem.</div>'; };
        return;
    }
    const textExts = ['txt','md','js','html','css','json','xml','sh','py','rb','php','java','c','cpp','h','csv','log'];
    const isText = textExts.includes(ext) || file.name.includes('.env');
    if (isText && file.size < 1024*1024) {
        try {
            const res = await fetch(file.download_url);
            if (!res.ok) throw new Error();
            const text = await res.text();
            const pre = document.createElement('pre');
            pre.className = 'text-sm font-mono bg-slate-800 text-slate-100 p-4 rounded-xl overflow-auto max-h-[60vh] whitespace-pre-wrap';
            pre.textContent = text;
            contentDiv.innerHTML = '';
            contentDiv.appendChild(pre);
        } catch {
            contentDiv.innerHTML = `<div class="text-red-500">Erro ao carregar texto.<br><a href="${file.download_url}" target="_blank">Descarregar</a></div>`;
        }
    } else {
        contentDiv.innerHTML = `<div class="text-center"><i class="fas fa-file fa-4x text-slate-300"></i><p>Pré-visualização não disponível.</p><a href="${file.download_url}" target="_blank" class="inline-block px-5 py-2 bg-indigo-600 text-white rounded-xl">Descarregar</a></div>`;
    }
}

// ==================== ÍCONES ====================
function getFileIcon(file) {
    if (file.type === 'dir') return `<div class="flex items-center justify-center w-full h-full text-amber-500"><i class="fas fa-folder-open text-4xl"></i></div>`;
    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = ['jpg','jpeg','png','gif','webp','svg','bmp','ico'].includes(ext);
    if (isImage && file.download_url) {
        return `<img src="${file.download_url}" class="w-full h-full object-cover rounded-xl" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'flex items-center justify-center w-full h-full text-slate-400\'><i class=\'fas fa-image-slash text-3xl\'></i></div>';">`;
    }
    let iconClass = 'fa-file-alt';
    if (ext === 'pdf') iconClass = 'fa-file-pdf';
    else if (['doc','docx'].includes(ext)) iconClass = 'fa-file-word';
    else if (['xls','xlsx','csv'].includes(ext)) iconClass = 'fa-file-excel';
    else if (['ppt','pptx'].includes(ext)) iconClass = 'fa-file-powerpoint';
    else if (['zip','rar','7z','tar','gz'].includes(ext)) iconClass = 'fa-file-archive';
    else if (['mp3','wav','ogg','flac'].includes(ext)) iconClass = 'fa-file-audio';
    else if (['mp4','avi','mkv','mov'].includes(ext)) iconClass = 'fa-file-video';
    else if (['js','html','css','json','xml','py','java','c','cpp'].includes(ext)) iconClass = 'fa-code';
    return `<div class="flex items-center justify-center w-full h-full text-indigo-400"><i class="fas ${iconClass} text-5xl"></i></div>`;
}

function renderCheckbox(file) {
    if (!state.multiSelectMode) return '';
    const checked = state.selectedItems.has(file.path) ? 'checked' : '';
    return `<input type="checkbox" class="select-item w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" data-path="${file.path}" ${checked}>`;
}

// ==================== RENDERIZAÇÃO ====================
function attachCheckboxEvents() {
    document.querySelectorAll('.select-item').forEach(cb => {
        cb.removeEventListener('change', handleCheckboxChange);
        cb.addEventListener('change', handleCheckboxChange);
    });
}
function handleCheckboxChange(e) {
    e.stopPropagation();
    const path = e.target.dataset.path;
    if (e.target.checked) state.selectedItems.add(path);
    else state.selectedItems.delete(path);
    updateSelectedButtons();
}

function renderListView() {
    const sorted = [...state.files].sort((a,b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
    });
    elements.fileList.innerHTML = '';
    if (!sorted.length) {
        elements.fileList.innerHTML = '<div class="p-20 text-center text-slate-300 font-bold">Pasta Vazia</div>';
        return;
    }
    sorted.forEach(file => {
        const isDir = file.type === 'dir';
        const isProtected = (PROTECTED_FILES.includes(file.name) && !state.currentPath) || (PROTECTED_FOLDERS.includes(file.name) && !state.currentPath);
        const item = document.createElement('div');
        item.className = `file-item flex flex-wrap sm:flex-nowrap items-center gap-2 px-4 py-3 transition cursor-pointer border-b hover:bg-slate-50 ${isProtected ? 'system-file' : ''}`;
        item.innerHTML = `
            <div class="flex items-center gap-1 flex-shrink-0">${renderCheckbox(file)}</div>
            <div class="flex-grow flex items-center gap-3 overflow-hidden">
                <div class="w-10 h-10 rounded-xl ${isDir ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'} flex items-center justify-center"><i class="fas ${isDir ? 'fa-folder' : 'fa-file-alt'}"></i></div>
                <div class="flex flex-col overflow-hidden"><span class="truncate font-bold text-sm">${escapeHtml(file.name)}</span>${isProtected ? '<span class="text-[9px] font-bold text-indigo-600"><i class="fas fa-shield-alt mr-1"></i>Protegido</span>' : ''}</div>
            </div>
            <div class="text-right text-xs font-bold text-slate-400 w-24 hidden sm:block">${isDir ? '--' : formatBytes(file.size)}</div>
            <div class="flex justify-end gap-1 flex-shrink-0">
                ${!isProtected && !isDir ? `<button class="btn-preview w-9 h-9 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600" title="Pré-visualizar"><i class="fas fa-eye text-sm"></i></button>` : ''}
                ${!isProtected ? `
                    <button class="btn-move w-9 h-9 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600" title="Mover"><i class="fas fa-exchange-alt text-sm"></i></button>
                    <button class="btn-rename w-9 h-9 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600" title="Renomear"><i class="fas fa-pen text-sm"></i></button>
                    <button class="btn-delete w-9 h-9 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600" title="Eliminar"><i class="fas fa-trash-alt text-sm"></i></button>
                ` : '<div class="w-9 h-9 flex items-center justify-center text-slate-200"><i class="fas fa-lock"></i></div>'}
            </div>
        `;
        item.onclick = (e) => { if (e.target.closest('button') || e.target.closest('.select-item')) return; if (isDir) loadFiles(file.path); else openPreview(file); };
        if (!isProtected) {
            item.querySelector('.btn-preview')?.addEventListener('click', (e) => { e.stopPropagation(); openPreview(file); });
            item.querySelector('.btn-move').addEventListener('click', (e) => { e.stopPropagation(); openModal('move', file); });
            item.querySelector('.btn-rename').addEventListener('click', (e) => { e.stopPropagation(); openModal('rename', file); });
            item.querySelector('.btn-delete').addEventListener('click', (e) => { e.stopPropagation(); deleteItem(file); });
        }
        elements.fileList.appendChild(item);
    });
    attachCheckboxEvents();
}

function renderGridView() {
    const sorted = [...state.files].sort((a,b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
    });
    elements.fileList.innerHTML = '';
    if (!sorted.length) {
        elements.fileList.innerHTML = '<div class="p-20 text-center text-slate-300 font-bold">Pasta Vazia</div>';
        return;
    }
    let colClass, iconSizeClass, textSizeClass, nameMaxLines;
    switch (state.iconSize) {
        case 'small': colClass = 'grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5'; iconSizeClass = 'w-20 h-20'; textSizeClass = 'text-xs'; nameMaxLines = 'line-clamp-1'; break;
        case 'medium': colClass = 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3'; iconSizeClass = 'w-28 h-28'; textSizeClass = 'text-sm'; nameMaxLines = 'line-clamp-2'; break;
        case 'large': colClass = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2'; iconSizeClass = 'w-36 h-36'; textSizeClass = 'text-base'; nameMaxLines = 'line-clamp-2'; break;
        default: colClass = 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3'; iconSizeClass = 'w-28 h-28'; textSizeClass = 'text-sm'; nameMaxLines = 'line-clamp-2';
    }
    elements.fileList.className = `grid ${colClass} gap-4 p-4`;
    sorted.forEach(file => {
        const isDir = file.type === 'dir';
        const isProtected = (PROTECTED_FILES.includes(file.name) && !state.currentPath) || (PROTECTED_FOLDERS.includes(file.name) && !state.currentPath);
        const card = document.createElement('div');
        card.className = `file-item group bg-white rounded-2xl border hover:shadow-lg transition cursor-pointer ${isProtected ? 'opacity-60' : ''}`;
        card.innerHTML = `
            <div class="relative">
                ${state.multiSelectMode ? `<div class="absolute top-2 left-2 z-10">${renderCheckbox(file)}</div>` : ''}
                <div class="flex items-center justify-center p-4 bg-slate-50 ${iconSizeClass} w-full mx-auto">${getFileIcon(file)}</div>
                ${!isProtected ? `
                    <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        ${!isDir ? `<button class="btn-preview-grid w-8 h-8 bg-white rounded-full shadow text-indigo-500"><i class="fas fa-eye text-xs"></i></button>` : ''}
                        <button class="btn-move-grid w-8 h-8 bg-white rounded-full shadow text-slate-500"><i class="fas fa-exchange-alt text-xs"></i></button>
                        <button class="btn-rename-grid w-8 h-8 bg-white rounded-full shadow text-slate-500"><i class="fas fa-pen text-xs"></i></button>
                        <button class="btn-delete-grid w-8 h-8 bg-white rounded-full shadow text-slate-500"><i class="fas fa-trash-alt text-xs"></i></button>
                    </div>
                ` : `<div class="absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center"><i class="fas fa-lock text-xs text-slate-400"></i></div>`}
            </div>
            <div class="p-3 text-center border-t">
                <p class="font-bold ${textSizeClass} text-slate-800 ${nameMaxLines}" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</p>
                ${!isDir ? `<p class="text-[10px] text-slate-400 mt-1">${formatBytes(file.size)}</p>` : ''}
                ${isProtected ? '<p class="text-[8px] font-bold text-amber-600 mt-1"><i class="fas fa-shield-alt"></i> Protegido</p>' : ''}
            </div>
        `;
        card.onclick = (e) => { if (e.target.closest('button') || e.target.closest('.select-item')) return; if (isDir) loadFiles(file.path); else openPreview(file); };
        if (!isProtected) {
            if (!isDir) card.querySelector('.btn-preview-grid')?.addEventListener('click', (e) => { e.stopPropagation(); openPreview(file); });
            card.querySelector('.btn-move-grid').addEventListener('click', (e) => { e.stopPropagation(); openModal('move', file); });
            card.querySelector('.btn-rename-grid').addEventListener('click', (e) => { e.stopPropagation(); openModal('rename', file); });
            card.querySelector('.btn-delete-grid').addEventListener('click', (e) => { e.stopPropagation(); deleteItem(file); });
        }
        elements.fileList.appendChild(card);
    });
    attachCheckboxEvents();
}

function renderFileList() {
    if (state.viewMode === 'list') renderListView();
    else renderGridView();
    if (elements.searchInput.value) {
        const term = elements.searchInput.value.toLowerCase();
        document.querySelectorAll('.file-item').forEach(item => {
            const nameSpan = item.querySelector('.font-bold');
            if (nameSpan) item.style.display = nameSpan.innerText.toLowerCase().includes(term) ? '' : 'none';
        });
    }
}

// ==================== FUNÇÕES BASE ====================
async function login() {
    const token = elements.tokenInput.value.trim();
    if (!token) return;
    try {
        updateStatus('Autenticando...');
        const res = await fetch('https://api.github.com/user', { headers: { Authorization: `token ${token}` } });
        if (!res.ok) throw new Error('Token inválido');
        const data = await res.json();
        state.owner = data.login;
        if (window.location.hostname.includes('github.io')) {
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
    } catch (err) { alert(err.message); logout(); }
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
    elements.repoInfo.innerText = `${state.owner}/${state.repo}`;
}

async function refreshAll() {
    await loadFiles();
    await calculateStats();
}

async function loadFiles(path = state.currentPath) {
    state.currentPath = path;
    if (state.multiSelectMode) toggleMultiSelectMode();
    state.selectedItems.clear();
    updateSelectedButtons();
    updateStatus('A ler diretório...');
    renderBreadcrumbs();
    updateBackButton();
    try {
        const url = `https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`;
        const res = await fetch(url, { headers: { Authorization: `token ${state.token}` }, cache: 'no-store' });
        state.files = res.ok ? await res.json() : [];
        renderFileList();
        updateFolderStats();
        updateStatus('');
    } catch (err) {
        updateStatus('Erro ao ler pasta');
        console.error(err);
    }
}

async function calculateStats() {
    try {
        const repoRes = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}`, { headers: { Authorization: `token ${state.token}` } });
        const repoData = await repoRes.json();
        state.totalSize = repoData.size * 1024;
        const branchRes = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/branches/main`, { headers: { Authorization: `token ${state.token}` } });
        const branchData = await branchRes.json();
        const treeRes = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/git/trees/${branchData.commit.commit.tree.sha}?recursive=1`, { headers: { Authorization: `token ${state.token}` } });
        const treeData = await treeRes.json();
        state.allFilesTree = treeData.tree.filter(i => i.type === 'blob').map(i => ({ path: i.path, sha: i.sha }));
        state.allFolders = treeData.tree.filter(i => i.type === 'tree').map(i => i.path);
        state.allFolders.unshift('');
        state.totalCount = state.allFilesTree.length;
        updateStatsUI();
    } catch (err) { console.error("Erro nas estatísticas", err); }
}

function updateStatsUI() {
    elements.totalStorageUsage.innerText = formatBytes(state.totalSize);
    elements.totalFileCount.innerText = `${state.totalCount} ficheiros`;
    const percent = Math.min((state.totalSize / STORAGE_LIMIT_SUGGESTED) * 100, 100);
    elements.storageProgress.style.width = `${percent}%`;
}

function updateFolderStats() {
    const folderFiles = state.files.filter(f => f.type === 'file');
    const folderSize = folderFiles.reduce((acc, f) => acc + f.size, 0);
    elements.folderFileCount.innerText = folderFiles.length;
    elements.folderStorageUsage.innerText = formatBytes(folderSize);
}

async function deleteItem(file) {
    if (!confirm(`Eliminar "${file.name}"?`)) return;
    try {
        updateStatus('A eliminar...');
        const res = await fetch(file.url, {
            method: 'DELETE',
            headers: { Authorization: `token ${state.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Delete ${file.name}`, sha: file.sha })
        });
        if (!res.ok) throw new Error('Erro ao eliminar');
        await refreshAll();
    } catch (err) { alert(err.message); }
}

async function uploadToGithub(path, content, message, isBase64 = false) {
    let sha = null;
    const check = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, { headers: { Authorization: `token ${state.token}` } });
    if (check.ok) { const data = await check.json(); sha = data.sha; }
    const res = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, {
        method: 'PUT',
        headers: { Authorization: `token ${state.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: isBase64 ? content : btoa(content), sha })
    });
    if (!res.ok) throw new Error('Falha no upload');
}

// ==================== EXCLUSÃO MÚLTIPLA (recursiva optimizada) ====================
async function deleteMultipleItems(selectedPaths) {
    if (!selectedPaths.length) return;
    let filesToDelete = [];
    for (const path of selectedPaths) {
        const item = state.files.find(f => f.path === path);
        if (!item) continue;
        if (item.type === 'file') {
            filesToDelete.push({ path: item.path, sha: item.sha, url: item.url });
        } else {
            const prefix = item.path + '/';
            const subFiles = state.allFilesTree.filter(f => f.path.startsWith(prefix));
            if (!subFiles.length) {
                alert(`Pasta "${item.name}" está vazia.`);
                continue;
            }
            for (const f of subFiles) {
                filesToDelete.push({
                    path: f.path,
                    sha: f.sha,
                    url: `https://api.github.com/repos/${state.owner}/${state.repo}/contents/${f.path}`
                });
            }
        }
    }
    if (!filesToDelete.length) { updateStatus('Nada para excluir'); return; }
    if (!confirm(`Excluir ${filesToDelete.length} ficheiro(s)?`)) return;
    let completed = 0;
    updateStatus(`A excluir ${filesToDelete.length} ficheiros...`);
    await Promise.all(filesToDelete.map(async (file) => {
        try {
            const res = await fetch(file.url, {
                method: 'DELETE',
                headers: { Authorization: `token ${state.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Delete ${file.path}`, sha: file.sha })
            });
            if (!res.ok) throw new Error(`Erro ${file.path}`);
            completed++;
            updateStatus(`Excluído ${file.path} (${completed}/${filesToDelete.length})`);
        } catch (err) { alert(`Falha: ${file.path}\n${err.message}`); }
    }));
    updateStatus(`${filesToDelete.length} ficheiros processados`);
    await refreshAll();
    if (state.multiSelectMode) toggleMultiSelectMode();
}

// ==================== MOVIMENTAÇÃO MÚLTIPLA ====================
async function moveMultipleItems(selectedPaths, targetFolder) {
    if (!selectedPaths.length) return;
    let movePlan = [];
    for (const path of selectedPaths) {
        const item = state.files.find(f => f.path === path);
        if (!item) continue;
        if (item.type === 'file') {
            const newPath = targetFolder ? `${targetFolder}/${item.name}` : item.name;
            movePlan.push({ oldPath: item.path, newPath, sha: item.sha });
        } else {
            const prefix = item.path + '/';
            const subFiles = state.allFilesTree.filter(f => f.path.startsWith(prefix));
            if (!subFiles.length) { alert(`Pasta "${item.name}" vazia.`); continue; }
            for (const f of subFiles) {
                const relative = f.path.substring(item.path.length + 1);
                const newPath = targetFolder ? `${targetFolder}/${item.name}/${relative}` : `${item.name}/${relative}`;
                movePlan.push({ oldPath: f.path, newPath, sha: f.sha });
            }
        }
    }
    if (!movePlan.length) { updateStatus('Nada para mover'); return; }
    if (!confirm(`Mover ${movePlan.length} ficheiro(s) para ${targetFolder || 'raiz'}?`)) return;
    let completed = 0;
    updateStatus(`A mover ${movePlan.length} ficheiros...`);
    await Promise.all(movePlan.map(async ({ oldPath, newPath, sha }) => {
        try {
            const getRes = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${oldPath}`, { headers: { Authorization: `token ${state.token}` } });
            if (!getRes.ok) throw new Error(`Não foi possível ler ${oldPath}`);
            const data = await getRes.json();
            await uploadToGithub(newPath, data.content, `Move to ${targetFolder}`, true);
            const delRes = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${oldPath}`, {
                method: 'DELETE',
                headers: { Authorization: `token ${state.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Cleanup move', sha })
            });
            if (!delRes.ok) throw new Error(`Erro ao remover original ${oldPath}`);
            completed++;
            updateStatus(`Movido (${completed}/${movePlan.length})`);
        } catch (err) { alert(`Falha mover ${oldPath}: ${err.message}`); }
    }));
    updateStatus(`${movePlan.length} ficheiros movidos`);
    await refreshAll();
    if (state.multiSelectMode) toggleMultiSelectMode();
}

function openMoveSelectedModal() {
    if (!state.selectedItems.size) return;
    state.modalAction = 'moveSelected';
    elements.modalInput.classList.remove('hidden');
    elements.genericInputContainer.classList.add('hidden');
    elements.moveFolderSelectContainer.classList.remove('hidden');
    elements.modalTitle.innerText = "Mover Selecionados";
    elements.modalSubtitle.innerText = "Destino";
    elements.modalIcon.className = "fas fa-exchange-alt text-indigo-600";
    elements.modalIconBg.className = "bg-indigo-100 p-3 rounded-xl";
    elements.moveFolderSelect.innerHTML = '<option value="">/ (Raiz)</option>';
    state.allFolders.forEach(f => {
        if (f === '') return;
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        elements.moveFolderSelect.appendChild(opt);
    });
    elements.moveFolderSelect.value = '';
}

// ==================== MODAL INDIVIDUAL ====================
function openModal(type, item = null) {
    state.modalAction = type;
    state.activeItem = item;
    elements.modalInput.classList.remove('hidden');
    elements.genericInputContainer.classList.add('hidden');
    elements.moveFolderSelectContainer.classList.add('hidden');
    if (type === 'folder') {
        elements.modalTitle.innerText = "Nova Pasta";
        elements.modalSubtitle.innerText = "Criação";
        elements.modalIcon.className = "fas fa-folder-plus text-amber-600";
        elements.modalIconBg.className = "bg-amber-100 p-3 rounded-xl";
        elements.genericInputContainer.classList.remove('hidden');
        elements.genericInput.value = "";
        elements.genericInput.focus();
    } else if (type === 'rename') {
        elements.modalTitle.innerText = "Renomear";
        elements.modalSubtitle.innerText = "Alteração";
        elements.modalIcon.className = "fas fa-edit text-indigo-600";
        elements.modalIconBg.className = "bg-indigo-100 p-3 rounded-xl";
        elements.genericInputContainer.classList.remove('hidden');
        elements.genericInput.value = item.name;
        elements.genericInput.focus();
    } else if (type === 'move') {
        elements.modalTitle.innerText = "Mover Item";
        elements.modalSubtitle.innerText = "Transferência";
        elements.modalIcon.className = "fas fa-exchange-alt text-indigo-600";
        elements.modalIconBg.className = "bg-indigo-100 p-3 rounded-xl";
        elements.moveFolderSelectContainer.classList.remove('hidden');
        elements.moveFolderSelect.innerHTML = '<option value="">/ (Raiz)</option>';
        state.allFolders.forEach(f => {
            if (f === '') return;
            const opt = document.createElement('option');
            opt.value = f;
            opt.textContent = f;
            elements.moveFolderSelect.appendChild(opt);
        });
        elements.moveFolderSelect.value = '';
    }
}

async function handleModalConfirm() {
    const value = elements.genericInput.value.trim();
    const targetFolder = elements.moveFolderSelect.value;
    try {
        if (state.modalAction === 'folder') {
            if (!value) return;
            await uploadToGithub(`${state.currentPath ? state.currentPath + '/' : ''}${value}/.keep`, 'Pasta criada', 'Created via UI');
        } else if (state.modalAction === 'rename') {
            if (!value || value === state.activeItem.name) return closeModal();
            const getRes = await fetch(state.activeItem.url, { headers: { Authorization: `token ${state.token}` } });
            const data = await getRes.json();
            const newPath = state.activeItem.path.replace(state.activeItem.name, value);
            await uploadToGithub(newPath, data.content, `Renamed to ${value}`, true);
            await fetch(state.activeItem.url, { method: 'DELETE', headers: { Authorization: `token ${state.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Cleanup', sha: state.activeItem.sha }) });
        } else if (state.modalAction === 'move') {
            const file = state.activeItem;
            const newPath = `${targetFolder ? targetFolder + '/' : ''}${file.name}`;
            if (newPath === file.path) return closeModal();
            const getRes = await fetch(file.url, { headers: { Authorization: `token ${state.token}` } });
            const data = await getRes.json();
            await uploadToGithub(newPath, data.content, `Moved ${file.name}`, true);
            await fetch(file.url, { method: 'DELETE', headers: { Authorization: `token ${state.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Cleanup', sha: file.sha }) });
        } else if (state.modalAction === 'moveSelected') {
            await moveMultipleItems(Array.from(state.selectedItems), targetFolder);
        }
        closeModal();
        await refreshAll();
    } catch (err) { alert(err.message); }
}

function closeModal() {
    elements.modalInput.classList.add('hidden');
    state.modalAction = null;
    state.activeItem = null;
}

// ==================== UTILITÁRIOS ====================
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
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
    elements.statusMsg.innerText = msg;
}

function renderBreadcrumbs() {
    elements.breadcrumbs.innerHTML = `<li><a href="#" onclick="loadFiles('')" class="text-indigo-600 font-bold">Raiz</a></li>`;
    if (!state.currentPath) return;
    const parts = state.currentPath.split('/');
    let acc = '';
    parts.forEach((p, i) => {
        acc += (i === 0 ? '' : '/') + p;
        const current = acc;
        const isLast = i === parts.length - 1;
        elements.breadcrumbs.innerHTML += `<li><i class="fas fa-chevron-right text-slate-300 text-[8px] mx-1"></i><a href="#" class="${isLast ? 'text-slate-400 cursor-default' : 'text-indigo-600'}" onclick="${isLast ? '' : `loadFiles('${current}')`}">${p}</a></li>`;
    });
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

async function uploadMultipleFiles(files) {
    const total = files.length;
    let completed = 0;
    updateStatus(`Enviando ${total} ficheiro(s)...`);
    await Promise.all(files.map(async (file) => {
        try {
            const content = await readFileAsBase64(file);
            const remotePath = state.currentPath ? `${state.currentPath}/${file.name}` : file.name;
            await uploadToGithub(remotePath, content, `Upload: ${file.name}`, true);
            completed++;
            updateStatus(`Enviado ${file.name} (${completed}/${total})`);
        } catch (err) {
            alert(`Falha ao enviar ${file.name}: ${err.message}`);
        }
    }));
    updateStatus(`${total} ficheiro(s) enviado(s)`);
    await refreshAll();
    elements.fileUpload.value = '';
}

// ==================== INIT E LISTENERS ====================
async function init() {
    if (state.token) {
        elements.tokenInput.value = state.token;
        await login();
    }
    createPreviewModal();
    createViewControls();
    createBackButton();
    createMultiSelectControls();
    elements.fileUpload.setAttribute('multiple', true);
}

elements.btnLogin.onclick = login;
elements.btnLogout.onclick = logout;
elements.btnRefresh.onclick = refreshAll;
elements.btnNewFolder.onclick = () => openModal('folder');
elements.btnModalCancel.onclick = closeModal;
elements.btnModalConfirm.onclick = handleModalConfirm;
elements.fileUpload.onchange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) uploadMultipleFiles(files);
};
elements.searchInput.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.file-item').forEach(item => {
        const nameSpan = item.querySelector('.font-bold');
        if (nameSpan) item.style.display = nameSpan.innerText.toLowerCase().includes(term) ? '' : 'none';
    });
};
elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add('bg-indigo-50/30'); };
elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('bg-indigo-50/30');
elements.dropZone.ondrop = (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('bg-indigo-50/30');
    if (e.dataTransfer.files.length) uploadMultipleFiles(Array.from(e.dataTransfer.files));
};
init();