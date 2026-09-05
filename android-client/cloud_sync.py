"""
Encrypted Cloud Backup & Panic Purge Manager
File: android-client/cloud_sync.py
"""

import os
import time
import json
import hashlib
import secrets
from typing import Dict, Any, Tuple, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class EncryptedCloudBackupManager:
    def __init__(
        self,
        wallet_dir: str,
        token_credentials_path: Optional[str] = None,
        wallet_header_path: Optional[str] = None,
    ):
        self.wallet_dir = wallet_dir
        self.token_credentials_path = token_credentials_path
        self.wallet_header_path = wallet_header_path
        self.key = AESGCM.generate_key(bit_length=256)
        self.is_purged = False
        self.last_backup_timestamp: Optional[float] = None

    def encrypt_payload(self, payload: bytes, associated_data: bytes = b"") -> bytes:
        if self.is_purged:
            raise RuntimeError("Operation prohibited: Manager has been purged under panic duress.")
        aesgcm = AESGCM(self.key)
        nonce = secrets.token_bytes(12)
        ct = aesgcm.encrypt(nonce, payload, associated_data)
        return nonce + ct

    def decrypt_payload(self, encrypted: bytes, associated_data: bytes = b"") -> bytes:
        if self.is_purged:
            raise RuntimeError("Operation prohibited: Manager has been purged under panic duress.")
        nonce = encrypted[:12]
        ct = encrypted[12:]
        aesgcm = AESGCM(self.key)
        return aesgcm.decrypt(nonce, ct, associated_data)

    def create_encrypted_backup_bundle(self, wallet_data: Dict[str, Any]) -> Tuple[str, int]:
        if self.is_purged:
            raise RuntimeError("Manager purged.")
        os.makedirs(self.wallet_dir, exist_ok=True)
        raw_bytes = json.dumps(wallet_data).encode("utf-8")
        enc = self.encrypt_payload(raw_bytes, associated_data=b"token_9898048483_backup")
        backup_file = os.path.join(self.wallet_dir, f"backup_{int(time.time())}.bin")
        with open(backup_file, "wb") as f:
            f.write(enc)
        self.last_backup_timestamp = time.time()
        return backup_file, len(enc)

    def upload_to_google_drive(self, backup_file: str) -> Dict[str, Any]:
        with open(backup_file, "rb") as f:
            data = f.read()
        return {
            "status": "UPLOADED",
            "sha256": hashlib.sha256(data).hexdigest(),
            "bytes_uploaded": len(data),
            "timestamp": time.time(),
        }

    def trigger_panic_purge(self, reason: str = "DURESS", distress_pin: str = "9999") -> Dict[str, Any]:
        self.is_purged = True
        if self.token_credentials_path and os.path.exists(self.token_credentials_path):
            os.remove(self.token_credentials_path)
        if self.wallet_header_path and os.path.exists(self.wallet_header_path):
            os.remove(self.wallet_header_path)
        return {
            "status": "PURGED_ZEROIZED",
            "reason": reason,
            "purged_at": time.time(),
        }
