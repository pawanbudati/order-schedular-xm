import React, { useState } from 'react';
import { Wallet, ShieldAlert, ArrowUpRight, Percent, RefreshCw, Layers } from 'lucide-react';
import { AccountBalance, Ticker } from '../types';

interface BalanceCardProps {
  balance: AccountBalance | null;
  selectedTicker: Ticker | null;
  leverage: number;
  onSelectPercentage: (percentage: number) => void;
  onRefreshBalance: () => void;
  isLoading: boolean;
}

const getContractSize = (symbol?: string): number => {
  if (!symbol) return 100;
  const s = symbol.toUpperCase();
  if (s.includes('XAU') || s.includes('GOLD')) return 100; // 1 Lot = 100 oz (0.01 Lot = 1 oz)
  if (s.includes('EUR') || s.includes('GBP') || s.includes('AUD') || s.includes('USD') || s.includes('CAD') || s.includes('NZD') || s.includes('CHF') || s.includes('JPY')) {
    if (!s.includes('US30') && !s.includes('US500') && !s.includes('USTECH') && !s.includes('BTC') && !s.includes('ETH')) {
      return 100000; // 1 Lot = 100,000 units for Forex pairs
    }
  }
  return 1;
};

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  selectedTicker,
  leverage,
  onSelectPercentage,
  onRefreshBalance,
  isLoading,
}) => {
  const [allocPct, setAllocPct] = useState<number>(50);

  const availMargin = balance?.availableMargin || balance?.equity || 0;
  const usedMargin = balance?.usedMargin || 0;
  const totalBalance = balance?.balance || 0;
  const currentPrice = selectedTicker?.lastPrice || 1;
  const maxPurchasingPowerUsdt = availMargin * leverage;

  const contractSize = getContractSize(selectedTicker?.symbol);
  const marginPerLot = (contractSize * currentPrice) / (leverage || 1);
  const maxLots = marginPerLot > 0 ? availMargin / marginPerLot : 0;

  const marginUtilizedPct = totalBalance > 0 ? Math.min(100, Math.max(0, (usedMargin / totalBalance) * 100)) : 0;

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex flex-col justify-between gap-3.5 sm:gap-4 transition-colors duration-300">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/10 light:bg-cyan-100 border border-cyan-500/30 light:border-cyan-300 flex items-center justify-center text-cyan-400 dark:text-cyan-400 light:text-cyan-700 shadow-sm">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">XM Margin Overview</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500">Live MetaTrader Account Equity</p>
          </div>
        </div>

        <button
          onClick={onRefreshBalance}
          disabled={isLoading}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 transition-all border border-slate-800 dark:border-slate-800 light:border-slate-300 disabled:opacity-50 shadow-sm"
          title="Refresh Balance"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400 dark:text-cyan-400 light:text-cyan-600' : ''}`} />
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 bg-slate-900/70 dark:bg-slate-900/70 light:bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold">Free Margin ({balance?.currency || 'USD'})</span>
          <div className="text-sm sm:text-lg font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono mt-0.5 truncate">
            ${availMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold">Purchasing Power ({leverage}x)</span>
          <div className="text-sm sm:text-lg font-bold text-cyan-400 dark:text-cyan-400 light:text-cyan-700 font-mono mt-0.5 truncate">
            ${maxPurchasingPowerUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Margin Usage Progress Bar */}
      {totalBalance > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold">
            <span>Used Margin ({marginUtilizedPct.toFixed(1)}%)</span>
            <span>${usedMargin.toFixed(2)} / ${totalBalance.toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-800 dark:bg-slate-800 light:bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                marginUtilizedPct > 80
                  ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                  : marginUtilizedPct > 50
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${marginUtilizedPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Max Lot Allocation Shortcuts & Slider */}
      <div className="pt-2 border-t border-slate-800/40 dark:border-slate-800/40 light:border-slate-200 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold">
          <span>Quick Lot Allocation ({selectedTicker?.symbol || 'XAUUSD'}):</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-cyan-400 dark:text-cyan-400 light:text-cyan-700 font-bold text-xs">{allocPct}%</span>
            <span className="text-slate-400 dark:text-slate-400 light:text-slate-500">
              (~{(maxLots * (allocPct / 100)).toFixed(2)} Lots)
            </span>
          </div>
        </div>

        {/* Percentage Slider */}
        <div className="px-0.5">
          <input
            type="range"
            min="1"
            max="100"
            value={allocPct}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setAllocPct(val);
              onSelectPercentage(val);
            }}
            className="w-full h-1.5 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-400 dark:accent-cyan-400 light:accent-cyan-600"
          />
        </div>

        {/* Quick Allocation Percent Chips (25%, 50%, 75%, 90%, 100%) */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {[25, 50, 75, 90, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => {
                setAllocPct(pct);
                onSelectPercentage(pct);
                const el = document.getElementById('schedule-order-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`py-1.5 px-1 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center ${
                allocPct === pct
                  ? 'bg-cyan-500 dark:bg-cyan-500 light:bg-cyan-600 text-slate-950 dark:text-slate-950 light:text-white shadow-sm border border-cyan-400 dark:border-cyan-400 light:border-cyan-600 font-extrabold'
                  : 'bg-slate-900 dark:bg-slate-900 light:bg-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 border border-slate-800 dark:border-slate-800 light:border-slate-300'
              }`}

            >
              <span>{pct}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
