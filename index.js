import { saveFileToDB, getFilesFromDB, deleteFileFromDB, downloadFileFromDB } from './services/db.js';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from './constants.js';

console.log("%c AL Production %c Roblox Asset Manager Ready ", "background: #06b6d4; color: #fff; padding: 2px 4px; border-radius: 4px 0 0 4px;", "background: #1e293b; color: #e2e8f0; padding: 2px 4px; border-radius: 0 4px 4px 0;");

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadContent = document.getElementById('upload-content');
const uploadLoading = document.getElementById('upload-loading');
const errorContainer = document.getElementById('error-container');
const errorText = document.getElementById('error-text');
const fileListWrapper = document.getElementById('file-list-wrapper');
const fileListBody = document.getElementById('file-list-body');
const emptyState = document.getElementById('empty-state');
const initialLoader = document.getElementById('initial-loader');
const fileCountSpan = document.getElementById('file-count');
const yearSpan = document.getElementById('year');

// Admin Elements
const adminTrigger = document.getElementById('admin-trigger');
const adminModal = document.getElementById('admin-modal');
const closeModalBtn = document.getElementById('close-modal');
const adminForm = document.getElementById('admin-form');
const adminPasswordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');

// State
let currentFiles = [];
let isAdmin = localStorage.getItem('roblox_hub_admin') === 'true';

// Set Year
if(yearSpan) yearSpan.textContent = new Date().getFullYear();

// --- Icons (SVG Strings) ---
const ICONS = {
  box: `<svg class="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.5 5H5.5L3 18.5H21L18.5 5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/><path d="M9.5 9.5H14.5V14.5H9.5V9.5Z" fill="currentColor"/></svg>`,
  fileCode: `<svg class="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m10 13-2 2 2 2"></path><path d="m14 17 2-2-2-2"></path></svg>`,
  file: `<svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
  download: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  trash: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
  spinner: `<div class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin-custom"></div>`
};

// --- Toast Notification System ---
const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  const isError = type === 'error';
  const bgColor = isError ? 'bg-red-900/90' : 'bg-gray-800/90';
  const borderColor = isError ? 'border-red-700' : 'border-gray-700';
  const textColor = isError ? 'text-red-100' : 'text-white';
  
  toast.className = `fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border ${borderColor} ${bgColor} ${textColor} transform transition-all duration-500 translate-y-[-20px] opacity-0 flex items-center gap-3 font-medium text-sm sm:text-base pointer-events-none`;
  
  // Icon based on type
  const icon = isError 
    ? `<svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
    : `<svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
    
  toast.innerHTML = `${icon} <span>${message}</span>`;
  
  document.body.appendChild(toast);

  // Animate In
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-[-20px]', 'opacity-0');
  });

  // Remove after 3s
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-20px]');
    setTimeout(() => toast.remove(), 500);
  }, 3000);
};

// --- Formatters ---
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (ts) => {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const getFileIcon = (ext) => {
  if (ext && ext.includes('rbxl')) return ICONS.fileCode;
  if (ext && ext.includes('rbxm')) return ICONS.box;
  return ICONS.file;
};

// --- App Logic ---

const renderList = () => {
  if (!fileListBody) return;
  fileListBody.innerHTML = '';
  if (fileCountSpan) fileCountSpan.textContent = currentFiles.length;
  
  if (initialLoader) initialLoader.classList.add('hidden');

  if (currentFiles.length === 0) {
    if (fileListWrapper) fileListWrapper.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (fileListWrapper) fileListWrapper.classList.remove('hidden');

  currentFiles.forEach(file => {
    const row = document.createElement('tr');
    row.className = 'group hover:bg-gray-800/50 transition-colors';
    row.id = `file-row-${file.id}`;
    
    // Name Column
    const nameCell = document.createElement('td');
    nameCell.className = 'p-4';
    nameCell.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-gray-900 border border-gray-700">
          ${getFileIcon(file.extension)}
        </div>
        <div class="min-w-0">
          <p class="font-medium text-gray-200 truncate max-w-[150px] sm:max-w-xs" title="${file.name}">
            ${file.name}
          </p>
          <span class="text-xs text-al-accent bg-al-accent/10 px-1.5 py-0.5 rounded border border-al-accent/20">
            ${file.extension ? file.extension.toUpperCase().replace('.', '') : 'FILE'}
          </span>
        </div>
      </div>
    `;

    // Size Column
    const sizeCell = document.createElement('td');
    sizeCell.className = 'p-4 text-sm text-gray-400 font-mono';
    sizeCell.textContent = formatSize(file.size);

    // Date Column
    const dateCell = document.createElement('td');
    dateCell.className = 'p-4 text-sm text-gray-500 hidden sm:table-cell';
    dateCell.textContent = formatDate(file.uploadDate);

    // Actions Column
    const actionCell = document.createElement('td');
    actionCell.className = 'p-4';
    
    const actionWrapper = document.createElement('div');
    actionWrapper.className = 'flex items-center justify-end gap-2';

    // Download Button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'p-2 text-gray-400 hover:text-al-accent hover:bg-al-accent/10 rounded-lg transition-colors';
    downloadBtn.innerHTML = ICONS.download;
    downloadBtn.title = "Download";
    downloadBtn.onclick = async () => {
      downloadBtn.innerHTML = ICONS.spinner;
      try {
        await downloadFileFromDB(file.id);
      } catch(e) {
        showToast("Gagal download: " + (e.message || "Unknown error"), 'error');
      } finally {
        downloadBtn.innerHTML = ICONS.download;
      }
    };
    actionWrapper.appendChild(downloadBtn);

    // Delete Button (Admin)
    if (isAdmin) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors';
      deleteBtn.innerHTML = ICONS.trash;
      deleteBtn.title = "Hapus (Admin)";
      
      deleteBtn.onclick = async () => {
        if (confirm(`ADMIN: Hapus file "${file.name}" secara permanen?`)) {
          deleteBtn.innerHTML = ICONS.spinner;
          try {
            await deleteFileFromDB(file.id);
            currentFiles = currentFiles.filter(f => f.id !== file.id);
            renderList();
            showToast("File berhasil dihapus");
          } catch(e) {
            console.error(e);
            const msg = e.message || JSON.stringify(e);
            
            if (msg.includes('policy') || msg.includes('permission')) {
               showToast("Gagal: Izin ditolak. Cek Policy Supabase.", 'error');
            } else {
               showToast("Gagal menghapus file", 'error');
            }
          } finally {
             deleteBtn.innerHTML = ICONS.trash;
          }
        }
      };

      actionWrapper.appendChild(deleteBtn);
    }

    actionCell.appendChild(actionWrapper);

    row.appendChild(nameCell);
    row.appendChild(sizeCell);
    row.appendChild(dateCell);
    row.appendChild(actionCell);
    
    fileListBody.appendChild(row);
  });
};

const loadData = async () => {
  try {
    currentFiles = await getFilesFromDB();
    renderList();
  } catch (e) {
    console.error(e);
    if (initialLoader) {
        initialLoader.innerHTML = `<p class="text-red-400 text-center text-sm px-4">Gagal memuat data.<br/><span class="text-xs text-gray-500">${e.message}</span></p>`;
    }
  }
};

const showError = (msg) => {
  if (errorText) errorText.textContent = msg;
  if (errorContainer) {
    errorContainer.classList.remove('hidden');
    errorContainer.classList.add('animate-pulse');
    setTimeout(() => errorContainer.classList.remove('animate-pulse'), 500);
  }
  showToast(msg, 'error');
};

const hideError = () => {
  if (errorContainer) errorContainer.classList.add('hidden');
};

const handleFile = async (file) => {
  hideError();
  
  const fileName = file.name.toLowerCase();
  const isValidExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (!isValidExt) {
    showError(`Format salah. Gunakan: ${ALLOWED_EXTENSIONS.join(', ')}`);
    return;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    showError(`Terlalu besar. Max ${MAX_FILE_SIZE_MB}MB.`);
    return;
  }

  if (uploadContent) uploadContent.classList.add('hidden');
  if (uploadLoading) uploadLoading.classList.remove('hidden');
  
  try {
    await new Promise(r => setTimeout(r, 800));
    const savedFile = await saveFileToDB(file);
    currentFiles.unshift(savedFile);
    renderList();
    showToast("File berhasil diupload!");
  } catch (e) {
    console.error(e);
    showError(e.message || "Gagal menyimpan file.");
  } finally {
    if (uploadLoading) uploadLoading.classList.add('hidden');
    if (uploadContent) uploadContent.classList.remove('hidden');
    if (fileInput) fileInput.value = '';
  }
};

// --- Admin Logic ---

const toggleModal = (show) => {
  if (!adminModal) return;
  if (show) {
    adminModal.classList.remove('hidden');
    setTimeout(() => {
        adminModal.classList.remove('opacity-0');
        adminModal.querySelector('div').classList.remove('scale-95');
    }, 10);
    if (adminPasswordInput) adminPasswordInput.focus();
  } else {
    adminModal.classList.add('opacity-0');
    adminModal.querySelector('div').classList.add('scale-95');
    setTimeout(() => adminModal.classList.add('hidden'), 300);
    if (adminForm) adminForm.reset();
    if (loginError) loginError.classList.add('hidden');
  }
};

if (isAdmin && adminTrigger) {
  adminTrigger.classList.add('text-al-accent', 'opacity-100');
}

if (adminTrigger) {
    adminTrigger.addEventListener('click', () => {
      if (isAdmin) {
        if(confirm('Logout dari mode Admin?')) {
            isAdmin = false;
            localStorage.setItem('roblox_hub_admin', 'false');
            adminTrigger.classList.remove('text-al-accent', 'opacity-100');
            renderList();
            showToast("Logout berhasil");
        }
      } else {
        toggleModal(true);
      }
    });
}

if (closeModalBtn) closeModalBtn.addEventListener('click', () => toggleModal(false));
if (adminModal) adminModal.addEventListener('click', (e) => {
    if(e.target === adminModal) toggleModal(false);
});

if (adminForm) {
    adminForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pass = adminPasswordInput.value;
      
      if (pass === 'admin123') {
        isAdmin = true;
        localStorage.setItem('roblox_hub_admin', 'true');
        if (adminTrigger) adminTrigger.classList.add('text-al-accent', 'opacity-100');
        renderList();
        toggleModal(false);
        showToast("Login Admin Berhasil");
      } else {
        if (loginError) loginError.classList.remove('hidden');
        if (adminPasswordInput) adminPasswordInput.classList.add('border-red-500');
      }
    });
}

if (adminPasswordInput) {
    adminPasswordInput.addEventListener('input', () => {
        if (loginError) loginError.classList.add('hidden');
        adminPasswordInput.classList.remove('border-red-500');
    });
}

// --- Event Listeners ---

loadData();

if (dropZone) {
    dropZone.addEventListener('click', () => {
      if (uploadLoading && uploadLoading.classList.contains('hidden')) {
        fileInput.click();
      }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('drag-active');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });
}