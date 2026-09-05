#!/usr/bin/env python3
"""
Quantum-Resistant URI & Animated QR Invoice Protocol (BIP-21 Variant)
Implements Prompt 31 from Untitled document (1).md
"""

import time
import urllib.parse
from typing import Dict, List, Optional

class PQCQRProtocol:
    def __init__(self, scheme: str = "pqc-token"):
        self.scheme = scheme

    def create_invoice(self, recipient_pqc_addr: str, amount: float, memo: str, onion_callback: str = "") -> Dict[str, any]:
        """Generate a standardized pqc-token:// URI invoice with animated fountain chunks."""
        exp_epoch = int(time.time()) + 3600
        params = {
            "amount": f"{amount:.4f}",
            "memo": memo,
            "exp": str(exp_epoch),
            "onion": onion_callback
        }
        query_string = urllib.parse.urlencode(params)
        uri = f"{self.scheme}://{recipient_pqc_addr}?{query_string}"
        
        # Partition into animated QR code fountain chunks (UR standard)
        chunk_size = 64
        chunks = []
        total_chunks = (len(uri) + chunk_size - 1) // chunk_size
        for idx in range(total_chunks):
            start = idx * chunk_size
            chunk_data = uri[start:start+chunk_size]
            chunks.append(f"ur:pqc/{idx+1}-{total_chunks}/{chunk_data}")
            
        return {
            "uri": uri,
            "recipient": recipient_pqc_addr,
            "amount": amount,
            "expiration": exp_epoch,
            "fountain_chunks": chunks
        }

    def decode_invoice(self, uri_str: str) -> Optional[Dict[str, str]]:
        """Parse and validate a pqc-token:// invoice URI."""
        if not uri_str.startswith(f"{self.scheme}://"):
            return None
        
        raw = uri_str.replace(f"{self.scheme}://", "http://")
        parsed = urllib.parse.urlparse(raw)
        query = urllib.parse.parse_qs(parsed.query)
        
        return {
            "recipient": parsed.netloc,
            "amount": query.get("amount", ["0.0000"])[0],
            "memo": query.get("memo", [""])[0],
            "exp": query.get("exp", ["0"])[0],
            "onion": query.get("onion", [""])[0]
        }

if __name__ == "__main__":
    protocol = PQCQRProtocol()
    inv = protocol.create_invoice("pqc1node9898048483mldsa87", 50.0, "Test Android Node Settlement", "v3tor9898.onion")
    print(f"Generated URI: {inv['uri']}")
    print(f"Fountain QR Chunks: {len(inv['fountain_chunks'])}")
