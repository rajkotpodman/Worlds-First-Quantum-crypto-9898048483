import React, { useState, useEffect } from 'react';
import { Radio, Wifi, Bluetooth, Send, RefreshCw, Layers } from 'lucide-react';
import { scanAirGappedPeers, broadcastGossipPayload, MeshPeerDevice, GossipTransactionPayload } from '../network/meshRadio';

export const AirGappedMeshRadar: React.FC = () => {
  const [peers, setPeers] = useState<MeshPeerDevice[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [gossipQueue, setGossipQueue] = useState<GossipTransactionPayload[]>([]);
  const [txPayload, setTxPayload] = useState<string>('0x_mldsa87_signed_transfer_50_tokens');

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const results = await scanAirGappedPeers();
      setPeers(results);
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleBroadcast = () => {
    if (!txPayload) return;
    const payload = broadcastGossipPayload(txPayload, '0x_pubkey_pqc_9898048483');
    setGossipQueue(prev => [payload, ...prev]);
  };

  useEffect(() => {
    handleScan();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Air-Gapped Sovereign Mesh Radar
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono">
                BLE & Wi-Fi Direct
              </span>
            </h3>
            <p className="text-xs text-slate-400">Off-Grid P2P Gossip Relay Protocol</p>
          </div>
        </div>

        <button
          onClick={handleScan}
          disabled={isScanning}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-indigo-400' : ''}`} />
          {isScanning ? 'Scanning Radios...' : 'Scan Nearby Peers'}
        </button>
      </div>

      {/* Discovered Peer Radios */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Nearby Discovered Sovereign Relays ({peers.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {peers.map((peer) => (
            <div key={peer.deviceId} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  {peer.radioMedium.includes('BLE') ? (
                    <Bluetooth className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  )}
                  {peer.deviceId}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-bold">
                  {peer.rssiDb} dBm
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                <span>TX Power: {peer.txPower} dBm</span>
                <span className="text-indigo-400">Queue: {peer.pendingGossipMessagesCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gossip Broadcast Form */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-400" />
          Broadcast Off-Grid PQC Transaction
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={txPayload}
            onChange={(e) => setTxPayload(e.target.value)}
            className="flex-grow bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
            placeholder="0x_signed_pqc_payload"
          />
          <button
            onClick={handleBroadcast}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            Gossip Broadcast
          </button>
        </div>
      </div>

      {/* Gossip Queue Logs */}
      {gossipQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Store-and-Forward Gossip Ledger ({gossipQueue.length})
          </h4>
          <div className="space-y-2">
            {gossipQueue.map((g) => (
              <div key={g.gossipId} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-indigo-400 font-bold">{g.gossipId}</span>
                <span className="text-slate-300 truncate max-w-xs">{g.txBlobHex}</span>
                <span className="text-slate-500">Hops: {g.hopCount}/{g.maxHops}</span>
                <span className="text-emerald-400">PQC Verified ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
