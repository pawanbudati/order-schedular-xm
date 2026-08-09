import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Layers, Send, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Ticker } from '../types';

interface OrderFormProps {
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
  const [positionMode, setPositionMode] = useState<'ONE_WAY' | 'HEDGE'>('HEDGE');
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

  // Auto-switch to Hedge Mode for XM instruments (Gold XAUUSD / Forex pairs)
  useEffect(() => {
    if (selectedTicker) {
      const sym = selectedTicker.symbol.toUpperCase();
      if (sym.includes('XAU') || sym.includes('GOLD') || sym.includes('SILVER') || sym.includes('EUR')) {
        setPositionMode('HEDGE');
      }
    }
  }, [selectedTicker]);

  const getComputedPositionSide = (): 'LONG' | 'SHORT' | 'BOTH' => {
    if (positionMode === 'ONE_WAY') return 'BOTH';
    return side === 'BUY' ? 'LONG' : 'SHORT';
  };

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

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg('Please enter a valid order quantity.');
      return;
    }

    const targetTs = getComputedTargetTimestamp();
    if (!targetTs) {
      setErrorMsg('Please select a valid scheduled date and time.');
      return;
    }

    if (targetTs <= Date.now()) {
      setErrorMsg('Scheduled time must be in the future.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitSchedule({
        symbol: selectedTicker.symbol,
        side,
        positionSide: getComputedPositionSide(),
        type: orderType,
        price: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
        quantity: qtyNum,
        leverage,
        targetTime: targetTs,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to schedule order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const computedTs = getComputedTargetTimestamp();
  const timeRemainingMs = computedTs ? computedTs - Date.now() : null;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Schedule XM360 Order</span>
          </h2>
          <p className="text-xs text-slate-400">Configure MetaTrader instrument, lot size & exact millisecond trigger time</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Position Mode Selector (One-Way vs Hedge) */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setPositionMode('HEDGE')}
              title="Hedge Mode (MetaTrader Default)"
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                positionMode === 'HEDGE'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hedge Mode
            </button>
            <button
              type="button"
              onClick={() => setPositionMode('ONE_WAY')}
              title="One-Way Mode"
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                positionMode === 'ONE_WAY'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              One-Way
            </button>
          </div>

          {/* Side Selector Tabs */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                side === 'BUY'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>BUY</span>
            </button>
            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                side === 'SELL'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>SELL</span>
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Instrument & Leverage Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Instrument Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">XM Instrument (FX / CFD)</label>
            <select
              value={selectedTicker?.symbol || ''}
              onChange={(e) => {
                const found = tickers.find((t) => t.symbol === e.target.value);
                if (found) onSelectTicker(found);
              }}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-semibold focus:outline-none focus:border-cyan-500 transition-all"
            >
              {tickers.map((t) => (
                <option key={t.symbol} value={t.symbol} className="bg-slate-900 text-slate-100">
                  {t.symbol} — {t.lastPrice < 10 ? t.lastPrice.toFixed(4) : t.lastPrice.toLocaleString()} ({t.priceChangePercent > 0 ? '+' : ''}
                  {t.priceChangePercent.toFixed(2)}%)
                </option>
              ))}
            </select>
          </div>

          {/* Leverage Selector & Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400">XM Account Leverage</label>
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
                  className="w-16 bg-slate-900 border border-cyan-500/40 rounded-md px-2 py-0.5 text-xs font-mono font-bold text-cyan-400 text-center focus:outline-none focus:border-cyan-400"
                />
                <span className="text-xs font-mono text-cyan-400 font-bold">x</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="1000"
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between gap-1 text-[10px] text-slate-400 mt-1.5">
              {[10, 50, 100, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLeverage(preset)}
                  className={`px-1.5 py-0.5 rounded font-mono transition-all ${
                    leverage === preset
                      ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Type & Lot Volume Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Order Type */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Order Type</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  orderType === 'MARKET' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400'
                }`}
              >
                MARKET
              </button>
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  orderType === 'LIMIT' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400'
                }`}
              >
                LIMIT
              </button>
            </div>
          </div>

          {/* Volume (Lots) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
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
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 transition-all"
              />
              <div className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                {parseFloat(quantity || '0') <= 0.01 ? 'Micro Lot' : parseFloat(quantity || '0') < 1.0 ? 'Mini Lot' : 'Standard Lot'}
              </div>
            </div>
          </div>
        </div>

        {/* Limit Price, Stop Loss & Take Profit Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {orderType === 'LIMIT' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Limit Price</label>
              <input
                type="number"
                step="any"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={selectedTicker?.lastPrice.toString() || '2435.50'}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Stop Loss (Optional)</label>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="e.g. 2420.00"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-rose-400 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Take Profit (Optional)</label>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="e.g. 2460.00"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* High Precision Schedule Time Picker */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Exact Execution Schedule Time</span>
            </span>
            {timeRemainingMs !== null && timeRemainingMs > 0 && (
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                In {(timeRemainingMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Date */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Time (hh:mm:ss) */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Time (HH:mm:ss)</label>
              <input
                type="time"
                step="1"
                value={targetTimeStr}
                onChange={(e) => setTargetTimeStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Milliseconds (000-999) */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Millisecond (.SSS)</label>
              <input
                type="number"
                min="0"
                max="999"
                value={targetMsStr}
                onChange={(e) => setTargetMsStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Quick Offset Shortcuts */}
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
            <span className="text-[11px] text-slate-400">Quick Shortcuts:</span>
            {[
              { label: '+10s', sec: 10 },
              { label: '+30s', sec: 30 },
              { label: '+1m', sec: 60 },
              { label: '+5m', sec: 300 },
              { label: '+1h', sec: 3600 },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => setOffsetSeconds(btn.sec)}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-all"
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
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
            side === 'BUY'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400'
              : 'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-rose-500/20 hover:from-rose-500 hover:to-red-400'
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
