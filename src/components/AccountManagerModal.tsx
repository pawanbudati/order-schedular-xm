import React, { useState } from 'react';
import { X, UserCheck, Plus, Trash2, CheckCircle2, Monitor, Shield, Sparkles } from 'lucide-react';
import { AccountConfig } from '../types';

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountConfig[];
  activeAccountId: string;
  onSwitchAccount: (id: string) => Promise<void>;
  onAddAccount: (data: {
    accountId: string;
    accountName?: string;
    serverName?: string;
    platform?: 'MT4' | 'MT5';
    password?: string;
    terminalPath?: string;
  }) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  detectedInstances?: any[];
  configuredPaths?: string[];
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  activeAccountId,
  onSwitchAccount,
  onAddAccount,
  onDeleteAccount,
  detectedInstances = [],
  configuredPaths = [],
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [serverName, setServerName] = useState('XMGlobal-Real 30');
  const [platform, setPlatform] = useState<'MT4' | 'MT5'>('MT5');
  const [terminalPath, setTerminalPath] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim()) {
      setError('MT5 Account ID / Login is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onAddAccount({
        accountId: accountId.trim(),
        accountName: accountName.trim() || `MT5 Account ${accountId.trim()}`,
        serverName: serverName.trim() || 'XMGlobal-Real 30',
        platform,
        password: password.trim() || undefined,
        terminalPath: terminalPath.trim() || undefined,
      });

      setAccountId('');
      setAccountName('');
      setTerminalPath('');
      setPassword('');
      setIsAdding(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  const handleImportInstance = (instance: any) => {
    setAccountId(instance.account_id || '');
    setAccountName(`XM Account ${instance.account_id}`);
    if (instance.server) setServerName(instance.server);
    if (instance.path) setTerminalPath(instance.path);
    setIsAdding(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 text-slate-900 dark:text-slate-100 transition-all my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Manage MT5 Accounts & Terminals</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch between running MT5 instances & configure account credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Detected Instances Banner */}
          {detectedInstances && detectedInstances.length > 0 && (
            <div className="p-3.5 rounded-xl bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  Auto-Detected Running MT5 Terminals ({detectedInstances.length})
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">From Windows processes & .env</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {detectedInstances.map((inst, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">Acct #{inst.account_id}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                        {inst.server} {inst.balance !== undefined ? `| $${inst.balance}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => handleImportInstance(inst)}
                      className="px-2 py-1 rounded bg-cyan-600 text-white text-[10px] font-semibold hover:bg-cyan-500 transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Use
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configured Accounts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Registered MT5 Accounts ({accounts.length})
              </h3>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAdding ? 'Cancel' : 'Add MT5 Account'}
              </button>
            </div>

            {/* Add Account Form */}
            {isAdding && (
              <form
                onSubmit={handleAddSubmit}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-cyan-500/30 space-y-3 animate-fadeIn"
              >
                <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Add New MetaTrader 5 Account
                </h4>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      MT5 Account Login (Number) *
                    </label>
                    <input
                      type="text"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      placeholder="e.g. 50123456"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Account Label / Name
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. XM Real Account 1"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Broker Server Name
                    </label>
                    <input
                      type="text"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="e.g. XMGlobal-Real 30"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Terminal Executable Path (Optional)
                    </label>
                    <input
                      type="text"
                      value={terminalPath}
                      onChange={(e) => setTerminalPath(e.target.value)}
                      placeholder="e.g. C:\Program Files\XM MT5\terminal64.exe"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Account'}
                  </button>
                </div>
              </form>
            )}

            {/* Accounts Cards */}
            <div className="space-y-2.5">
              {accounts.map((acc) => {
                const isActive = acc.id === activeAccountId || acc.accountId === activeAccountId;
                return (
                  <div
                    key={acc.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/40 ring-1 ring-cyan-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {acc.accountName || `MT5 Account ${acc.accountId}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                          #{acc.accountId}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-600 text-white flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>Server: <strong className="text-slate-700 dark:text-slate-300">{acc.serverName}</strong></span>
                        <span>Platform: <strong className="text-slate-700 dark:text-slate-300">{acc.platform}</strong></span>
                        {acc.terminalPath && (
                          <span className="truncate max-w-[220px]" title={acc.terminalPath}>
                            Path: <span className="font-mono text-[10px]">{acc.terminalPath}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!isActive ? (
                        <button
                          onClick={() => onSwitchAccount(acc.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-cyan-600 hover:text-white dark:hover:bg-cyan-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
                        >
                          Switch To Account
                        </button>
                      ) : (
                        <span className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold px-2 py-1">
                          Current Active
                        </span>
                      )}
                      {accounts.length > 1 && (
                        <button
                          onClick={() => onDeleteAccount(acc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition"
                          title="Delete account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-cyan-500" /> MT5 Multi-Instance Engine Active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
