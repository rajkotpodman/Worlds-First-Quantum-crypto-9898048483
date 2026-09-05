import React, { useState } from 'react';
import { ArrowDownUp, RefreshCw, Shield, Zap, TrendingUp } from 'lucide-react';
import { calculateSwapOutput, getInitialAMMPoolState, AMMPoolState } from '../defi/ammPool';
import { updateBalance, fetchBalance } from '../db/tokenUtils';

interface AmmSwapPanelProps {
  userId: string;
}

export const AmmSwapPanel: React.FC<AmmSwapPanelProps> = ({ userId }) => {
  const [poolState, setPoolState] = useState<AMMPoolState>(getInitialAMMPoolState());
  const [amountIn, setAmountIn] = useState<string>('100');
  const [isTokenIn, setIsTokenIn] = useState<boolean>(true);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapResult, setSwapResult] = useState<string | null>(null);

  const numIn = parseFloat(amountIn) || 0;
  const quote = calculateSwapOutput(numIn, isTokenIn, poolState);

  const handleSwap = async () => {
    if (numIn <= 0) return;
    setIsSwapping(true);
    setSwapResult(null);

    try {
      if (isTokenIn) {
        // Spend TOK and gain sUSDC
        await updateBalance(userId, numIn.toFixed(4), 'spend', 'AMM_SWAP_TOK_TO_sUSDC');
        setSwapResult(`Success: Swapped ${numIn} TOK for $${quote.expectedAmountOut} sUSDC at 0.3% pool fee.`);
      } else {
        // Mint TOK from sUSDC swap
        await updateBalance(userId, quote.expectedAmountOut.toFixed(4), 'mint', 'AMM_SWAP_sUSDC_TO_TOK');
        setSwapResult(`Success: Swapped $${numIn} sUSDC for ${quote.expectedAmountOut} TOK.`);
      }

      // Update local pool state
      setPoolState(prev => ({
        ...prev,
        reserveToken9898: isTokenIn ? prev.reserveToken9898 + numIn : prev.reserveToken9898 - quote.expectedAmountOut,
        reserveShieldedUSDC: isTokenIn ? prev.reserveShieldedUSDC - quote.expectedAmountOut : prev.reserveShieldedUSDC + numIn
      }));
    } catch (err) {
      setSwapResult(`Swap Error: ${String(err)}`);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <ArrowDownUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Shielded AMM Swap Pool
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                x · y = k
              </span>
            </h3>
            <p className="text-xs text-slate-400">Decentralized Constant-Product Liquidity Pool</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 font-medium">Floor Valuation Ratio</div>
          <div className="text-sm font-mono font-bold text-emerald-400">
            1 TOK = ${(poolState.reserveShieldedUSDC / poolState.reserveToken9898).toFixed(4)} sUSDC
          </div>
        </div>
      </div>

      {/* Reserves Summary Card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Pool Reserve (TOK)</span>
          <p className="text-sm font-mono font-bold text-slate-200 mt-0.5">
            {poolState.reserveToken9898.toLocaleString()} TOK
          </p>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Shielded Reserve</span>
          <p className="text-sm font-mono font-bold text-slate-200 mt-0.5">
            ${poolState.reserveShieldedUSDC.toLocaleString()} sUSDC
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Anti-Sandwich Fee</span>
          <p className="text-sm font-mono font-bold text-cyan-400 mt-0.5">0.3% Protocol Burn</p>
        </div>
      </div>

      {/* Swap Input Form */}
      <div className="space-y-4">
        {/* From Box */}
        <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>You Pay</span>
            <span>Asset: {isTokenIn ? 'TOK-9898048483' : 'Shielded sUSDC'}</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="w-full bg-transparent font-mono text-2xl font-bold text-slate-100 focus:outline-none"
              placeholder="0.00"
            />
            <span className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 font-bold text-sm">
              {isTokenIn ? 'TOK' : 'sUSDC'}
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={() => setIsTokenIn(!isTokenIn)}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition transform hover:scale-105"
            title="Invert Swap Direction"
          >
            <ArrowDownUp className="w-4 h-4" />
          </button>
        </div>

        {/* To Box */}
        <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>You Receive (Estimated)</span>
            <span>Asset: {!isTokenIn ? 'TOK-9898048483' : 'Shielded sUSDC'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-full font-mono text-2xl font-bold text-emerald-400">
              {quote.expectedAmountOut.toLocaleString(undefined, { minimumFractionDigits: 4 })}
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 font-bold text-sm">
              {!isTokenIn ? 'TOK' : 'sUSDC'}
            </span>
          </div>
        </div>

        {/* Trade Details */}
        <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs space-y-1.5 font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Price Impact:</span>
            <span className={quote.priceImpactPercent > 5 ? 'text-rose-400' : 'text-emerald-400'}>
              {quote.priceImpactPercent}%
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Liquidity Provider Fee:</span>
            <span className="text-slate-200">{quote.feeAmount} {isTokenIn ? 'TOK' : 'sUSDC'}</span>
          </div>
        </div>

        {/* Swap Action Button */}
        <button
          onClick={handleSwap}
          disabled={isSwapping || numIn <= 0}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-xl transition ${
            isSwapping || numIn <= 0
              ? 'bg-slate-700 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500'
          }`}
        >
          {isSwapping ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Executing Cryptographic Settlement...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Swap Now via Shielded AMM
            </>
          )}
        </button>

        {/* Feedback Message */}
        {swapResult && (
          <div className={`p-3 rounded-lg text-xs font-mono ${
            swapResult.startsWith('Success') ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300' : 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
          }`}>
            {swapResult}
          </div>
        )}
      </div>
    </div>
  );
};
