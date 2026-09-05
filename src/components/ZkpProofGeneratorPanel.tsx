import React, { useState } from 'react';
import { EyeOff, ShieldCheck, Cpu, RefreshCw, Copy, Check, FileCode, Sparkles } from 'lucide-react';
import { generateZeroKnowledgeProof, verifyZeroKnowledgeProof, ZkProofResult } from '../zkp/snarkjsProofEngine';
import { generateGroth16Proof, ZKProofResponse } from '../lib/zkpClient';

export const ZkpProofGeneratorPanel: React.FC = () => {
  const [proofMode, setProofMode] = useState<'solvency' | 'mixer'>('solvency');
  const [privateBalance, setPrivateBalance] = useState<string>('1500');
  const [thresholdReq, setThresholdReq] = useState<string>('500');
  const [mixerSecret, setMixerSecret] = useState<string>('9898048483deadbeef');
  const [mixerNullifier, setMixerNullifier] = useState<string>('c0ffee1234567890');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [proofResult, setProofResult] = useState<ZkProofResult | null>(null);
  const [mixerResult, setMixerResult] = useState<ZKProofResponse | null>(null);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerateProof = async () => {
    setIsGenerating(true);
    setVerificationResult(null);
    try {
      if (proofMode === 'solvency') {
        const res = await generateZeroKnowledgeProof(parseFloat(privateBalance) || 0, parseFloat(thresholdReq) || 0);
        setProofResult(res);
        setMixerResult(null);
        const ver = await verifyZeroKnowledgeProof(res);
        setVerificationResult(`Proof Verified in ${ver.verificationTimeMs}ms (Valid: ${ver.valid ? 'True ✓' : 'False'})`);
      } else {
        const res = await generateGroth16Proof(mixerSecret || '123', mixerNullifier || '456');
        setMixerResult(res);
        setProofResult(null);
        setVerificationResult(`Mixer Groth16 Proof Generated (Curve BN128, Public Signals: ${res.publicSignals.join(', ')})`);
      }
    } catch (err) {
      setVerificationResult(`ZKP Error: ${String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };


  const handleCopyProofJson = () => {
    if (!proofResult) return;
    navigator.clipboard.writeText(JSON.stringify(proofResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl text-fuchsia-400">
            <EyeOff className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Zero-Knowledge Proof Generator
              <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-800 font-mono">
                Groth16 / BN128
              </span>
            </h3>
            <p className="text-xs text-slate-400">Client-Side Circom & SnarkJS Solvency & Action Prover</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400 font-medium">Circuit Architecture</div>
          <div className="text-xs font-mono font-bold text-fuchsia-400">Poseidon Hash + BN128 R1CS</div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
        <button
          onClick={() => setProofMode('solvency')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
            proofMode === 'solvency' ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Solvency &amp; Threshold Prover
        </button>
        <button
          onClick={() => setProofMode('mixer')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
            proofMode === 'mixer' ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mixer Deposit &amp; Nullifier Prover
        </button>
      </div>

      {/* Input Parameters */}
      {proofMode === 'solvency' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <label className="text-xs font-bold text-slate-400 flex items-center justify-between">
              <span>Private User Balance (Hidden Witness)</span>
              <span className="text-slate-500 font-mono">Secret</span>
            </label>
            <input
              type="number"
              value={privateBalance}
              onChange={(e) => setPrivateBalance(e.target.value)}
              className="w-full bg-transparent font-mono text-xl font-bold text-slate-100 focus:outline-none"
              placeholder="1500"
            />
            <p className="text-[11px] text-slate-500">Never transmitted to server or leaked on-chain.</p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <label className="text-xs font-bold text-slate-400 flex items-center justify-between">
              <span>Required Threshold (Public Signal)</span>
              <span className="text-fuchsia-400 font-mono">Public</span>
            </label>
            <input
              type="number"
              value={thresholdReq}
              onChange={(e) => setThresholdReq(e.target.value)}
              className="w-full bg-transparent font-mono text-xl font-bold text-slate-100 focus:outline-none"
              placeholder="500"
            />
            <p className="text-[11px] text-slate-500">Public statement proven without revealing exact balance.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <label className="text-xs font-bold text-slate-400 flex items-center justify-between">
              <span>Private Deposit Secret (Hex)</span>
              <span className="text-slate-500 font-mono">Witness</span>
            </label>
            <input
              type="text"
              value={mixerSecret}
              onChange={(e) => setMixerSecret(e.target.value)}
              className="w-full bg-transparent font-mono text-sm font-bold text-slate-100 focus:outline-none"
              placeholder="9898048483deadbeef"
            />
            <p className="text-[11px] text-slate-500">Shielded private key for zero-knowledge withdrawal.</p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <label className="text-xs font-bold text-slate-400 flex items-center justify-between">
              <span>Private Nullifier (Hex)</span>
              <span className="text-fuchsia-400 font-mono">Nullifier</span>
            </label>
            <input
              type="text"
              value={mixerNullifier}
              onChange={(e) => setMixerNullifier(e.target.value)}
              className="w-full bg-transparent font-mono text-sm font-bold text-slate-100 focus:outline-none"
              placeholder="c0ffee1234567890"
            />
            <p className="text-[11px] text-slate-500">Prevents double-spend while keeping identity anonymous.</p>
          </div>
        </div>
      )}

      {/* Generate Action Button */}
      <button
        onClick={handleGenerateProof}
        disabled={isGenerating}
        className="w-full py-3.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Computing R1CS Witness &amp; BN128 Groth16 Proof...
          </>
        ) : (
          <>
            <Cpu className="w-4 h-4" />
            Generate Zero-Knowledge Proof (SnarkJS / Circom)
          </>
        )}
      </button>

      {/* Proof Results Display */}
      {(proofResult || mixerResult) && (
        <div className="space-y-4 pt-2">
          {/* Verification Badge */}
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-300">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4" />
              {verificationResult || 'Groth16 Proof Verified Valid ✓'}
            </span>
          </div>

          {/* Proof JSON Block */}
          <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2 relative group">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-fuchsia-400">
                <FileCode className="w-4 h-4" />
                Proof Payload (pi_a, pi_b, pi_c)
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(proofResult?.proof || mixerResult?.proof, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-[11px] transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Proof JSON'}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
              {JSON.stringify(proofResult?.proof || mixerResult?.proof, null, 2)}
            </pre>
            <div className="text-[10px] text-slate-500 font-mono flex justify-between pt-1">
              <span>Public Signals: {JSON.stringify(proofResult?.publicSignals || mixerResult?.publicSignals)}</span>
              <span>Curve: BN128</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
