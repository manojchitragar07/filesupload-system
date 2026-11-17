"""
Backend Configuration for File Manager Server
"""

import os
from pathlib import Path

# Paths
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
UPLOADS_DIR = BACKEND_DIR / "uploads"
METADATA_FILE = UPLOADS_DIR / ".metadata.json"

# Server Network Settings
HOST = os.environ.get("FILE_MANAGER_HOST", "127.0.0.1")
PORT = int(os.environ.get("FILE_MANAGER_PORT", 8000))

# Upload Constraints
MAX_FILE_SIZE = 250 * 1024 * 1024  # 250 MB
ALLOWED_ORIGINS = ["*"]

# Ensure directories exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
