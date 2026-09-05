import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { fetchTransactionHistory } from '../db/tokenUtils';

interface Transaction {
  id: string;
  amount: string;
  type: 'mint' | 'spend';
  actionType?: string;
  timestamp: string;
  proofHash?: string;
}

interface TokenTransactionHistoryProps {
  userId: string;
}

export const TokenTransactionHistory: React.FC<TokenTransactionHistoryProps> = ({ userId }) => {
  const [history, setHistory] = useState<Transaction[]>([]);
  
  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/tokens/history?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.history && data.history.length > 0) {
          setHistory(data.history);
          return;
        }
      }
    } catch {
      // Offline fallback
    }

    try {
      const localHistory = await fetchTransactionHistory(userId, 20);
      setHistory(localHistory as Transaction[]);
    } catch (e) {
      console.error('[TokenTransactionHistory] Error loading history:', e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userId]);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 shadow-xl flex flex-col h-[400px]">
      <div className="flex items-center gap-3 mb-6">
        <History className="text-blue-400" size={24} />
        <h3 className="text-lg font-bold text-slate-100">Transaction History</h3>
      </div>
      <div className="overflow-y-auto flex-grow space-y-2 pr-2">
        {history.length === 0 ? (
          <p className="text-slate-500 text-center mt-10">No transactions yet.</p>
        ) : (
          history.map(tx => (
            <div key={tx.id} className="bg-slate-800/50 p-4 rounded-lg flex justify-between items-center font-mono text-sm border border-slate-700/50">
              <span className={`px-2 py-0.5 rounded text-xs ${tx.type === 'mint' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {tx.type.toUpperCase()}
              </span>
              <span className="text-slate-100 font-bold">{tx.amount}</span>
              <span className="text-slate-500 text-xs">{new Date(tx.timestamp).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
