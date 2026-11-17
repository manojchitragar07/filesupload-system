/**
 * My File Manager - Standalone Application Bundle
 * Supports both HTTP web servers and direct file:// protocol in all browsers
 * Includes Utils, StateManager, FileViewer, UploaderEngine, and App Controller.
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. UTILS MODULE
  // =========================================================================
  const Utils = {
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B';
      if (!bytes || isNaN(bytes)) return 'Unknown';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)) + ' ' + sizes[i];
    },

    formatDate(timestamp) {
      if (!timestamp) return 'Just now';
      const date = new Date(timestamp);
      const now = new Date();
      const diffSeconds = Math.floor((now - date) / 1000);

      if (diffSeconds < 60) return 'Just now';
      if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
      if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    },

    getFileExtension(filename) {
      if (!filename || typeof filename !== 'string') return '';
      const parts = filename.split('.');
      return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
    },

    getFileCategory(file) {
      const mime = (file.type || '').toLowerCase();
      const ext = this.getFileExtension(file.name).toLowerCase();

      if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico', 'avif'].includes(ext)) {
        return 'image';
      }
      if (mime === 'application/pdf' || ext === 'pdf') {
        return 'pdf';
      }
      if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv'].includes(ext)) {
        return 'video';
      }
      if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)) {
        return 'audio';
      }
      if (mime.includes('word') || mime.includes('officedocument') || ['doc', 'docx', 'rtf', 'odt'].includes(ext)) {
        return 'document';
      }
      if (mime.includes('spreadsheet') || mime.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) {
        return 'spreadsheet';
      }
      if (mime.includes('presentation') || mime.includes('powerpoint') || ['ppt', 'pptx'].includes(ext)) {
        return 'presentation';
      }
      if (mime.includes('zip') || mime.includes('compressed') || mime.includes('tar') || ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
        return 'archive';
      }
      if (mime.includes('text') || mime.includes('javascript') || mime.includes('json') || ['txt', 'md', 'html', 'css', 'js', 'json', 'py', 'ts', 'jsx', 'tsx', 'xml', 'yaml', 'yml'].includes(ext)) {
        return 'text';
      }
      return 'other';
    },

    getCategoryTheme(category) {
      switch (category) {
        case 'image':
          return {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            accent: 'text-emerald-600',
            badgeBg: 'bg-emerald-500',
            pill: 'bg-emerald-100 text-emerald-800'
          };
        case 'pdf':
          return {
            bg: 'bg-rose-50 text-rose-700 border-rose-200',
            accent: 'text-rose-600',
            badgeBg: 'bg-rose-500',
            pill: 'bg-rose-100 text-rose-800'
          };
        case 'video':
          return {
            bg: 'bg-purple-50 text-purple-700 border-purple-200',
            accent: 'text-purple-600',
            badgeBg: 'bg-purple-500',
            pill: 'bg-purple-100 text-purple-800'
          };
        case 'audio':
          return {
            bg: 'bg-amber-50 text-amber-700 border-amber-200',
            accent: 'text-amber-600',
            badgeBg: 'bg-amber-500',
            pill: 'bg-amber-100 text-amber-800'
          };
        case 'document':
          return {
            bg: 'bg-blue-50 text-blue-700 border-blue-200',
            accent: 'text-blue-600',
            badgeBg: 'bg-blue-500',
            pill: 'bg-blue-100 text-blue-800'
          };
        case 'spreadsheet':
          return {
            bg: 'bg-teal-50 text-teal-700 border-teal-200',
            accent: 'text-teal-600',
            badgeBg: 'bg-teal-500',
            pill: 'bg-teal-100 text-teal-800'
          };
        case 'presentation':
          return {
            bg: 'bg-orange-50 text-orange-700 border-orange-200',
            accent: 'text-orange-600',
            badgeBg: 'bg-orange-500',
            pill: 'bg-orange-100 text-orange-800'
          };
        case 'archive':
          return {
            bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            accent: 'text-indigo-600',
            badgeBg: 'bg-indigo-500',
            pill: 'bg-indigo-100 text-indigo-800'
          };
        case 'text':
          return {
            bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
            accent: 'text-cyan-600',
            badgeBg: 'bg-cyan-500',
            pill: 'bg-cyan-100 text-cyan-800'
          };
        default:
          return {
            bg: 'bg-slate-50 text-slate-700 border-slate-200',
            accent: 'text-slate-600',
            badgeBg: 'bg-slate-500',
            pill: 'bg-slate-100 text-slate-800'
          };
      }
    },

    getFileIconSVG(category, ext, className = 'w-10 h-10') {
      switch (category) {
        case 'image':
          return `
            <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>`;
        case 'pdf':
          return `
            <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <path d="M10 12H8v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z"/>
              <path d="M16 12h-2v6"/>
            </svg>`;
        case 'video':
          return `
            <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="14" x="3" y="5" rx="2" ry="2"/>
              <polygon points="10 9 15 12 10 15 10 9" fill="currentColor"/>
            </svg>`;
        case 'audio':
          return `
            <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>`;
        case 'document':
          return `
            <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>`;
        case 'spreadsheet':
          return `
            <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="15" y1="3" x2="15" y2="21"/>
            </svg>`;
        case 'archive':
          return `
            <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="21 8 21 21 3 21 3 8"/>
              <rect width="22" height="5" x="1" y="3" rx="1"/>
              <line x1="10" y1="12" x2="14" y2="12"/>
            </svg>`;
        case 'text':
          return `
            <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>`;
        default:
          return `
            <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>`;
      }
    },

    escapeHTML(str) {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    generateVideoThumbnail(videoSrc) {
      return new Promise((resolve) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.src = videoSrc;

        let resolved = false;

        const finish = (result) => {
          if (!resolved) {
            resolved = true;
            video.remove();
            resolve(result);
          }
        };

        const timeoutId = setTimeout(() => finish(null), 3000);

        video.addEventListener('loadeddata', () => {
          try {
            video.currentTime = Math.min(1.0, (video.duration || 1) / 2);
          } catch {
            finish(null);
          }
        });

        video.addEventListener('seeked', () => {
          clearTimeout(timeoutId);
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 320;
            let w = video.videoWidth || 320;
            let h = video.videoHeight || 180;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, w, h);
            finish(canvas.toDataURL('image/jpeg', 0.85));
          } catch {
            finish(null);
          }
        });

        video.addEventListener('error', () => {
          clearTimeout(timeoutId);
          finish(null);
        });
      });
    },

    async generatePDFThumbnail(fileOrBlob) {
      if (typeof window.pdfjsLib === 'undefined') return null;
      try {
        const arrayBuffer = await fileOrBlob.arrayBuffer();
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        return canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('PDF thumbnail generation failed:', e);
        return null;
      }
    }
  };

  // =========================================================================
  // 2. STATE MANAGER MODULE
  // =========================================================================
  class StateManager {
    constructor() {
      this.files = [];
      this.subscribers = new Set();
      this.activeFilter = 'all';
      this.searchQuery = '';
      this.sortBy = 'date-desc';
      this.viewMode = 'grid';
      this.isServerConnected = false;
    }

    subscribe(callback) {
      this.subscribers.add(callback);
      return () => this.subscribers.delete(callback);
    }

    notify(event = 'change') {
      for (const callback of this.subscribers) {
        try {
          callback(this, event);
        } catch (err) {
          console.error('Subscriber error:', err);
        }
      }
    }

    isDuplicate(file) {
      return this.files.some(f => f.name === file.name && f.size === file.size);
    }

    addFiles(rawFileList, initialStatus = 'ready') {
      const added = [];
      const duplicates = [];
      const rejected = [];
      const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250 MB limit

      const filesArray = Array.from(rawFileList);

      for (const file of filesArray) {
        if (file.size > MAX_FILE_SIZE) {
          rejected.push({
            file,
            reason: `File "${file.name}" exceeds 250MB limit (${Utils.formatFileSize(file.size)})`
          });
          continue;
        }

        if (this.isDuplicate(file)) {
          duplicates.push(file);
          continue;
        }

        let previewUrl = '';
        try {
          previewUrl = URL.createObjectURL(file);
        } catch (e) {
          console.warn('Could not create Object URL for:', file.name, e);
        }

        const ext = Utils.getFileExtension(file.name);
        const category = Utils.getFileCategory(file);
        const id = 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

        const fileItem = {
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          extension: ext,
          category,
          previewUrl,
          thumbnailUrl: null,
          status: initialStatus,
          progress: initialStatus === 'uploaded' ? 100 : 0,
          errorMessage: null,
          uploadedAt: file.lastModified || Date.now(),
          serverUrl: null
        };

        this.files.push(fileItem);
        added.push(fileItem);

        this.generateAsyncThumbnail(fileItem);
      }

      if (added.length > 0) {
        this.notify('files-added');
      }

      return { added, duplicates, rejected };
    }

    async generateAsyncThumbnail(fileItem) {
      if (!fileItem.previewUrl && !fileItem.file) return;

      if (fileItem.category === 'image') {
        fileItem.thumbnailUrl = fileItem.previewUrl;
        this.notify('thumbnail-ready');
        return;
      }

      if (fileItem.category === 'video' && fileItem.previewUrl) {
        try {
          const thumb = await Utils.generateVideoThumbnail(fileItem.previewUrl);
          if (thumb) {
            fileItem.thumbnailUrl = thumb;
            this.notify('thumbnail-ready');
          }
        } catch (err) {
          console.warn('Video thumb error:', err);
        }
        return;
      }

      if (fileItem.category === 'pdf' && fileItem.file) {
        try {
          const thumb = await Utils.generatePDFThumbnail(fileItem.file);
          if (thumb) {
            fileItem.thumbnailUrl = thumb;
            this.notify('thumbnail-ready');
          }
        } catch (err) {
          console.warn('PDF thumb error:', err);
        }
      }
    }

    addServerFiles(serverFilesList) {
      let addedCount = 0;
      for (const item of serverFilesList) {
        if (this.files.some(f => f.id === item.id || f.name === item.name)) {
          continue;
        }
        const category = Utils.getFileCategory({ name: item.name, type: item.mimeType });
        const fileItem = {
          id: item.id,
          file: null,
          name: item.name,
          size: item.size,
          type: item.mimeType || 'application/octet-stream',
          extension: (item.extension || Utils.getFileExtension(item.name)).toUpperCase(),
          category,
          previewUrl: item.url,
          thumbnailUrl: category === 'image' ? item.url : null,
          status: 'uploaded',
          progress: 100,
          errorMessage: null,
          uploadedAt: item.uploadedAt || Date.now(),
          serverUrl: item.url
        };
        this.files.push(fileItem);
        addedCount++;
      }
      if (addedCount > 0) {
        this.notify('files-added');
      }
    }

    updateFile(id, patch) {
      const file = this.files.find(f => f.id === id);
      if (file) {
        Object.assign(file, patch);
        this.notify('file-updated');
      }
    }

    removeFile(id) {
      const index = this.files.findIndex(f => f.id === id);
      if (index !== -1) {
        const removed = this.files.splice(index, 1)[0];
        if (removed.previewUrl) {
          try {
            URL.revokeObjectURL(removed.previewUrl);
          } catch (e) {
            console.warn('Error revoking Object URL:', e);
          }
        }
        this.notify('file-removed');
        return removed;
      }
      return null;
    }

    clearAll() {
      for (const file of this.files) {
        if (file.previewUrl) {
          try {
            URL.revokeObjectURL(file.previewUrl);
          } catch (e) {
            console.warn('Error revoking Object URL:', e);
          }
        }
      }
      this.files = [];
      this.notify('cleared');
    }

    getFilteredFiles() {
      let result = [...this.files];

      if (this.activeFilter !== 'all') {
        result = result.filter(f => f.category === this.activeFilter);
      }

      if (this.searchQuery.trim()) {
        const q = this.searchQuery.trim().toLowerCase();
        result = result.filter(f =>
          f.name.toLowerCase().includes(q) ||
          f.extension.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
        );
      }

      result.sort((a, b) => {
        switch (this.sortBy) {
          case 'date-desc':
            return (b.uploadedAt || 0) - (a.uploadedAt || 0);
          case 'date-asc':
            return (a.uploadedAt || 0) - (b.uploadedAt || 0);
          case 'name-asc':
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
          case 'name-desc':
            return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
          case 'size-desc':
            return b.size - a.size;
          case 'size-asc':
            return a.size - b.size;
          default:
            return 0;
        }
      });

      return result;
    }

    getTotalCount() {
      return this.files.length;
    }

    getTotalBytes() {
      return this.files.reduce((sum, f) => sum + (f.size || 0), 0);
    }

    setFilter(category) {
      this.activeFilter = category;
      this.notify('filter-changed');
    }

    setSearch(query) {
      this.searchQuery = query;
      this.notify('search-changed');
    }

    setSort(sortBy) {
      this.sortBy = sortBy;
      this.notify('sort-changed');
    }

    setViewMode(mode) {
      this.viewMode = mode;
      this.notify('view-changed');
    }

    setServerStatus(connected) {
      this.isServerConnected = connected;
      this.notify('server-status');
    }
  }

  const State = new StateManager();

  // =========================================================================
  // 3. FILE VIEWER LIGHTBOX MODULE
  // =========================================================================
  class FileViewer {
    constructor() {
      this.modal = null;
      this.currentFileIndex = -1;
      this.activeFiles = [];
      this.initDOM();
      this.bindEvents();
    }

    initDOM() {
      let existing = document.getElementById('file-preview-modal');
      if (existing) {
        this.modal = existing;
        return;
      }

      const modalHTML = `
        <div id="file-preview-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 opacity-0" role="dialog" aria-modal="true">
          <div class="relative w-full max-w-5xl h-[90vh] mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-transform duration-300 scale-95" id="preview-modal-container">
            
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div class="flex items-center space-x-3 overflow-hidden mr-4">
                <span id="preview-type-badge" class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 flex-shrink-0">
                  FILE
                </span>
                <div class="truncate">
                  <h3 id="preview-file-name" class="text-base font-semibold text-slate-900 dark:text-slate-100 truncate" title="">
                    Filename
                  </h3>
                  <p id="preview-file-meta" class="text-xs text-slate-500 dark:text-slate-400">
                    Size • Status
                  </p>
                </div>
              </div>

              <div class="flex items-center space-x-2 flex-shrink-0">
                <button id="preview-download-btn" class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Download File">
                  <svg class="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Download</span>
                </button>

                <button id="preview-close-btn" class="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" aria-label="Close preview">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <div id="preview-body" class="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50 dark:bg-slate-950/40 relative">
            </div>

            <button id="preview-prev-btn" class="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition hover:scale-105" aria-label="Previous file">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button id="preview-next-btn" class="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition hover:scale-105" aria-label="Next file">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>

            <div class="px-6 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400 flex items-center justify-between">
              <span id="preview-index-counter">File 1 of 1</span>
              <div class="flex items-center space-x-2">
                <kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">ESC</kbd>
                <span>close</span>
                <kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] ml-2">← / →</kbd>
                <span>navigate</span>
              </div>
            </div>

          </div>
        </div>
      `;

      const div = document.createElement('div');
      div.innerHTML = modalHTML;
      document.body.appendChild(div.firstElementChild);
      this.modal = document.getElementById('file-preview-modal');
    }

    bindEvents() {
      const closeBtn = document.getElementById('preview-close-btn');
      const prevBtn = document.getElementById('preview-prev-btn');
      const nextBtn = document.getElementById('preview-next-btn');
      const downloadBtn = document.getElementById('preview-download-btn');

      if (closeBtn) closeBtn.addEventListener('click', () => this.close());
      if (prevBtn) prevBtn.addEventListener('click', () => this.navigate(-1));
      if (nextBtn) nextBtn.addEventListener('click', () => this.navigate(1));

      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
          const file = this.activeFiles[this.currentFileIndex];
          if (file) this.triggerDownload(file);
        });
      }

      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.close();
      });

      window.addEventListener('keydown', (e) => {
        if (this.modal.classList.contains('hidden')) return;
        if (e.key === 'Escape') this.close();
        else if (e.key === 'ArrowLeft') this.navigate(-1);
        else if (e.key === 'ArrowRight') this.navigate(1);
      });
    }

    open(fileId, fileList = null) {
      this.activeFiles = fileList || State.getFilteredFiles();
      this.currentFileIndex = this.activeFiles.findIndex(f => f.id === fileId);

      if (this.currentFileIndex === -1 && this.activeFiles.length > 0) {
        this.currentFileIndex = 0;
      }

      if (this.currentFileIndex === -1) return;

      this.renderCurrentFile();

      this.modal.classList.remove('hidden');
      void this.modal.offsetWidth;
      this.modal.classList.remove('opacity-0');
      const container = document.getElementById('preview-modal-container');
      if (container) {
        container.classList.remove('scale-95');
        container.classList.add('scale-100');
      }

      document.body.classList.add('overflow-hidden');
    }

    close() {
      this.modal.classList.add('opacity-0');
      const container = document.getElementById('preview-modal-container');
      if (container) {
        container.classList.remove('scale-100');
        container.classList.add('scale-95');
      }

      setTimeout(() => {
        this.modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        const body = document.getElementById('preview-body');
        if (body) body.innerHTML = '';
      }, 250);
    }

    navigate(dir) {
      if (this.activeFiles.length <= 1) return;
      this.currentFileIndex = (this.currentFileIndex + dir + this.activeFiles.length) % this.activeFiles.length;
      this.renderCurrentFile();
    }

    renderCurrentFile() {
      const file = this.activeFiles[this.currentFileIndex];
      if (!file) return;

      const nameEl = document.getElementById('preview-file-name');
      const metaEl = document.getElementById('preview-file-meta');
      const badgeEl = document.getElementById('preview-type-badge');
      const counterEl = document.getElementById('preview-index-counter');
      const body = document.getElementById('preview-body');

      nameEl.textContent = file.name;
      nameEl.title = file.name;
      metaEl.textContent = `${Utils.formatFileSize(file.size)} • Status: ${file.status.toUpperCase()} • ${Utils.formatDate(file.uploadedAt)}`;
      badgeEl.textContent = file.extension || 'FILE';

      const theme = Utils.getCategoryTheme(file.category);
      badgeEl.className = `px-2.5 py-0.5 text-xs font-semibold rounded-full ${theme.pill} flex-shrink-0`;

      counterEl.textContent = `File ${this.currentFileIndex + 1} of ${this.activeFiles.length}`;

      const prevBtn = document.getElementById('preview-prev-btn');
      const nextBtn = document.getElementById('preview-next-btn');
      if (prevBtn && nextBtn) {
        if (this.activeFiles.length <= 1) {
          prevBtn.classList.add('hidden');
          nextBtn.classList.add('hidden');
        } else {
          prevBtn.classList.remove('hidden');
          nextBtn.classList.remove('hidden');
        }
      }

      body.innerHTML = '';
      const srcUrl = file.previewUrl || file.serverUrl;

      if (file.category === 'image' && srcUrl) {
        body.innerHTML = `
          <div class="relative max-w-full max-h-full flex items-center justify-center p-2">
            <img src="${srcUrl}" alt="${Utils.escapeHTML(file.name)}" class="max-w-full max-h-[70vh] rounded-lg object-contain shadow-md transition-transform duration-200 select-none">
          </div>
        `;
      } else if (file.category === 'pdf' && srcUrl) {
        body.innerHTML = `
          <div class="w-full h-full flex flex-col items-center">
            <iframe src="${srcUrl}#toolbar=1" class="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-700 bg-white" title="${Utils.escapeHTML(file.name)}">
              <p>Embedded PDF not supported. Please download file.</p>
            </iframe>
          </div>
        `;
      } else if (file.category === 'video' && srcUrl) {
        body.innerHTML = `
          <div class="w-full max-w-4xl max-h-[70vh] flex items-center justify-center">
            <video controls autoplay class="w-full max-h-[70vh] rounded-xl shadow-lg bg-black" src="${srcUrl}">
              HTML5 video not supported.
            </video>
          </div>
        `;
      } else if (file.category === 'audio' && srcUrl) {
        body.innerHTML = `
          <div class="p-8 max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
            <div class="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              ${Utils.getFileIconSVG('audio', file.extension, 'w-10 h-10')}
            </div>
            <h4 class="font-semibold text-slate-900 dark:text-slate-100 mb-1 truncate">${Utils.escapeHTML(file.name)}</h4>
            <p class="text-xs text-slate-500 mb-6">${Utils.formatFileSize(file.size)}</p>
            <audio controls autoplay class="w-full" src="${srcUrl}">
              HTML5 audio not supported.
            </audio>
          </div>
        `;
      } else if (file.category === 'text' && file.file) {
        const reader = new FileReader();
        body.innerHTML = `<div class="p-6 text-slate-500 text-sm">Loading text preview...</div>`;
        reader.onload = (e) => {
          body.innerHTML = `
            <div class="w-full h-full max-h-[70vh] p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl overflow-auto border border-slate-800 shadow-inner">
              <pre class="whitespace-pre-wrap">${Utils.escapeHTML(e.target.result)}</pre>
            </div>
          `;
        };
        reader.onerror = () => this.renderFallbackPreview(file, body);
        reader.readAsText(file.file.slice(0, 100000));
      } else {
        this.renderFallbackPreview(file, body);
      }
    }

    renderFallbackPreview(file, container) {
      const theme = Utils.getCategoryTheme(file.category);
      container.innerHTML = `
        <div class="p-10 max-w-lg w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
          <div class="w-24 h-24 mx-auto rounded-2xl ${theme.bg} ${theme.accent} flex items-center justify-center mb-6 shadow-sm">
            ${Utils.getFileIconSVG(file.category, file.extension, 'w-12 h-12')}
          </div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 break-all">${Utils.escapeHTML(file.name)}</h4>
          <div class="flex items-center justify-center space-x-2 my-3">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${theme.pill}">${file.extension}</span>
            <span class="text-sm text-slate-500">• ${Utils.formatFileSize(file.size)}</span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Preview is not directly displayable inline for this file type. You can download and view it with your system default app.
          </p>
          <button id="fallback-download-btn" class="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md transition hover:scale-102">
            <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download File
          </button>
        </div>
      `;

      const btn = document.getElementById('fallback-download-btn');
      if (btn) btn.addEventListener('click', () => this.triggerDownload(file));
    }

    triggerDownload(file) {
      const url = file.previewUrl || file.serverUrl;
      if (!url) return;

      const a = document.createElement('a');
      a.href = url;
      a.download = file.name || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  // =========================================================================
  // 4. UPLOADER ENGINE MODULE
  // =========================================================================
  class UploaderEngine {
    constructor(options = {}) {
      this.dropZone = options.dropZone;
      this.fileInput = options.fileInput;
      this.onProgressUpdate = options.onProgressUpdate || (() => {});
      this.onUploadComplete = options.onUploadComplete || (() => {});
      this.onError = options.onError || (() => {});
      this.onDuplicate = options.onDuplicate || (() => {});
      this.activeUploads = new Map();
      this.serverBase = window.location.protocol.startsWith('http') ? '' : 'http://127.0.0.1:8000';

      this.initEvents();
    }

    getBaseUrl() {
      return this.serverBase;
    }

    initEvents() {
      if (!this.dropZone || !this.fileInput) return;

      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.processSelectedFiles(e.target.files);
          this.fileInput.value = '';
        }
      });

      const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };

      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        this.dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        this.dropZone.addEventListener(eventName, () => {
          this.dropZone.classList.add('drag-active');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        this.dropZone.addEventListener(eventName, () => {
          this.dropZone.classList.remove('drag-active');
        }, false);
      });

      this.dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
          this.processSelectedFiles(dt.files);
        }
      });

      this.dropZone.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        this.triggerFilePicker();
      });
    }

    triggerFilePicker() {
      if (this.fileInput) {
        this.fileInput.click();
      }
    }

    async processSelectedFiles(fileList) {
      const { added, duplicates, rejected } = State.addFiles(fileList, 'uploading');

      if (duplicates.length > 0) {
        this.onDuplicate(duplicates);
      }

      if (rejected.length > 0) {
        this.onError(rejected);
      }

      if (added.length > 0) {
        for (const item of added) {
          this.startUpload(item);
        }
      }
    }

    async checkServerConnection() {
      try {
        const res = await fetch(`${this.getBaseUrl()}/api/status`, { method: 'GET', cache: 'no-cache' });
        if (res.ok) {
          State.setServerStatus(true);
          return true;
        }
      } catch {
        // Offline / standalone
      }
      State.setServerStatus(false);
      return false;
    }

    async startUpload(fileItem) {
      const isOnline = await this.checkServerConnection();
      if (isOnline) {
        this.uploadToServer(fileItem);
      } else {
        this.uploadClientSide(fileItem);
      }
    }

    uploadToServer(fileItem) {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', fileItem.file, fileItem.name);

      this.activeUploads.set(fileItem.id, xhr);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          State.updateFile(fileItem.id, {
            progress: percent,
            status: percent >= 100 ? 'processing' : 'uploading'
          });
          this.onProgressUpdate(fileItem, percent, e.loaded, e.total);
        }
      });

      xhr.addEventListener('load', () => {
        this.activeUploads.delete(fileItem.id);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const resp = JSON.parse(xhr.responseText);
            const uploadedFile = resp.files && resp.files[0];
            State.updateFile(fileItem.id, {
              status: 'uploaded',
              progress: 100,
              serverUrl: uploadedFile ? uploadedFile.url : null
            });
            this.onUploadComplete(fileItem);
          } catch {
            State.updateFile(fileItem.id, { status: 'uploaded', progress: 100 });
            this.onUploadComplete(fileItem);
          }
        } else {
          State.updateFile(fileItem.id, {
            status: 'error',
            errorMessage: `Server error: ${xhr.statusText || xhr.status}`
          });
        }
      });

      xhr.addEventListener('error', () => {
        this.activeUploads.delete(fileItem.id);
        this.uploadClientSide(fileItem);
      });

      xhr.addEventListener('abort', () => {
        this.activeUploads.delete(fileItem.id);
      });

      xhr.open('POST', `${this.getBaseUrl()}/api/upload`, true);
      xhr.send(formData);
    }

    uploadClientSide(fileItem) {
      const file = fileItem.file;
      if (!file) {
        State.updateFile(fileItem.id, { status: 'uploaded', progress: 100 });
        return;
      }

      const totalBytes = file.size;
      let loadedBytes = 0;
      const chunkSize = Math.max(64 * 1024, Math.floor(totalBytes / 20));
      let offset = 0;

      const readNextChunk = () => {
        if (!State.files.some(f => f.id === fileItem.id)) return;

        const slice = file.slice(offset, offset + chunkSize);
        const reader = new FileReader();

        reader.onload = (e) => {
          loadedBytes += e.target.result.byteLength;
          offset += chunkSize;

          const percent = totalBytes > 0 ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100)) : 100;
          State.updateFile(fileItem.id, {
            progress: percent,
            status: percent >= 100 ? 'uploaded' : 'uploading'
          });
          this.onProgressUpdate(fileItem, percent, loadedBytes, totalBytes);

          if (offset < totalBytes) {
            setTimeout(readNextChunk, 40);
          } else {
            State.updateFile(fileItem.id, { status: 'uploaded', progress: 100 });
            this.onUploadComplete(fileItem);
          }
        };

        reader.onerror = () => {
          State.updateFile(fileItem.id, {
            status: 'error',
            errorMessage: 'Failed reading file from device'
          });
        };

        reader.readAsArrayBuffer(slice);
      };

      readNextChunk();
    }

    cancelUpload(fileId) {
      if (this.activeUploads.has(fileId)) {
        const xhr = this.activeUploads.get(fileId);
        try {
          xhr.abort();
        } catch (e) {
          console.warn('Error aborting upload:', e);
        }
        this.activeUploads.delete(fileId);
      }
    }
  }

  // =========================================================================
  // 5. APPLICATION CONTROLLER MODULE
  // =========================================================================
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
      this.btnUpload = document.getElementById('btn-upload-file');
      this.btnAddMore = document.getElementById('btn-add-more');
      this.btnShowFiles = document.getElementById('btn-show-files');
      this.btnClearAll = document.getElementById('btn-clear-all');

      this.fileInput = document.getElementById('file-input');
      this.dropZone = document.getElementById('drop-zone');

      this.totalFilesBadge = document.getElementById('total-files-badge');
      this.totalStorageBadge = document.getElementById('total-storage-badge');
      this.serverStatusIndicator = document.getElementById('server-status-indicator');

      this.uploadSection = document.getElementById('upload-section');
      this.gallerySection = document.getElementById('gallery-section');
      this.filesContainer = document.getElementById('files-container');
      this.emptyState = document.getElementById('empty-state');
      this.uploadProgressSection = document.getElementById('upload-progress-section');
      this.uploadProgressBar = document.getElementById('overall-progress-bar');
      this.uploadProgressText = document.getElementById('upload-progress-text');

      this.filterChips = document.querySelectorAll('.filter-chip');
      this.searchInput = document.getElementById('search-input');
      this.sortSelect = document.getElementById('sort-select');
      this.btnViewGrid = document.getElementById('btn-view-grid');
      this.btnViewList = document.getElementById('btn-view-list');

      this.clearModal = document.getElementById('clear-modal');
      this.clearModalCancel = document.getElementById('clear-modal-cancel');
      this.clearModalConfirm = document.getElementById('clear-modal-confirm');
      this.clearModalCountText = document.getElementById('clear-modal-count-text');

      this.toastContainer = document.getElementById('toast-container');
    }

    initUploader() {
      this.uploader = new UploaderEngine({
        dropZone: this.dropZone,
        fileInput: this.fileInput,
        onProgressUpdate: () => this.updateUploadProgressUI(),
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
      if (this.btnUpload) {
        this.btnUpload.addEventListener('click', (e) => {
          e.preventDefault();
          this.uploader.triggerFilePicker();
        });
      }

      if (this.btnAddMore) {
        this.btnAddMore.addEventListener('click', (e) => {
          e.preventDefault();
          this.uploader.triggerFilePicker();
        });
      }

      if (this.btnShowFiles) {
        this.btnShowFiles.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleShowFiles();
        });
      }

      if (this.btnClearAll) {
        this.btnClearAll.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleClearAllClick();
        });
      }

      if (this.clearModalCancel) {
        this.clearModalCancel.addEventListener('click', () => this.hideClearModal());
      }

      if (this.clearModalConfirm) {
        this.clearModalConfirm.addEventListener('click', () => this.executeClearAll());
      }

      if (this.clearModal) {
        this.clearModal.addEventListener('click', (e) => {
          if (e.target === this.clearModal) this.hideClearModal();
        });
      }

      const emptyUploadBtn = document.getElementById('empty-state-upload-btn');
      if (emptyUploadBtn) {
        emptyUploadBtn.addEventListener('click', () => this.uploader.triggerFilePicker());
      }

      const emptyDemoBtn = document.getElementById('empty-state-demo-btn');
      if (emptyDemoBtn) {
        emptyDemoBtn.addEventListener('click', () => this.loadDemoFiles());
      }

      this.filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
          this.filterChips.forEach(c => c.classList.remove('active-filter'));
          chip.classList.add('active-filter');
          const filter = chip.getAttribute('data-filter') || 'all';
          State.setFilter(filter);
        });
      });

      if (this.searchInput) {
        this.searchInput.addEventListener('input', (e) => State.setSearch(e.target.value));
      }

      if (this.sortSelect) {
        this.sortSelect.addEventListener('change', (e) => State.setSort(e.target.value));
      }

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

    handleShowFiles() {
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

      if (this.gallerySection) {
        this.gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.gallerySection.classList.remove('gallery-highlight');
        void this.gallerySection.offsetWidth;
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

    async executeClearAll() {
      this.hideClearModal();

      if (State.isServerConnected) {
        try {
          await fetch(`${this.uploader.getBaseUrl()}/api/files`, { method: 'DELETE' });
        } catch (err) {
          console.warn('Backend clear all error:', err);
        }
      }

      State.clearAll();
      this.showToast('All files have been cleared from your collection.', 'success');
    }

    render() {
      const totalCount = State.getTotalCount();
      const totalBytes = State.getTotalBytes();
      const filteredFiles = State.getFilteredFiles();

      if (this.totalFilesBadge) {
        this.totalFilesBadge.textContent = `${totalCount} ${totalCount === 1 ? 'file' : 'files'}`;
      }
      if (this.totalStorageBadge) {
        this.totalStorageBadge.textContent = Utils.formatFileSize(totalBytes);
      }

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

    renderGridView(files) {
      this.filesContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5';
      this.filesContainer.innerHTML = '';

      files.forEach(file => {
        const card = document.createElement('div');
        card.className = 'file-card group relative bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1';
        card.setAttribute('data-id', file.id);

        const theme = Utils.getCategoryTheme(file.category);
        const isUploading = file.status === 'uploading' || file.status === 'processing';

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
          previewMediaHTML = `
            <div class="w-full h-44 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-850 flex flex-col items-center justify-center p-6 text-center border-b border-slate-100 dark:border-slate-700/50">
              <div class="w-16 h-16 rounded-2xl ${theme.bg} ${theme.accent} flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform duration-300">
                ${Utils.getFileIconSVG(file.category, file.extension, 'w-8 h-8')}
              </div>
              <span class="text-[11px] font-bold tracking-wider text-slate-400 uppercase">${file.category}</span>
            </div>
          `;
        }

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
          <div class="relative cursor-pointer card-thumbnail-trigger">
            ${previewMediaHTML}
            <div class="absolute top-3 left-3">
              <span class="px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-lg shadow-sm text-white ${theme.badgeBg}">
                ${file.extension || 'FILE'}
              </span>
            </div>

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

          ${isUploading ? `
            <div class="w-full bg-slate-100 h-1 overflow-hidden">
              <div class="bg-indigo-600 h-1 transition-all duration-300" style="width: ${file.progress}%"></div>
            </div>
          ` : ''}
        `;

        this.bindCardEvents(card, file);
        this.filesContainer.appendChild(card);
      });
    }

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
            <div class="w-10 h-10 rounded-lg ${theme.bg} ${theme.accent} flex items-center justify-center flex-shrink-0">
              ${Utils.getFileIconSVG(file.category, file.extension, 'w-5 h-5')}
            </div>
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
          this.uploader.cancelUpload(file.id);

          if (State.isServerConnected && file.id) {
            try {
              await fetch(`${this.uploader.getBaseUrl()}/api/files/${file.id}`, { method: 'DELETE' });
            } catch (err) {
              console.warn('Backend delete error:', err);
            }
          }

          State.removeFile(file.id);
          this.showToast(`"${file.name}" was removed`, 'info');
        });
      });
    }

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
      // Create high-res PNG image
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

      // Create PDF
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

      // Create Document
      const docText = `Project Specification & System Architecture
==============================================
1. System Summary: High performance File Management & Asset Processing
2. Security: Clean memory disposal and Object URL revocation
3. Formats: Supports Image, PDF, Video, Audio, Word, Excel, and Archive files
4. Verification: Automatic duplicate detection and size validation`;
      const docFile = new File([docText], 'System_Specification.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', lastModified: Date.now() - 14400000 });

      // Create Audio WAV
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

      // Create ZIP Archive
      const zipBytes = new Uint8Array([0x50, 0x4b, 0x05, 0x06, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
      const zipFile = new File([zipBytes], 'Deployment_Bundle_v1.zip', { type: 'application/zip', lastModified: Date.now() - 86400000 });

      this.uploader.processSelectedFiles([imageFile, pdfFile, docFile, audioFile, zipFile]);
      this.showToast('Demo files loaded successfully into your collection.', 'success');
    }

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

      const raf = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
      raf(() => {
        toast.classList.remove('translate-y-3', 'opacity-0');
      });

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

  // Expose globals for debugging/testing
  window.FileManager = {
    Utils,
    State,
    FileViewer,
    UploaderEngine,
    App
  };

  // Initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.app = new App();
    });
  } else {
    window.app = new App();
  }
})();
