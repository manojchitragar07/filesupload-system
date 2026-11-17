# File Manager - Backend

Modular Python REST API server providing file uploads, disk persistence, and static frontend hosting.

## 📁 Architecture & Structure

```
backend/
├── server.py            # Multithreaded HTTP server and REST API handler
├── config.py            # Central configuration (Host, Port, Max size, Paths)
├── requirements.txt     # Dependency list (Zero external dependencies required)
└── uploads/             # Physical persistent storage for uploaded files
    └── .metadata.json   # Persistent metadata database
```

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | Server health check, active file count, and storage size |
| `GET` | `/api/files` | Lists all uploaded files with metadata |
| `POST` | `/api/upload` | Multipart form-data upload for one or multiple files |
| `DELETE` | `/api/files/<id>` | Deletes an individual file from disk and updates metadata |
| `DELETE` | `/api/files` | Clears all uploaded files from disk |
| `GET` | `/uploads/<filename>` | Streams file directly from disk |

## 🚀 How to Run the Backend
```bash
cd backend
python3 server.py
# Or specify a custom port:
python3 server.py 8000
```
Server runs at: `http://127.0.0.1:8000/` and automatically serves the frontend from `../frontend`.
