import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Zap, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Key,
  Layers,
  Cpu
} from 'lucide-react';
import { simulateQkdSession, testOtpEncryption, QkdSessionResult, QBER_SECURITY_THRESHOLD_PCT } from '../crypto/qkdMeshEngine';

export const QkdEntanglementNetworkPanel: React.FC = () => {
  const [photonCount, setPhotonCount] = useState<number>(32);
  const [eveProbability, setEveProbability] = useState<number>(0.0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionResult, setSessionResult] = useState<QkdSessionResult | null>(null);
  const [plainText, setPlainText] = useState<string>('Quantum Transaction: Transfer 10,000 $9898048483 to Vault-Alpha');
  const [cipherResult, setCipherResult] = useState<{ ciphertextHex: string; decryptedText: string } | null>(null);

  const handleRunQkd = async () => {
    setIsRunning(true);
    try {
      const res = await simulateQkdSession(photonCount, eveProbability);
      setSessionResult(res);
      if (res.isSecure) {
        setCipherResult(testOtpEncryption(plainText, res.derivedOtpKeyHex));
      } else {
        setCipherResult(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    handleRunQkd();
  }, [eveProbability, photonCount]);

  const handleTestEncryption = () => {
    if (sessionResult && sessionResult.isSecure) {
      setCipherResult(testOtpEncryption(plainText, sessionResult.derivedOtpKeyHex));
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              QKD Mesh Entanglement Router (BB84 / E91)
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                Physical Layer Security
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Information-Theoretic Quantum Polarization Key Exchange & Wave Function Collapse Detection
            </p>
          </div>
        </div>

        <button
          onClick={handleRunQkd}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-900/40 disabled:opacity-50 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>Transmit Photon Stream</span>
        </button>
      </div>

      {/* Controls & Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Eavesdropper (Eve) Intercept Probability</span>
            <span className={`font-mono font-bold ${eveProbability > 0.11 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {(eveProbability * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={eveProbability}
            onChange={(e) => setEveProbability(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0% (Clean Air-Gap Channel)</span>
            <span className="text-rose-500">100% (Active Intercept Man-in-the-Middle)</span>
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Photon Emission Batch Size</span>
            <span className="text-cyan-400 font-mono font-bold">{photonCount} Qubits</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[16, 32, 64].map((cnt) => (
              <button
                key={cnt}
                onClick={() => setPhotonCount(cnt)}
                className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                  photonCount === cnt
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {cnt} Photons
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Telemetry & QBER Security Metrics */}
      {sessionResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Quantum Bit Error (QBER)</div>
            <div className={`text-2xl font-black font-mono flex items-center gap-2 ${
              sessionResult.isEveDetected ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {sessionResult.qberPercentage}%
              {sessionResult.isEveDetected ? (
                <ShieldAlert className="w-5 h-5 text-rose-500" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Threshold Limit: <span className="text-slate-300 font-mono">{QBER_SECURITY_THRESHOLD_PCT}%</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Sifted Key Bits</div>
            <div className="text-2xl font-black font-mono text-cyan-400">
              {sessionResult.siftedBitsCount} / {sessionResult.totalPhotonsSent}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Base Coincidence: <span className="text-slate-300 font-mono">{((sessionResult.siftedBitsCount / sessionResult.totalPhotonsSent) * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Eavesdropper Intercept</div>
            <div className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${
              sessionResult.isEveDetected ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {sessionResult.isEveDetected ? (
                <>
                  <Eye className="w-4 h-4 text-rose-400" />
                  Wave Function Collapsed!
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-emerald-400" />
                  Undetected / Secure
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Sample Tested: <span className="text-slate-300 font-mono">{sessionResult.sampleTestedBitsCount} bits</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Derived OTP Key Status</div>
            <div className={`text-xs font-mono font-bold mt-1 break-all ${
              sessionResult.isSecure ? 'text-cyan-400' : 'text-rose-400'
            }`}>
              {sessionResult.isSecure ? '256-Bit OTP Valid' : 'ABORTED (Eve Detected)'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Session: <span className="text-slate-400 font-mono">{sessionResult.sessionId}</span>
            </div>
          </div>
        </div>
      )}

      {/* Derived OTP Key & Live Encryption Test */}
      {sessionResult && sessionResult.isSecure && (
        <div className="p-4 bg-cyan-950/20 border border-cyan-800/40 rounded-xl space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 mb-1">
              <Key className="w-4 h-4" />
              Shared Derived One-Time-Pad (OTP) Key (256-bit SHA-256 Privacy-Amplified)
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-400 break-all select-all">
              {sessionResult.derivedOtpKeyHex}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Plaintext Message to Shield via OTP</label>
              <input
                type="text"
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleTestEncryption}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
              >
                Encrypt & Decrypt Live
              </button>
            </div>

            {cipherResult && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">OTP Ciphertext (Hex) & Verified Decryption</label>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-amber-300 break-all">
                  Ciphertext: {cipherResult.ciphertextHex}
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-emerald-400 break-all flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Decrypted: {cipherResult.decryptedText}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photon Polarization Stream Grid */}
      {sessionResult && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Quantum Photon Polarization Stream
            </span>
            <span>Showing {sessionResult.qubitTrace.length} Qubits</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
            {sessionResult.qubitTrace.map((q) => (
              <div
                key={q.index}
                className={`p-1.5 rounded-lg border text-center text-[10px] font-mono transition-all ${
                  !q.basisMatched
                    ? 'bg-slate-900/50 border-slate-800/40 text-slate-600'
                    : q.bitMatched
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                    : 'bg-rose-950/60 border-rose-800/80 text-rose-400'
                }`}
                title={`Photon #${q.index + 1}: Alice [${q.aliceBasis}] Bit ${q.bit} | Bob [${q.bobBasis}] Bit ${q.bobMeasuredBit} | Eve: ${q.eveIntercepted ? 'Intercepted' : 'None'}`}
              >
                <div className="text-[9px] font-bold">
                  {q.aliceBasis} → {q.bobBasis}
                </div>
                <div className="text-xs font-black">{q.bit}</div>
                <div className="text-[8px]">
                  {q.basisMatched ? (q.bitMatched ? '✓' : '✗ Eve') : 'Discard'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
