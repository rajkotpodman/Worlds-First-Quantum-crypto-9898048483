"""
Runtime Application Self-Protection (RASP) Manager
File: android-client/rasp_manager.py
"""

from typing import List, Any

class RaspManager:
    def __init__(self):
        self._registered_buffers: List[Any] = []

    def register_secure_key_buffer(self, key_buffer: Any) -> None:
        self._registered_buffers.append(key_buffer)
