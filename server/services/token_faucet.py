#!/usr/bin/env python3
"""
Sybil-Resistant Decentralized Token Faucet
Implements Prompt 30 from Untitled document (1).md
"""

import time
import uuid
import hashlib
from typing import Dict, Any, Optional
from dataclasses import dataclass, field

@dataclass
class PoWChallenge:
    challenge_id: str
    hwid: str
    challenge_string: str
    difficulty_bits: int = 8
    created_at: float = field(default_factory=time.time)
    is_solved: bool = False

@dataclass
class FaucetClaimReceipt:
    recipient_address: str
    hwid_binding_hash: str
    tokens_granted: float
    claim_index: int
    timestamp: float = field(default_factory=time.time)

class SybilResistantTokenFaucet:
    """Sybil-Resistant Token Faucet with PoW difficulty verification and hardware cooldowns."""

    def __init__(self, base_drop_amount: float = 100.0, cooldown_seconds: float = 86400.0):
        self.base_drop_amount = base_drop_amount
        self.cooldown_seconds = cooldown_seconds
        self.challenges: Dict[str, PoWChallenge] = {}
        self.claims_history: Dict[str, float] = {}
        self.total_tokens_disbursed: float = 0.0
        self.total_claims_count: int = 0

    def generate_pow_challenge(self, hwid: str, difficulty_bits: int = 8) -> PoWChallenge:
        challenge_id = f"faucet_ch_{uuid.uuid4().hex[:12]}"
        ch_str = f"PQC_FAUCET_{hwid}_{uuid.uuid4().hex[:8]}"
        challenge = PoWChallenge(
            challenge_id=challenge_id,
            hwid=hwid,
            challenge_string=ch_str,
            difficulty_bits=difficulty_bits,
            is_solved=False,
        )
        self.challenges[challenge_id] = challenge
        return challenge

    def claim_faucet_tokens(
        self,
        recipient_address: str,
        hwid_binding_hash: str,
        challenge_id: str,
        pow_nonce: str,
        attestation_verified: bool = True,
    ) -> FaucetClaimReceipt:
        now = time.time()
        last_claim = self.claims_history.get(hwid_binding_hash, 0.0)
        
        if (now - last_claim) < self.cooldown_seconds and last_claim > 0.0:
            remaining = int(self.cooldown_seconds - (now - last_claim))
            raise ValueError(f"Device under faucet cooldown! Please wait {remaining} seconds.")

        challenge = self.challenges.get(challenge_id)
        if not challenge:
            raise ValueError("Invalid or expired challenge ID.")
        if challenge.is_solved:
            raise ValueError("Challenge already redeemed.")

        # Verify PoW solution
        candidate = f"{challenge.challenge_string}:{pow_nonce}".encode('utf-8')
        digest = hashlib.sha256(candidate).hexdigest()
        
        # Check required zero bits
        hex_zeros_needed = challenge.difficulty_bits // 4
        required_prefix = "0" * hex_zeros_needed
        if not digest.startswith(required_prefix):
            raise ValueError("Proof-of-work solution is invalid for the required difficulty.")

        challenge.is_solved = True
        self.claims_history[hwid_binding_hash] = now
        self.total_claims_count += 1
        self.total_tokens_disbursed += self.base_drop_amount

        return FaucetClaimReceipt(
            recipient_address=recipient_address,
            hwid_binding_hash=hwid_binding_hash,
            tokens_granted=self.base_drop_amount,
            claim_index=self.total_claims_count,
            timestamp=now,
        )


class TokenFaucet(SybilResistantTokenFaucet):
    """Backward compatibility wrapper."""
    def __init__(self, grant_amount: float = 25.0):
        super().__init__(base_drop_amount=grant_amount)

    def claim(self, hwid: str, pow_nonce: int) -> Dict[str, Any]:
        ch = self.generate_pow_challenge(hwid, difficulty_bits=8)
        try:
            receipt = self.claim_faucet_tokens(
                recipient_address=f"0x{hwid[:16]}",
                hwid_binding_hash=hwid,
                challenge_id=ch.challenge_id,
                pow_nonce=str(pow_nonce),
            )
            return {
                "success": True,
                "granted": receipt.tokens_granted,
                "hwid": hwid,
                "next_claim_at": int(time.time() + self.cooldown_seconds),
            }
        except Exception as e:
            return {"success": False, "reason": str(e)}


if __name__ == "__main__":
    faucet = SybilResistantTokenFaucet()
    ch = faucet.generate_pow_challenge("hwid_123")
    print(f"Faucet PoW Challenge: {ch.challenge_id}")
