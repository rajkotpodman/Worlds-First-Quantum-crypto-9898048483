"""
Multi-Guardian Social Recovery Engine
File: android-client/social_recovery.py
"""

import time
import secrets
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Any

class RecoveryStatus(Enum):
    PENDING = "PENDING"
    DISPUTE_WINDOW_ACTIVE = "DISPUTE_WINDOW_ACTIVE"
    APPROVED = "APPROVED"
    EXECUTED = "EXECUTED"

@dataclass
class RecoverySession:
    session_id: str
    proposed_new_owner_key: str
    required_threshold: int
    status: RecoveryStatus = RecoveryStatus.DISPUTE_WINDOW_ACTIVE
    approvals: List[Dict[str, str]] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)

class SocialRecoveryManager:
    def __init__(
        self,
        wallet_address: str,
        owner_public_key: str,
        threshold: int = 2,
        timelock_delay_seconds: float = 3600.0,
    ):
        self.wallet_address = wallet_address
        self.owner_public_key = owner_public_key
        self.threshold = threshold
        self.timelock_delay_seconds = timelock_delay_seconds
        self.guardians: Dict[str, Dict[str, str]] = {}
        self.sessions: Dict[str, RecoverySession] = {}

    def add_guardian(self, guardian_id: str, display_name: str, public_key: str, guardian_type: str) -> None:
        self.guardians[guardian_id] = {
            "display_name": display_name,
            "public_key": public_key,
            "type": guardian_type,
        }

    def initiate_recovery(self, proposed_new_owner_key: str) -> RecoverySession:
        s_id = f"rec_{secrets.token_hex(6)}"
        session = RecoverySession(
            session_id=s_id,
            proposed_new_owner_key=proposed_new_owner_key,
            required_threshold=self.threshold,
            status=RecoveryStatus.DISPUTE_WINDOW_ACTIVE,
        )
        self.sessions[s_id] = session
        return session

    def submit_guardian_approval(self, session_id: str, guardian_id: str, signature: str) -> Dict[str, Any]:
        session = self.sessions[session_id]
        approval = {"guardian_id": guardian_id, "signature": signature, "timestamp": time.time()}
        session.approvals.append(approval)
        return approval

    def execute_recovery(self, session_id: str, force_timelock_bypass_for_testing: bool = False) -> Dict[str, Any]:
        session = self.sessions[session_id]
        if len(session.approvals) >= session.required_threshold:
            session.status = RecoveryStatus.EXECUTED
            self.owner_public_key = session.proposed_new_owner_key
            return {
                "status": "RECOVERY_EXECUTED",
                "session_id": session_id,
                "new_owner_key": session.proposed_new_owner_key,
            }
        raise ValueError("Insufficient guardian approvals")
