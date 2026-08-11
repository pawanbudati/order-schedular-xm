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
    <header className="w-full glass-panel border-b border-slate-200 dark:border-slate-800/80 px-3 py-2.5 sm:px-6 sm:py-3 sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
        {/* Brand & Connection Pill */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Zap className="w-4 h-4 text-white fill-current" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <h1 className="text-xs sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  XM360 Order Scheduler
                </h1>
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold rounded-full bg-blue-100 dark:bg-cyan-500/10 text-blue-800 dark:text-cyan-400 border border-blue-300 dark:border-cyan-500/30 shrink-0">
                  1ms Engine
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Actions & Lock */}
          <div className="flex items-center gap-1.5 md:hidden shrink-0 ml-2">
            <button
              onClick={onLock}
              title={userRole === 'ADMIN' ? 'Switch Role / Lock' : 'Unlock Admin Mode'}
              aria-label="Lock / Switch Role"
              className="p-1.5 sm:p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-cyan-400 border border-blue-200 dark:border-slate-800 transition-all shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700 dark:text-cyan-400" />
            </button>
            <button
              onClick={onToggleTheme}
              aria-label="Toggle Theme"
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-800 transition-all shadow-sm"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />}
            </button>
            {userRole === 'ADMIN' && (
              <button
                onClick={onOpenConfig}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-800 text-xs font-bold shadow-sm"
              >
                <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 dark:text-cyan-400" />
              </button>
            )}
          </div>
        </div>

        {/* Server Clock & API Status Bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-end w-full md:w-auto border-t border-slate-200 dark:border-slate-800/50 md:border-0 pt-2 md:pt-0">
          {/* Clock Sync Display */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 px-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-800 font-mono text-xs shadow-sm">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 animate-pulse shrink-0" />
            <span className="text-blue-700 dark:text-cyan-300 font-black text-xs">{currentIst || 'Syncing...'}</span>
            {status && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700/60 pl-1.5 font-bold">
                <span className={Math.abs(status.offsetMs) < 50 ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : 'text-amber-700 dark:text-amber-400 font-extrabold'}>
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
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-cyan-500/10 text-blue-900 dark:text-cyan-400 border border-blue-300 dark:border-cyan-500/30 text-[11px] font-black shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-blue-700 dark:text-cyan-400" />
                <span>Admin</span>
              </div>
            ) : (
              <div
                title="Guest Mode: Sandbox Demo Mode (Orders do not execute on MT5)"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 text-[11px] font-black shadow-sm"
              >
                <Eye className="w-3.5 h-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
                <span>Guest (Demo Sandbox)</span>
              </div>
            )}
          </div>

          {/* Account Status Pill */}
          <div className="flex items-center gap-1">
            {status?.hasApiKeys || status?.mt5Connected ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 text-[11px] font-black shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                <span>MT5 Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 text-[11px] font-black shadow-sm">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
                <span>MT5 Pending</span>
              </div>
            )}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {/* Lock / Role Button */}
            <button
              onClick={onLock}
              title={userRole === 'ADMIN' ? 'Lock / Switch to Guest' : 'Unlock Admin Mode'}
              className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-cyan-400 border border-blue-200 dark:border-slate-800 transition-all shadow-sm flex items-center gap-1.5 text-xs font-black px-3 py-1.5"
            >
              <Lock className="w-3.5 h-3.5 shrink-0 text-blue-700 dark:text-cyan-400" />
              <span>{userRole === 'ADMIN' ? 'Lock' : 'Login Admin'}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-800 transition-all shadow-sm active:scale-95"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Settings Button */}
            {userRole === 'ADMIN' && (
              <button
                onClick={onOpenConfig}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 text-xs font-extrabold transition-all shadow-sm active:scale-95"
              >
                <Key className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                <span>Settings</span>
              </button>
            )}

            {/* Logs Button */}
            <button
              onClick={onOpenLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 text-xs font-extrabold transition-all shadow-sm active:scale-95"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Logs</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
