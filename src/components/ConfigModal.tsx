import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Server, Check } from 'lucide-react';
import { getBackendUrl, setBackendUrl } from '../services/api';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (config: {
    apiToken: string;
    accountId: string;
    serverName: string;
    platform: 'MT4' | 'MT5';
    isDemo: boolean;
  }) => Promise<void>;
  currentHasKeys: boolean;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSaveConfig, currentHasKeys }) => {
  const [apiToken, setApiToken] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [serverName, setServerName] = useState<string>('XMGlobal-Real 30');
  const [platform, setPlatform] = useState<'MT4' | 'MT5'>('MT5');
  const [isDemo, setIsDemo] = useState<boolean>(true);
  const [backendUrl, setBackendUrlInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setBackendUrlInput(getBackendUrl());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      setBackendUrl(backendUrl);
      await onSaveConfig({ apiToken, accountId, serverName, platform, isDemo });
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-lg w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">XM360 Broker Settings</h2>
            <p className="text-xs text-slate-400">Configure your XM MetaTrader Account & API Credentials</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Mode Selector */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-slate-200">Demo / Simulation Mode</span>
                <p className="text-xs text-slate-400">Test order execution without live XM broker risk</p>
              </div>
              <input
                type="checkbox"
                checked={isDemo}
                onChange={(e) => setIsDemo(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Account ID & Platform Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">XM Account ID / Login</label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g. 12345678"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">MetaTrader Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as 'MT4' | 'MT5')}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="MT5">MetaTrader 5 (MT5)</option>
                <option value="MT4">MetaTrader 4 (MT4)</option>
              </select>
            </div>
          </div>

          {/* Server Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">XM Server Name</label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="e.g. XMGlobal-Real 30 or XMGlobal-Demo"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* API Token */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">MetaApi / XM Access Token</label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder={currentHasKeys ? "••••••••••••••••••••••••" : "Paste MetaApi / XM Access Token"}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Backend Server URL */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>Backend API Server URL</span>
              </span>
              <span className="text-[10px] text-slate-500">Default: http://localhost:3001/api</span>
            </label>
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrlInput(e.target.value)}
              placeholder="e.g. http://localhost:3001/api"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Credentials are stored locally in your server database (`data.json`) and used exclusively for signing orders sent to your XM account.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              {successMsg ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Credentials</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
