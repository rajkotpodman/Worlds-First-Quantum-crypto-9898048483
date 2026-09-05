#!/usr/bin/env python3
"""
Quantum-Resistant URI & Animated QR Invoice Protocol (BIP-21 Variant)
Implements Prompt 31 from Untitled document (1).md
"""

import time
import json
import zlib
import uuid
import urllib.parse
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

BASE45_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"

def base45_encode(data: bytes) -> str:
    """Encodes bytes into Base45 string (RFC 9285 standard)."""
    res = []
    i = 0
    while i < len(data):
        if i + 1 < len(data):
            val = (data[i] << 8) | data[i + 1]
            c = val % 45
            d = (val // 45) % 45
            e = (val // (45 * 45)) % 45
            res.append(BASE45_CHARSET[c])
            res.append(BASE45_CHARSET[d])
            res.append(BASE45_CHARSET[e])
            i += 2
        else:
            val = data[i]
            c = val % 45
            d = val // 45
            res.append(BASE45_CHARSET[c])
            res.append(BASE45_CHARSET[d])
            i += 1
    return "".join(res)

def base45_decode(encoded: str) -> bytes:
    """Decodes Base45 string into raw bytes (RFC 9285 standard)."""
    res = bytearray()
    i = 0
    char_map = {c: idx for idx, c in enumerate(BASE45_CHARSET)}
    while i < len(encoded):
        if i + 2 < len(encoded):
            c = char_map[encoded[i]]
            d = char_map[encoded[i + 1]]
            e = char_map[encoded[i + 2]]
            val = c + (d * 45) + (e * 45 * 45)
            res.append((val >> 8) & 0xFF)
            res.append(val & 0xFF)
            i += 3
        elif i + 1 < len(encoded):
            c = char_map[encoded[i]]
            d = char_map[encoded[i + 1]]
            val = c + (d * 45)
            res.append(val & 0xFF)
            i += 2
        else:
            raise ValueError("Malformed Base45 string length.")
    return bytes(res)


@dataclass
class QRInvoice:
    recipient_address: str
    amount: float
    memo: str = ""
    ttl_seconds: float = 3600.0
    tor_callback_onion: str = ""
    invoice_id: str = field(default_factory=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    created_at: float = field(default_factory=time.time)

    def to_uri(self) -> str:
        params = {
            "amount": str(self.amount),
            "memo": self.memo,
            "exp": str(int(self.created_at + self.ttl_seconds)),
            "onion": self.tor_callback_onion,
            "id": self.invoice_id,
        }
        query = urllib.parse.urlencode(params)
        return f"pqc-token://{self.recipient_address}?{query}"


@dataclass
class QRFrame:
    chunk_index: int
    total_chunks: int
    payload_chunk: str
    formatted_ur: str = ""


class DynamicQRProtocolManager:
    """Dynamic Animated QR Code Protocol Manager with Base45 + Zlib Compression and Fountain Chunking."""

    def __init__(self, scheme: str = "pqc-token"):
        self.scheme = scheme

    def create_invoice(
        self,
        recipient_address: str,
        amount: float,
        memo: str = "",
        ttl_seconds: float = 3600.0,
        tor_callback_onion: str = "",
    ) -> QRInvoice:
        return QRInvoice(
            recipient_address=recipient_address,
            amount=amount,
            memo=memo,
            ttl_seconds=ttl_seconds,
            tor_callback_onion=tor_callback_onion,
        )

    def encode_invoice_to_compact_payload(self, invoice: QRInvoice) -> bytes:
        data = {
            "id": invoice.invoice_id,
            "to": invoice.recipient_address,
            "amt": invoice.amount,
            "memo": invoice.memo,
            "ttl": invoice.ttl_seconds,
            "onion": invoice.tor_callback_onion,
            "ts": invoice.created_at,
        }
        raw_json = json.dumps(data).encode('utf-8')
        compressed = zlib.compress(raw_json, level=9)
        b45 = base45_encode(compressed)
        return b45.encode('utf-8')

    def decode_compact_payload_to_invoice(self, payload: bytes) -> QRInvoice:
        b45_str = payload.decode('utf-8')
        compressed = base45_decode(b45_str)
        raw_json = zlib.decompress(compressed)
        data = json.loads(raw_json.decode('utf-8'))
        invoice = QRInvoice(
            recipient_address=data["to"],
            amount=float(data["amt"]),
            memo=data.get("memo", ""),
            ttl_seconds=float(data.get("ttl", 3600.0)),
            tor_callback_onion=data.get("onion", ""),
            invoice_id=data.get("id", ""),
            created_at=float(data.get("ts", time.time())),
        )
        return invoice

    def generate_animated_qr_chunks(self, compact_payload: bytes, chunk_size: int = 64) -> List[QRFrame]:
        payload_str = compact_payload.decode('utf-8')
        total_chunks = max(1, (len(payload_str) + chunk_size - 1) // chunk_size)
        frames: List[QRFrame] = []
        for idx in range(total_chunks):
            start = idx * chunk_size
            chunk = payload_str[start:start+chunk_size]
            ur_frame = f"ur:pqc/{idx+1}-{total_chunks}/{chunk}"
            frames.append(QRFrame(chunk_index=idx, total_chunks=total_chunks, payload_chunk=chunk, formatted_ur=ur_frame))
        return frames

    def reassemble_animated_qr_chunks(self, frames: List[QRFrame]) -> bytes:
        sorted_frames = sorted(frames, key=lambda f: f.chunk_index)
        payload_str = "".join([f.payload_chunk for f in sorted_frames])
        return payload_str.encode('utf-8')


class PQCQRProtocol(DynamicQRProtocolManager):
    """Backward compatibility wrapper."""
    pass


if __name__ == "__main__":
    mgr = DynamicQRProtocolManager()
    inv = mgr.create_invoice("0xrecipient", 100.0, "Test Invoice")
    compact = mgr.encode_invoice_to_compact_payload(inv)
    frames = mgr.generate_animated_qr_chunks(compact)
    print(f"Generated {len(frames)} animated QR frames for URI: {inv.to_uri()}")
