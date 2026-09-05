import React, { useState } from 'react';
import { TokenBalanceDisplay } from './TokenBalanceDisplay';
import { TokenTransactionHistory } from './TokenTransactionHistory';
import { HelpCircle, X } from 'lucide-react';

interface TokenDashboardProps {
  userId: string;
}

export const TokenDashboard: React.FC<TokenDashboardProps> = ({ userId }) => {
  const [showPolicy, setShowPolicy] = useState(false);
  const [policyText, setPolicyText] = useState('');

  const loadPolicy = async () => {
    try {
      const res = await fetch('/static/token-policy.txt');
      if (res.ok) {
        const text = await res.text();
        setPolicyText(text);
        setShowPolicy(true);
        return;
      }
    } catch {
      // Offline fallback
    }
    setPolicyText(`================================================================================
          AI SECURE SPACE & SOVEREIGN NODE — REWARD POLICY (2026-2030)
================================================================================

1. OVERVIEW
Tokens (TOK) within the AI Secure Space ecosystem represent sovereign compute 
and participation units. Users earn tokens purely through verifiable actions.

2. REWARD SCHEDULE
- Android APK Build (Clean CI/CD): +50.0000 TOK
- NIST L5 Quantum Verification:    +25.0000 TOK
- Biometric Device Registration:   +100.0000 TOK
- Welcome / New Node Registration: +1,000.0000 TOK

3. SETTLEMENT & LIQUIDITY
Master Stake: india9898048483@gmail.com (+91 9898048483)
Official Store: https://wa.me/c/919898048483
================================================================================`);
    setShowPolicy(true);
  };

  return (
    <div className="p-8 space-y-8 bg-zinc-950 min-h-screen relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-100">Token Management Dashboard</h2>
        <button onClick={loadPolicy} className="text-slate-400 hover:text-slate-200">
          <HelpCircle size={24} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <TokenBalanceDisplay userId={userId} />
        </div>
        <div className="lg:col-span-2">
          <TokenTransactionHistory userId={userId} />
        </div>
      </div>

      {showPolicy && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-lg w-full relative">
            <button onClick={() => setShowPolicy(false)} className="absolute top-4 right-4 text-slate-400">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-slate-100 mb-4">Reward Policy</h3>
            <pre className="text-slate-300 font-sans whitespace-pre-wrap">{policyText}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
