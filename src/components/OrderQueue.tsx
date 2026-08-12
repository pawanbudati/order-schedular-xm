import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Trash2, Ban, ExternalLink, Zap, Search, Filter, Layers, UserCheck } from 'lucide-react';
import { ScheduledOrder, AccountConfig } from '../types';

interface OrderQueueProps {
  orders: ScheduledOrder[];
  onCancelOrder: (id: string) => void;
  onDeleteOrderHistory: (id: string) => void;
  onClearOrderHistory: () => void;
  serverOffsetMs: number;
  accounts?: AccountConfig[];
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
  parts.forEach((p) => {
    map[p.type] = p.value;
  });
  const ms = String(date.getMilliseconds()).padStart(3, '0');

  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}.${ms} IST`;
};

export const OrderQueue: React.FC<OrderQueueProps> = ({
  orders,
  onCancelOrder,
  onDeleteOrderHistory,
  onClearOrderHistory,
  serverOffsetMs,
  accounts = [],
}) => {
  const [nowMs, setNowMs] = useState<number>(Date.now() + serverOffsetMs);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED'>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
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

  // Get unique account IDs present in order queue
  const uniqueAccountIds = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.accountId) set.add(o.accountId);
    });
    accounts.forEach((a) => {
      if (a.accountId) set.add(a.accountId);
    });
    return Array.from(set);
  }, [orders, accounts]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Account filter
      if (accountFilter !== 'ALL') {
        const targetAcc = accounts.find((a) => a.id === accountFilter || a.accountId === accountFilter);
        const matchAccId = order.accountId === accountFilter || (targetAcc && order.accountId === targetAcc.accountId);
        if (!matchAccId) return false;
      }

      // Tab filter
      if (activeTab === 'PENDING' && order.status !== 'PENDING') return false;
      if (activeTab === 'COMPLETED' && order.status !== 'COMPLETED') return false;
      if (activeTab === 'FAILED' && order.status !== 'FAILED') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSymbol = order.symbol.toLowerCase().includes(q);
        const matchId = order.id.toLowerCase().includes(q);
        const matchAccount = (order.accountName || order.accountId || '').toLowerCase().includes(q);
        const matchTicket = (order.xmOrderId || order.brokerOrderId || '').toLowerCase().includes(q);
        if (!matchSymbol && !matchId && !matchAccount && !matchTicket) return false;
      }

      return true;
    });
  }, [orders, activeTab, accountFilter, searchQuery, accounts]);

  const counts = useMemo(() => {
    const targetOrders =
      accountFilter === 'ALL'
        ? orders
        : orders.filter((o) => {
            const targetAcc = accounts.find((a) => a.id === accountFilter || a.accountId === accountFilter);
            return o.accountId === accountFilter || (targetAcc && o.accountId === targetAcc.accountId);
          });

    return {
      all: targetOrders.length,
      pending: targetOrders.filter((o) => o.status === 'PENDING').length,
      completed: targetOrders.filter((o) => o.status === 'COMPLETED').length,
      failed: targetOrders.filter((o) => o.status === 'FAILED').length,
      historical: targetOrders.filter((o) => o.status === 'COMPLETED' || o.status === 'FAILED' || o.status === 'CANCELLED').length,
    };
  }, [orders, accountFilter, accounts]);

  return (
    <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-800/80 flex flex-col gap-3.5 transition-colors duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-300 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Orders Queue & History
          </h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 dark:bg-slate-900 dark:text-cyan-400 font-mono border border-blue-300 dark:border-cyan-500/20 font-black">
            {orders.length}
          </span>
        </div>

        {/* Search Bar & Clear History Action */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbol, ticket..."
              className="w-full bg-white dark:bg-slate-900/90 border border-slate-400 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500 shadow-sm font-bold"
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
              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white dark:bg-slate-900 dark:hover:bg-rose-500/20 dark:text-slate-300 dark:hover:text-rose-400 border border-rose-700 dark:border-slate-800 text-xs font-extrabold flex items-center gap-1 transition-all shrink-0 active:scale-95 shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5 text-white dark:text-rose-400" />
              <span className="hidden xs:inline">Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Account Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
          {[
            { key: 'ALL', label: 'All', count: counts.all },
            { key: 'PENDING', label: 'Pending', count: counts.pending },
            { key: 'COMPLETED', label: 'Completed', count: counts.completed },
            { key: 'FAILED', label: 'Failed', count: counts.failed },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5 shadow-sm active:scale-95 ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-md font-black'
                  : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-900/80 text-slate-900 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-black ${
                  activeTab === tab.key
                    ? 'bg-blue-800 dark:bg-slate-950 text-white dark:text-cyan-300'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-900 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Account Filter Selector */}
        {uniqueAccountIds.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs self-end sm:self-center">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-cyan-500" /> Filter Account:
            </span>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Connected Accounts ({uniqueAccountIds.length})</option>
              {uniqueAccountIds.map((accId) => {
                const accObj = accounts.find((a) => a.accountId === accId || a.id === accId);
                return (
                  <option key={accId} value={accId}>
                    {accObj?.accountName || `Acct #${accId}`} (#{accId})
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 gap-1.5">
          <Clock className="w-8 h-8 stroke-1 opacity-50 text-blue-700 dark:text-cyan-400" />
          <p className="text-xs font-extrabold">No orders match your filter.</p>
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

              const displayTargetTime =
                order.targetTimeFormatted && order.targetTimeFormatted.includes('IST')
                  ? order.targetTimeFormatted
                  : formatIST(order.targetTime);

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-300 dark:border-slate-800/80 flex flex-col gap-2 shadow-sm font-mono text-xs"
                >
                  {/* Top Bar: Account Tag, Symbol, Side Badge, Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        {order.accountName || `Acct #${order.accountId || 'Default'}`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider ${
                          order.side === 'BUY'
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                            : 'bg-rose-100 text-rose-900 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                        }`}
                      >
                        {order.side} {order.positionSide}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm font-sans">
                        {order.symbol}
                      </span>
                      <span className="text-[11px] text-slate-700 dark:text-slate-400 font-bold">{order.quantity} Lots</span>
                    </div>

                    {/* Pending Cancel or Historical Delete */}
                    {isPending ? (
                      <button
                        onClick={() => onCancelOrder(order.id)}
                        className="px-2 py-0.5 rounded-lg bg-rose-600 text-white dark:bg-rose-500/10 dark:text-rose-400 border border-rose-700 dark:border-rose-500/30 text-[10px] font-black flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    ) : isHistorical ? (
                      <button
                        onClick={() => onDeleteOrderHistory(order.id)}
                        title="Delete from history"
                        className="p-1 rounded-lg bg-slate-200 dark:bg-slate-800/60 hover:bg-rose-500/20 text-slate-900 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-700 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      </button>
                    ) : null}
                  </div>

                  {/* Scheduled Target Time */}
                  <div className="flex flex-col text-[11px] text-slate-800 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-300 dark:border-slate-800/60 font-bold">
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-bold text-[10px]">Target (IST):</span>
                      <span className="text-blue-700 dark:text-cyan-300 font-black">{displayTargetTime}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] mt-0.5 text-slate-700 dark:text-slate-400">
                      <span>Leverage: {order.leverage}x</span>
                      <span>Type: {order.type}</span>
                    </div>
                  </div>

                  {/* Status Indicator & Details */}
                  <div className="flex flex-col gap-1.5 pt-0.5 border-t border-slate-300 dark:border-slate-800/50">
                    {isPending && (
                      <div className="font-black text-blue-900 dark:text-cyan-400 bg-blue-100 dark:bg-cyan-950/60 border border-blue-300 dark:border-cyan-500/30 px-2.5 py-1 rounded-lg flex items-center justify-between">
                        <span className="text-[10px] font-sans font-extrabold">Countdown:</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 animate-spin text-blue-700 dark:text-cyan-400" />
                          <span>{formatCountdown(order.targetTime)}</span>
                        </div>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex flex-col gap-1">
                        <div className="text-emerald-900 dark:text-emerald-400 font-black flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{order.isMock ? 'FILLED (GUEST MOCK)' : 'FILLED SUCCESS'}</span>
                          </span>
                          <span className="bg-emerald-100 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30 px-1.5 py-0.2 rounded-md font-bold">
                            Drift:{' '}
                            {order.precisionDriftMs !== undefined
                              ? `${order.precisionDriftMs > 0 ? '+' : ''}${order.precisionDriftMs} ms`
                              : '0 ms'}
                          </span>
                        </div>

                        {(order.xmOrderId || order.brokerOrderId) && (
                          <div className="text-[10px] text-slate-700 dark:text-slate-400 font-mono font-bold">
                            MT5 Order Ticket:{' '}
                            <span className="text-slate-900 dark:text-slate-200 font-black">
                              #{order.xmOrderId || order.brokerOrderId}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {isFailed && (
                      <div className="flex flex-col gap-1 w-full text-rose-900 dark:text-rose-400 font-bold">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>EXECUTION FAILED</span>
                        </div>
                        {order.errorMessage && (
                          <div className="text-[10px] font-bold text-rose-900 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/50 p-2 rounded-lg break-words font-mono">
                            {order.errorMessage}
                          </div>
                        )}
                      </div>
                    )}

                    {isCancelled && <span className="text-slate-700 dark:text-slate-400 text-[11px] font-bold">Order Cancelled</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Visible on screens >= 640px) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-200/90 text-slate-900 dark:bg-slate-900/80 dark:text-slate-300 border-b border-slate-300 dark:border-slate-800 font-extrabold">
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-3">Order Instrument</th>
                  <th className="py-2.5 px-3">Type / Leverage</th>
                  <th className="py-2.5 px-3">Scheduled Time (IST)</th>
                  <th className="py-2.5 px-3">Countdown / Accuracy</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-800/60">
                {filteredOrders.map((order) => {
                  const isPending = order.status === 'PENDING';
                  const isExecuting = order.status === 'EXECUTING';
                  const isCompleted = order.status === 'COMPLETED';
                  const isFailed = order.status === 'FAILED';
                  const isCancelled = order.status === 'CANCELLED';
                  const isHistorical = isCompleted || isFailed || isCancelled;

                  const displayTargetTime =
                    order.targetTimeFormatted && order.targetTimeFormatted.includes('IST')
                      ? order.targetTimeFormatted
                      : formatIST(order.targetTime);

                  return (
                    <tr key={order.id} className="hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-all font-mono">
                      {/* Account Badge Column */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 whitespace-nowrap">
                          {order.accountName || `Acct #${order.accountId || 'Default'}`}
                        </span>
                      </td>

                      {/* Symbol & Side */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                              order.side === 'BUY'
                                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                                : 'bg-rose-100 text-rose-900 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                            }`}
                          >
                            {order.side} {order.positionSide}
                          </span>
                          <span className="font-sans text-sm font-extrabold">{order.symbol}</span>
                        </div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-400 mt-0.5 font-bold">
                          Volume: <span className="text-slate-900 dark:text-slate-200 font-black">{order.quantity} Lots</span>
                        </div>
                      </td>

                      {/* Type & Leverage */}
                      <td className="py-3 px-3">
                        <div className="text-slate-900 dark:text-slate-200 font-black">{order.type}</div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-400 font-bold">
                          {order.leverage}x XM Margin
                        </div>
                      </td>

                      {/* Target Time */}
                      <td className="py-3 px-3">
                        <div className="text-blue-700 dark:text-cyan-300 font-black text-xs">{displayTargetTime}</div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">ID: {order.id}</div>
                      </td>

                      {/* Countdown or Drift Metric */}
                      <td className="py-3 px-3">
                        {isPending && (
                          <div className="font-black text-blue-900 dark:text-cyan-400 bg-blue-100 dark:bg-cyan-950/60 border border-blue-300 dark:border-cyan-500/30 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 animate-spin text-blue-700 dark:text-cyan-400" />
                            <span>{formatCountdown(order.targetTime)}</span>
                          </div>
                        )}

                        {isExecuting && (
                          <div className="font-black text-blue-900 dark:text-cyan-300 bg-blue-200 dark:bg-cyan-500/20 border border-blue-300 dark:border-cyan-400/40 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5 animate-pulse">
                            <Zap className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400 fill-current" />
                            <span>TRIGGERING MT5...</span>
                          </div>
                        )}

                        {isCompleted && (
                          <div>
                            <div className="text-emerald-900 dark:text-emerald-400 font-black flex items-center gap-1 text-[11px]">
                              <span>Accuracy:</span>
                              <span className="bg-emerald-100 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30 px-1.5 py-0.2 rounded-md font-bold">
                                {order.precisionDriftMs !== undefined
                                  ? `${order.precisionDriftMs > 0 ? '+' : ''}${order.precisionDriftMs} ms`
                                  : '0 ms'}
                              </span>
                            </div>
                            {(order.xmOrderId || order.brokerOrderId) && (
                              <div className="text-[10px] text-slate-700 dark:text-slate-400 font-mono font-bold mt-0.5">
                                Ticket #{order.xmOrderId || order.brokerOrderId}
                              </div>
                            )}
                          </div>
                        )}

                        {(isFailed || isCancelled) && (
                          <span className="text-slate-500 dark:text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status & Error Display */}
                      <td className="py-3 px-3">
                        {isPending && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                            PENDING
                          </span>
                        )}
                        {isExecuting && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 dark:bg-cyan-500/20 dark:text-cyan-300 border border-blue-300 dark:border-cyan-400/40">
                            EXECUTING
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>FILLED</span>
                          </span>
                        )}
                        {isFailed && (
                          <div className="flex flex-col gap-1 max-w-[240px]">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-900 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3 shrink-0" />
                              <span>FAILED</span>
                            </span>
                            {order.errorMessage && (
                              <div className="text-[10px] font-bold text-rose-900 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/50 px-2 py-0.5 rounded-lg break-words font-mono leading-tight">
                                {order.errorMessage}
                              </div>
                            )}
                          </div>
                        )}
                        {isCancelled && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                            CANCELLED
                          </span>
                        )}
                      </td>

                      {/* Action (Cancel if pending, Delete if completed/failed/cancelled) */}
                      <td className="py-3 px-3 text-right">
                        {isPending ? (
                          <button
                            onClick={() => onCancelOrder(order.id)}
                            className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-700 dark:border-rose-500/30 transition-all font-sans text-xs font-black flex items-center gap-1 ml-auto active:scale-95 shadow-sm"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        ) : isHistorical ? (
                          <button
                            onClick={() => onDeleteOrderHistory(order.id)}
                            title="Delete from history"
                            className="p-1.5 rounded-xl bg-slate-200 hover:bg-rose-500/20 text-slate-900 hover:text-rose-600 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-800 transition-all font-sans text-xs font-bold flex items-center gap-1 ml-auto active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
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
