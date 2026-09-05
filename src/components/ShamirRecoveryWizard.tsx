import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Copy, Check, RefreshCw, Languages, FileText } from 'lucide-react';
import { splitSecretShamir3of5, recoverSecretFromShards, ShamirShard } from '../crypto/mnemonicRecovery';

export const ShamirRecoveryWizard: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'SPLIT' | 'RESTORE'>('SPLIT');
  const [seedInput, setSeedInput] = useState<string>('0x9898048483abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
  const [language, setLanguage] = useState<'en' | 'es' | 'ja' | 'zh'>('en');
  const [shards, setShards] = useState<ShamirShard[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Restore state
  const [selectedShardsForRestore, setSelectedShardsForRestore] = useState<number[]>([1, 2, 3]);
  const [restoredKey, setRestoredKey] = useState<string | null>(null);

  const handleGenerateShards = () => {
    const generated = splitSecretShamir3of5(seedInput, language);
    setShards(generated);
    setRestoredKey(null);
  };

  const handleCopyShard = (index: number, words: string[]) => {
    navigator.clipboard.writeText(`Card #${index} (3-of-5 Threshold): ${words.join(' ')}`);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleRestore = () => {
    if (shards.length < 3) {
      // Generate default if not present
      const generated = splitSecretShamir3of5(seedInput, language);
      setShards(generated);
      const chosen = generated.filter(s => selectedShardsForRestore.includes(s.index));
      const res = recoverSecretFromShards(chosen);
      setRestoredKey(res.restoredSeedHex);
    } else {
      const chosen = shards.filter(s => selectedShardsForRestore.includes(s.index));
      try {
        const res = recoverSecretFromShards(chosen);
        setRestoredKey(res.restoredSeedHex);
      } catch (e) {
        setRestoredKey(`Error: ${String(e)}`);
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              SLIP-0039 Shamir Secret Sharing
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-mono">
                3-of-5 Threshold
              </span>
            </h3>
            <p className="text-xs text-slate-400">Post-Quantum Key Sharding & Paper Card Backup Engine</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveMode('SPLIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeMode === 'SPLIT' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Split Seed (5 Cards)
          </button>
          <button
            onClick={() => setActiveMode('RESTORE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeMode === 'RESTORE' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Restore Seed (3 Cards)
          </button>
        </div>
      </div>

      {activeMode === 'SPLIT' ? (
        <div className="space-y-5">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Master Secret Hex</label>
              <input
                type="text"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" /> Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none"
              >
                <option value="en">English (BIP-39)</option>
                <option value="es">Español (BIP-39)</option>
                <option value="ja">日本語 (BIP-39)</option>
                <option value="zh">中文 (BIP-39)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateShards}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            Generate 5 Sharded Backup Cards (Threshold: 3)
          </button>

          {/* Shards Cards Display */}
          {shards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {shards.map((s) => (
                <div key={s.index} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 relative group">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-amber-400 font-mono">Card #{s.index} of 5</span>
                    <button
                      onClick={() => handleCopyShard(s.index, s.words)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Copy Card Words"
                    >
                      {copiedIdx === s.index ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.words.map((w, wIdx) => (
                      <span key={wIdx} className="px-2 py-1 bg-slate-800/90 text-slate-200 rounded font-mono text-xs">
                        <strong className="text-slate-500 mr-1">{wIdx + 1}.</strong>{w}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                    <span>CRC: {s.checksum}</span>
                    <span>3 Needed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Restore Mode */
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Select Any 3 Cards to Reconstruct Master Secret
            </h4>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((idx) => {
                const isSelected = selectedShardsForRestore.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isSelected) {
                        if (selectedShardsForRestore.length > 3) {
                          setSelectedShardsForRestore(selectedShardsForRestore.filter(i => i !== idx));
                        }
                      } else {
                        setSelectedShardsForRestore([...selectedShardsForRestore, idx]);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border border-amber-400'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    Card #{idx} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleRestore}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reconstruct Master Seed from Selected {selectedShardsForRestore.length} Shards
          </button>

          {restoredKey && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-1">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Restored 256-Bit Master Seed</div>
              <p className="text-xs font-mono font-bold text-slate-100 break-all">{restoredKey}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
