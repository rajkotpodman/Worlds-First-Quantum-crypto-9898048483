#!/usr/bin/env python3
"""
Kademlia Tor DHT Peer Discovery Node (160-bit XOR Metric over Tor)
Implements Prompt 29 from Untitled document (1).md
"""

import hashlib
import time
from typing import List, Dict, Optional

class KademliaTorDHT:
    def __init__(self, node_id_hex: Optional[str] = None):
        if not node_id_hex:
            self.node_id_int = int(hashlib.sha1(b"sovereign_node_9898048483").hexdigest(), 16)
        else:
            self.node_id_int = int(node_id_hex, 16)
        self.k_buckets: Dict[int, List[Dict[str, any]]] = {i: [] for i in range(160)}

    def calculate_distance(self, peer_node_id_hex: str) -> int:
        """160-bit XOR metric distance calculation."""
        peer_int = int(peer_node_id_hex, 16)
        return self.node_id_int ^ peer_int

    def add_peer(self, peer_node_id_hex: str, onion_address: str, port: int = 9050):
        """Add or refresh a peer in its corresponding k-bucket."""
        dist = self.calculate_distance(peer_node_id_hex)
        bucket_index = min(159, max(0, dist.bit_length() - 1))
        
        bucket = self.k_buckets[bucket_index]
        existing = [p for p in bucket if p["node_id"] == peer_node_id_hex]
        if existing:
            existing[0]["last_seen"] = time.time()
        elif len(bucket) < 20:
            bucket.append({
                "node_id": peer_node_id_hex,
                "onion": onion_address,
                "port": port,
                "last_seen": time.time()
            })

    def find_closest_nodes(self, target_node_id_hex: str, count: int = 8) -> List[Dict[str, any]]:
        """Return the closest peers to the given target node ID."""
        all_peers = []
        for b in self.k_buckets.values():
            all_peers.extend(b)
        
        target_int = int(target_node_id_hex, 16)
        all_peers.sort(key=lambda p: int(p["node_id"], 16) ^ target_int)
        return all_peers[:count]

if __name__ == "__main__":
    dht = KademliaTorDHT()
    dht.add_peer(hashlib.sha1(b"peer_alpha").hexdigest(), "peeralpha9898v3.onion")
    dht.add_peer(hashlib.sha1(b"peer_beta").hexdigest(), "peerbeta9898v3.onion")
    closest = dht.find_closest_nodes(hashlib.sha1(b"search_target").hexdigest())
    print(f"DHT Initialized: Found {len(closest)} closest peers over Tor")
