import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Layers, Send, TrendingUp, TrendingDown, AlertCircle, Eye, ShieldCheck, UserCheck } from 'lucide-react';
import { Ticker, AccountConfig } from '../types';

interface OrderFormProps {
  userRole: 'ADMIN' | 'GUEST';
  tickers: Ticker[];
  selectedTicker: Ticker | null;
  onSelectTicker: (ticker: Ticker) => void;
  quantity: string;
  setQuantity: (val: string) => void;
  leverage: number;
  setLeverage: (val: number) => void;
  accounts?: AccountConfig[];
  activeAccountId?: string;
  onSubmitSchedule: (orderData: {
    symbol: string;
    side: 'BUY' | 'SELL';
    positionSide?: 'LONG' | 'SHORT' | 'BOTH';
    type: 'MARKET' | 'LIMIT';
    price?: number;
    quantity: number;
    leverage: number;
    targetTime: number;
    stopLoss?: number;
    takeProfit?: number;
    accountId?: string;
    accountName?: string;
    serverName?: string;
    terminalPath?: string;
  }) => Promise<void>;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  userRole,
  tickers,
  selectedTicker,
  onSelectTicker,
  quantity,
  setQuantity,
  leverage,
  setLeverage,
  accounts = [],
  activeAccountId = '',
  onSubmitSchedule,
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(activeAccountId);

  useEffect(() => {
    if (activeAccountId && !selectedAccountId) {
      setSelectedAccountId(activeAccountId);
    }
  }, [activeAccountId]);

  // Date and Time state
  const [targetDate, setTargetDate] = useState<string>('');
  const [targetTimeStr, setTargetTimeStr] = useState<string>('');
  const [targetMsStr, setTargetMsStr] = useState<string>('000');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Set default target time to +30 seconds from now
  useEffect(() => {
    setOffsetSeconds(30);
  }, []);

  // Set target date/time relative to now in IST timezone
  const setOffsetSeconds = (secondsToAdd: number) => {
    const future = new Date(Date.now() + secondsToAdd * 1000);
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(future);

    const map: Record<string, string> = {};
    parts.forEach(p => { map[p.type] = p.value; });

    setTargetDate(`${map.year}-${map.month}-${map.day}`);
    setTargetTimeStr(`${map.hour}:${map.minute}:${map.second}`);
    setTargetMsStr(String(future.getMilliseconds()).padStart(3, '0'));
  };

  const getComputedTargetTimestamp = (): number | null => {
    if (!targetDate || !targetTimeStr) return null;
    try {
      const [year, month, day] = targetDate.split('-').map(Number);
      const [hours, minutes, seconds] = targetTimeStr.split(':').map(Number);
      const milliseconds = parseInt(targetMsStr || '0', 10);

      const d = new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
      return d.getTime();
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedTicker) {
      setErrorMsg('Please select a trading instrument.');
      return;
    }

    const computedTs = getComputedTargetTimestamp();
    if (!computedTs) {
      setErrorMsg('Invalid target execution date or time.');
      return;
    }

    if (computedTs <= Date.now()) {
      setErrorMsg('Target execution time must be in the future.');
      return;
    }

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMsg('Please enter a valid order volume (lots).');
      return;
    }

    const targetAccObj = accounts.find((a) => a.id === selectedAccountId || a.accountId === selectedAccountId);

    setIsSubmitting(true);
    try {
      await onSubmitSchedule({
        symbol: selectedTicker.symbol,
        side,
        positionSide: side === 'BUY' ? 'LONG' : 'SHORT',
        type: orderType,
        price: orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : undefined,
        quantity: parsedQty,
        leverage,
        targetTime: computedTs,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
        accountId: targetAccObj?.accountId || selectedAccountId || activeAccountId,
        accountName: targetAccObj?.accountName,
        serverName: targetAccObj?.serverName,
        terminalPath: targetAccObj?.terminalPath,
      });

      // Scroll smoothly to Orders Queue after scheduling
      const el = document.getElementById('orders-queue-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to schedule order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const computedTs = getComputedTargetTimestamp();
  const timeRemainingMs = computedTs ? computedTs - Date.now() : null;

  return (
    <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-800/80 flex flex-col gap-3.5 sm:gap-4 transition-colors duration-300">
      {/* Header & Side Tabs */}
      <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800/60 pb-3 gap-2">
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Schedule Order
        </h2>

        {/* Side Selector Tabs (BUY / SELL) */}
        <div className="flex bg-slate-200 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-300 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 active:scale-95 ${
              side === 'BUY'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md font-black'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>BUY</span>
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 active:scale-95 ${
              side === 'SELL'
                ? 'bg-rose-600 dark:bg-rose-500 text-white shadow-md font-black'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>SELL</span>
          </button>
        </div>
      </div>

      {userRole === 'GUEST' && (
        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-400 text-xs flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
            <span><strong>Guest Sandbox Mode:</strong> Orders are simulated locally (no live MT5 trades placed).</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-400 text-xs flex items-center gap-2 animate-shake font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-700 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Account & Instrument Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {/* Target Account Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-300 mb-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-cyan-500" /> Target MT5 Account
            </label>
            <select
              value={selectedAccountId || activeAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/90 border border-slate-400 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500 transition-all shadow-sm"
            >
              {accounts.length > 0 ? (
                accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {acc.accountName || `MT5 Account ${acc.accountId}`} (#{acc.accountId})
                  </option>
                ))
              ) : (
                <option value={activeAccountId}>Active Account #{activeAccountId || '50000000'}</option>
              )}
            </select>
          </div>

          {/* Instrument Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-300 mb-1">Instrument</label>
            <select
              value={selectedTicker?.symbol || ''}
              onChange={(e) => {
                const found = tickers.find((t) => t.symbol === e.target.value);
                if (found) onSelectTicker(found);
              }}
              className="w-full bg-white dark:bg-slate-900/90 border border-slate-400 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500 transition-all shadow-sm"
            >
              {tickers.map((t) => (
                <option key={t.symbol} value={t.symbol} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {t.symbol} — {t.lastPrice < 10 ? t.lastPrice.toFixed(4) : t.lastPrice.toLocaleString()} ({t.priceChangePercent > 0 ? '+' : ''}
                  {t.priceChangePercent.toFixed(2)}%)
                </option>
              ))}
            </select>
          </div>

          {/* Leverage Selector & Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-900 dark:text-slate-300">Account Leverage</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={leverage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setLeverage(Math.min(1000, Math.max(1, val)));
                  }}
                  className="w-14 bg-white dark:bg-slate-900 border border-blue-600/60 dark:border-cyan-500/40 rounded-md px-1.5 py-0.5 text-xs font-mono font-black text-blue-700 dark:text-cyan-400 text-center focus:outline-none focus:border-blue-600 shadow-sm"
                />
                <span className="text-xs font-mono text-blue-700 dark:text-cyan-400 font-black">x</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="1000"
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-cyan-400"
            />
            <div className="flex justify-between gap-1 text-[9px] text-slate-700 dark:text-slate-400 mt-1">
              {[10, 50, 100, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLeverage(preset)}
                  className={`px-1.5 py-0.5 rounded font-mono font-bold transition-all ${
                    leverage === preset
                      ? 'bg-blue-600 text-white dark:bg-cyan-500/20 dark:text-cyan-400 border border-blue-700 dark:border-cyan-500/40 font-black'
                      : 'bg-slate-200 dark:bg-slate-900/60 text-slate-900 dark:text-slate-400 hover:bg-slate-300 dark:hover:text-slate-200'
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Type & Volume (Lots) Row */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* Order Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-300 mb-1">Order Type</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-200 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-300 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                  orderType === 'MARKET' ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-cyan-400 shadow-sm' : 'text-slate-700 dark:text-slate-400'
                }`}
              >
                MARKET
              </button>
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                  orderType === 'LIMIT' ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-cyan-400 shadow-sm' : 'text-slate-700 dark:text-slate-400'
                }`}
              >
                LIMIT
              </button>
            </div>
          </div>

          {/* Volume (Lots) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-300 mb-1">
              Volume (Lots)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.01"
                className="w-full bg-white dark:bg-slate-900/90 border border-slate-400 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500 transition-all shadow-sm"
              />
              <div className="absolute right-2.5 top-2 text-[10px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                {parseFloat(quantity || '0') <= 0.01 ? 'Micro' : parseFloat(quantity || '0') < 1.0 ? 'Mini' : 'Std'}
              </div>
            </div>
          </div>
        </div>

        {/* Limit Price, Stop Loss (SL) & Take Profit (TP) in 1 Single Horizontal Row */}
        <div className={`grid ${orderType === 'LIMIT' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 sm:gap-3`}>
          {orderType === 'LIMIT' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-300 mb-1">Limit Price</label>
              <input
                type="number"
                step="any"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={selectedTicker?.lastPrice.toString() || '2435.50'}
                className="w-full bg-white dark:bg-slate-900/90 border border-slate-400 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-300 mb-1">Stop Loss (SL)</label>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="e.g. 2420.00"
              className="w-full bg-white dark:bg-slate-900/90 border border-slate-400 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-rose-700 dark:text-rose-400 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-300 mb-1">Take Profit (TP)</label>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="e.g. 2460.00"
              className="w-full bg-white dark:bg-slate-900/90 border border-slate-400 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Trigger Time Selection Section (1 Horizontal Row of 3 Columns for ALL screens) */}
        <div className="bg-slate-100 dark:bg-slate-900/70 p-3 rounded-xl border border-slate-300 dark:border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
              <span>Trigger Time (IST)</span>
            </span>
            {timeRemainingMs !== null && timeRemainingMs > 0 && (
              <span className="text-[10px] font-mono text-blue-800 dark:text-cyan-400 bg-blue-100 dark:bg-cyan-500/10 px-2 py-0.5 rounded-full border border-blue-300 dark:border-cyan-500/30 font-black">
                In {(timeRemainingMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>

          {/* Date, Time, Milliseconds in 3 Columns in 1 Single Horizontal Row */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
            {/* Date */}
            <div>
              <label className="block text-[9px] text-slate-700 dark:text-slate-400 mb-0.5 font-bold">Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-400 dark:border-slate-800 rounded-lg px-1.5 py-1 text-[11px] font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500 shadow-sm"
              />
            </div>

            {/* Time (hh:mm:ss) */}
            <div>
              <label className="block text-[9px] text-slate-700 dark:text-slate-400 mb-0.5 font-bold font-mono">Time (HH:mm:ss)</label>
              <input
                type="time"
                step="1"
                value={targetTimeStr}
                onChange={(e) => setTargetTimeStr(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-400 dark:border-slate-800 rounded-lg px-1.5 py-1 text-[11px] font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500 shadow-sm"
              />
            </div>

            {/* Milliseconds (.SSS) Dropdown */}
            <div>
              <label className="block text-[9px] text-slate-700 dark:text-slate-400 mb-0.5 font-bold font-mono">MS (.SSS)</label>
              <select
                value={targetMsStr}
                onChange={(e) => setTargetMsStr(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-400 dark:border-slate-800 rounded-lg px-1 py-1 text-[11px] font-mono font-black text-blue-800 dark:text-cyan-400 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500 shadow-sm cursor-pointer"
              >
                {['000', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', '990'].map((ms) => (
                  <option key={ms} value={ms} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-bold">
                    .{ms} ms
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Offset Shortcuts */}
          <div className="flex items-center gap-1 flex-wrap text-xs pt-0.5">
            {[
              { label: '+10s', sec: 10 },
              { label: '+30s', sec: 30 },
              { label: '+1m', sec: 60 },
              { label: '+5m', sec: 300 },
              { label: '+15m', sec: 900 },
              { label: '+1h', sec: 3600 },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => setOffsetSeconds(btn.sec)}
                className="px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-black transition-all active:scale-95 shadow-sm"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] ${
            side === 'BUY'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-emerald-600/30 hover:bg-emerald-700 dark:hover:bg-emerald-400'
              : 'bg-rose-600 dark:bg-rose-600 text-white shadow-rose-600/30 hover:bg-rose-700 dark:hover:bg-rose-500'
          } disabled:opacity-50`}
        >
          <Send className="w-4 h-4" />
          <span>
            {isSubmitting
              ? 'Scheduling Order...'
              : `Schedule ${side} ${selectedTicker?.symbol || ''} Order`}
          </span>
        </button>
      </form>
    </div>
  );
};
