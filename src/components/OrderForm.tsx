import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Layers, Send, TrendingUp, TrendingDown, AlertCircle, Eye, ShieldCheck } from 'lucide-react';
import { Ticker } from '../types';

interface OrderFormProps {
  userRole: 'ADMIN' | 'GUEST';
  tickers: Ticker[];
  selectedTicker: Ticker | null;
  onSelectTicker: (ticker: Ticker) => void;
  quantity: string;
  setQuantity: (val: string) => void;
  leverage: number;
  setLeverage: (val: number) => void;
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
  onSubmitSchedule,
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');

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
    <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex flex-col gap-3.5 sm:gap-4 transition-colors duration-300">
      {/* Header & Side Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 pb-3 gap-2">
        <h2 className="text-sm sm:text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
          Schedule Order
        </h2>

        {/* Side Selector Tabs (BUY / SELL) */}
        <div className="flex bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-100 p-1 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-300">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
              side === 'BUY'
                ? 'bg-emerald-500 dark:bg-emerald-500 light:bg-emerald-600 text-slate-950 dark:text-slate-950 light:text-white shadow-sm font-extrabold'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>BUY</span>
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
              side === 'SELL'
                ? 'bg-rose-500 dark:bg-rose-500 light:bg-rose-600 text-white shadow-sm font-extrabold'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>SELL</span>
          </button>
        </div>
      </div>

      {userRole === 'GUEST' && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 dark:text-amber-400 light:text-amber-700 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0 text-amber-400" />
            <span><strong>Guest Sandbox Mode:</strong> Orders are simulated locally (no live MT5 trades placed).</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 dark:text-rose-400 light:text-rose-600 text-xs flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Instrument & Leverage Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {/* Instrument Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">Instrument</label>
            <select
              value={selectedTicker?.symbol || ''}
              onChange={(e) => {
                const found = tickers.find((t) => t.symbol === e.target.value);
                if (found) onSelectTicker(found);
              }}
              className="w-full bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 font-bold focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
            >
              {tickers.map((t) => (
                <option key={t.symbol} value={t.symbol} className="bg-slate-900 light:bg-white text-slate-100 light:text-slate-900">
                  {t.symbol} — {t.lastPrice < 10 ? t.lastPrice.toFixed(4) : t.lastPrice.toLocaleString()} ({t.priceChangePercent > 0 ? '+' : ''}
                  {t.priceChangePercent.toFixed(2)}%)
                </option>
              ))}
            </select>
          </div>

          {/* Leverage Selector & Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">Account Leverage</label>
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
                  className="w-14 bg-slate-900 dark:bg-slate-900 light:bg-white border border-cyan-500/40 rounded-md px-1.5 py-0.5 text-xs font-mono font-bold text-cyan-400 dark:text-cyan-400 light:text-cyan-700 text-center focus:outline-none focus:border-cyan-400 shadow-sm"
                />
                <span className="text-xs font-mono text-cyan-400 dark:text-cyan-400 light:text-cyan-700 font-bold">x</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="1000"
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-400 dark:accent-cyan-400 light:accent-cyan-600"
            />
            <div className="flex justify-between gap-1 text-[9px] text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1">
              {[10, 50, 100, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLeverage(preset)}
                  className={`px-1 py-0.2 rounded font-mono font-semibold transition-all ${
                    leverage === preset
                      ? 'bg-cyan-500/20 text-cyan-400 dark:text-cyan-400 light:text-cyan-700 border border-cyan-500/40'
                      : 'bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 text-slate-400 dark:text-slate-400 light:text-slate-700 hover:text-slate-200'
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
            <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">Order Type</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 p-1 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-300">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  orderType === 'MARKET' ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-400 dark:text-cyan-400 light:text-cyan-700 shadow-sm' : 'text-slate-400 dark:text-slate-400 light:text-slate-600'
                }`}
              >
                MARKET
              </button>
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  orderType === 'LIMIT' ? 'bg-slate-800 dark:bg-slate-800 light:bg-white text-cyan-400 dark:text-cyan-400 light:text-cyan-700 shadow-sm' : 'text-slate-400 dark:text-slate-400 light:text-slate-600'
                }`}
              >
                LIMIT
              </button>
            </div>
          </div>

          {/* Volume (Lots) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
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
                className="w-full bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
              />
              <div className="absolute right-2.5 top-2 text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">
                {parseFloat(quantity || '0') <= 0.01 ? 'Micro' : parseFloat(quantity || '0') < 1.0 ? 'Mini' : 'Std'}
              </div>
            </div>
          </div>
        </div>

        {/* Limit Price, Stop Loss (SL) & Take Profit (TP) in 1 Single Horizontal Row */}
        <div className={`grid ${orderType === 'LIMIT' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 sm:gap-3`}>
          {orderType === 'LIMIT' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">Limit Price</label>
              <input
                type="number"
                step="any"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={selectedTicker?.lastPrice.toString() || '2435.50'}
                className="w-full bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">Stop Loss (SL)</label>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="e.g. 2420.00"
              className="w-full bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono text-rose-400 dark:text-rose-400 light:text-rose-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">Take Profit (TP)</label>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="e.g. 2460.00"
              className="w-full bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono text-emerald-400 dark:text-emerald-400 light:text-emerald-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Trigger Time Selection Section (1 Horizontal Row of 3 Columns for ALL screens) */}
        <div className="bg-slate-900/70 dark:bg-slate-900/70 light:bg-slate-50 p-3 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400 dark:text-cyan-400 light:text-cyan-600" />
              <span>Trigger Time (IST)</span>
            </span>
            {timeRemainingMs !== null && timeRemainingMs > 0 && (
              <span className="text-[10px] font-mono text-cyan-400 dark:text-cyan-400 light:text-cyan-700 bg-cyan-500/10 px-2 py-0.2 rounded-full border border-cyan-500/30 font-bold">
                In {(timeRemainingMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>

          {/* Date, Time, Milliseconds in 3 Columns in 1 Single Horizontal Row */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
            {/* Date */}
            <div>
              <label className="block text-[9px] text-slate-400 dark:text-slate-400 light:text-slate-600 mb-0.5 font-semibold">Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-1.5 py-1 text-[11px] font-mono font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-cyan-500 shadow-sm"
              />
            </div>

            {/* Time (hh:mm:ss) */}
            <div>
              <label className="block text-[9px] text-slate-400 dark:text-slate-400 light:text-slate-600 mb-0.5 font-semibold font-mono">Time (HH:mm:ss)</label>
              <input
                type="time"
                step="1"
                value={targetTimeStr}
                onChange={(e) => setTargetTimeStr(e.target.value)}
                className="w-full bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-1.5 py-1 text-[11px] font-mono font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-cyan-500 shadow-sm"
              />
            </div>

            {/* Milliseconds (.SSS) Dropdown */}
            <div>
              <label className="block text-[9px] text-slate-400 dark:text-slate-400 light:text-slate-600 mb-0.5 font-semibold font-mono">MS (.SSS)</label>
              <select
                value={targetMsStr}
                onChange={(e) => setTargetMsStr(e.target.value)}
                className="w-full bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-1 py-1 text-[11px] font-mono font-bold text-cyan-400 dark:text-cyan-400 light:text-cyan-700 focus:outline-none focus:border-cyan-500 shadow-sm cursor-pointer"
              >
                {['000', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', '990'].map((ms) => (
                  <option key={ms} value={ms} className="bg-slate-900 light:bg-white text-slate-100 light:text-slate-900 font-mono">
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
                className="px-2 py-0.5 rounded-lg bg-slate-800 dark:bg-slate-800 light:bg-white hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 text-slate-200 dark:text-slate-200 light:text-slate-800 border border-slate-700 dark:border-slate-700 light:border-slate-300 font-mono text-[10px] font-bold transition-all active:scale-95 shadow-sm"
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
          className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99] ${
            side === 'BUY'
              ? 'bg-emerald-500 dark:bg-emerald-500 light:bg-emerald-600 text-slate-950 dark:text-slate-950 light:text-white shadow-emerald-500/20 hover:bg-emerald-400 dark:hover:bg-emerald-400 light:hover:bg-emerald-700'
              : 'bg-rose-600 dark:bg-rose-600 light:bg-rose-600 text-white shadow-rose-500/20 hover:bg-rose-500 dark:hover:bg-rose-500 light:hover:bg-rose-700'
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
