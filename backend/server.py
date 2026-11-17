#!/usr/bin/env python3
"""
My File Manager - Backend Server
Modular REST API server with disk persistence and static frontend delivery.
"""

import sys
import json
import time
import email
import mimetypes
import urllib.parse
from http import HTTPStatus
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

# Import local configuration
import config

mimetypes.init()
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/pdf", ".pdf")

def load_metadata():
    if config.METADATA_FILE.exists():
        try:
            with open(config.METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_metadata(meta):
    try:
        with open(config.METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving metadata: {e}", file=sys.stderr)


class FileManagerAPIHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Default directory is FRONTEND_DIR so index.html, css/, js/ are served directly
        super().__init__(*args, directory=str(config.FRONTEND_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def _send_json(self, data, status=HTTPStatus.OK):
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)
        try:
            self.wfile.flush()
        except Exception:
            pass

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 1. API: Server Health & Metrics
        if path == "/api/status":
            meta = load_metadata()
            files_count = len(meta)
            total_bytes = sum(item.get("size", 0) for item in meta.values())
            self._send_json({
                "status": "online",
                "filesCount": files_count,
                "totalBytes": total_bytes,
                "storagePath": str(config.UPLOADS_DIR),
                "serverTime": int(time.time() * 1000)
            })
            return

        # 2. API: List all uploaded files
        if path == "/api/files":
            meta = load_metadata()
            files_list = list(meta.values())
            files_list.sort(key=lambda x: x.get("uploadedAt", 0), reverse=True)
            self._send_json({
                "success": True,
                "count": len(files_list),
                "files": files_list
            })
            return

        # 3. Serve physical uploads from backend/uploads/
        if path.startswith("/uploads/"):
            filename = path[len("/uploads/"):]
            # Prevent directory traversal attacks
            safe_filename = Path(filename).name
            file_path = config.UPLOADS_DIR / safe_filename

            if file_path.exists() and file_path.is_file():
                self._serve_file(file_path)
            else:
                self._send_json({"error": "File not found"}, status=HTTPStatus.NOT_FOUND)
            return

        # 4. Otherwise, serve static frontend assets (index.html, js, css)
        return super().do_GET()

    def _serve_file(self, file_path: Path):
        try:
            content_type, _ = mimetypes.guess_type(str(file_path))
            if not content_type:
                content_type = "application/octet-stream"

            file_size = file_path.stat().st_size
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(file_size))
            self.end_headers()

            with open(file_path, "rb") as f:
                while chunk := f.read(64 * 1024):
                    self.wfile.write(chunk)
            self.wfile.flush()
        except Exception as e:
            print(f"Error streaming file: {e}", file=sys.stderr)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/upload":
            self._handle_upload()
            return

        self._send_json({"error": "Endpoint not found"}, status=HTTPStatus.NOT_FOUND)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Clear All: DELETE /api/files
        if path == "/api/files":
            meta = load_metadata()
            deleted_count = 0
            for item in list(meta.values()):
                saved_name = item.get("savedName")
                if saved_name:
                    file_path = config.UPLOADS_DIR / saved_name
                    if file_path.exists() and file_path.is_file():
                        try:
                            file_path.unlink()
                            deleted_count += 1
                        except Exception as e:
                            print(f"Failed to delete {file_path}: {e}")
            save_metadata({})
            self._send_json({
                "success": True,
                "message": "All files cleared successfully from disk",
                "deletedCount": deleted_count
            })
            return

        # Delete single file: DELETE /api/files/<file_id_or_name>
        if path.startswith("/api/files/"):
            target_id = path[len("/api/files/"):]
            meta = load_metadata()
            found_key = None

            for key, item in meta.items():
                if key == target_id or item.get("id") == target_id or item.get("savedName") == target_id:
                    found_key = key
                    break

            if found_key:
                item = meta.pop(found_key)
                save_metadata(meta)
                saved_name = item.get("savedName")
                if saved_name:
                    file_path = config.UPLOADS_DIR / saved_name
                    if file_path.exists() and file_path.is_file():
                        try:
                            file_path.unlink()
                        except Exception as e:
                            print(f"Error removing file from disk: {e}")
                self._send_json({
                    "success": True,
                    "message": f"File '{item.get('name')}' deleted successfully",
                    "file": item
                })
            else:
                self._send_json({"error": "File not found"}, status=HTTPStatus.NOT_FOUND)
            return

        self._send_json({"error": "Endpoint not found"}, status=HTTPStatus.NOT_FOUND)

    def _handle_upload(self):
        content_type = self.headers.get("Content-Type", "")
        if not content_type.startswith("multipart/form-data"):
            self._send_json({"error": "Expected multipart/form-data"}, status=HTTPStatus.BAD_REQUEST)
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
        except (ValueError, TypeError):
            self._send_json({"error": "Invalid Content-Length"}, status=HTTPStatus.BAD_REQUEST)
            return

        if content_length <= 0:
            self._send_json({"error": "Empty request body"}, status=HTTPStatus.BAD_REQUEST)
            return

        raw_body = self.rfile.read(content_length)

        msg_bytes = f"Content-Type: {content_type}\r\n\r\n".encode("utf-8") + raw_body
        parsed_msg = email.message_from_bytes(msg_bytes)

        meta = load_metadata()
        uploaded_files = []

        for part in parsed_msg.walk():
            filename = part.get_filename()
            if not filename:
                continue

            raw_filename = Path(filename).name
            payload = part.get_payload(decode=True)
            if payload is None:
                continue

            file_size = len(payload)
            mime_type = part.get_content_type()
            if not mime_type or mime_type == "application/octet-stream":
                guessed, _ = mimetypes.guess_type(raw_filename)
                if guessed:
                    mime_type = guessed

            timestamp = int(time.time() * 1000)
            stem = Path(raw_filename).stem[:50]
            ext = Path(raw_filename).suffix
            safe_stem = "".join(c for c in stem if c.isalnum() or c in ("-", "_")).strip() or "file"
            file_id = f"f_{timestamp}_{len(uploaded_files)+1}"
            saved_name = f"{safe_stem}_{timestamp}_{len(uploaded_files)+1}{ext}"

            dest_path = config.UPLOADS_DIR / saved_name
            with open(dest_path, "wb") as f:
                f.write(payload)

            file_info = {
                "id": file_id,
                "name": raw_filename,
                "savedName": saved_name,
                "size": file_size,
                "mimeType": mime_type or "application/octet-stream",
                "extension": ext.lstrip(".").lower(),
                "uploadedAt": timestamp,
                "url": f"/uploads/{saved_name}"
            }

            meta[file_id] = file_info
            uploaded_files.append(file_info)

        save_metadata(meta)

        self._send_json({
            "success": True,
            "message": f"Successfully uploaded {len(uploaded_files)} file(s)",
            "files": uploaded_files
        }, status=HTTPStatus.CREATED if uploaded_files else HTTPStatus.OK)


def run_server(port=None):
    if port is None:
        port = config.PORT
    server_address = (config.HOST, port)
    httpd = ThreadingHTTPServer(server_address, FileManagerAPIHandler)
    print(f"✓ File Manager Server running at http://{config.HOST}:{port}/")
    print(f"✓ Serving frontend from: {config.FRONTEND_DIR}")
    print(f"✓ Storing uploads in:    {config.UPLOADS_DIR}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer gracefully stopped.")
    finally:
        httpd.server_close()

if __name__ == "__main__":
    port = config.PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
