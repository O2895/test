#!/usr/bin/env python3
"""
Simple HTTP server for the Ask God website
Serves static files and handles CORS for Ollama connection
"""

import http.server
import socketserver
import os

PORT = 8080

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow Ollama API calls
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

# Change to the directory containing the website files
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = CORSRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"✨ Ask God server running at http://localhost:{PORT}")
    print(f"🌐 Access from other devices: http://YOUR_IP_ADDRESS:{PORT}")
    print(f"⚡ Make sure Ollama is running on this machine!")
    print(f"\n🛑 Press Ctrl+C to stop the server\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✨ Server stopped. Divine service ended.")

