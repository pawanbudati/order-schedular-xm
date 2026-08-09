import React, { useState, useEffect } from 'react';
import { Shield, Clock, Terminal, Key, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  onOpenConfig: () => void;
  onOpenLogs: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onOpenConfig, onOpenLogs }) => {
  const [currentIst, setCurrentIst] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const offset = status?.offsetMs || 0;
      const now = new Date(Date.now() + offset);
      const timeStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      setCurrentIst(`${timeStr}.${ms} IST`);
    }, 45); // Update fast for millisecond tick

    return () => clearInterval(timer);
  }, [status]);

  return (
    <header className="w-full glass-panel border-b border-slate-800 px-3 py-3 sm:px-6 sm:py-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-black fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  XM360 Order Scheduler
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
                  1ms Engine
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block">Automated FX, Gold & CFD Execution Engine</p>
            </div>
          </div>
        </div>

        {/* Server Clock & API Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-end w-full md:w-auto">
          {/* Clock Sync Display */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-pulse shrink-0" />
            <span className="text-cyan-300 font-semibold text-xs sm:text-sm">{currentIst || 'Syncing...'}</span>
            {status && (
              <span className="text-[10px] sm:text-[11px] text-slate-400 border-l border-slate-700 pl-1.5 sm:pl-2">
                Offset: <span className={Math.abs(status.offsetMs) < 50 ? 'text-emerald-400' : 'text-amber-400'}>{status.offsetMs > 0 ? `+${status.offsetMs}` : status.offsetMs}ms</span>
              </span>
            )}
          </div>

          {/* Account Status Pill */}
          <div className="flex items-center gap-1.5">
            {status?.hasApiKeys ? (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] sm:text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>XM Connected ({status.accountId || 'Active'})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] sm:text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>No Account</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenConfig}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] sm:text-xs font-medium transition-all"
            >
              <Key className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Settings</span>
            </button>
            <button
              onClick={onOpenLogs}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] sm:text-xs font-medium transition-all"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Logs</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
