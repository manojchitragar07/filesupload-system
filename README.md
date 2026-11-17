# My File Manager

A modern, responsive **File Upload & Display Management Website** with a clean, premium UI and fully functional file management capabilities.

The project is structured systematically into dedicated **`frontend/`** and **`backend/`** architectures.

---

## 📁 Systematic Project Structure

```
upload/
├── frontend/                     # CLIENT-SIDE APPLICATION
│   ├── index.html                # Modern dashboard layout & UI structure
│   ├── css/
│   │   └── styles.css            # Custom styling, animations & glassmorphism
│   ├── js/
│   │   ├── app.js                # Main application coordinator
│   │   ├── state.js              # Central reactive StateManager
│   │   ├── uploader.js           # Drag-and-drop & upload engine
│   │   ├── viewer.js             # File preview modal & lightbox
│   │   ├── utils.js              # Format detectors, size formatters & SVG icons
│   │   └── bundle.js             # Universal self-contained browser bundle
│   └── README.md                 # Frontend documentation
│
├── backend/                      # SERVER-SIDE REST API
│   ├── server.py                 # Multi-threaded Python server & API handlers
│   ├── config.py                 # Central configuration (Host, Port, Max size)
│   ├── requirements.txt          # Python dependency specifications
│   ├── uploads/                  # Physical persistent storage directory for uploaded files
│   │   └── .metadata.json        # Persistent metadata store
│   └── README.md                 # Backend API documentation
│
├── start.sh                      # One-click startup script
└── README.md                     # Root project documentation
```

---

## 🚀 Quick Start Guide

### Option 1: One-Click Startup Script (Recommended)
From the root workspace directory:
```bash
./start.sh
```
Open **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)** in your browser.

### Option 2: Running Backend Directly
```bash
cd backend
python3 server.py 8000
```
The backend automatically hosts the REST API at `/api/...`, serves physical uploads from `backend/uploads/`, and delivers the static frontend from `frontend/`.

### Option 3: Running Frontend Separately
- **Direct browser opening:** Double-click [`frontend/index.html`](file:///Users/manojchitragar/Desktop/tpppp/upload/frontend/index.html) in Chrome, Safari, Firefox, or Edge.
- **Independent static server:**
  ```bash
  cd frontend
  python3 -m http.server 3000
  ```
  The frontend automatically auto-detects the backend at `http://127.0.0.1:8000/` via CORS. If the backend is running, uploads are saved to disk; if offline, it functions seamlessly in browser memory.

---

## ⚡ Core Features & Capabilities

1. **Upload File**: Select and upload multiple files (JPG, PNG, SVG, PDF, DOCX, MP4, ZIP, XLSX, WAV, etc.) with real-time transfer progress bars.
2. **+ Add More**: Add more files without replacing previously added files.
3. **Show Files**: Displays the complete collection in a responsive card gallery with previews, thumbnails, sizes, and status badges.
4. **Interactive Lightbox**: Fullscreen preview modal for images, embedded PDFs, video playback, audio waveforms, and code/text snippets.
5. **Clear All**: Confirmation dialog before permanently removing all files from disk and revoking memory-safe Object URLs.
6. **Duplicate Prevention**: Automatically detects and skips duplicate files by checking matching names and byte sizes.
