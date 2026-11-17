/**
 * Main Application Controller
 * Coordinates UI events, gallery rendering, button workflows,
 * modal dialogs, and notifications.
 */

import { State } from './state.js';
import { Utils } from './utils.js';
import { UploaderEngine } from './uploader.js';
import { FileViewer } from './viewer.js';

class App {
  constructor() {
    this.viewer = new FileViewer();
    this.initDOMReferences();
    this.initUploader();
    this.bindEvents();
    this.subscribeState();
    this.render();
  }

  initDOMReferences() {
    // Buttons specified in requirements
    this.btnUpload = document.getElementById('btn-upload-file');
    this.btnAddMore = document.getElementById('btn-add-more');
    this.btnShowFiles = document.getElementById('btn-show-files');
    this.btnClearAll = document.getElementById('btn-clear-all');

    // File input & Drop zone
    this.fileInput = document.getElementById('file-input');
    this.dropZone = document.getElementById('drop-zone');

    // Stats & Counters
    this.totalFilesBadge = document.getElementById('total-files-badge');
    this.totalStorageBadge = document.getElementById('total-storage-badge');
    this.serverStatusIndicator = document.getElementById('server-status-indicator');

    // Sections
    this.uploadSection = document.getElementById('upload-section');
    this.gallerySection = document.getElementById('gallery-section');
    this.filesContainer = document.getElementById('files-container');
    this.emptyState = document.getElementById('empty-state');
    this.uploadProgressSection = document.getElementById('upload-progress-section');
    this.uploadProgressBar = document.getElementById('overall-progress-bar');
    this.uploadProgressText = document.getElementById('upload-progress-text');

    // Filter, Search, Sort & View controls
    this.filterChips = document.querySelectorAll('.filter-chip');
    this.searchInput = document.getElementById('search-input');
    this.sortSelect = document.getElementById('sort-select');
    this.btnViewGrid = document.getElementById('btn-view-grid');
    this.btnViewList = document.getElementById('btn-view-list');

    // Clear Confirmation Modal
    this.clearModal = document.getElementById('clear-modal');
    this.clearModalCancel = document.getElementById('clear-modal-cancel');
    this.clearModalConfirm = document.getElementById('clear-modal-confirm');
    this.clearModalCountText = document.getElementById('clear-modal-count-text');

    // Toast Container
    this.toastContainer = document.getElementById('toast-container');
  }

  initUploader() {
    this.uploader = new UploaderEngine({
      dropZone: this.dropZone,
      fileInput: this.fileInput,
      onProgressUpdate: (item, percent) => {
        this.updateUploadProgressUI();
      },
      onUploadComplete: (item) => {
        this.updateUploadProgressUI();
        this.showToast(`"${item.name}" uploaded successfully`, 'success');
      },
      onError: (rejectedList) => {
        for (const item of rejectedList) {
          this.showToast(item.reason, 'error');
        }
      },
      onDuplicate: (duplicateList) => {
        const names = duplicateList.map(f => `"${f.name}"`).join(', ');
        this.showToast(
          duplicateList.length === 1
            ? `Duplicate file ${names} was skipped.`
            : `${duplicateList.length} duplicate files were skipped: ${names}`,
          'warning'
        );
      }
    });

    // Check server connectivity initially and load existing files from disk
    this.uploader.checkServerConnection().then(connected => {
      if (connected) {
        this.loadServerFiles();
      }
    });
  }

  async loadServerFiles() {
    try {
      const res = await fetch(`${this.uploader.getBaseUrl()}/api/files`);
      if (res.ok) {
        const data = await res.json();
        if (data.files && data.files.length > 0) {
          State.addServerFiles(data.files, this.uploader.getBaseUrl());
          this.showToast(`Restored ${data.files.length} existing file${data.files.length === 1 ? '' : 's'} from server disk.`, 'info');
        }
      }
    } catch (e) {
      console.warn('Could not load existing files from server:', e);
    }
  }

  bindEvents() {
    // 1. Upload File Button -> Triggers native file selection
    if (this.btnUpload) {
      this.btnUpload.addEventListener('click', (e) => {
        e.preventDefault();
        this.uploader.triggerFilePicker();
      });
    }

    // 2. Add More Button -> Triggers file selection and appends to existing files
    if (this.btnAddMore) {
      this.btnAddMore.addEventListener('click', (e) => {
        e.preventDefault();
        this.uploader.triggerFilePicker();
      });
    }

    // 3. Show Files Button -> Smoothly scrolls to gallery, pulses it, displays all files
    if (this.btnShowFiles) {
      this.btnShowFiles.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleShowFiles();
      });
    }

    // 4. Clear All Button -> Displays confirmation dialog
    if (this.btnClearAll) {
      this.btnClearAll.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleClearAllClick();
      });
    }

    // Clear Modal Cancel & Confirm
    if (this.clearModalCancel) {
      this.clearModalCancel.addEventListener('click', () => {
        this.hideClearModal();
      });
    }

    if (this.clearModalConfirm) {
      this.clearModalConfirm.addEventListener('click', () => {
        this.executeClearAll();
      });
    }

    if (this.clearModal) {
      this.clearModal.addEventListener('click', (e) => {
        if (e.target === this.clearModal) {
          this.hideClearModal();
        }
      });
    }

    // Empty state buttons
    const emptyUploadBtn = document.getElementById('empty-state-upload-btn');
    if (emptyUploadBtn) {
      emptyUploadBtn.addEventListener('click', () => {
        this.uploader.triggerFilePicker();
      });
    }

    const emptyDemoBtn = document.getElementById('empty-state-demo-btn');
    if (emptyDemoBtn) {
      emptyDemoBtn.addEventListener('click', () => {
        this.loadDemoFiles();
      });
    }

    // Filter Chips
    this.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.filterChips.forEach(c => c.classList.remove('active-filter'));
        chip.classList.add('active-filter');
        const filter = chip.getAttribute('data-filter') || 'all';
        State.setFilter(filter);
      });
    });

    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        State.setSearch(e.target.value);
      });
    }

    // Sort select
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        State.setSort(e.target.value);
      });
    }

    // View Mode Toggle (Grid vs List)
    if (this.btnViewGrid && this.btnViewList) {
      this.btnViewGrid.addEventListener('click', () => {
        State.setViewMode('grid');
        this.btnViewGrid.classList.add('active-view');
        this.btnViewList.classList.remove('active-view');
      });

      this.btnViewList.addEventListener('click', () => {
        State.setViewMode('list');
        this.btnViewList.classList.add('active-view');
        this.btnViewGrid.classList.remove('active-view');
      });
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.clearModal.classList.contains('hidden')) {
        this.hideClearModal();
      }
    });
  }

  subscribeState() {
    State.subscribe((state, event) => {
      this.render();
      if (event === 'files-added') {
        const count = state.getTotalCount();
        this.showToast(`Files added. Total collection: ${count} file${count === 1 ? '' : 's'}.`, 'info');
      }
    });
  }

  /**
   * Handle "Show Files" button action
   */
  handleShowFiles() {
    // Reset any search or category filter to show ALL files as requested
    State.setFilter('all');
    State.setSearch('');
    if (this.searchInput) this.searchInput.value = '';
    this.filterChips.forEach(c => {
      if (c.getAttribute('data-filter') === 'all') {
        c.classList.add('active-filter');
      } else {
        c.classList.remove('active-filter');
      }
    });

    // Smooth scroll to the gallery section
    if (this.gallerySection) {
      this.gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Gentle glow highlight animation
      this.gallerySection.classList.remove('gallery-highlight');
      void this.gallerySection.offsetWidth; // Reflow
      this.gallerySection.classList.add('gallery-highlight');
      setTimeout(() => {
        this.gallerySection.classList.remove('gallery-highlight');
      }, 1500);
    }

    const count = State.getTotalCount();
    if (count === 0) {
      this.showToast('No files uploaded yet. Select files to get started!', 'info');
    } else {
      this.showToast(`Displaying all ${count} file${count === 1 ? '' : 's'} in your gallery.`, 'success');
    }
  }

  /**
   * Open Clear All Confirmation Dialog
   */
  handleClearAllClick() {
    const count = State.getTotalCount();
    if (count === 0) {
      this.showToast('Your file collection is already empty.', 'info');
      return;
    }

    if (this.clearModalCountText) {
      this.clearModalCountText.textContent = `You are about to remove ${count} file${count === 1 ? '' : 's'} (${Utils.formatFileSize(State.getTotalBytes())}). This action cannot be undone.`;
    }

    this.clearModal.classList.remove('hidden');
    void this.clearModal.offsetWidth;
    this.clearModal.classList.remove('opacity-0');
    const modalBox = this.clearModal.querySelector('.modal-box');
    if (modalBox) {
      modalBox.classList.remove('scale-95');
      modalBox.classList.add('scale-100');
    }
  }

  hideClearModal() {
    this.clearModal.classList.add('opacity-0');
    const modalBox = this.clearModal.querySelector('.modal-box');
    if (modalBox) {
      modalBox.classList.remove('scale-100');
      modalBox.classList.add('scale-95');
    }
    setTimeout(() => {
      this.clearModal.classList.add('hidden');
    }, 200);
  }

  /**
   * Execute Clear All after user confirms
   */
  async executeClearAll() {
    this.hideClearModal();

    // Call backend DELETE endpoint if online
    if (State.isServerConnected) {
      try {
        await fetch(`${this.uploader.getBaseUrl()}/api/files`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Backend clear all error:', err);
      }
    }

    // Clear client state & revoke all object URLs
    State.clearAll();

    this.showToast('All files have been cleared from your collection.', 'success');
  }

  /**
   * Main Render function
   */
  render() {
    const totalCount = State.getTotalCount();
    const totalBytes = State.getTotalBytes();
    const filteredFiles = State.getFilteredFiles();

    // Update Counter Badges
    if (this.totalFilesBadge) {
      this.totalFilesBadge.textContent = `${totalCount} ${totalCount === 1 ? 'file' : 'files'}`;
    }
    if (this.totalStorageBadge) {
      this.totalStorageBadge.textContent = Utils.formatFileSize(totalBytes);
    }

    // Update Server Status Indicator
    if (this.serverStatusIndicator) {
      if (State.isServerConnected) {
        this.serverStatusIndicator.innerHTML = `
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Server Connected (Real Storage)
          </span>
        `;
      } else {
        this.serverStatusIndicator.innerHTML = `
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
            Local Browser Storage
          </span>
        `;
      }
    }

    // Toggle Empty State vs Files Container
    if (totalCount === 0) {
      if (this.emptyState) this.emptyState.classList.remove('hidden');
      if (this.filesContainer) this.filesContainer.innerHTML = '';
      if (this.btnAddMore) this.btnAddMore.classList.add('opacity-70');
      if (this.btnClearAll) this.btnClearAll.classList.add('opacity-50', 'pointer-events-none');
    } else {
      if (this.emptyState) this.emptyState.classList.add('hidden');
      if (this.btnAddMore) this.btnAddMore.classList.remove('opacity-70');
      if (this.btnClearAll) this.btnClearAll.classList.remove('opacity-50', 'pointer-events-none');

      if (filteredFiles.length === 0) {
        // Search/filter resulted in no files
        this.filesContainer.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-400">
            <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p class="text-base font-medium text-slate-600 dark:text-slate-300">No matching files found</p>
            <p class="text-xs text-slate-400 mt-1">Try adjusting your search query or category filter</p>
          </div>
        `;
      } else {
        if (State.viewMode === 'list') {
          this.renderListView(filteredFiles);
        } else {
          this.renderGridView(filteredFiles);
        }
      }
    }

    this.updateUploadProgressUI();
  }

  /**
   * Render files in Grid View (Individual Cards)
   */
  renderGridView(files) {
    this.filesContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5';
    this.filesContainer.innerHTML = '';

    files.forEach(file => {
      const card = document.createElement('div');
      card.className = 'file-card group relative bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1';
      card.setAttribute('data-id', file.id);

      const theme = Utils.getCategoryTheme(file.category);
      const isUploading = file.status === 'uploading' || file.status === 'processing';

      // Thumbnail content
      let previewMediaHTML = '';
      if (file.thumbnailUrl) {
        previewMediaHTML = `
          <div class="w-full h-44 overflow-hidden bg-slate-100 dark:bg-slate-900 relative flex items-center justify-center">
            <img src="${file.thumbnailUrl}" alt="${Utils.escapeHTML(file.name)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy">
            ${file.category === 'video' ? `
              <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span class="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5 ml-0.5 fill-current" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                </span>
              </div>
            ` : ''}
          </div>
        `;
      } else if (file.category === 'image' && file.previewUrl) {
        previewMediaHTML = `
          <div class="w-full h-44 overflow-hidden bg-slate-100 dark:bg-slate-900 relative flex items-center justify-center">
            <img src="${file.previewUrl}" alt="${Utils.escapeHTML(file.name)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy">
          </div>
        `;
      } else {
        // Icon thumbnail
        previewMediaHTML = `
          <div class="w-full h-44 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-850 flex flex-col items-center justify-center p-6 text-center border-b border-slate-100 dark:border-slate-700/50">
            <div class="w-16 h-16 rounded-2xl ${theme.bg} ${theme.accent} flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform duration-300">
              ${Utils.getFileIconSVG(file.category, file.extension, 'w-8 h-8')}
            </div>
            <span class="text-[11px] font-bold tracking-wider text-slate-400 uppercase">${file.category}</span>
          </div>
        `;
      }

      // Status Badge
      let statusBadgeHTML = '';
      if (file.status === 'uploaded') {
        statusBadgeHTML = `
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <svg class="w-3 h-3 mr-1 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Uploaded
          </span>
        `;
      } else if (isUploading) {
        statusBadgeHTML = `
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 animate-pulse">
            <svg class="w-3 h-3 mr-1 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ${file.progress}%
          </span>
        `;
      } else if (file.status === 'error') {
        statusBadgeHTML = `
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            Failed
          </span>
        `;
      } else {
        statusBadgeHTML = `
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            Ready
          </span>
        `;
      }

      card.innerHTML = `
        <!-- Card Thumbnail / Preview -->
        <div class="relative cursor-pointer card-thumbnail-trigger">
          ${previewMediaHTML}
          <!-- Extension Pill Overlay -->
          <div class="absolute top-3 left-3">
            <span class="px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-lg shadow-sm text-white ${theme.badgeBg}">
              ${file.extension || 'FILE'}
            </span>
          </div>

          <!-- Quick Action Buttons on Hover Overlay -->
          <div class="absolute top-3 right-3 flex items-center space-x-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            <button class="btn-card-preview p-2 rounded-xl bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-md hover:scale-105 transition-all" title="Preview File">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-card-download p-2 rounded-xl bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-md hover:scale-105 transition-all" title="Download File">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button class="btn-card-delete p-2 rounded-xl bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 shadow-md hover:scale-105 transition-all" title="Delete File">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <!-- Card Details -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate mb-1" title="${Utils.escapeHTML(file.name)}">
              ${Utils.escapeHTML(file.name)}
            </h4>
            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>${Utils.formatFileSize(file.size)}</span>
              <span>${Utils.formatDate(file.uploadedAt)}</span>
            </div>
          </div>

          <!-- Bottom Status & Actions -->
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <div class="flex items-center">
              ${statusBadgeHTML}
            </div>
            <div class="flex items-center space-x-1 text-slate-400">
              <button class="btn-card-preview text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1">
                View
              </button>
              <button class="btn-card-download text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline px-2 py-1">
                Download
              </button>
            </div>
          </div>
        </div>

        <!-- In-card Progress Bar (if uploading) -->
        ${isUploading ? `
          <div class="w-full bg-slate-100 h-1 overflow-hidden">
            <div class="bg-indigo-600 h-1 transition-all duration-300" style="width: ${file.progress}%"></div>
          </div>
        ` : ''}
      `;

      // Bind card interactions
      this.bindCardEvents(card, file);
      this.filesContainer.appendChild(card);
    });
  }

  /**
   * Render files in List View (Table / Rows)
   */
  renderListView(files) {
    this.filesContainer.className = 'flex flex-col space-y-2';
    this.filesContainer.innerHTML = '';

    files.forEach(file => {
      const row = document.createElement('div');
      row.className = 'group bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-3.5 flex items-center justify-between hover:shadow-md transition-all duration-200';
      row.setAttribute('data-id', file.id);

      const theme = Utils.getCategoryTheme(file.category);

      row.innerHTML = `
        <div class="flex items-center space-x-3.5 min-w-0 flex-1 mr-4">
          <!-- Thumbnail / Icon -->
          <div class="w-10 h-10 rounded-lg ${theme.bg} ${theme.accent} flex items-center justify-center flex-shrink-0">
            ${Utils.getFileIconSVG(file.category, file.extension, 'w-5 h-5')}
          </div>
          <!-- Name & Details -->
          <div class="min-w-0 truncate">
            <p class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title="${Utils.escapeHTML(file.name)}">
              ${Utils.escapeHTML(file.name)}
            </p>
            <div class="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span class="font-medium text-slate-500">${file.extension}</span>
              <span>•</span>
              <span>${Utils.formatFileSize(file.size)}</span>
              <span>•</span>
              <span>${Utils.formatDate(file.uploadedAt)}</span>
            </div>
          </div>
        </div>

        <!-- Status & Actions -->
        <div class="flex items-center space-x-4 flex-shrink-0">
          <span class="text-xs px-2.5 py-0.5 rounded-full font-medium ${file.status === 'uploaded' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}">
            ${file.status.toUpperCase()}
          </span>
          <div class="flex items-center space-x-1">
            <button class="btn-card-preview p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Preview">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-card-download p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Download">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button class="btn-card-delete p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Delete">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;

      this.bindCardEvents(row, file);
      this.filesContainer.appendChild(row);
    });
  }

  /**
   * Bind card buttons (preview, download, delete)
   */
  bindCardEvents(el, file) {
    const previewBtns = el.querySelectorAll('.btn-card-preview, .card-thumbnail-trigger');
    previewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.viewer.open(file.id);
      });
    });

    const downloadBtns = el.querySelectorAll('.btn-card-download');
    downloadBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.viewer.triggerDownload(file);
      });
    });

    const deleteBtns = el.querySelectorAll('.btn-card-delete');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        // Cancel active upload if in progress
        this.uploader.cancelUpload(file.id);

        // Delete from backend if online
        if (State.isServerConnected && file.id) {
          try {
            await fetch(`${this.uploader.getBaseUrl()}/api/files/${file.id}`, { method: 'DELETE' });
          } catch (err) {
            console.warn('Backend delete error:', err);
          }
        }

        // Remove from client state and revoke object URL
        State.removeFile(file.id);
        this.showToast(`"${file.name}" was removed`, 'info');
      });
    });
  }

  /**
   * Update active upload progress banner
   */
  updateUploadProgressUI() {
    if (!this.uploadProgressSection) return;

    const uploadingFiles = State.files.filter(f => f.status === 'uploading' || f.status === 'processing');

    if (uploadingFiles.length === 0) {
      this.uploadProgressSection.classList.add('hidden');
      return;
    }

    this.uploadProgressSection.classList.remove('hidden');

    const totalProgress = uploadingFiles.reduce((acc, f) => acc + (f.progress || 0), 0);
    const avgProgress = Math.round(totalProgress / uploadingFiles.length);

    if (this.uploadProgressBar) {
      this.uploadProgressBar.style.width = `${avgProgress}%`;
    }
    if (this.uploadProgressText) {
      this.uploadProgressText.textContent = `Uploading ${uploadingFiles.length} file${uploadingFiles.length === 1 ? '' : 's'} (${avgProgress}%)`;
    }
  }

  loadDemoFiles() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 800, 600);
    grad.addColorStop(0, '#4f46e5');
    grad.addColorStop(0.5, '#7c3aed');
    grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      ctx.arc((i * 97) % 800, (i * 73) % 600, (i % 5) * 15 + 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Project Banner Artwork', 400, 290);
    ctx.font = '18px sans-serif';
    ctx.fillText('High Definition Image Sample', 400, 335);

    const dataUrl = canvas.toDataURL('image/png');
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const imageFile = new File([ab], 'Project_Hero_Banner.png', { type: 'image/png', lastModified: Date.now() - 3600000 });

    const pdfString = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj
4 0 obj<</Length 55>>stream
BT /F1 24 Tf 70 700 Td (Annual Financial & Project Report 2026) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000102 00000 n 
0000000203 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
305
%%EOF`;
    const pdfFile = new File([pdfString], 'Quarterly_Executive_Report.pdf', { type: 'application/pdf', lastModified: Date.now() - 7200000 });

    const docText = `Project Specification & System Architecture
==============================================
1. System Summary: High performance File Management & Asset Processing
2. Security: Clean memory disposal and Object URL revocation
3. Formats: Supports Image, PDF, Video, Audio, Word, Excel, and Archive files
4. Verification: Automatic duplicate detection and size validation`;
    const docFile = new File([docText], 'System_Specification.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', lastModified: Date.now() - 14400000 });

    const sampleRate = 8000;
    const numSamples = Math.floor(sampleRate * 1.2);
    const audioBuf = new ArrayBuffer(44 + numSamples);
    const view = new DataView(audioBuf);
    const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true);
    view.setUint16(32, 1, true);
    view.setUint16(34, 8, true);
    writeStr(36, 'data');
    view.setUint32(40, numSamples, true);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const v = Math.floor(128 + 50 * Math.sin(2 * Math.PI * 523.25 * t));
      view.setUint8(44 + i, v);
    }
    const audioFile = new File([audioBuf], 'Chime_Soundtrack.wav', { type: 'audio/wav', lastModified: Date.now() - 28800000 });

    const zipBytes = new Uint8Array([0x50, 0x4b, 0x05, 0x06, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    const zipFile = new File([zipBytes], 'Deployment_Bundle_v1.zip', { type: 'application/zip', lastModified: Date.now() - 86400000 });

    this.uploader.processSelectedFiles([imageFile, pdfFile, docFile, audioFile, zipFile]);
    this.showToast('Demo files loaded successfully into your collection.', 'success');
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    const id = 'toast_' + Date.now();
    toast.id = id;

    let iconSVG = '';
    let borderClass = '';

    switch (type) {
      case 'success':
        borderClass = 'border-emerald-500 bg-emerald-950 text-white';
        iconSVG = `<svg class="w-5 h-5 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        break;
      case 'warning':
        borderClass = 'border-amber-500 bg-amber-950 text-white';
        iconSVG = `<svg class="w-5 h-5 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        break;
      case 'error':
        borderClass = 'border-rose-500 bg-rose-950 text-white';
        iconSVG = `<svg class="w-5 h-5 text-rose-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        break;
      default:
        borderClass = 'border-indigo-500 bg-slate-900 text-white';
        iconSVG = `<svg class="w-5 h-5 text-indigo-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.className = `flex items-center space-x-3 px-4 py-3 rounded-xl shadow-xl border-l-4 ${borderClass} transition-all duration-300 transform translate-y-3 opacity-0 max-w-sm pointer-events-auto`;
    toast.innerHTML = `
      ${iconSVG}
      <p class="text-xs font-medium leading-relaxed truncate">${Utils.escapeHTML(message)}</p>
    `;

    this.toastContainer.appendChild(toast);

    // Animate in
    const raf = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
    raf(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
    });

    // Auto remove after 3.8s
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => {
        if (toast.remove) {
          toast.remove();
        } else if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3800);
  }
}

// Bootstrap application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
