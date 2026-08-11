import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Trash2, Ban, ExternalLink, Zap, Search, Filter, Layers } from 'lucide-react';
import { ScheduledOrder } from '../types';

interface OrderQueueProps {
  orders: ScheduledOrder[];
  onCancelOrder: (id: string) => void;
  onDeleteOrderHistory: (id: string) => void;
  onClearOrderHistory: () => void;
  serverOffsetMs: number;
}

const formatIST = (ts: number): string => {
  const date = new Date(ts);
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  parts.forEach(p => { map[p.type] = p.value; });
  const ms = String(date.getMilliseconds()).padStart(3, '0');

  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}.${ms} IST`;
};

export const OrderQueue: React.FC<OrderQueueProps> = ({
  orders,
  onCancelOrder,
  onDeleteOrderHistory,
  onClearOrderHistory,
  serverOffsetMs,
}) => {
  const [nowMs, setNowMs] = useState<number>(Date.now() + serverOffsetMs);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now() + serverOffsetMs);
    }, 45);

    return () => clearInterval(timer);
  }, [serverOffsetMs]);

  const formatCountdown = (targetTime: number) => {
    const diff = targetTime - nowMs;
    if (diff <= 0) return '00:00:00.000';

    const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    const ms = String(Math.floor(diff % 1000)).padStart(3, '0');

    return `${hours}:${minutes}:${seconds}.${ms}`;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab === 'PENDING' && order.status !== 'PENDING') return false;
      if (activeTab === 'COMPLETED' && order.status !== 'COMPLETED') return false;
      if (activeTab === 'FAILED' && order.status !== 'FAILED') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSymbol = order.symbol.toLowerCase().includes(q);
        const matchId = order.id.toLowerCase().includes(q);
        const matchTicket = (order.xmOrderId || order.brokerOrderId || '').toLowerCase().includes(q);
        if (!matchSymbol && !matchId && !matchTicket) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      completed: orders.filter((o) => o.status === 'COMPLETED').length,
      failed: orders.filter((o) => o.status === 'FAILED').length,
      historical: orders.filter((o) => o.status === 'COMPLETED' || o.status === 'FAILED' || o.status === 'CANCELLED').length,
    };
  }, [orders]);

  return (
    <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex flex-col gap-3.5 transition-colors duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
            Orders Queue & History
          </h2>
          <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-cyan-400 dark:text-cyan-400 light:text-cyan-700 font-mono border border-cyan-500/20 light:border-cyan-300 font-bold">
            {orders.length}
          </span>
        </div>

        {/* Search Bar & Clear History Action */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400 dark:text-slate-400 light:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbol, ticket..."
              className="w-full bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-cyan-500 shadow-sm font-medium"
            />
          </div>

          {counts.historical > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`Clear all ${counts.historical} completed/failed history entries?`)) {
                  onClearOrderHistory();
                }
              }}
              title="Clear completed and failed order history"
              className="px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-slate-100 hover:bg-rose-500/20 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-rose-400 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs font-semibold flex items-center gap-1 transition-all shrink-0 active:scale-95 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xs:inline">Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'ALL', label: 'All', count: counts.all },
          { key: 'PENDING', label: 'Pending', count: counts.pending },
          { key: 'COMPLETED', label: 'Completed', count: counts.completed },
          { key: 'FAILED', label: 'Failed', count: counts.failed },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 shadow-sm active:scale-95 ${
              activeTab === tab.key
                ? 'bg-cyan-500 dark:bg-cyan-500 light:bg-cyan-600 text-slate-950 dark:text-slate-950 light:text-white shadow-sm font-extrabold'
                : 'bg-slate-900/80 dark:bg-slate-900/80 light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-700 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
              activeTab === tab.key
                ? 'bg-slate-950 dark:bg-slate-950 light:bg-cyan-700 text-cyan-300 dark:text-cyan-300 light:text-white'
                : 'bg-slate-800 dark:bg-slate-800 light:bg-slate-100 text-slate-400 dark:text-slate-400 light:text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-500 light:text-slate-500 gap-1.5">
          <Clock className="w-8 h-8 stroke-1 opacity-40 text-cyan-400 dark:text-cyan-400 light:text-cyan-600" />
          <p className="text-xs font-semibold">No orders match your filter.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card List (Visible on screens < 640px) */}
          <div className="block sm:hidden space-y-2.5">
            {filteredOrders.map((order) => {
              const isPending = order.status === 'PENDING';
              const isExecuting = order.status === 'EXECUTING';
              const isCompleted = order.status === 'COMPLETED';
              const isFailed = order.status === 'FAILED';
              const isCancelled = order.status === 'CANCELLED';
              const isHistorical = isCompleted || isFailed || isCancelled;

              const displayTargetTime = order.targetTimeFormatted && order.targetTimeFormatted.includes('IST')
                ? order.targetTimeFormatted
                : formatIST(order.targetTime);

              return (
                <div key={order.id} className="bg-slate-900/90 dark:bg-slate-900/90 light:bg-white p-3 rounded-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex flex-col gap-2 shadow-sm font-mono text-xs">
                  {/* Top Bar: Symbol, Side Badge, Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider ${
                        order.side === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 dark:text-rose-400 light:text-rose-700 border border-rose-500/30'
                      }`}>
                        {order.side} {order.positionSide}
                      </span>
                      <span className="font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 text-sm font-sans">{order.symbol}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold">{order.quantity} Lots</span>
                    </div>

                    {/* Pending Cancel or Historical Delete */}
                    {isPending ? (
                      <button
                        onClick={() => onCancelOrder(order.id)}
                        className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 dark:text-rose-400 light:text-rose-600 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    ) : isHistorical ? (
                      <button
                        onClick={() => onDeleteOrderHistory(order.id)}
                        title="Delete from history"
                        className="p-1 rounded-lg bg-slate-800/60 dark:bg-slate-800/60 light:bg-slate-100 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 dark:border-slate-700 light:border-slate-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    ) : null}
                  </div>

                  {/* Scheduled Target Time */}
                  <div className="flex flex-col text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 p-2 rounded-lg border border-slate-800/60 dark:border-slate-800/60 light:border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-medium text-[10px]">Target (IST):</span>
                      <span className="text-cyan-400 dark:text-cyan-300 light:text-cyan-700 font-bold">{displayTargetTime}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] mt-0.5 text-slate-400 dark:text-slate-400 light:text-slate-500">
                      <span>Leverage: {order.leverage}x</span>
                      <span>Type: {order.type}</span>
                    </div>
                  </div>

                  {/* Status Indicator & Details */}
                  <div className="flex flex-col gap-1.5 pt-0.5 border-t border-slate-800/50 dark:border-slate-800/50 light:border-slate-200">
                    {isPending && (
                      <div className="font-bold text-cyan-400 dark:text-cyan-400 light:text-cyan-700 bg-cyan-950/60 dark:bg-cyan-950/60 light:bg-cyan-50 border border-cyan-500/30 px-2.5 py-1 rounded-lg flex items-center justify-between">
                        <span className="text-[10px] font-sans font-semibold">Countdown:</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 animate-spin text-cyan-400 dark:text-cyan-400 light:text-cyan-700" />
                          <span>{formatCountdown(order.targetTime)}</span>
                        </div>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex flex-col gap-1">
                        <div className="text-emerald-400 dark:text-emerald-400 light:text-emerald-700 font-bold flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>FILLED SUCCESS</span>
                          </span>
                          <span className="bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded-md">
                            Drift: {order.precisionDriftMs !== undefined ? `${order.precisionDriftMs > 0 ? '+' : ''}${order.precisionDriftMs} ms` : '0 ms'}
                          </span>
                        </div>
                        {(order.xmOrderId || order.brokerOrderId) && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">
                            MT5 Order Ticket: <span className="text-slate-200 dark:text-slate-200 light:text-slate-800 font-bold">#{order.xmOrderId || order.brokerOrderId}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {isFailed && (
                      <div className="flex flex-col gap-1 w-full text-rose-400 dark:text-rose-400 light:text-rose-600 font-semibold">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>EXECUTION FAILED</span>
                        </div>
                        {order.errorMessage && (
                          <div className="text-[10px] font-normal text-rose-300 dark:text-rose-300 light:text-rose-700 bg-rose-950/60 dark:bg-rose-950/60 light:bg-rose-50 border border-rose-800/50 dark:border-rose-800/50 light:border-rose-200 p-2 rounded-lg break-words font-mono">
                            {order.errorMessage}
                          </div>
                        )}
                      </div>
                    )}

                    {isCancelled && (
                      <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 text-[11px]">Order Cancelled</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Visible on screens >= 640px) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 dark:text-slate-400 light:text-slate-600 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 font-semibold">
                  <th className="py-2.5 px-2.5">Order Instrument</th>
                  <th className="py-2.5 px-2.5">Type / Leverage</th>
                  <th className="py-2.5 px-2.5">Scheduled Time (IST)</th>
                  <th className="py-2.5 px-2.5">Countdown / Accuracy</th>
                  <th className="py-2.5 px-2.5">Status</th>
                  <th className="py-2.5 px-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
                {filteredOrders.map((order) => {
                  const isPending = order.status === 'PENDING';
                  const isExecuting = order.status === 'EXECUTING';
                  const isCompleted = order.status === 'COMPLETED';
                  const isFailed = order.status === 'FAILED';
                  const isCancelled = order.status === 'CANCELLED';
                  const isHistorical = isCompleted || isFailed || isCancelled;

                  const displayTargetTime = order.targetTimeFormatted && order.targetTimeFormatted.includes('IST')
                    ? order.targetTimeFormatted
                    : formatIST(order.targetTime);

                  return (
                    <tr key={order.id} className="hover:bg-slate-900/40 dark:hover:bg-slate-900/40 light:hover:bg-slate-100 transition-all font-mono">
                      {/* Symbol & Side */}
                      <td className="py-3 px-2.5">
                        <div className="font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              order.side === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 dark:text-rose-400 light:text-rose-700 border border-rose-500/30'
                            }`}
                          >
                            {order.side} {order.positionSide}
                          </span>
                          <span className="font-sans text-sm">{order.symbol}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 mt-0.5 font-normal">
                          Volume: <span className="text-slate-200 dark:text-slate-200 light:text-slate-800 font-bold">{order.quantity} Lots</span>
                        </div>
                      </td>

                      {/* Type & Leverage */}
                      <td className="py-3 px-2.5">
                        <div className="text-slate-200 dark:text-slate-200 light:text-slate-800 font-bold">{order.type}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-normal">
                          {order.leverage}x XM Margin
                        </div>
                      </td>

                      {/* Target Time */}
                      <td className="py-3 px-2.5">
                        <div className="text-cyan-400 dark:text-cyan-300 light:text-cyan-700 font-bold">{displayTargetTime}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500">ID: {order.id}</div>
                      </td>

                      {/* Countdown or Drift Metric */}
                      <td className="py-3 px-2.5">
                        {isPending && (
                          <div className="font-bold text-cyan-400 dark:text-cyan-400 light:text-cyan-700 bg-cyan-950/60 dark:bg-cyan-950/60 light:bg-cyan-50 border border-cyan-500/30 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 animate-spin text-cyan-400 dark:text-cyan-400 light:text-cyan-700" />
                            <span>{formatCountdown(order.targetTime)}</span>
                          </div>
                        )}

                        {isExecuting && (
                          <div className="font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5 animate-pulse">
                            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                            <span>TRIGGERING MT5...</span>
                          </div>
                        )}

                        {isCompleted && (
                          <div>
                            <div className="text-emerald-400 dark:text-emerald-400 light:text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                              <span>Accuracy:</span>
                              <span className="bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded-md">
                                {order.precisionDriftMs !== undefined
                                  ? `${order.precisionDriftMs > 0 ? '+' : ''}${order.precisionDriftMs} ms`
                                  : '0 ms'}
                              </span>
                            </div>
                            {(order.xmOrderId || order.brokerOrderId) && (
                              <div className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono mt-0.5">
                                Ticket #{order.xmOrderId || order.brokerOrderId}
                              </div>
                            )}
                          </div>
                        )}

                        {(isFailed || isCancelled) && (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status & Error Display */}
                      <td className="py-3 px-2.5">
                        {isPending && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 dark:text-amber-400 light:text-amber-700 border border-amber-500/30">
                            PENDING
                          </span>
                        )}
                        {isExecuting && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 dark:text-cyan-300 light:text-cyan-700 border border-cyan-500/40">
                            EXECUTING
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>FILLED</span>
                          </span>
                        )}
                        {isFailed && (
                          <div className="flex flex-col gap-1 max-w-[240px]">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 dark:text-rose-400 light:text-rose-700 border border-rose-500/30 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3 shrink-0" />
                              <span>FAILED</span>
                            </span>
                            {order.errorMessage && (
                              <div className="text-[10px] text-rose-300 dark:text-rose-300 light:text-rose-700 bg-rose-950/60 dark:bg-rose-950/60 light:bg-rose-50 border border-rose-800/50 dark:border-rose-800/50 light:border-rose-200 px-2 py-0.5 rounded-lg break-words font-mono leading-tight">
                                {order.errorMessage}
                              </div>
                            )}
                          </div>
                        )}
                        {isCancelled && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 dark:bg-slate-800 light:bg-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-600 border border-slate-700 dark:border-slate-700 light:border-slate-300">
                            CANCELLED
                          </span>
                        )}
                      </td>

                      {/* Action (Cancel if pending, Delete if completed/failed/cancelled) */}
                      <td className="py-3 px-2.5 text-right">
                        {isPending ? (
                          <button
                            onClick={() => onCancelOrder(order.id)}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 dark:text-rose-400 light:text-rose-600 border border-rose-500/30 transition-all font-sans text-xs font-bold flex items-center gap-1 ml-auto active:scale-95"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        ) : isHistorical ? (
                          <button
                            onClick={() => onDeleteOrderHistory(order.id)}
                            title="Delete from history"
                            className="p-1.5 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 dark:border-slate-800 light:border-slate-300 transition-all font-sans text-xs font-bold flex items-center gap-1 ml-auto active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete</span>
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
