/**
 * Central State Management for File Manager
 * Handles file collection, object URL lifecycle, duplicate detection,
 * filtering, sorting, and reactive subscriptions.
 */

import { Utils } from './utils.js';

class StateManager {
  constructor() {
    this.files = [];
    this.subscribers = new Set();
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.sortBy = 'date-desc';
    this.viewMode = 'grid'; // 'grid' | 'list'
    this.galleryActive = true;
    this.isServerConnected = false;
  }

  /**
   * Subscribe a listener callback to state changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all registered subscribers
   */
  notify(event = 'change') {
    for (const callback of this.subscribers) {
      try {
        callback(this, event);
      } catch (err) {
        console.error('Subscriber callback error:', err);
      }
    }
  }

  /**
   * Check if a file is already in the collection (duplicate detection)
   */
  isDuplicate(file) {
    const name = file.name;
    const size = file.size;
    return this.files.some(f => f.name === name && f.size === size);
  }

  /**
   * Add new files to the existing collection (used by Upload File and Add More)
   * Returns: { added: Array, duplicates: Array, rejected: Array }
   */
  addFiles(rawFileList, initialStatus = 'ready') {
    const added = [];
    const duplicates = [];
    const rejected = [];
    const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250 MB limit

    const filesArray = Array.from(rawFileList);

    for (const file of filesArray) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        rejected.push({
          file,
          reason: `File "${file.name}" exceeds the 250MB limit (${Utils.formatFileSize(file.size)})`
        });
        continue;
      }

      // Check for duplicate
      if (this.isDuplicate(file)) {
        duplicates.push(file);
        continue;
      }

      // Create local object URL for preview
      let previewUrl = '';
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (e) {
        console.warn('Could not create Object URL for file:', file.name, e);
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
        thumbnailUrl: null, // Populated asynchronously for video/pdf/image
        status: initialStatus,
        progress: initialStatus === 'uploaded' ? 100 : 0,
        errorMessage: null,
        uploadedAt: file.lastModified || Date.now(),
        serverUrl: null
      };

      this.files.push(fileItem);
      added.push(fileItem);

      // Asynchronously generate rich thumbnails
      this.generateAsyncThumbnail(fileItem);
    }

    if (added.length > 0) {
      this.notify('files-added');
    }

    return { added, duplicates, rejected };
  }

  /**
   * Asynchronously generate preview thumbnails (for videos, PDFs, images)
   */
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
        console.warn('Video thumb generation error:', err);
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
        console.warn('PDF thumb generation error:', err);
      }
    }
  }

  /**
   * Add files already persisted on backend server to local state
   */
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

  /**
   * Update properties of a specific file
   */
  updateFile(id, patch) {
    const file = this.files.find(f => f.id === id);
    if (file) {
      Object.assign(file, patch);
      this.notify('file-updated');
    }
  }

  /**
   * Remove a single file from the collection and revoke its Object URL
   */
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

  /**
   * Clear all files from the collection and revoke all Object URLs
   */
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

  /**
   * Get all files or filtered & sorted files
   */
  getFilteredFiles() {
    let result = [...this.files];

    // Filter by Category
    if (this.activeFilter !== 'all') {
      result = result.filter(f => f.category === this.activeFilter);
    }

    // Search Query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.extension.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }

    // Sorting
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

  /**
   * Return total count of files
   */
  getTotalCount() {
    return this.files.length;
  }

  /**
   * Return total bytes of all files
   */
  getTotalBytes() {
    return this.files.reduce((sum, f) => sum + (f.size || 0), 0);
  }

  /**
   * Set filter category
   */
  setFilter(category) {
    this.activeFilter = category;
    this.notify('filter-changed');
  }

  /**
   * Set search query
   */
  setSearch(query) {
    this.searchQuery = query;
    this.notify('search-changed');
  }

  /**
   * Set sort criteria
   */
  setSort(sortBy) {
    this.sortBy = sortBy;
    this.notify('sort-changed');
  }

  /**
   * Set view mode ('grid' | 'list')
   */
  setViewMode(mode) {
    this.viewMode = mode;
    this.notify('view-changed');
  }

  /**
   * Set server connection status
   */
  setServerStatus(connected) {
    this.isServerConnected = connected;
    this.notify('server-status');
  }
}

export const State = new StateManager();
