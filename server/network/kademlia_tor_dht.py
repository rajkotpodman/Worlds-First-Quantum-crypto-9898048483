#!/usr/bin/env python3
"""
Kademlia Tor DHT Peer Discovery Node (160-bit XOR Metric over Tor)
Implements Prompt 29 from Untitled document (1).md
"""

import hashlib
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field

@dataclass
class DHTNodeContact:
    node_id: int
    node_id_hex: str
    onion_address: str
    onion_port: int = 9050
    hwid_hash: str = ""
    attestation_verified: bool = True
    last_seen: float = field(default_factory=time.time)

class KademliaRoutingTable:
    def __init__(self, local_node_id: int, k_bucket_size: int = 20):
        self.local_node_id = local_node_id
        self.k_bucket_size = k_bucket_size
        self.k_buckets: Dict[int, List[DHTNodeContact]] = {i: [] for i in range(160)}
        self.all_contacts: Dict[int, DHTNodeContact] = {}

    def total_contacts_count(self) -> int:
        return len(self.all_contacts)

    def insert_contact(self, contact: DHTNodeContact):
        self.all_contacts[contact.node_id] = contact
        dist = self.local_node_id ^ contact.node_id
        bucket_index = min(159, max(0, dist.bit_length() - 1)) if dist > 0 else 0
        bucket = self.k_buckets[bucket_index]

        existing = [c for c in bucket if c.node_id == contact.node_id]
        if existing:
            existing[0].last_seen = time.time()
        elif len(bucket) < self.k_bucket_size:
            bucket.append(contact)

    def get_closest_contacts(self, target_id: int, count: int = 8) -> List[DHTNodeContact]:
        contacts = list(self.all_contacts.values())
        contacts.sort(key=lambda c: c.node_id ^ target_id)
        return contacts[:count]


class TorKademliaDHTNode:
    """Kademlia 160-bit Distributed Hash Table Node running over Tor Onion Services."""

    def __init__(self, onion_address: str = "local_node.onion", onion_port: int = 9050):
        self.onion_address = onion_address
        self.onion_port = onion_port
        self.node_id_hex = hashlib.sha1(f"{onion_address}:{onion_port}".encode('utf-8')).hexdigest()
        self.node_id = int(self.node_id_hex, 16)
        self.routing_table = KademliaRoutingTable(self.node_id)
        self.storage: Dict[str, Any] = {}

    def register_peer(
        self,
        onion_address: str,
        onion_port: int = 9050,
        hwid_hash: str = "",
        attestation_verified: bool = True,
    ) -> DHTNodeContact:
        peer_id_hex = hashlib.sha1(f"{onion_address}:{onion_port}".encode('utf-8')).hexdigest()
        peer_id = int(peer_id_hex, 16)
        contact = DHTNodeContact(
            node_id=peer_id,
            node_id_hex=peer_id_hex,
            onion_address=onion_address,
            onion_port=onion_port,
            hwid_hash=hwid_hash,
            attestation_verified=attestation_verified,
        )
        self.routing_table.insert_contact(contact)
        return contact

    def rpc_ping(self, peer_contact: DHTNodeContact) -> Dict[str, Any]:
        """RPC PING handler."""
        return {
            "status": "PONG",
            "responder_node_id": self.node_id_hex,
            "responder_onion": self.onion_address,
            "timestamp": time.time(),
        }

    def rpc_store(self, key: str, value: Any, publisher_contact: DHTNodeContact) -> bool:
        """RPC STORE handler."""
        self.storage[key] = value
        self.routing_table.insert_contact(publisher_contact)
        return True

    def rpc_find_value(self, key: str, requester_contact: DHTNodeContact) -> Dict[str, Any]:
        """RPC FIND_VALUE handler."""
        self.routing_table.insert_contact(requester_contact)
        if key in self.storage:
            return {"found": True, "value": self.storage[key]}
        
        target_id = int(hashlib.sha1(key.encode('utf-8')).hexdigest(), 16)
        closest = self.routing_table.get_closest_contacts(target_id)
        return {
            "found": False,
            "closest_nodes": [
                {"node_id": hex(c.node_id), "onion_address": c.onion_address, "onion_port": c.onion_port}
                for c in closest
            ],
        }

    def rpc_find_node(self, target_node_id_hex: str, requester_contact: DHTNodeContact) -> List[Dict[str, Any]]:
        """RPC FIND_NODE handler."""
        self.routing_table.insert_contact(requester_contact)
        target_int = int(target_node_id_hex, 16) if target_node_id_hex.startswith("0x") else int(target_node_id_hex, 16)
        closest = self.routing_table.get_closest_contacts(target_int)
        return [
            {"node_id": hex(c.node_id), "onion_address": c.onion_address, "onion_port": c.onion_port}
            for c in closest
        ]


class KademliaTorDHT(TorKademliaDHTNode):
    """Backward compatibility wrapper."""
    def __init__(self, node_id_hex: Optional[str] = None):
        super().__init__()
        if node_id_hex:
            self.node_id_hex = node_id_hex
            self.node_id = int(node_id_hex, 16)
            self.routing_table = KademliaRoutingTable(self.node_id)

    def calculate_distance(self, peer_node_id_hex: str) -> int:
        peer_int = int(peer_node_id_hex, 16)
        return self.node_id ^ peer_int

    def add_peer(self, peer_node_id_hex: str, onion_address: str, port: int = 9050):
        contact = DHTNodeContact(
            node_id=int(peer_node_id_hex, 16),
            node_id_hex=peer_node_id_hex,
            onion_address=onion_address,
            onion_port=port,
        )
        self.routing_table.insert_contact(contact)

    def find_closest_nodes(self, target_node_id_hex: str, count: int = 8) -> List[Dict[str, Any]]:
        target_int = int(target_node_id_hex, 16)
        closest = self.routing_table.get_closest_contacts(target_int, count)
        return [{"node_id": c.node_id_hex, "onion": c.onion_address, "port": c.onion_port} for c in closest]


if __name__ == "__main__":
    node = TorKademliaDHTNode("sovereign_master.onion", 9050)
    p = node.register_peer("peer_alpha.onion", 9050)
    print(f"DHT Initialized: {node.node_id_hex} with peer: {p.onion_address}")
