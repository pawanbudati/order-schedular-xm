import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Server, Check, RefreshCw } from 'lucide-react';
import { api, getBackendUrl, setBackendUrl } from '../services/api';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (config: {
    apiToken: string;
    accountId: string;
    password?: string;
    serverName: string;
    platform: 'MT4' | 'MT5';
  }) => Promise<void>;
  currentHasKeys: boolean;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSaveConfig, currentHasKeys }) => {
  const [apiToken, setApiToken] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [serverName, setServerName] = useState<string>('XMGlobal-Real 30');
  const [platform, setPlatform] = useState<'MT4' | 'MT5'>('MT5');
  const [backendUrl, setBackendUrlInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectMsg, setConnectMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setBackendUrlInput(getBackendUrl());
      setApiToken(localStorage.getItem('XM360_API_TOKEN') || 'LOCAL');
      setAccountId(localStorage.getItem('XM360_ACCOUNT_ID') || '');
      setPassword(localStorage.getItem('XM360_PASSWORD') || '');
      setServerName(localStorage.getItem('XM360_SERVER_NAME') || 'XMGlobal-Real 30');
      setPlatform((localStorage.getItem('XM360_PLATFORM') as 'MT4' | 'MT5') || 'MT5');
      setConnectMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectBridge = async () => {
    setIsConnecting(true);
    setConnectMsg(null);
    try {
      setBackendUrl(backendUrl);
      localStorage.setItem('XM360_API_TOKEN', apiToken || 'LOCAL');
      if (accountId) localStorage.setItem('XM360_ACCOUNT_ID', accountId);
      if (password) localStorage.setItem('XM360_PASSWORD', password);
      if (serverName) localStorage.setItem('XM360_SERVER_NAME', serverName);
      if (platform) localStorage.setItem('XM360_PLATFORM', platform);

      // Save config first
      await onSaveConfig({ apiToken, accountId, password, serverName, platform });

      // Trigger manual bridge connection
      const res = await api.connectMt5Bridge();
      if (res.success) {
        setConnectMsg({ type: 'success', text: res.message });
      } else {
        setConnectMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setConnectMsg({ type: 'error', text: err.message || 'Failed to connect to MT5 Bridge' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      setBackendUrl(backendUrl);
      localStorage.setItem('XM360_API_TOKEN', apiToken || 'LOCAL');
      if (accountId) localStorage.setItem('XM360_ACCOUNT_ID', accountId);
      if (password) localStorage.setItem('XM360_PASSWORD', password);
      if (serverName) localStorage.setItem('XM360_SERVER_NAME', serverName);
      if (platform) localStorage.setItem('XM360_PLATFORM', platform);

      await onSaveConfig({ apiToken, accountId, password, serverName, platform });
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
        window.location.reload();
      }, 500);

    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
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

          {/* Account Password for Local MT5 Bridge */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">XM Account Password (for Local Headless MT5 Bridge)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter XM Account Password"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* API Token */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">MetaApi Access Token (or enter "LOCAL")</label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder={currentHasKeys ? "••••••••••••••••••••••••" : "Paste MetaApi Access Token or enter LOCAL"}
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
              <span className="text-[10px] text-slate-500">Default: http://localhost:8444/api</span>
            </label>
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrlInput(e.target.value)}
              placeholder="e.g. https://neo-copier.duckdns.org/xm-api"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>



          {/* Manual MT5 Connection Trigger Box */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnecting ? 'bg-amber-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
                <div>
                  <span className="text-xs font-semibold text-slate-200">MT5 Local Execution Bridge</span>
                  <p className="text-[10px] text-slate-400">Trigger connection to MT5 terminal using saved credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConnectBridge}
                disabled={isConnecting}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>{isConnecting ? 'Connecting...' : 'Connect to MT5'}</span>
              </button>
            </div>

            {connectMsg && (
              <div className={`p-2.5 rounded-lg text-xs font-medium border flex items-start gap-2 ${
                connectMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                <span>{connectMsg.text}</span>
              </div>
            )}
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
