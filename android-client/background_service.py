"""
Android Background Service & Socket Listener
File: android-client/background_service.py
"""

import time
import json
import socket
import threading
from typing import Callable, Optional, Dict, Any

NOTIFICATION_CHANNEL_ID = "channel_pqc_token_mesh_9898048483"
FOREGROUND_SERVICE_ID = 989804

class AndroidTokenBackgroundService:
    def __init__(
        self,
        listen_host: str = "127.0.0.1",
        listen_port: int = 18989,
        on_token_received_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    ):
        self.listen_host = listen_host
        self.listen_port = listen_port
        self.on_token_received_callback = on_token_received_callback
        self.is_running = False
        self.server_socket: Optional[socket.socket] = None
        self.thread: Optional[threading.Thread] = None

    def start_p2p_socket_listener(self) -> None:
        self.is_running = True
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind((self.listen_host, self.listen_port))
        self.server_socket.listen(5)

        self.thread = threading.Thread(target=self._listen_loop, daemon=True)
        self.thread.start()

    def _listen_loop(self) -> None:
        while self.is_running and self.server_socket:
            try:
                client_sock, _ = self.server_socket.accept()
                data = client_sock.recv(4096)
                if data:
                    payload = json.loads(data.decode("utf-8"))
                    if self.on_token_received_callback:
                        self.on_token_received_callback(payload)
                    resp = json.dumps({"status": "SUCCESS", "ack": True})
                    client_sock.sendall(resp.encode("utf-8"))
                client_sock.close()
            except Exception:
                break

    def stop_service(self) -> None:
        self.is_running = False
        if self.server_socket:
            try:
                self.server_socket.close()
            except Exception:
                pass
            self.server_socket = None
