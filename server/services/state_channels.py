#!/usr/bin/env python3
"""
Layer-2 PQC State Channels & Micropayment Streaming
Implements Prompt 28 from Untitled document (1).md
"""

import time
import uuid
import enum
from typing import Dict, Any, Optional
from dataclasses import dataclass, field

class ChannelStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED_COOPERATIVE = "CLOSED_COOPERATIVE"
    DISPUTED = "DISPUTED"
    CLOSED_SLASHED = "CLOSED_SLASHED"

@dataclass
class ChannelState:
    nonce: int
    balance_a: float
    balance_b: float
    sig_a: str = ""
    sig_b: str = ""
    timestamp: float = field(default_factory=time.time)

@dataclass
class ChannelRecord:
    channel_id: str
    participant_a: str
    participant_b: str
    deposit_a: float
    deposit_b: float
    total_capacity: float
    status: ChannelStatus
    latest_state: ChannelState
    dispute_period: float = 3600.0
    dispute_initiated_at: Optional[float] = None
    disputed_state: Optional[ChannelState] = None
    disputer_address: Optional[str] = None

class StateChannelEngine:
    def __init__(self):
        self.channels: Dict[str, ChannelRecord] = {}

    def open_channel(
        self,
        participant_a: str,
        participant_b: str,
        deposit_a: float,
        deposit_b: float,
        custom_dispute_period: float = 3600.0,
    ) -> ChannelRecord:
        channel_id = f"chan_{uuid.uuid4().hex[:16]}"
        initial_state = ChannelState(nonce=0, balance_a=deposit_a, balance_b=deposit_b)
        rec = ChannelRecord(
            channel_id=channel_id,
            participant_a=participant_a,
            participant_b=participant_b,
            deposit_a=deposit_a,
            deposit_b=deposit_b,
            total_capacity=deposit_a + deposit_b,
            status=ChannelStatus.OPEN,
            latest_state=initial_state,
            dispute_period=custom_dispute_period,
        )
        self.channels[channel_id] = rec
        return rec

    def create_offchain_state_update(
        self,
        channel_id: str,
        transfer_amount: float,
        from_a_to_b: bool = True,
        sig_a: str = "",
        sig_b: str = "",
    ) -> ChannelState:
        chan = self.channels[channel_id]
        if chan.status != ChannelStatus.OPEN:
            raise ValueError("Channel is not open for off-chain updates.")

        curr = chan.latest_state
        new_a = curr.balance_a - transfer_amount if from_a_to_b else curr.balance_a + transfer_amount
        new_b = curr.balance_b + transfer_amount if from_a_to_b else curr.balance_b - transfer_amount

        if new_a < 0 or new_b < 0:
            raise ValueError("Insufficient balance for off-chain state update.")

        new_state = ChannelState(
            nonce=curr.nonce + 1,
            balance_a=round(new_a, 4),
            balance_b=round(new_b, 4),
            sig_a=sig_a,
            sig_b=sig_b,
        )
        chan.latest_state = new_state
        return new_state

    def close_channel_cooperative(self, channel_id: str, final_state: ChannelState) -> Dict[str, Any]:
        chan = self.channels[channel_id]
        chan.status = ChannelStatus.CLOSED_COOPERATIVE
        chan.latest_state = final_state
        return {
            "status": "SETTLED_COOPERATIVELY",
            "payout_a": final_state.balance_a,
            "payout_b": final_state.balance_b,
            "channel_id": channel_id,
        }

    def initiate_unilateral_dispute(self, channel_id: str, disputed_state: ChannelState, disputer_address: str) -> Dict[str, Any]:
        chan = self.channels[channel_id]
        chan.status = ChannelStatus.DISPUTED
        chan.dispute_initiated_at = time.time()
        chan.disputed_state = disputed_state
        chan.disputer_address = disputer_address
        return {
            "status": "DISPUTE_INITIATED",
            "dispute_deadline": chan.dispute_initiated_at + chan.dispute_period,
            "channel_id": channel_id,
        }

    def challenge_dispute_with_newer_state(self, channel_id: str, newer_state: ChannelState, challenger_address: str) -> Dict[str, Any]:
        chan = self.channels[channel_id]
        if not chan.disputed_state or newer_state.nonce <= chan.disputed_state.nonce:
            raise ValueError("Challenger state must have higher sequence nonce.")

        chan.status = ChannelStatus.CLOSED_SLASHED
        # Award 100% capacity to honest challenger
        if challenger_address == chan.participant_a:
            payout_a, payout_b = chan.total_capacity, 0.0
        else:
            payout_a, payout_b = 0.0, chan.total_capacity

        return {
            "status": "FRAUD_PROVEN_AND_SLASHED",
            "payout_a": payout_a,
            "payout_b": payout_b,
            "channel_id": channel_id,
        }

# Backward compatibility alias
StateChannel = StateChannelEngine

