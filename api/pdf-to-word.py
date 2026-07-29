"""
Vercel serverless function: real PDF -> Word conversion using pdf2docx.

Unlike the client-side pdf-to-word-converter tool (which only reads text
position/size to approximate paragraphs and headings), this endpoint uses
pdf2docx (built on PyMuPDF) to do actual document layout analysis: tables,
images, and multi-column text are preserved far more faithfully. This is
the trade-off explicitly discussed with the site owner: better output
quality in exchange for uploading the file to a server, clearly disclosed
in the tool's UI copy.

Request:  POST raw PDF bytes as the request body (no multipart wrapper).
Response: raw .docx bytes, or a small JSON error body on failure.

Known limits on the Vercel Hobby plan (as of this writing):
- 10 second hard execution timeout -> very large/complex PDFs may time out.
- Python function bundle cap of 500 MB uncompressed (pdf2docx + PyMuPDF are
  well within this).
If this becomes a bottleneck, raising `maxDuration` requires a Pro plan
(see vercel.json).
"""

import json
import os
import tempfile
import traceback
from http.server import BaseHTTPRequestHandler

MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB; keeps conversions inside the 10s Hobby timeout for typical PDFs.

# Origins allowed to call this endpoint directly (basic hygiene, not a security boundary).
ALLOWED_ORIGINS = {
    "https://adawaty-five.vercel.app",
    "https://abdelaziz-maysara-hm.github.io",
}


def _cors_headers(origin):
    if origin in ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    return {}


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        origin = self.headers.get("Origin", "")
        self.send_response(204)
        for key, value in _cors_headers(origin).items():
            self.send_header(key, value)
        self.end_headers()

    def _send_json_error(self, status, message_ar, message_en, origin):
        body = json.dumps({"error": {"ar": message_ar, "en": message_en}}).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        for key, value in _cors_headers(origin).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        origin = self.headers.get("Origin", "")
        content_length = int(self.headers.get("Content-Length", 0))

        if content_length <= 0:
            self._send_json_error(400, "لم يتم استلام أي ملف.", "No file was received.", origin)
            return
        if content_length > MAX_UPLOAD_BYTES:
            self._send_json_error(
                413,
                "الملف كبير جدًا. الحد الأقصى حاليًا 15 ميجابايت.",
                "The file is too large. The current limit is 15 MB.",
                origin,
            )
            return

        pdf_bytes = self.rfile.read(content_length)
        if pdf_bytes[:4] != b"%PDF":
            self._send_json_error(400, "الملف ليس PDF صالحًا.", "The file is not a valid PDF.", origin)
            return

        input_path = None
        output_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as input_file:
                input_file.write(pdf_bytes)
                input_path = input_file.name
            output_path = input_path.replace(".pdf", ".docx")

            from pdf2docx import Converter

            converter = Converter(input_path)
            try:
                converter.convert(output_path)
            finally:
                converter.close()

            with open(output_path, "rb") as result_file:
                docx_bytes = result_file.read()

            self.send_response(200)
            self.send_header(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
            self.send_header("Content-Disposition", 'attachment; filename="converted.docx"')
            for key, value in _cors_headers(origin).items():
                self.send_header(key, value)
            self.end_headers()
            self.wfile.write(docx_bytes)
        except Exception:
            traceback.print_exc()
            self._send_json_error(
                500,
                "تعذّر تحويل هذا الملف. جرّب ملفًا آخر أو استخدم أداة التحويل المحلية.",
                "Could not convert this file. Try a different PDF or use the local conversion tool.",
                origin,
            )
        finally:
            for path in (input_path, output_path):
                if path and os.path.exists(path):
                    os.remove(path)
