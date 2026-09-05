"""
Dynamic QR Protocol & Base45 Encoding
File: android-client/qr_protocol.py
"""

import zlib
import json
import secrets
from dataclasses import dataclass, asdict
from typing import List, Dict, Any

BASE45_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"

def base45_encode(data: bytes) -> str:
    res = []
    for i in range(0, len(data), 2):
        chunk = data[i : i + 2]
        if len(chunk) == 2:
            val = (chunk[0] << 8) + chunk[1]
            c = val % 45
            val //= 45
            d = val % 45
            e = val // 45
            res.extend([BASE45_CHARSET[c], BASE45_CHARSET[d], BASE45_CHARSET[e]])
        else:
            val = chunk[0]
            c = val % 45
            d = val // 45
            res.extend([BASE45_CHARSET[c], BASE45_CHARSET[d]])
    return "".join(res)

def base45_decode(s: str) -> bytes:
    res = bytearray()
    for i in range(0, len(s), 3):
        chunk = s[i : i + 3]
        if len(chunk) == 3:
            val = BASE45_CHARSET.index(chunk[0]) + BASE45_CHARSET.index(chunk[1]) * 45 + BASE45_CHARSET.index(chunk[2]) * 45 * 45
            res.append(val >> 8)
            res.append(val & 0xFF)
        elif len(chunk) == 2:
            val = BASE45_CHARSET.index(chunk[0]) + BASE45_CHARSET.index(chunk[1]) * 45
            res.append(val)
    return bytes(res)

@dataclass
class Invoice:
    invoice_id: str
    recipient_address: str
    amount: float
    memo: str
    ttl_seconds: float
    tor_callback_onion: str

    def to_uri(self) -> str:
        return f"pqc-token://pay?recipient={self.recipient_address}&amount={self.amount}&memo={self.memo}&onion={self.tor_callback_onion}"

@dataclass
class QRChunkFrame:
    chunk_index: int
    total_chunks: int
    payload: str

class DynamicQRProtocolManager:
    def create_invoice(
        self,
        recipient_address: str,
        amount: float,
        memo: str,
        ttl_seconds: float = 3600.0,
        tor_callback_onion: str = "",
    ) -> Invoice:
        return Invoice(
            invoice_id=f"inv_{secrets.token_hex(6)}",
            recipient_address=recipient_address,
            amount=amount,
            memo=memo,
            ttl_seconds=ttl_seconds,
            tor_callback_onion=tor_callback_onion,
        )

    def encode_invoice_to_compact_payload(self, invoice: Invoice) -> str:
        raw_json = json.dumps(asdict(invoice)).encode("utf-8")
        compressed = zlib.compress(raw_json)
        return base45_encode(compressed)

    def decode_compact_payload_to_invoice(self, compact_payload: str) -> Invoice:
        compressed = base45_decode(compact_payload)
        raw_json = zlib.decompress(compressed).decode("utf-8")
        data = json.loads(raw_json)
        return Invoice(**data)

    def generate_animated_qr_chunks(self, compact_payload: str, max_chunk_len: int = 200) -> List[QRChunkFrame]:
        chunks = [compact_payload[i : i + max_chunk_len] for i in range(0, len(compact_payload), max_chunk_len)]
        total = max(1, len(chunks))
        frames = []
        for idx, ch in enumerate(chunks):
            frames.append(QRChunkFrame(chunk_index=idx + 1, total_chunks=total, payload=ch))
        return frames

    def reassemble_animated_qr_chunks(self, frames: List[QRChunkFrame]) -> str:
        sorted_frames = sorted(frames, key=lambda f: f.chunk_index)
        return "".join(f.payload for f in sorted_frames)
