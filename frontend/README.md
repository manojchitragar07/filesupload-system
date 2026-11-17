# File Manager - Frontend

The client-side single page application (SPA) built with modern JavaScript (ES6+), HTML5, and Tailwind CSS.

## 📁 Architecture & Structure

```
frontend/
├── index.html           # Main dashboard UI structure
├── css/
│   └── styles.css       # Custom styles, animations, scrollbars & glassmorphism
└── js/
    ├── app.js           # Main controller, event bindings & UI orchestration
    ├── state.js         # Reactive StateManager (pub/sub pattern)
    ├── uploader.js      # Drag-and-drop & upload engine (XHR + chunk streaming)
    ├── viewer.js        # File preview modal & lightbox (Images, PDF, Video, Audio)
    ├── utils.js         # Size formatting, mime detection, SVG icons & thumbnails
    └── bundle.js        # Universal self-contained browser bundle
```

## 🚀 How to Run the Frontend Separately
- **Direct Launch:** Double-click `index.html` or open it directly in any web browser (`file:///.../frontend/index.html`).
- **Via Static Server:**
  ```bash
  # Example with python http.server
  cd frontend
  python3 -m http.server 3000
  ```
- **Backend Auto-Discovery:** If the backend is running at `http://127.0.0.1:8000`, the frontend automatically connects to it via CORS, enabling server upload and physical disk storage.
