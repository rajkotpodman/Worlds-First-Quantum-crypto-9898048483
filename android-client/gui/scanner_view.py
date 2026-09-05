"""
AirGap Scanner View Mock & Frame Reassembler
File: android-client/gui/scanner_view.py
"""

import json
from dataclasses import dataclass
from typing import Optional, Dict

@dataclass
class QRScanProgress:
    received_frames: int
    total_frames: int
    is_complete: bool

@dataclass
class DeserializedTransactionPayload:
    sender_address: str
    recipient_address: str
    amount: float
    nonce: int
    signature: str

class AirGapScannerViewMockKivy:
    def __init__(self):
        self.current_progress = QRScanProgress(received_frames=0, total_frames=0, is_complete=False)
        self._frames: Dict[int, str] = {}

    def simulate_camera_frame_capture(self, frame_str: str) -> Optional[DeserializedTransactionPayload]:
        # UR:PQC/idx-total/chunk
        prefix, chunk = frame_str.split("/", 2)[1], frame_str.split("/", 2)[2]
        idx_str, total_str = prefix.split("-")
        idx, total = int(idx_str), int(total_str)

        self._frames[idx] = chunk
        self.current_progress.received_frames = len(self._frames)
        self.current_progress.total_frames = total

        if len(self._frames) == total:
            self.current_progress.is_complete = True
            joined = "".join(self._frames[i] for i in range(1, total + 1))
            data = json.loads(joined)
            return DeserializedTransactionPayload(
                sender_address=data["from"],
                recipient_address=data["to"],
                amount=float(data["amt"]),
                nonce=int(data["nonce"]),
                signature=data["sig"],
            )

        self.current_progress.is_complete = False
        return None
