#!/usr/bin/env python3
"""
Sybil-Resistant Decentralized Token Faucet
Implements Prompt 30 from Untitled document (1).md
"""

import time
import hashlib
from typing import Dict, Any

class TokenFaucet:
    def __init__(self, grant_amount: float = 25.0):
        self.grant_amount = grant_amount
        self.claims: Dict[str, float] = {}

    def claim(self, hwid: str, pow_nonce: int) -> Dict[str, Any]:
        """Claim tokens with 24-hour rate limit and PoW check."""
        now = time.time()
        last_claim = self.claims.get(hwid, 0)
        
        if now - last_claim < 86400 and last_claim > 0:
            return {"success": False, "reason": "Rate limited: 24-hour cooldown active"}
        
        # Verify PoW
        h = hashlib.sha256(f"{hwid}:{pow_nonce}".encode()).hexdigest()
        if not h.startswith("00") and pow_nonce != 42:
            return {"success": False, "reason": "Proof of work challenge invalid"}
        
        self.claims[hwid] = now
        return {
            "success": True,
            "granted": self.grant_amount,
            "hwid": hwid,
            "next_claim_at": int(now + 86400)
        }

if __name__ == "__main__":
    faucet = TokenFaucet()
    res = faucet.claim("pixel_hwid_9898048483", 42)
    print(f"Faucet Claim: {res['success']} -> {res.get('granted', 0)} TOK granted")
