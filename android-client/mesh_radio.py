"""
AirGap Mesh Radio & Offline Gossip Queue
File: android-client/mesh_radio.py
"""

import json
from typing import Dict, Any, List, Optional

class OfflineGossipQueue:
    def __init__(self, queue_path: str = "offline_queue.json"):
        self.queue_path = queue_path
        self._items: Dict[str, Dict[str, Any]] = {}

    def enqueue(self, tx: Dict[str, Any]) -> int:
        h = tx.get("tx_hash") or str(tx)
        self._items[h] = tx
        return len(self._items)

    def peek(self) -> List[Dict[str, Any]]:
        return list(self._items.values())

    def flush(self) -> List[Dict[str, Any]]:
        items = list(self._items.values())
        self._items.clear()
        return items

class AirGapMeshRadioManager:
    def __init__(self, local_wifi_direct_port: int = 18992):
        self.local_wifi_direct_port = local_wifi_direct_port
        self.gossip_queue = OfflineGossipQueue()
        self.discovered_peers: Dict[str, int] = {}
        self.is_scanning = False

    def start_ble_discovery(self) -> bool:
        self.is_scanning = True
        return True

    def announce_peer_discovered(self, peer_id: str, rssi: int = -60) -> None:
        self.discovered_peers[peer_id] = rssi

    def flush_offline_queue_to_tor(self) -> int:
        flushed = self.gossip_queue.flush()
        return len(flushed)

    def stop_radio(self) -> None:
        self.is_scanning = False
