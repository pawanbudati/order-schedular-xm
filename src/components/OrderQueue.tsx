import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Trash2, Ban, ExternalLink, Zap } from 'lucide-react';
import { ScheduledOrder } from '../types';

interface OrderQueueProps {
  orders: ScheduledOrder[];
  onCancelOrder: (id: string) => void;
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

export const OrderQueue: React.FC<OrderQueueProps> = ({ orders, onCancelOrder, serverOffsetMs }) => {
  const [nowMs, setNowMs] = useState<number>(Date.now() + serverOffsetMs);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now() + serverOffsetMs);
    }, 45); // High refresh rate for millisecond countdown

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

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Scheduled Orders Queue & History</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono">
              {orders.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-400">Live active countdowns & millisecond execution logs</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center text-slate-500 gap-2">
          <Clock className="w-10 h-10 stroke-1 opacity-40 text-cyan-400" />
          <p className="text-sm">No scheduled orders yet.</p>
          <p className="text-xs text-slate-600">Use the Order Form above to set your first exact timestamp trigger.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80 font-medium">
                <th className="py-3 px-3">Order Details</th>
                <th className="py-3 px-3">Type / Leverage</th>
                <th className="py-3 px-3">Scheduled Time (IST)</th>
                <th className="py-3 px-3">Countdown / Precision</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.map((order) => {
                const isPending = order.status === 'PENDING';
                const isExecuting = order.status === 'EXECUTING';
                const isCompleted = order.status === 'COMPLETED';
                const isFailed = order.status === 'FAILED';
                const isCancelled = order.status === 'CANCELLED';

                const displayTargetTime = order.targetTimeFormatted && order.targetTimeFormatted.includes('IST')
                  ? order.targetTimeFormatted
                  : formatIST(order.targetTime);

                return (
                  <tr key={order.id} className="hover:bg-slate-900/40 transition-all font-mono">
                    {/* Symbol & Side */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            order.side === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {order.side} {order.positionSide}
                        </span>
                        <span>{order.symbol}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
                        Lots: <span className="text-slate-200 font-semibold">{order.quantity}</span>
                      </div>
                    </td>

                    {/* Type & Leverage */}
                    <td className="py-3.5 px-3">
                      <div className="text-slate-200 font-semibold">{order.type}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {order.leverage}x XM Margin
                      </div>
                    </td>

                    {/* Target Time */}
                    <td className="py-3.5 px-3">
                      <div className="text-cyan-300 font-semibold">{displayTargetTime}</div>
                      <div className="text-[10px] text-slate-500">ID: {order.id}</div>
                    </td>

                    {/* Countdown or Drift Metric */}
                    <td className="py-3.5 px-3">
                      {isPending && (
                        <div className="font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          <span>{formatCountdown(order.targetTime)}</span>
                        </div>
                      )}

                      {isExecuting && (
                        <div className="font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 animate-pulse">
                          <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                          <span>TRIGGERING XM API...</span>
                        </div>
                      )}

                      {isCompleted && (
                        <div>
                          <div className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                            <span>Accuracy:</span>
                            <span className="bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                              {order.precisionDriftMs !== undefined
                                ? `${order.precisionDriftMs > 0 ? '+' : ''}${order.precisionDriftMs} ms`
                                : '0 ms'}
                            </span>
                          </div>
                          {(order.xmOrderId || order.brokerOrderId) && (
                            <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              Ticket #{order.xmOrderId || order.brokerOrderId}
                            </div>
                          )}
                        </div>
                      )}

                      {(isFailed || isCancelled) && (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          PENDING
                        </span>
                      )}
                      {isExecuting && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          EXECUTING
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>FILLED</span>
                        </span>
                      )}
                      {isFailed && (
                        <div title={order.errorMessage || 'Execution Failed'}>
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            <span>FAILED</span>
                          </span>
                        </div>
                      )}
                      {isCancelled && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          CANCELLED
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-right">
                      {isPending && (
                        <button
                          onClick={() => onCancelOrder(order.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all font-sans text-xs font-semibold flex items-center gap-1 ml-auto"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
