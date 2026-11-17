/**
 * File Preview Modal & Lightbox
 * Provides interactive full-screen previews for Images, PDFs, Videos,
 * Audio, Text/Code, and other documents with keyboard navigation.
 */

import { Utils } from './utils.js';
import { State } from './state.js';

export class FileViewer {
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
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div class="flex items-center space-x-3 overflow-hidden mr-4">
              <span id="preview-type-badge" class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 flex-shrink-0">
                PDF
              </span>
              <div class="truncate">
                <h3 id="preview-file-name" class="text-base font-semibold text-slate-900 dark:text-slate-100 truncate" title="">
                  Filename.ext
                </h3>
                <p id="preview-file-meta" class="text-xs text-slate-500 dark:text-slate-400">
                  1.2 MB • Uploaded Just now
                </p>
              </div>
            </div>

            <!-- Header Actions -->
            <div class="flex items-center space-x-2 flex-shrink-0">
              <!-- Download Button -->
              <button id="preview-download-btn" class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Download File">
                <svg class="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Download</span>
              </button>

              <!-- Close Button -->
              <button id="preview-close-btn" class="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" aria-label="Close preview">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Modal Body Content -->
          <div id="preview-body" class="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50 dark:bg-slate-950/40 relative">
            <!-- Dynamic Content Injected Here -->
          </div>

          <!-- Navigation Chevrons -->
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

          <!-- Modal Footer with status -->
          <div class="px-6 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400 flex items-center justify-between">
            <span id="preview-index-counter">File 1 of 5</span>
            <div class="flex items-center space-x-2">
              <kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">ESC</kbd>
              <span>to close</span>
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
        if (file) {
          this.triggerDownload(file);
        }
      });
    }

    // Backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (this.modal.classList.contains('hidden')) return;

      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowLeft') {
        this.navigate(-1);
      } else if (e.key === 'ArrowRight') {
        this.navigate(1);
      }
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

    // Show modal with animation
    this.modal.classList.remove('hidden');
    // Force reflow
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

    // Prev/next buttons visibility
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

    // Render body content according to category
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
            <p>Your browser does not support embedded PDFs. Please download to view.</p>
          </iframe>
        </div>
      `;
    } else if (file.category === 'video' && srcUrl) {
      body.innerHTML = `
        <div class="w-full max-w-4xl max-h-[70vh] flex items-center justify-center">
          <video controls autoplay class="w-full max-h-[70vh] rounded-xl shadow-lg bg-black" src="${srcUrl}">
            Your browser does not support HTML5 video.
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
            Your browser does not support HTML5 audio.
          </audio>
        </div>
      `;
    } else if (file.category === 'text' && file.file) {
      // Read text snippet
      const reader = new FileReader();
      body.innerHTML = `<div class="p-6 text-slate-500 text-sm">Loading text preview...</div>`;
      reader.onload = (e) => {
        const text = e.target.result;
        body.innerHTML = `
          <div class="w-full h-full max-h-[70vh] p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl overflow-auto border border-slate-800 shadow-inner">
            <pre class="whitespace-pre-wrap">${Utils.escapeHTML(text)}</pre>
          </div>
        `;
      };
      reader.onerror = () => {
        this.renderFallbackPreview(file, body);
      };
      reader.readAsText(file.file.slice(0, 100000)); // preview up to 100KB
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
          This file format does not have an inline browser preview. You can download and open it with your device's default application.
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
    if (btn) {
      btn.addEventListener('click', () => this.triggerDownload(file));
    }
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
