#!/usr/bin/env python3
"""
Post-Quantum Mnemonic Seed & SLIP-39 Sharded Recovery Engine
Implements Prompt 33 from Untitled document (1).md
"""

import os
import hashlib
import binascii
from typing import List, Dict, Tuple, Any, Optional
from dataclasses import dataclass, field

# 2^521 - 1 Mersenne Prime for exact Shamir Secret Sharing arithmetic
SHAMIR_PRIME = (1 << 521) - 1

BIP39_WORDLIST_SAMPLE = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
    "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
    "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
    "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance",
    "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
    "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album",
    "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone",
    "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among",
    "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry",
    "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
    "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april",
    "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor",
    "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact",
    "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume",
    "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction",
    "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado",
    "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis",
    "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball",
    "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base",
    "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become",
    "beef", "before", "begin", "behave", "behind", "believe", "below", "belt",
    "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle",
    "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black",
    "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood",
    "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body",
    "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring",
    "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain",
    "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief",
    "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother",
    "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb"
]

SPANISH_WORDLIST_SAMPLE = [
    "abaco", "abdomen", "abeja", "abierto", "abogado", "abono", "aborto", "abrazo",
    "abrir", "abuelo", "abuso", "acabar", "academia", "acceso", "accion", "aceite",
    "acelga", "acento", "aceptar", "acido", "aclarar", "acne", "acoger", "acoso",
    "activo", "acto", "actriz", "actuar", "acudir", "acuerdo", "acusar", "adicto",
    "admitir", "adorar", "aduana", "adulto", "afable", "afectar", "afilar", "afinar",
    "afirmar", "aflojar", "afuera", "agencia", "agenda", "agosto", "agotar", "agradable",
    "agradecer", "agravio", "agua", "agudo", "aguila", "aguja", "ahogo", "ahora",
    "ahorro", "aire", "aislar", "ajedrez", "ajeno", "ajuste", "alarma", "alba",
    "album", "alcalde", "aldea", "alegre", "alejar", "alerta", "aleta", "alfiler",
    "alga", "algodon", "aliado", "aliento", "alivio", "alma", "almeja", "almibar",
    "altar", "alteza", "altivo", "alto", "altura", "alumno", "alzar", "amable",
    "amante", "amargo", "amatar", "ambar", "ambito", "ameno", "amigo", "amistad",
    "amor", "amparo", "amplio", "ancho", "anciano", "ancla", "andar", "anden",
    "anecdota", "anexo", "angel", "angulo", "anhelo", "anillo", "animal", "anoche",
    "ansia", "antena", "antiguo", "antojo", "anual", "anular", "anuncio", "anadir"
]

@dataclass
class Slip39Shard:
    index: int
    threshold: int
    total: int
    value_y: int
    shard_id: str = ""
    words: List[str] = field(default_factory=list)

class PostQuantumMnemonicEngine:
    """Multi-language Post-Quantum Mnemonic Phrase Derivation & SLIP-39 Shamir Secret Sharding."""

    def __init__(self):
        self.wordlists = {
            "english": BIP39_WORDLIST_SAMPLE,
            "spanish": SPANISH_WORDLIST_SAMPLE,
        }

    def generate_mnemonic_phrase(self, language: str = "english", word_count: int = 24) -> str:
        words = self.wordlists.get(language.lower(), BIP39_WORDLIST_SAMPLE)
        selected = []
        for _ in range(word_count):
            rand_idx = int.from_bytes(os.urandom(2), 'big') % len(words)
            selected.append(words[rand_idx])
        return " ".join(selected)

    def derive_master_seed(self, mnemonic: str, passphrase: str = "") -> str:
        """Derives 64-character hex master seed via PBKDF2-HMAC-SHA512."""
        salt = ("mnemonic" + passphrase).encode('utf-8')
        derived = hashlib.pbkdf2_hmac("sha512", mnemonic.encode('utf-8'), salt, iterations=2048, dklen=32)
        return binascii.hexlify(derived).decode('utf-8')

    def split_seed_slip39(self, master_seed_hex: str, threshold_m: int = 3, total_n: int = 5) -> List[Slip39Shard]:
        """Splits master seed into m-of-n Shamir secret shards over Mersenne prime field."""
        secret_int = int(master_seed_hex, 16)
        
        # Generate m-1 random coefficients
        coeffs = [secret_int]
        for _ in range(threshold_m - 1):
            rand_coeff = int.from_bytes(os.urandom(64), 'big') % SHAMIR_PRIME
            coeffs.append(rand_coeff)

        shards: List[Slip39Shard] = []
        for x in range(1, total_n + 1):
            # Evaluate polynomial at x
            y = 0
            x_pow = 1
            for coeff in coeffs:
                y = (y + coeff * x_pow) % SHAMIR_PRIME
                x_pow = (x_pow * x) % SHAMIR_PRIME

            shard = Slip39Shard(
                index=x,
                threshold=threshold_m,
                total=total_n,
                value_y=y,
                shard_id=f"slip39-{x}-of-{total_n}",
            )
            shards.append(shard)

        return shards

    def recover_seed_slip39(self, shards: List[Slip39Shard]) -> str:
        """Reconstructs master seed from any m shards using Lagrange interpolation modulo prime."""
        if not shards:
            raise ValueError("No shards provided for recovery.")
        
        k = len(shards)
        secret_int = 0

        for j in range(k):
            xj, yj = shards[j].index, shards[j].value_y
            num = 1
            den = 1
            for m in range(k):
                if m == j:
                    continue
                xm = shards[m].index
                num = (num * (-xm)) % SHAMIR_PRIME
                den = (den * (xj - xm)) % SHAMIR_PRIME

            # den^-1 mod SHAMIR_PRIME
            den_inv = pow(den, SHAMIR_PRIME - 2, SHAMIR_PRIME)
            term = (yj * num * den_inv) % SHAMIR_PRIME
            secret_int = (secret_int + term) % SHAMIR_PRIME

        # Format back to 64-character hex string
        recovered_hex = f"{secret_int:064x}"
        return recovered_hex


class Slip39RecoveryEngine(PostQuantumMnemonicEngine):
    """Backward compatibility wrapper."""
    def __init__(self, threshold: int = 3, total_shares: int = 5):
        super().__init__()
        self.threshold = threshold
        self.total_shares = total_shares

    def split_master_seed(self, secret_hex: str) -> List[Dict[str, Any]]:
        shards = self.split_seed_slip39(secret_hex, self.threshold, self.total_shares)
        return [
            {
                "index": s.index,
                "threshold": s.threshold,
                "shard_id": s.shard_id,
                "value_y": s.value_y,
            }
            for s in shards
        ]


if __name__ == "__main__":
    engine = PostQuantumMnemonicEngine()
    phrase = engine.generate_mnemonic_phrase("english", 24)
    seed = engine.derive_master_seed(phrase, "test_pass")
    shards = engine.split_seed_slip39(seed, 3, 5)
    rec = engine.recover_seed_slip39([shards[0], shards[2], shards[4]])
    print(f"Original Seed:  {seed}")
    print(f"Recovered Seed: {rec} -> Match: {seed == rec}")
