import React from 'react';
import { X, Terminal, CheckCircle2, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { ExecutionLog } from '../types';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ExecutionLog[];
  onRefreshLogs: () => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({ isOpen, onClose, logs, onRefreshLogs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full h-[90vh] sm:h-[80vh] shadow-2xl relative flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-300 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Engine Execution Logs</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time millisecond timing & API execution traces</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshLogs}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Logs Content */}
        <div className="flex-1 overflow-y-auto my-4 space-y-2 font-mono text-xs pr-2">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">No logs recorded yet.</div>
          ) : (
            logs.map((log) => {
              const date = new Date(log.timestamp);
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
              const dateStr = `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}.${ms} IST`;

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border flex flex-col gap-1 ${
                    log.level === 'SUCCESS'
                      ? 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : log.level === 'ERROR'
                      ? 'bg-rose-500/10 border-rose-300 dark:border-rose-500/20 text-rose-800 dark:text-rose-300'
                      : log.level === 'WARN'
                      ? 'bg-amber-500/10 border-amber-300 dark:border-amber-500/20 text-amber-800 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] opacity-80">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">[{dateStr}]</span>
                    <span className="font-bold">{log.level}</span>
                  </div>
                  <div className="text-sm font-medium">{log.message}</div>
                  {log.details && (
                    <pre className="mt-1 p-2 bg-white dark:bg-slate-950/80 rounded-lg text-[10px] text-slate-700 dark:text-slate-400 overflow-x-auto border border-slate-200 dark:border-slate-900">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800/80 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
