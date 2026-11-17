/**
 * Utility functions for File Upload & Display Management
 * Handles format conversion, size formatting, file type detection,
 * SVG icons, and duplicate verification.
 */

export const Utils = {
  /**
   * Format file size in human-readable units (Bytes, KB, MB, GB)
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    if (!bytes || isNaN(bytes)) return 'Unknown';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)) + ' ' + sizes[i];
  },

  /**
   * Format timestamp into a clean relative or localized string
   */
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

  /**
   * Get clean file extension in uppercase
   */
  getFileExtension(filename) {
    if (!filename || typeof filename !== 'string') return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
  },

  /**
   * Determine file category: image, pdf, video, audio, document, archive, code, other
   */
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
    if (
      mime.includes('word') ||
      mime.includes('officedocument') ||
      ['doc', 'docx', 'rtf', 'odt'].includes(ext)
    ) {
      return 'document';
    }
    if (
      mime.includes('spreadsheet') ||
      mime.includes('excel') ||
      ['xls', 'xlsx', 'csv'].includes(ext)
    ) {
      return 'spreadsheet';
    }
    if (
      mime.includes('presentation') ||
      mime.includes('powerpoint') ||
      ['ppt', 'pptx'].includes(ext)
    ) {
      return 'presentation';
    }
    if (
      mime.includes('zip') ||
      mime.includes('compressed') ||
      mime.includes('tar') ||
      ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)
    ) {
      return 'archive';
    }
    if (
      mime.includes('text') ||
      mime.includes('javascript') ||
      mime.includes('json') ||
      ['txt', 'md', 'html', 'css', 'js', 'json', 'py', 'ts', 'jsx', 'tsx', 'xml', 'yaml', 'yml'].includes(ext)
    ) {
      return 'text';
    }
    return 'other';
  },

  /**
   * Get category color theme for badges and borders
   */
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

  /**
   * Return high quality SVG icon based on category or file extension
   */
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

  /**
   * Escape HTML to prevent XSS
   */
  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Generate video thumbnail from a video File or URL
   */
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

      const timeoutId = setTimeout(() => {
        finish(null);
      }, 3000);

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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          finish(dataUrl);
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

  /**
   * Render first page of PDF using PDF.js or Canvas
   */
  async generatePDFThumbnail(fileOrBlob) {
    if (typeof window.pdfjsLib === 'undefined') {
      return null;
    }
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
