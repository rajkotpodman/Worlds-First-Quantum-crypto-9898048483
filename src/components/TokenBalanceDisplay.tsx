import React, { useState, useEffect } from 'react';
import { Wallet, RefreshCw } from 'lucide-react';
import { fetchBalance } from '../db/tokenUtils';

interface TokenBalanceDisplayProps {
  userId: string;
  email?: string;
  onBalanceUpdate?: (bal: string) => void;
}

export const TokenBalanceDisplay: React.FC<TokenBalanceDisplayProps> = ({ userId, email, onBalanceUpdate }) => {
  const [balance, setBalance] = useState('1,000.0000');
  const [loading, setLoading] = useState(false);
  
  const [hwAttached, setHwAttached] = useState<boolean>(true);

  const refresh = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Query server endpoint which checks hardware presence
      const res = await fetch('/api/tokens/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email })
      });
      if (res.ok) {
        const data = await res.json();
        setHwAttached(data.hardwareAttached !== false);
        if (data.balance !== undefined) {
          const num = Number(data.balance);
          const formatted = isNaN(num) ? data.balance : num.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
          setBalance(formatted);
          if (onBalanceUpdate) onBalanceUpdate(formatted);
          return;
        }
      }
    } catch {
      // Offline: do not load 51% from PC
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [userId, email]);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Token Balance</h3>
            <p className="text-xs text-slate-400">Sovereign Clearing Ledger</p>
          </div>
        </div>
        <button 
          onClick={refresh}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          title="Refresh Balance"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>
      <div className="mt-5 flex items-baseline justify-between flex-wrap gap-2">
        <p className={`text-3xl sm:text-4xl font-mono tracking-tight font-extrabold flex items-baseline ${
          hwAttached ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {balance} 
          <span className="text-xs text-slate-400 ml-2 font-sans font-medium">TOK</span>
        </p>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
          hwAttached 
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
            : 'bg-red-950/80 text-red-300 border-red-500/50'
        }`}>
          {hwAttached ? '🟢 eToken Chip Loaded' : '🔴 eToken Detached (Unloaded)'}
        </span>
      </div>
    </div>
  );
};
