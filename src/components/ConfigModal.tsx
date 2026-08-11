import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Server, Check, Lock } from 'lucide-react';
import { setBackendUrl } from '../services/api';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (config: {
    apiToken: string;
    accountId: string;
    serverName: string;
    platform: 'MT4' | 'MT5';
  }) => Promise<void>;
  currentHasKeys: boolean;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSaveConfig }) => {
  const [backendUrlInput, setBackendUrlInput] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const savedCustom = localStorage.getItem('XM360_BACKEND_URL');
      setBackendUrlInput(savedCustom || '');
      setPasscode(localStorage.getItem('XM360_PASSCODE') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      setBackendUrl(backendUrlInput);
      if (passcode) localStorage.setItem('XM360_PASSCODE', passcode);

      await onSaveConfig({
        apiToken: 'LOCAL',
        accountId: '',
        serverName: 'XMGlobal-Real',
        platform: 'MT5',
      });

      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-cyan-500/10 border border-blue-300 dark:border-cyan-500/20 text-blue-700 dark:text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">XM Terminal Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure security & API endpoint</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Security Terminal Passcode (PIN) */}
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                <span>Backend Admin Password / PIN</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Env: ADMIN_PASSWORD</span>
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Admin PIN"
              className="w-full bg-white dark:bg-slate-900/90 border border-slate-400 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-blue-800 dark:text-cyan-400 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500"
            />
          </div>

          {/* Backend Server URL */}
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                <span>Backend API Server URL (Client Override)</span>
              </span>
            </label>
            <input
              type="text"
              value={backendUrlInput}
              onChange={(e) => setBackendUrlInput(e.target.value)}
              placeholder="Default: https://order-schedular.duckdns.org"
              className="w-full bg-white dark:bg-slate-900/90 border border-slate-400 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-cyan-500"
            />
          </div>

          {/* Automatic MT5 Connection Banner */}
          <div className="bg-slate-100 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-300 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 flex items-start gap-2.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Orders attach directly to your active MetaTrader 5 desktop application. No MT5 credentials or login tokens are required or stored.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 dark:bg-cyan-500 hover:bg-blue-700 dark:hover:bg-cyan-400 text-white dark:text-slate-950 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {successMsg ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
