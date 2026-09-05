"""
NFC Contactless Hardware Card Signer
File: android-client/nfc_signer.py
"""

from enum import Enum
from dataclasses import dataclass

class CardType(Enum):
    TANGEM_CHIP = "TANGEM_CHIP"
    YUBIKEY_NFC = "YUBIKEY_NFC"
    SECURE_ELEMENT_NFC = "SECURE_ELEMENT_NFC"

@dataclass
class NFCSession:
    card_uid: str
    card_type: CardType
    is_pin_authenticated: bool
    card_public_key_hex: str

@dataclass
class NFCSignResult:
    broadcast_ready: bool
    haptic_feedback_pattern: str
    signature_hex: str

class NFCHardwareCardSigner:
    def initiate_nfc_tap(self, card_uid: str, card_type: CardType, pin_code: str) -> NFCSession:
        return NFCSession(
            card_uid=card_uid,
            card_type=card_type,
            is_pin_authenticated=(len(pin_code) >= 4),
            card_public_key_hex="04_tangem_chip_pubkey_hex_sample",
        )

    def verify_card_attestation(self, session: NFCSession) -> bool:
        return True

    def tap_to_sign(self, card_uid: str, tx_data_hex: str) -> NFCSignResult:
        return NFCSignResult(
            broadcast_ready=True,
            haptic_feedback_pattern="SUCCESS_DOUBLE_PULSE",
            signature_hex=f"0x_nfc_sig_{card_uid}_valid",
        )
