// Configurações Globais
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
    totalSize: 0,
    totalCount: 0,
    modalAction: null,
    activeItem: null,
    viewMode: 'list',
    iconSize: 'medium'
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
    folderStorageUsage: document.getElementById('folder-storage-usage'),
    btnBack: null // será criado dinamicamente
};

// --- BARRA DE CONTROLO VISUAL ---
function createViewControls() {
    if (document.getElementById('view-controls')) return;
    
    const controlsHtml = `
        <div id="view-controls" class="p-4 border-b border-slate-50 bg-white">
            <!-- Botões Lista/Grelha -->
            <div class="flex gap-2 mb-3">
                <button id="view-list-btn" class="view-mode-btn flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-indigo-600 text-white shadow-md">
                    <i class="fas fa-list-ul"></i> Lista
                </button>
                <button id="view-grid-btn" class="view-mode-btn flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-200">
                    <i class="fas fa-th-large"></i> Grelha
                </button>
            </div>
            
            <!-- Botões de Tamanho -->
            <div id="size-controls" class="flex gap-2 ${state.viewMode === 'list' ? 'hidden' : ''}">
                <button id="size-sm" class="size-btn flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${state.iconSize === 'small' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">
                    <i class="fas fa-th"></i> P
                </button>
                <button id="size-md" class="size-btn flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${state.iconSize === 'medium' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">
                    <i class="fas fa-th-large"></i> M
                </button>
                <button id="size-lg" class="size-btn flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${state.iconSize === 'large' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">
                    <i class="fas fa-border-all"></i> G
                </button>
                <button id="size-xl" class="size-btn flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${state.iconSize === 'xlarge' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">
                    <i class="fas fa-arrows-alt"></i> XG
                </button>
            </div>
        </div>
    `;
    
    const viewControlsContainer = document.getElementById('view-controls-container');
    if (viewControlsContainer && !document.getElementById('view-controls')) {
        viewControlsContainer.innerHTML = controlsHtml;
    } else if (!document.getElementById('view-controls')) {
        const listHeader = document.getElementById('list-header');
        if (listHeader) {
            listHeader.insertAdjacentHTML('afterend', controlsHtml);
        }
    }
    
    document.getElementById('view-list-btn')?.addEventListener('click', () => setViewMode('list'));
    document.getElementById('view-grid-btn')?.addEventListener('click', () => setViewMode('grid'));
    document.getElementById('size-sm')?.addEventListener('click', () => setIconSize('small'));
    document.getElementById('size-md')?.addEventListener('click', () => setIconSize('medium'));
    document.getElementById('size-lg')?.addEventListener('click', () => setIconSize('large'));
    document.getElementById('size-xl')?.addEventListener('click', () => setIconSize('xlarge'));
}

function setViewMode(mode) {
    state.viewMode = mode;
    const listBtn = document.getElementById('view-list-btn');
    const gridBtn = document.getElementById('view-grid-btn');
    const sizeControls = document.getElementById('size-controls');
    const listHeader = document.getElementById('list-header');
    
    if (listBtn && gridBtn) {
        if (mode === 'list') {
            listBtn.className = "view-mode-btn flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-indigo-600 text-white shadow-md";
            gridBtn.className = "view-mode-btn flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-200";
            if (sizeControls) sizeControls.classList.add('hidden');
            if (listHeader) listHeader.style.display = 'grid';
        } else {
            listBtn.className = "view-mode-btn flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-200";
            gridBtn.className = "view-mode-btn flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-indigo-600 text-white shadow-md";
            if (sizeControls) sizeControls.classList.remove('hidden');
            if (listHeader) listHeader.style.display = 'none';
        }
    }
    renderFileList();
}

function setIconSize(size) {
    state.iconSize = size;
    const sizes = ['small', 'medium', 'large', 'xlarge'];
    const sizeIds = { small: 'sm', medium: 'md', large: 'lg', xlarge: 'xl' };
    
    sizes.forEach(s => {
        const btn = document.getElementById(`size-${sizeIds[s]}`);
        if (btn) {
            if (s === size) {
                btn.className = `size-btn flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all bg-indigo-100 text-indigo-600 border border-indigo-200`;
            } else {
                btn.className = `size-btn flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all bg-slate-100 text-slate-500 hover:bg-slate-200`;
            }
        }
    });
    renderFileList();
}

// --- MODAL DE PRÉ-VISUALIZAÇÃO ---
function createPreviewModal() {
    if (document.getElementById('preview-modal')) return;
    
    const modalHTML = `
        <div id="preview-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div class="bg-white rounded-3xl shadow-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div class="flex items-center justify-between p-5 border-b border-slate-100">
                    <div class="flex items-center gap-3">
                        <div class="bg-indigo-100 p-2 rounded-xl"><i class="fas fa-eye text-indigo-600"></i></div>
                        <div>
                            <h3 class="font-black text-slate-800" id="preview-filename">Pré-visualização</h3>
                            <p class="text-xs text-slate-400" id="preview-filesize"></p>
                        </div>
                    </div>
                    <button id="close-preview" class="w-8 h-8 rounded-full hover:bg-slate-100 transition flex items-center justify-center text-slate-400 hover:text-red-500">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="preview-content" class="flex-1 overflow-auto p-6 bg-slate-50 flex items-center justify-center">
                    <div class="text-center text-slate-400"><i class="fas fa-spinner fa-pulse text-2xl mb-2 block"></i> A carregar...</div>
                </div>
                <div class="p-4 border-t border-slate-100 flex justify-end gap-3">
                    <a id="preview-download-link" href="#" target="_blank" class="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-bold hover:bg-indigo-100 transition flex items-center gap-2">
                        <i class="fas fa-external-link-alt"></i> Abrir original
                    </a>
                    <button id="preview-close-btn" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('preview-modal');
    const closeBtn = document.getElementById('close-preview');
    const closeBtn2 = document.getElementById('preview-close-btn');
    const closeModal = () => modal.classList.add('hidden');
    closeBtn.onclick = closeModal;
    closeBtn2.onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

async function openPreview(file) {
    if (file.type !== 'file') return;
    createPreviewModal();
    
    const modal = document.getElementById('preview-modal');
    const filenameSpan = document.getElementById('preview-filename');
    const filesizeSpan = document.getElementById('preview-filesize');
    const contentDiv = document.getElementById('preview-content');
    const downloadLink = document.getElementById('preview-download-link');
    
    filenameSpan.textContent = file.name;
    filesizeSpan.textContent = formatBytes(file.size);
    downloadLink.href = file.download_url || file.html_url;
    contentDiv.innerHTML = `<div class="text-center text-slate-400"><i class="fas fa-spinner fa-pulse text-2xl mb-2 block"></i> A carregar conteúdo...</div>`;
    modal.classList.remove('hidden');
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = imageExtensions.includes(ext);
    
    if (isImage && file.download_url) {
        const img = document.createElement('img');
        img.src = file.download_url;
        img.alt = file.name;
        img.className = 'max-w-full max-h-[70vh] object-contain rounded-xl shadow-md';
        img.onload = () => { contentDiv.innerHTML = ''; contentDiv.appendChild(img); };
        img.onerror = () => { contentDiv.innerHTML = `<div class="text-center text-red-500"><i class="fas fa-image-slash text-4xl mb-2 block"></i> Não foi possível carregar a imagem.</div>`; };
        return;
    }
    
    const textExtensions = ['txt', 'md', 'js', 'html', 'css', 'json', 'xml', 'svg', 'sh', 'py', 'rb', 'php', 'java', 'c', 'cpp', 'h', 'csv', 'log'];
    const isText = textExtensions.includes(ext) || file.name.includes('.env') || file.name.includes('.gitignore');
    
    if (isText && file.size < 1024 * 1024) {
        try {
            const response = await fetch(file.download_url);
            if (!response.ok) throw new Error();
            const text = await response.text();
            const pre = document.createElement('pre');
            pre.className = 'text-sm font-mono bg-slate-800 text-slate-100 p-4 rounded-xl overflow-auto max-h-[60vh] whitespace-pre-wrap';
            pre.textContent = text;
            contentDiv.innerHTML = '';
            contentDiv.appendChild(pre);
        } catch (err) {
            contentDiv.innerHTML = `<div class="text-center text-red-500"><i class="fas fa-file-alt text-4xl mb-2 block"></i> Erro ao carregar o texto.<br><a href="${file.download_url}" target="_blank" class="text-indigo-600 underline">Descarregar ficheiro</a></div>`;
        }
    } else {
        contentDiv.innerHTML = `<div class="text-center text-slate-500"><i class="fas fa-file fa-4x mb-4 text-slate-300"></i><p class="mb-4">Pré-visualização não disponível para este tipo de ficheiro.</p><a href="${file.download_url}" target="_blank" class="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"><i class="fas fa-download"></i> Descarregar ficheiro</a></div>`;
    }
}

// --- FUNÇÃO AUXILIAR PARA ÍCONES/MINIATURAS ---
function getFileIcon(file) {
    if (file.type === 'dir') {
        return `<div class="flex items-center justify-center w-full h-full text-amber-500"><i class="fas fa-folder-open text-4xl"></i></div>`;
    }
    
    const ext = file.name.split('.').pop().toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const isImage = imageExts.includes(ext);
    
    if (isImage && file.download_url) {
        return `<img src="${file.download_url}" alt="${file.name}" class="w-full h-full object-cover rounded-xl" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'flex items-center justify-center w-full h-full text-slate-400\'><i class=\'fas fa-image-slash text-3xl\'></i></div>';">`;
    }
    
    let iconClass = 'fa-file-alt';
    if (['pdf'].includes(ext)) iconClass = 'fa-file-pdf';
    else if (['doc', 'docx'].includes(ext)) iconClass = 'fa-file-word';
    else if (['xls', 'xlsx', 'csv'].includes(ext)) iconClass = 'fa-file-excel';
    else if (['ppt', 'pptx'].includes(ext)) iconClass = 'fa-file-powerpoint';
    else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) iconClass = 'fa-file-archive';
    else if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) iconClass = 'fa-file-audio';
    else if (['mp4', 'avi', 'mkv', 'mov'].includes(ext)) iconClass = 'fa-file-video';
    else if (['txt', 'md', 'log'].includes(ext)) iconClass = 'fa-file-alt';
    else if (['js', 'html', 'css', 'json', 'xml', 'py', 'java', 'c', 'cpp'].includes(ext)) iconClass = 'fa-code';
    
    return `<div class="flex items-center justify-center w-full h-full text-indigo-400"><i class="fas ${iconClass} text-5xl"></i></div>`;
}

// --- RENDERIZAÇÃO LISTA ---
function renderListView() {
    const sorted = [...state.files].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
    });
    
    elements.fileList.innerHTML = '';
    if (state.files.length === 0) {
        elements.fileList.innerHTML = '<div class="p-20 text-center text-slate-300 font-bold">Pasta Vazia</div>';
        return;
    }
    
    sorted.forEach(file => {
        const isDir = file.type === 'dir';
        const isProtected = (PROTECTED_FILES.includes(file.name) && state.currentPath === '') || (PROTECTED_FOLDERS.includes(file.name) && state.currentPath === '');
        const item = document.createElement('div');
        item.className = `file-item grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-8 py-4 md:py-5 items-center transition cursor-pointer border-b border-slate-50 ${isProtected ? 'system-file' : ''}`;
        
        item.innerHTML = `
            <div class="col-span-7 md:col-span-8 flex items-center gap-3 md:gap-4 overflow-hidden">
                <div class="w-10 h-10 md:w-12 md:h-12 rounded-2xl ${isDir ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'} flex items-center justify-center flex-shrink-0 border border-white shadow-sm">
                    <i class="fas ${isDir ? 'fa-folder' : 'fa-file-alt'} text-base md:text-xl"></i>
                </div>
                <div class="flex flex-col overflow-hidden">
                    <span class="truncate font-bold text-slate-700 text-xs md:text-sm">${escapeHtml(file.name)}</span>
                    ${isProtected ? `<span class="text-[8px] md:text-[9px] font-black text-indigo-600 uppercase tracking-tighter"><i class="fas fa-shield-alt mr-1"></i>Protegido</span>` : ''}
                </div>
            </div>
            <div class="col-span-3 md:col-span-2 text-right text-xs font-black text-slate-400 hidden sm:block">${isDir ? '--' : formatBytes(file.size)}</div>
            <div class="col-span-5 sm:col-span-2 text-right flex justify-end gap-1">
                ${!isProtected && !isDir ? `<button class="btn-preview p-2 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition" title="Pré-visualizar"><i class="fas fa-eye text-xs"></i></button>` : ''}
                ${!isProtected ? `
                    <button class="btn-move p-2 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition" title="Mover"><i class="fas fa-exchange-alt text-xs"></i></button>
                    <button class="btn-rename p-2 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition" title="Renomear"><i class="fas fa-pen text-xs"></i></button>
                    <button class="btn-delete p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition" title="Eliminar"><i class="fas fa-trash-alt text-xs"></i></button>
                ` : `<div class="p-2 text-slate-200"><i class="fas fa-lock text-xs"></i></div>`}
            </div>
        `;
        
        item.onclick = (e) => { if (e.target.closest('button')) return; if (isDir) loadFiles(file.path); else openPreview(file); };
        
        if (!isProtected) {
            item.querySelector('.btn-preview')?.addEventListener('click', (e) => { e.stopPropagation(); openPreview(file); });
            item.querySelector('.btn-move').addEventListener('click', (e) => { e.stopPropagation(); openModal('move', file); });
            item.querySelector('.btn-rename').addEventListener('click', (e) => { e.stopPropagation(); openModal('rename', file); });
            item.querySelector('.btn-delete').addEventListener('click', (e) => { e.stopPropagation(); deleteItem(file); });
        }
        elements.fileList.appendChild(item);
    });
}

// --- RENDERIZAÇÃO GRELHA ---
function renderGridView() {
    const sorted = [...state.files].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
    });
    
    elements.fileList.innerHTML = '';
    if (state.files.length === 0) {
        elements.fileList.innerHTML = '<div class="p-20 text-center text-slate-300 font-bold">Pasta Vazia</div>';
        return;
    }
    
    let colClass, iconSizeClass, textSizeClass, nameMaxLines;
    switch (state.iconSize) {
        case 'small': 
            colClass = 'grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'; 
            iconSizeClass = 'w-20 h-20'; 
            textSizeClass = 'text-xs'; 
            nameMaxLines = 'line-clamp-1'; 
            break;
        case 'medium': 
            colClass = 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'; 
            iconSizeClass = 'w-28 h-28'; 
            textSizeClass = 'text-sm'; 
            nameMaxLines = 'line-clamp-2'; 
            break;
        case 'large': 
            colClass = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3'; 
            iconSizeClass = 'w-36 h-36'; 
            textSizeClass = 'text-base'; 
            nameMaxLines = 'line-clamp-2'; 
            break;
        case 'xlarge': 
            colClass = 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2'; 
            iconSizeClass = 'w-48 h-48'; 
            textSizeClass = 'text-lg'; 
            nameMaxLines = 'line-clamp-3'; 
            break;
        default: 
            colClass = 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'; 
            iconSizeClass = 'w-28 h-28'; 
            textSizeClass = 'text-sm'; 
            nameMaxLines = 'line-clamp-2';
    }
    
    elements.fileList.className = `grid ${colClass} gap-3 md:gap-6 p-3 md:p-4`;
    
    sorted.forEach(file => {
        const isDir = file.type === 'dir';
        const isProtected = (PROTECTED_FILES.includes(file.name) && state.currentPath === '') || (PROTECTED_FOLDERS.includes(file.name) && state.currentPath === '');
        const card = document.createElement('div');
        card.className = `file-item group bg-white rounded-2xl border border-slate-100 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer ${isProtected ? 'opacity-60' : ''}`;
        const thumbnailHtml = getFileIcon(file);
        
        card.innerHTML = `
            <div class="relative">
                <div class="flex items-center justify-center p-3 md:p-4 bg-slate-50 ${iconSizeClass} w-full mx-auto">
                    ${thumbnailHtml}
                </div>
                ${!isProtected ? `
                    <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        ${!isDir ? `<button class="btn-preview-grid p-1.5 bg-white rounded-full shadow text-indigo-500 hover:text-indigo-700"><i class="fas fa-eye text-xs"></i></button>` : ''}
                        <button class="btn-move-grid p-1.5 bg-white rounded-full shadow text-slate-500 hover:text-indigo-600"><i class="fas fa-exchange-alt text-xs"></i></button>
                        <button class="btn-rename-grid p-1.5 bg-white rounded-full shadow text-slate-500 hover:text-indigo-600"><i class="fas fa-pen text-xs"></i></button>
                        <button class="btn-delete-grid p-1.5 bg-white rounded-full shadow text-slate-500 hover:text-red-500"><i class="fas fa-trash-alt text-xs"></i></button>
                    </div>
                ` : `<div class="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-slate-400"><i class="fas fa-lock text-xs"></i></div>`}
            </div>
            <div class="p-2 md:p-3 text-center border-t border-slate-50">
                <p class="font-bold ${textSizeClass} text-slate-700 ${nameMaxLines}" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</p>
                ${!isDir ? `<p class="text-[10px] md:text-xs text-slate-400 mt-1">${formatBytes(file.size)}</p>` : ''}
                ${isProtected ? `<p class="text-[8px] md:text-[10px] font-black text-amber-600 mt-1"><i class="fas fa-shield-alt"></i> Protegido</p>` : ''}
            </div>
        `;
        
        card.onclick = (e) => { if (e.target.closest('button')) return; if (isDir) loadFiles(file.path); else openPreview(file); };
        
        if (!isProtected) {
            if (!isDir) card.querySelector('.btn-preview-grid')?.addEventListener('click', (e) => { e.stopPropagation(); openPreview(file); });
            card.querySelector('.btn-move-grid').addEventListener('click', (e) => { e.stopPropagation(); openModal('move', file); });
            card.querySelector('.btn-rename-grid').addEventListener('click', (e) => { e.stopPropagation(); openModal('rename', file); });
            card.querySelector('.btn-delete-grid').addEventListener('click', (e) => { e.stopPropagation(); deleteItem(file); });
        }
        elements.fileList.appendChild(card);
    });
}

function renderFileList() {
    if (state.viewMode === 'list') renderListView();
    else renderGridView();
    
    if (elements.searchInput.value) {
        const term = elements.searchInput.value.toLowerCase();
        document.querySelectorAll('.file-item').forEach(item => {
            const nameEl = item.querySelector('.font-bold');
            if (nameEl) item.style.display = nameEl.textContent.toLowerCase().includes(term) ? '' : 'none';
        });
    }
}

// --- FUNÇÕES BASE ---
async function login() {
    const token = elements.tokenInput.value.trim();
    if (!token) return;
    
    try {
        updateStatus('A autenticar...');
        const res = await fetch('https://api.github.com/user', { headers: { 'Authorization': `token ${token}` } });
        if (!res.ok) throw new Error('Token inválido.');
        const data = await res.json();
        state.owner = data.login;
        
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
    } catch (e) { alert(e.message); logout(); }
}

function logout() {
    state.token = '';
    localStorage.removeItem('gh_token');
    elements.authSection.classList.remove('hidden');
    elements.userSection.classList.add('hidden');
    elements.welcomeScreen.classList.remove('hidden');
    elements.appContent.classList.add('hidden');
    // Reset do botão voltar se existir
    if (elements.btnBack) {
        elements.btnBack.disabled = false;
        elements.btnBack.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function showApp() {
    elements.authSection.classList.add('hidden');
    elements.userSection.classList.remove('hidden');
    elements.welcomeScreen.classList.add('hidden');
    elements.appContent.classList.remove('hidden');
    elements.repoInfo.textContent = `${state.owner}/${state.repo}`;
}

async function refreshAll() { 
    await loadFiles(); 
    await calculateStats(); 
}

// --- FUNÇÃO PARA VOLTAR PASTA ANTERIOR ---
async function goBack() {
    if (!state.currentPath) return;
    
    // Obtém o caminho pai
    const pathParts = state.currentPath.split('/');
    pathParts.pop();
    const parentPath = pathParts.join('/');
    
    await loadFiles(parentPath);
}

// --- ATUALIZAR ESTADO DO BOTÃO VOLTAR ---
function updateBackButtonState() {
    if (!elements.btnBack) return;
    if (!state.currentPath) {
        elements.btnBack.disabled = true;
        elements.btnBack.classList.add('opacity-50', 'cursor-not-allowed');
        elements.btnBack.classList.remove('hover:bg-indigo-100', 'hover:text-indigo-600');
    } else {
        elements.btnBack.disabled = false;
        elements.btnBack.classList.remove('opacity-50', 'cursor-not-allowed');
        elements.btnBack.classList.add('hover:bg-indigo-100', 'hover:text-indigo-600');
    }
}

// --- GARANTIR QUE O BOTÃO VOLTAR EXISTE NO DOM ---
function ensureBackButton() {
    if (elements.btnBack) return;
    
    const backBtn = document.createElement('button');
    backBtn.id = 'btn-back';
    backBtn.className = 'px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 transition flex items-center gap-2 text-sm font-bold';
    backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar';
    backBtn.title = 'Pasta anterior';
    
    // Insere após o botão Nova Pasta
    const newFolderBtn = elements.btnNewFolder;
    if (newFolderBtn && newFolderBtn.parentNode) {
        newFolderBtn.parentNode.insertBefore(backBtn, newFolderBtn.nextSibling);
    } else {
        // fallback: coloca ao lado do repo-info
        const repoInfo = elements.repoInfo;
        if (repoInfo && repoInfo.parentNode) {
            repoInfo.parentNode.appendChild(backBtn);
        }
    }
    
    elements.btnBack = backBtn;
    elements.btnBack.onclick = goBack;
    updateBackButtonState();
}

async function loadFiles(path = state.currentPath) {
    state.currentPath = path;
    updateBackButtonState();
    renderBreadcrumbs();
    
    try {
        updateStatus('A ler diretório...');
        const res = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, {
            headers: { 'Authorization': `token ${state.token}` }, 
            cache: 'no-store'
        });
        state.files = res.ok ? await res.json() : [];
        renderFileList();
        updateFolderStats();
        updateStatus('');
    } catch (e) { updateStatus('Erro na leitura.'); }
}

async function calculateStats() {
    try {
        const repoRes = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}`, { headers: { 'Authorization': `token ${state.token}` } });
        const repoData = await repoRes.json();
        state.totalSize = repoData.size * 1024;
        
        const branchRes = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/branches/main`, { headers: { 'Authorization': `token ${state.token}` } });
        const branchData = await branchRes.json();
        
        const treeRes = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/git/trees/${branchData.commit.commit.tree.sha}?recursive=1`, { headers: { 'Authorization': `token ${state.token}` } });
        const treeData = await treeRes.json();
        
        const filesOnly = treeData.tree.filter(item => item.type === 'blob');
        state.totalCount = filesOnly.length;
        state.allFolders = treeData.tree.filter(item => item.type === 'tree').map(item => item.path);
        state.allFolders.unshift('');
        
        updateStatsUI();
    } catch (e) { console.error("Erro nas estatísticas:", e); }
}

function updateStatsUI() {
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

async function deleteItem(file) {
    if (!confirm(`Deseja eliminar "${file.name}"?`)) return;
    
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

async function uploadToGithub(path, content, message, isBase64 = false) {
    let sha = null;
    const check = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, { headers: { 'Authorization': `token ${state.token}` } });
    if (check.ok) { const data = await check.json(); sha = data.sha; }
    
    const res = await fetch(`https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${state.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: isBase64 ? content : btoa(content), sha })
    });
    if (!res.ok) throw new Error('Falha no upload.');
}

function openModal(type, item = null) {
    state.modalAction = type;
    state.activeItem = item;
    elements.modalInput.classList.remove('hidden');
    elements.genericInputContainer.classList.add('hidden');
    elements.moveFolderSelectContainer.classList.add('hidden');
    
    if (type === 'folder') {
        elements.modalTitle.textContent = "Nova Pasta";
        elements.modalSubtitle.textContent = "Criação";
        elements.modalIcon.className = "fas fa-folder-plus text-amber-600";
        elements.modalIconBg.className = "bg-amber-100 p-4 rounded-2xl";
        elements.genericInputContainer.classList.remove('hidden');
        elements.genericInput.value = "";
        elements.genericInput.focus();
    } else if (type === 'rename') {
        elements.modalTitle.textContent = "Renomear";
        elements.modalSubtitle.textContent = "Alteração";
        elements.modalIcon.className = "fas fa-edit text-indigo-600";
        elements.modalIconBg.className = "bg-indigo-100 p-4 rounded-2xl";
        elements.genericInputContainer.classList.remove('hidden');
        elements.genericInput.value = item.name;
        elements.genericInput.focus();
    } else if (type === 'move') {
        elements.modalTitle.textContent = "Mover Item";
        elements.modalSubtitle.textContent = "Transferência";
        elements.modalIcon.className = "fas fa-exchange-alt text-indigo-600";
        elements.modalIconBg.className = "bg-indigo-100 p-4 rounded-2xl";
        elements.moveFolderSelectContainer.classList.remove('hidden');
        elements.moveFolderSelect.innerHTML = '';
        state.allFolders.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f;
            opt.textContent = f === '' ? '/ (Raiz)' : f;
            elements.moveFolderSelect.appendChild(opt);
        });
    }
}

async function handleModalConfirm() {
    const value = elements.genericInput.value.trim();
    const targetFolder = elements.moveFolderSelect.value;
    
    try {
        if (state.modalAction === 'folder') {
            if (!value) return;
            updateStatus('A criar pasta...');
            await uploadToGithub(`${state.currentPath ? state.currentPath + '/' : ''}${value}/.keep`, 'Pasta criada', 'Created via UI');
        } else if (state.modalAction === 'rename') {
            if (!value || value === state.activeItem.name) return closeModal();
            updateStatus('A renomear...');
            const getRes = await fetch(state.activeItem.url, { headers: { 'Authorization': `token ${state.token}` } });
            const data = await getRes.json();
            const newPath = state.activeItem.path.replace(state.activeItem.name, value);
            await uploadToGithub(newPath, data.content, `Renamed to ${value}`, true);
            await fetch(state.activeItem.url, { method: 'DELETE', headers: { 'Authorization': `token ${state.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Cleanup', sha: state.activeItem.sha }) });
        } else if (state.modalAction === 'move') {
            const file = state.activeItem;
            const newPath = `${targetFolder ? targetFolder + '/' : ''}${file.name}`;
            if (newPath === file.path) return closeModal();
            updateStatus('A mover...');
            const getRes = await fetch(file.url, { headers: { 'Authorization': `token ${state.token}` } });
            const data = await getRes.json();
            await uploadToGithub(newPath, data.content, `Moved ${file.name} to ${targetFolder}`, true);
            await fetch(file.url, { method: 'DELETE', headers: { 'Authorization': `token ${state.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Cleanup after move', sha: file.sha }) });
        }
        closeModal();
        await refreshAll();
    } catch (e) { alert(e.message); }
}

function closeModal() {
    elements.modalInput.classList.add('hidden');
    state.modalAction = null;
    state.activeItem = null;
}

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

function updateStatus(msg) { elements.statusMsg.textContent = msg; }

function renderBreadcrumbs() {
    elements.breadcrumbs.innerHTML = `<li><a href="#" class="text-indigo-600 hover:text-indigo-800 transition" onclick="loadFiles('')">Raiz</a></li>`;
    if (!state.currentPath) return;
    
    const parts = state.currentPath.split('/');
    let acc = '';
    parts.forEach((p, i) => {
        acc += (i === 0 ? '' : '/') + p;
        const current = acc;
        elements.breadcrumbs.innerHTML += `<li class="flex items-center gap-1 md:gap-2"><i class="fas fa-chevron-right text-slate-300 text-[8px] md:text-[10px]"></i><a href="#" class="${i === parts.length - 1 ? 'text-slate-400 cursor-default' : 'text-indigo-600 hover:text-indigo-800 transition'} text-xs md:text-sm" onclick="${i === parts.length - 1 ? '' : `loadFiles('${current}')`}">${p}</a></li>`;
    });
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// --- INIT E LISTENERS ---
async function init() {
    ensureBackButton(); // cria o botão voltar se não existir
    if (state.token) {
        elements.tokenInput.value = state.token;
        await login();
    }
    createPreviewModal();
    createViewControls();
}

elements.btnLogin.onclick = login;
elements.btnLogout.onclick = logout;
elements.btnRefresh.onclick = refreshAll;
elements.btnNewFolder.onclick = () => openModal('folder');
elements.btnModalCancel.onclick = closeModal;
elements.btnModalConfirm.onclick = handleModalConfirm;

elements.fileUpload.onchange = (e) => {
    const files = e.target.files;
    if (!files.length) return;
    (async () => {
        for (const f of files) {
            try {
                updateStatus(`A enviar ${f.name}...`);
                const content = await readFileAsBase64(f);
                await uploadToGithub(`${state.currentPath ? state.currentPath + '/' : ''}${f.name}`, content, `Upload: ${f.name}`, true);
            } catch (e) { alert(e.message); }
        }
        await refreshAll();
        elements.fileUpload.value = '';
    })();
};

elements.searchInput.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.file-item').forEach(item => {
        const nameSpan = item.querySelector('.font-bold');
        if (nameSpan) item.style.display = nameSpan.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
};

elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add('bg-indigo-50/30'); };
elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('bg-indigo-50/30');
elements.dropZone.ondrop = (e) => { e.preventDefault(); elements.dropZone.classList.remove('bg-indigo-50/30'); elements.fileUpload.onchange({target: {files: e.dataTransfer.files}}); };

init();