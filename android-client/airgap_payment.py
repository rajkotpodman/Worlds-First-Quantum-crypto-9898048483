"""
AirGap Optical & Ultrasonic Payment Engine
File: android-client/airgap_payment.py
"""

import json
import math
from typing import Dict, Any, List, Tuple, Optional

class AirGapPaymentEngine:
    def __init__(self, token_id: str = "9898048483"):
        self.token_id = token_id
        self._received_frames: Dict[str, str] = {}

    def prepare_offline_transaction_payload(
        self,
        from_address: str,
        to_address: str,
        amount: float,
        nonce: int,
        hybrid_signature: str,
    ) -> Dict[str, Any]:
        return {
            "token_id": self.token_id,
            "from": from_address,
            "to": to_address,
            "amount": amount,
            "nonce": nonce,
            "signature": hybrid_signature,
        }

    def encode_payload_to_chunks(self, payload: Dict[str, Any], max_chunk_size: int = 200) -> List[str]:
        raw = json.dumps(payload)
        return [f"PQC:1/1:{raw}"]

    def ingest_qr_frame(self, frame: str) -> Tuple[bool, float, Optional[Dict[str, Any]]]:
        if frame.startswith("PQC:1/1:"):
            payload_str = frame[8:]
            payload = json.loads(payload_str)
            return True, 1.0, payload
        return False, 0.0, None

    def synthesize_ultrasonic_handshake(self, beacon: str, sample_rate: int = 44100, duration_sec: float = 0.05):
        import numpy as np
        # 19 kHz carrier sine wave
        freq = 19000.0
        num_samples = int(sample_rate * duration_sec)
        samples = [0.5 * math.sin(2.0 * math.pi * freq * i / sample_rate) for i in range(num_samples)]
        return np.array(samples, dtype=np.float32)
