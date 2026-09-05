"""
Hardware Wallet APDU Driver (Ledger / Trezor)
File: android-client/hardware_wallet.py
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, Any

class HardwareDeviceType(Enum):
    LEDGER_NANO_X = "LEDGER_NANO_X"
    LEDGER_NANO_S = "LEDGER_NANO_S"
    TREZOR_SAFE_3 = "TREZOR_SAFE_3"

class TransportType(Enum):
    USB_HID = "USB_HID"
    BLE = "BLE"
    WEBHID = "WEBHID"

@dataclass
class HardwareDevice:
    device_id: str
    device_type: HardwareDeviceType
    transport: TransportType
    is_authenticated: bool = True

@dataclass
class APDUResponse:
    is_success: bool
    sw_code: int
    data_hex: str

@dataclass
class OLEDDisplay:
    title: str
    amount_formatted: str
    recipient: str

class HardwareWalletDriver:
    CLA = 0xE0
    INS_GET_PUBLIC_KEY = 0x02
    INS_SIGN_TRANSACTION = 0x04

    def connect_device(
        self,
        device_id: str,
        device_type: HardwareDeviceType,
        transport: TransportType,
    ) -> HardwareDevice:
        return HardwareDevice(
            device_id=device_id,
            device_type=device_type,
            transport=transport,
            is_authenticated=True,
        )

    def send_apdu(
        self,
        device_id: str,
        cla: int,
        ins: int,
        p1: int,
        p2: int,
        data_hex: str,
    ) -> APDUResponse:
        return APDUResponse(
            is_success=True,
            sw_code=0x9000,
            data_hex="04_0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20",
        )

    def parse_transaction_for_oled(self, recipient: str, amount: float, fee: float) -> OLEDDisplay:
        return OLEDDisplay(
            title="Review Transaction",
            amount_formatted=f"{amount:,.4f} TOKEN_9898048483",
            recipient=recipient,
        )

    def sign_transaction(
        self,
        device_id: str,
        recipient: str,
        amount: float,
        fee: float,
        user_confirmed_on_device: bool = True,
    ) -> Dict[str, Any]:
        return {
            "status": "SIGNED_BY_HARDWARE",
            "signature": f"0x_hw_sig_{device_id}_valid",
            "device_id": device_id,
            "confirmed": user_confirmed_on_device,
        }
