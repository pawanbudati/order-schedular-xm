import React from 'react';
import { Wallet, ShieldAlert, ArrowUpRight, Percent, RefreshCw } from 'lucide-react';
import { AccountBalance, Ticker } from '../types';

interface BalanceCardProps {
  balance: AccountBalance | null;
  selectedTicker: Ticker | null;
  leverage: number;
  onSelectPercentage: (percentage: number) => void;
  onRefreshBalance: () => void;
  isLoading: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  selectedTicker,
  leverage,
  onSelectPercentage,
  onRefreshBalance,
  isLoading,
}) => {
  const availMargin = balance?.availableMargin || 0;
  const currentPrice = selectedTicker?.lastPrice || 1;
  const maxPurchasingPowerUsdt = availMargin * leverage;
  const maxContracts = currentPrice > 0 ? maxPurchasingPowerUsdt / currentPrice : 0;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between gap-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">XM Account Margin</h3>
            <p className="text-[11px] text-slate-400">MetaTrader Balance & Equity</p>
          </div>
        </div>

        <button
          onClick={onRefreshBalance}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 disabled:opacity-50"
          title="Refresh Balance"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Balance Numbers */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 bg-slate-900/60 p-3 sm:p-3.5 rounded-xl border border-slate-800/80">
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Free Margin ({balance?.currency || 'USD'})</span>
          <div className="text-base sm:text-xl font-bold text-white font-mono mt-0.5 truncate">
            ${availMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Purchasing Power ({leverage}x)</span>
          <div className="text-base sm:text-xl font-bold text-cyan-400 font-mono mt-0.5 truncate">
            ${maxPurchasingPowerUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Symbol Max Buy Info & Quick Allocation Buttons */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Max Lots ({selectedTicker?.symbol || 'XAUUSD'}):</span>
          <span className="font-mono text-slate-200 font-semibold">
            ~{maxContracts < 1 ? maxContracts.toFixed(2) : maxContracts.toFixed(1)} Lots
          </span>
        </div>

        {/* % Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => onSelectPercentage(pct)}
              className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-slate-800/90 hover:bg-cyan-500 hover:text-black hover:shadow-lg hover:shadow-cyan-500/20 text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-1"
            >
              <span>{pct}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
