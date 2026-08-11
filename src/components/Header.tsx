import React, { useState, useEffect } from 'react';
import { Shield, Clock, Terminal, Key, Zap, CheckCircle2, AlertCircle, Sun, Moon, Lock, ShieldCheck, Eye } from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  theme: 'dark' | 'light';
  userRole: 'ADMIN' | 'GUEST';
  onToggleTheme: () => void;
  onOpenConfig: () => void;
  onOpenLogs: () => void;
  onLock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  theme,
  userRole,
  onToggleTheme,
  onOpenConfig,
  onOpenLogs,
  onLock,
}) => {
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
    }, 45);

    return () => clearInterval(timer);
  }, [status]);

  return (
    <header className="w-full glass-panel border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3 sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
        {/* Brand & Connection Pill */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
              <Zap className="w-4 h-4 text-white fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-900">
                  XM360 Order Scheduler
                </h1>
                <span className="px-1.5 py-0.2 text-[9px] sm:text-[10px] font-bold rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 light:bg-cyan-100 text-cyan-400 dark:text-cyan-400 light:text-cyan-700 border border-cyan-500/30 shrink-0">
                  1ms Engine
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Actions & Lock */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onLock}
              title={userRole === 'ADMIN' ? 'Switch Role / Lock' : 'Unlock Admin Mode'}
              aria-label="Lock / Switch Role"
              className="p-1.5 rounded-lg bg-slate-800/80 dark:bg-slate-800 light:bg-slate-100 text-cyan-400 hover:bg-slate-700 border border-slate-700 dark:border-slate-700 light:border-slate-300 transition-all"
            >
              <Lock className="w-4 h-4 text-cyan-400 dark:text-cyan-400 light:text-cyan-600" />
            </button>
            <button
              onClick={onToggleTheme}
              aria-label="Toggle Theme"
              className="p-1.5 rounded-lg bg-slate-800/80 dark:bg-slate-800 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-700 border border-slate-700 dark:border-slate-700 light:border-slate-300 transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
            <button
              onClick={onOpenConfig}
              className="p-1.5 rounded-lg bg-slate-800/80 dark:bg-slate-800 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 border border-slate-700 dark:border-slate-700 light:border-slate-300 text-xs font-semibold"
            >
              <Key className="w-4 h-4 text-cyan-400 dark:text-cyan-400 light:text-cyan-600" />
            </button>
          </div>
        </div>

        {/* Server Clock & API Status Bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-end w-full md:w-auto border-t border-slate-800/50 dark:border-slate-800/50 light:border-slate-200 md:border-0 pt-2 md:pt-0">
          {/* Clock Sync Display */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-300 font-mono text-xs shadow-inner">
            <Clock className="w-3.5 h-3.5 text-cyan-400 dark:text-cyan-400 light:text-cyan-600 animate-pulse shrink-0" />
            <span className="text-cyan-400 dark:text-cyan-300 light:text-cyan-700 font-bold text-xs">{currentIst || 'Syncing...'}</span>
            {status && (
              <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 border-l border-slate-700/60 dark:border-slate-700/60 light:border-slate-300 pl-1.5">
                <span className={Math.abs(status.offsetMs) < 50 ? 'text-emerald-400 dark:text-emerald-400 light:text-emerald-600 font-semibold' : 'text-amber-400 dark:text-amber-400 light:text-amber-600 font-semibold'}>
                  {status.offsetMs > 0 ? `+${status.offsetMs}` : status.offsetMs}ms
                </span>
              </span>
            )}
          </div>

          {/* User Role Pill */}
          <div className="flex items-center gap-1">
            {userRole === 'ADMIN' ? (
              <div
                title="Admin Mode: Live MT5 Order Execution Enabled"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 light:bg-cyan-100 text-cyan-400 dark:text-cyan-400 light:text-cyan-700 border border-cyan-500/30 light:border-cyan-300 text-[11px] font-bold"
              >
                <ShieldCheck className="w-3 h-3 shrink-0 text-cyan-400" />
                <span>Admin</span>
              </div>
            ) : (
              <div
                title="Guest Mode: Sandbox Demo Mode (Orders do not execute on MT5)"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/10 light:bg-amber-100 text-amber-400 dark:text-amber-400 light:text-amber-700 border border-amber-500/30 light:border-amber-300 text-[11px] font-bold"
              >
                <Eye className="w-3 h-3 shrink-0 text-amber-400" />
                <span>Guest (Demo Sandbox)</span>
              </div>
            )}
          </div>

          {/* Account Status Pill */}
          <div className="flex items-center gap-1">
            {status?.hasApiKeys || status?.mt5Connected ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-100 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 border border-emerald-500/30 light:border-emerald-300 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>MT5 Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/10 light:bg-amber-100 text-amber-400 dark:text-amber-400 light:text-amber-700 border border-amber-500/30 light:border-amber-300 text-[11px] font-semibold">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>MT5 Pending</span>
              </div>
            )}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onLock}
              title={userRole === 'ADMIN' ? 'Lock / Switch to Guest' : 'Unlock Admin Mode'}
              className="p-1.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-cyan-400 dark:text-cyan-400 light:text-cyan-600 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-800 dark:border-slate-800 light:border-slate-300 transition-all shadow-sm flex items-center gap-1 text-xs font-semibold px-2.5"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>{userRole === 'ADMIN' ? 'Lock' : 'Login Admin'}</span>
            </button>

            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-1.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-800 dark:border-slate-800 light:border-slate-300 transition-all shadow-sm"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            <button
              onClick={onOpenConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 text-slate-200 dark:text-slate-200 light:text-slate-800 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs font-semibold transition-all shadow-sm"
            >
              <Key className="w-3.5 h-3.5 text-cyan-400 dark:text-cyan-400 light:text-cyan-600 shrink-0" />
              <span>Settings</span>
            </button>
            <button
              onClick={onOpenLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 text-slate-200 dark:text-slate-200 light:text-slate-800 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs font-semibold transition-all shadow-sm"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400 dark:text-blue-400 light:text-blue-600 shrink-0" />
              <span>Logs</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
