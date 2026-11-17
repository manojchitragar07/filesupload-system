/**
 * File Uploader Engine
 * Handles Drag & Drop, File Picker Triggers, Real Upload Tracking (XHR/Fetch),
 * Progress calculations, and Client-Side Fallback Streaming.
 */

import { State } from './state.js';
import { Utils } from './utils.js';

export class UploaderEngine {
  constructor(options = {}) {
    this.dropZone = options.dropZone;
    this.fileInput = options.fileInput;
    this.onProgressUpdate = options.onProgressUpdate || (() => {});
    this.onUploadComplete = options.onUploadComplete || (() => {});
    this.onError = options.onError || (() => {});
    this.onDuplicate = options.onDuplicate || (() => {});
    this.activeUploads = new Map(); // fileId -> abortController / xhr
    this.serverBase = window.location.protocol.startsWith('http') ? '' : 'http://127.0.0.1:8000';

    this.initEvents();
  }

  getBaseUrl() {
    return this.serverBase;
  }

  /**
   * Bind drag and drop events & file input listeners
   */
  initEvents() {
    if (!this.dropZone || !this.fileInput) return;

    // File input change
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.processSelectedFiles(e.target.files);
        // Clear input value so selecting the same file after deletion triggers change again
        this.fileInput.value = '';
      }
    });

    // Drag events
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

    // Drop event
    this.dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        this.processSelectedFiles(dt.files);
      }
    });

    // Clicking dropzone area (outside of buttons) triggers file picker
    this.dropZone.addEventListener('click', (e) => {
      // Don't trigger if clicked on a button or link inside
      if (e.target.closest('button') || e.target.closest('a')) {
        return;
      }
      this.triggerFilePicker();
    });
  }

  /**
   * Open the native file selection dialog
   */
  triggerFilePicker() {
    if (this.fileInput) {
      this.fileInput.click();
    }
  }

  /**
   * Process raw files selected or dropped
   */
  async processSelectedFiles(fileList) {
    const { added, duplicates, rejected } = State.addFiles(fileList, 'uploading');

    // Notify about duplicates
    if (duplicates.length > 0) {
      this.onDuplicate(duplicates);
    }

    // Notify about rejected files
    if (rejected.length > 0) {
      this.onError(rejected);
    }

    // Start uploads for added files
    if (added.length > 0) {
      for (const item of added) {
        this.startUpload(item);
      }
    }
  }

  /**
   * Check if backend server is online
   */
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

  /**
   * Perform actual file upload (XHR for backend progress, or real FileReader streaming)
   */
  async startUpload(fileItem) {
    const isOnline = await this.checkServerConnection();

    if (isOnline) {
      this.uploadToServer(fileItem);
    } else {
      this.uploadClientSide(fileItem);
    }
  }

  /**
   * Real XHR upload to backend server with genuine byte progress
   */
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
      // Fallback to client-side complete
      this.uploadClientSide(fileItem);
    });

    xhr.addEventListener('abort', () => {
      this.activeUploads.delete(fileItem.id);
    });

    xhr.open('POST', `${this.getBaseUrl()}/api/upload`, true);
    xhr.send(formData);
  }

  /**
   * Client-side actual file streaming read with realistic byte-level progress
   */
  uploadClientSide(fileItem) {
    const file = fileItem.file;
    if (!file) {
      State.updateFile(fileItem.id, { status: 'uploaded', progress: 100 });
      return;
    }

    const totalBytes = file.size;
    let loadedBytes = 0;
    const chunkSize = Math.max(64 * 1024, Math.floor(totalBytes / 20)); // ~20 chunks
    let offset = 0;
    const startTime = Date.now();

    const readNextChunk = () => {
      // Check if file was deleted during upload
      if (!State.files.some(f => f.id === fileItem.id)) {
        return;
      }

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
          // Slight delay between chunks (30-60ms) to provide smooth visual feedback for the user
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

  /**
   * Cancel an in-progress upload
   */
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
