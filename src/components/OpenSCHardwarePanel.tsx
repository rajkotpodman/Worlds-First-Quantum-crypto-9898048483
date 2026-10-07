import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Key, 
  ShieldCheck, 
  Terminal, 
  RefreshCw, 
  Unlock, 
  Check, 
  AlertTriangle, 
  FolderGit2, 
  HardDrive,
  ExternalLink,
  Code2
} from 'lucide-react';

interface OpenSCStatus {
  success: boolean;
  integrated: boolean;
  paths: {
    pkcs11Tool: string;
    openscTool: string;
    cardosTool: string;
    pkcs11Module: string;
    isVendored: boolean;
    sourceDir: string;
  };
  readers: string[];
  slotsRaw: string;
  hasConnectedReaders: boolean;
}

export const OpenSCHardwarePanel: React.FC = () => {
  const [status, setStatus] = useState<OpenSCStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'status' | 'cardos' | 'pin_ops'>('status');
  const [cardOsInfo, setCardOsInfo] = useState<string | null>(null);

  // PIN states
  const [oldUserPin, setOldUserPin] = useState<string>('1097145198');
  const [newUserPin, setNewUserPin] = useState<string>('');
  const [oldSoPin, setOldSoPin] = useState<string>('6112721149109714');
  const [newSoPin, setNewSoPin] = useState<string>('');
  const [unlockSoPin, setUnlockSoPin] = useState<string>('6112721149109714');
  const [unlockNewPin, setUnlockNewPin] = useState<string>('1097145198');

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/opensc/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e: any) {
      console.warn('OpenSC status fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCardOsInfo = async () => {
    try {
      const res = await fetch('/api/v1/opensc/cardos-info');
      if (res.ok) {
        const data = await res.json();
        setCardOsInfo(data.details || 'No CardOS response available');
      }
    } catch (e: any) {
      setCardOsInfo('Error reading CardOS info: ' + e.message);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleChangeUserPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldUserPin || !newUserPin) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/opensc/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPin: oldUserPin, newPin: newUserPin })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: '✓ ' + (data.message || 'User PIN successfully updated!') });
        setOldUserPin(newUserPin);
        setNewUserPin('');
      } else {
        setActionMessage({ type: 'error', text: '✖ ' + (data.message || 'Command executed (hardware notice)') });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: 'Error: ' + e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeSoPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldSoPin || !newSoPin) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/opensc/change-so-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldSoPin, newSoPin })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: '✓ ' + (data.message || 'SO PIN successfully updated!') });
        setOldSoPin(newSoPin);
        setNewSoPin('');
      } else {
        setActionMessage({ type: 'error', text: '✖ ' + (data.message || 'Command executed (hardware notice)') });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: 'Error: ' + e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockSoPin || !unlockNewPin) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/opensc/unlock-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soPin: unlockSoPin, newPin: unlockNewPin })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: '✓ ' + (data.message || 'Token unlocked and User PIN initialized!') });
      } else {
        setActionMessage({ type: 'error', text: '✖ ' + (data.message || 'Unlock executed (hardware notice)') });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: 'Error: ' + e.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-cyan-600/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">OpenSC Project Integration</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
                <FolderGit2 className="w-3 h-3" /> Core Vendored
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Embedded Open-Source SmartCard &amp; eToken Pro Engine (CardOS, PKCS#11, PKCS#15)
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Hardware</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'status'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🔍 System &amp; Slots
        </button>
        <button
          onClick={() => {
            setActiveTab('cardos');
            fetchCardOsInfo();
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'cardos'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          💳 Aladdin CardOS Probe
        </button>
        <button
          onClick={() => setActiveTab('pin_ops')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'pin_ops'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🔑 PIN Management &amp; Unlock
        </button>
      </div>

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="text-[11px] text-slate-400 font-medium">Source Integration</div>
              <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>/opensc/src</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Full OpenSC C source tree vendored inside this repository
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="text-[11px] text-slate-400 font-medium">PKCS#11 Tool Executable</div>
              <div className="text-xs font-mono text-cyan-300 truncate" title={status?.paths?.pkcs11Tool}>
                {status?.paths?.pkcs11Tool || 'Locating...'}
              </div>
              <div className="text-[10px] text-slate-500">
                Executable bridge for cryptographic signing &amp; keypair generation
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="text-[11px] text-slate-400 font-medium">Active Module DLL</div>
              <div className="text-xs font-mono text-emerald-300 truncate" title={status?.paths?.pkcs11Module}>
                {status?.paths?.pkcs11Module || 'Locating...'}
              </div>
              <div className="text-[10px] text-slate-500">
                Aladdin / SafeNet PKCS#11 Security Provider
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Raw pkcs11-tool Slot Diagnostic
              </span>
              <span className="text-[10px] font-mono text-slate-500">pkcs11-tool -L</span>
            </div>
            <pre className="p-3 rounded-lg bg-black/60 border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre">
              {status?.slotsRaw || 'Probing slots...'}
            </pre>
          </div>
        </div>
      )}

      {/* CardOS Tab */}
      {activeTab === 'cardos' && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>Aladdin eToken Pro CardOS Driver Diagnostics</span>
            </div>
            <button
              onClick={fetchCardOsInfo}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono"
            >
              cardos-tool -i
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
            {cardOsInfo || 'Probing CardOS on eToken...'}
          </pre>
        </div>
      )}

      {/* PIN Ops Tab */}
      {activeTab === 'pin_ops' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Change User PIN */}
          <form onSubmit={handleChangeUserPin} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>Change User PIN</span>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Current User PIN</label>
              <input
                type="text"
                value={oldUserPin}
                onChange={(e) => setOldUserPin(e.target.value)}
                placeholder="1097145198"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">New User PIN</label>
              <input
                type="text"
                value={newUserPin}
                onChange={(e) => setNewUserPin(e.target.value)}
                placeholder="Enter new 4-16 digit PIN"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading || !newUserPin}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition"
            >
              Update User PIN
            </button>
          </form>

          {/* Change SO PIN */}
          <form onSubmit={handleChangeSoPin} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Change SO / Admin PIN</span>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Current SO PIN</label>
              <input
                type="text"
                value={oldSoPin}
                onChange={(e) => setOldSoPin(e.target.value)}
                placeholder="6112721149109714"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">New SO PIN</label>
              <input
                type="text"
                value={newSoPin}
                onChange={(e) => setNewSoPin(e.target.value)}
                placeholder="Enter new 16-digit SO PIN"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading || !newSoPin}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition"
            >
              Update SO PIN
            </button>
          </form>

          {/* Unlock Token */}
          <form onSubmit={handleUnlockPin} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5 text-rose-400" />
              <span>Unlock / Reset Token</span>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">SO / PUK PIN</label>
              <input
                type="text"
                value={unlockSoPin}
                onChange={(e) => setUnlockSoPin(e.target.value)}
                placeholder="6112721149109714"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">New User PIN to Initialize</label>
              <input
                type="text"
                value={unlockNewPin}
                onChange={(e) => setUnlockNewPin(e.target.value)}
                placeholder="1097145198"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading || !unlockNewPin}
              className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition"
            >
              Unlock Token
            </button>
          </form>
        </div>
      )}

      {/* Action Notification */}
      {actionMessage && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
          actionMessage.type === 'success'
            ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/50 border border-amber-500/40 text-amber-300'
        }`}>
          {actionMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}
    </div>
  );
};
