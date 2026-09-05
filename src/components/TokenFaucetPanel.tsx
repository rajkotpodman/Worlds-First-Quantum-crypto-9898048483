import React, { useState } from 'react';
import { Droplet, Cpu, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { claimCommunityFaucet } from '../defi/tokenFaucet';
import { updateBalance } from '../db/tokenUtils';

interface TokenFaucetPanelProps {
  userId: string;
}

export const TokenFaucetPanel: React.FC<TokenFaucetPanelProps> = ({ userId }) => {
  const [isMining, setIsMining] = useState<boolean>(false);
  const [claimResult, setClaimResult] = useState<string | null>(null);
  const [claimedSuccessfully, setClaimedSuccessfully] = useState<boolean>(false);

  const handleClaimFaucet = async () => {
    setIsMining(true);
    setClaimResult(null);

    try {
      // Simulate Argon2id Proof of Work computation
      const claimRes = await claimCommunityFaucet('hwid_argon2id_' + userId, 42);
      if (claimRes.success) {
        await updateBalance(userId, claimRes.claimedAmount.toFixed(4), 'mint', 'FAUCET_POW_GRANT');
        setClaimedSuccessfully(true);
        setClaimResult(`Proof-of-Work verified! +${claimRes.claimedAmount} TOK successfully claimed and credited to your ledger.`);
      } else {
        setClaimResult('Faucet claim failed or cooldown active.');
      }
    } catch (e) {
      setClaimResult(`Error: ${String(e)}`);
    } finally {
      setIsMining(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Sybil-Resistant Token Faucet
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 font-mono">
                Argon2id PoW
              </span>
            </h3>
            <p className="text-xs text-slate-400">Rate-Limited Decentralized Community Onboarding Drop</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400 font-medium">Daily Grant</div>
          <div className="text-sm font-mono font-bold text-blue-400">+25.0000 TOK</div>
        </div>
      </div>

      {/* Proof of Work Challenge Box */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-blue-400" />
            Hardware Proof-of-Work Challenge
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/80 text-blue-300 font-mono">
            Target: 00... Argon2id
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Computes a brief client-side cryptographic hashing proof to prevent bot farming while allowing real sovereign nodes to claim daily compute gas.
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={handleClaimFaucet}
        disabled={isMining || claimedSuccessfully}
        className={`w-full py-3.5 px-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-xl transition ${
          claimedSuccessfully
            ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
            : isMining
            ? 'bg-blue-700 opacity-70 cursor-wait'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
        }`}
      >
        {isMining ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
            Solving Argon2id Proof-of-Work Challenge...
          </>
        ) : claimedSuccessfully ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Claimed for Today (24-Hour Cooldown Active)
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            Solve Challenge & Claim +25.0000 TOK
          </>
        )}
      </button>

      {/* Feedback Notice */}
      {claimResult && (
        <div className={`p-4 rounded-xl text-xs font-mono ${
          claimResult.startsWith('Proof-of-Work')
            ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
            : 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
        }`}>
          {claimResult}
        </div>
      )}
    </div>
  );
};
