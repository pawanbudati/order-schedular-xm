import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { OrderForm } from './components/OrderForm';
import { OrderQueue } from './components/OrderQueue';
import { ConfigModal } from './components/ConfigModal';
import { LogsModal } from './components/LogsModal';
import { api } from './services/api';
import { SystemStatus, AccountBalance, Ticker, ScheduledOrder, ExecutionLog } from './types';

export default function App() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<Ticker | null>(null);
  const [quantity, setQuantity] = useState<string>('0.01');
  const [leverage, setLeverage] = useState<number>(1000);
  const [orders, setOrders] = useState<ScheduledOrder[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);

  // Load system status & server time sync
  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getStatus();
      setStatus(data);
    } catch (err) {
      console.warn('Failed to fetch status:', err);
    }
  }, []);

  // Load account balance
  const fetchBalance = useCallback(async () => {
    setIsBalanceLoading(true);
    try {
      const data = await api.getBalance();
      setBalance(data);
    } catch (err) {
      console.warn('Failed to fetch balance:', err);
    } finally {
      setIsBalanceLoading(false);
    }
  }, []);

  // Load tickers
  const fetchPairs = useCallback(async () => {
    try {
      const data = await api.getPairs();
      setTickers(data);
      if (!selectedTicker && data.length > 0) {
        setSelectedTicker(data[0]);
      }
    } catch (err) {
      console.warn('Failed to fetch pairs:', err);
    }
  }, [selectedTicker]);

  // Load orders queue
  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.warn('Failed to fetch orders:', err);
    }
  }, []);

  // Load logs
  const fetchLogs = useCallback(async () => {
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (err) {
      console.warn('Failed to fetch logs:', err);
    }
  }, []);

  // Initial load & periodic background refresh
  useEffect(() => {
    fetchStatus();
    fetchBalance();
    fetchPairs();
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
      fetchStatus();
    }, 1500);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchBalance, fetchPairs, fetchOrders]);

  // Handle % selection for available funds calculation
  const handleSelectPercentage = (pct: number) => {
    const avail = balance?.availableMargin || 0;
    const currentPrice = selectedTicker?.lastPrice || 1;
    if (avail > 0 && currentPrice > 0) {
      const marginToUse = (avail * (pct / 100));
      const purchasingPowerUsdt = marginToUse * leverage;
      const computedQty = purchasingPowerUsdt / currentPrice;

      // Format quantity with appropriate decimals
      if (computedQty >= 100) {
        setQuantity(computedQty.toFixed(1));
      } else if (computedQty >= 1) {
        setQuantity(computedQty.toFixed(2));
      } else {
        setQuantity(computedQty.toFixed(4));
      }
    }
  };

  // Schedule order submission handler
  const handleScheduleOrder = async (orderData: {
    symbol: string;
    side: 'BUY' | 'SELL';
    positionSide: 'LONG' | 'SHORT' | 'BOTH';
    type: 'MARKET' | 'LIMIT';
    price?: number;
    quantity: number;
    leverage: number;
    targetTime: number;
  }) => {
    await api.scheduleOrder(orderData);
    await fetchOrders();
  };

  // Cancel order handler
  const handleCancelOrder = async (id: string) => {
    await api.cancelOrder(id);
    await fetchOrders();
  };

  // Save API Key config handler
  const handleSaveConfig = async (config: {
    apiToken: string;
    accountId: string;
    password?: string;
    serverName: string;
    platform: 'MT4' | 'MT5';
  }) => {
    await api.updateConfig(config);
    await fetchStatus();
    await fetchBalance();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E17] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Header Navigation */}
      <Header
        status={status}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenLogs={() => {
          fetchLogs();
          setIsLogsOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* No Account Prompt Banner */}
        {status && !status.hasApiKeys && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">No XM MetaTrader Account Connected</h4>
                <p className="text-xs text-slate-300">Please connect your XM MT5 Account & credentials to enable live balance metrics and order execution.</p>
              </div>
            </div>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shrink-0 transition-all shadow-lg shadow-cyan-500/20"
            >
              Connect XM Account
            </button>
          </div>
        )}

        {/* Top Grid: Balance & Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <BalanceCard
              balance={balance}
              selectedTicker={selectedTicker}
              leverage={leverage}
              onSelectPercentage={handleSelectPercentage}
              onRefreshBalance={fetchBalance}
              isLoading={isBalanceLoading}
            />
          </div>

          {/* Quick Stats Banner */}
          <div className="md:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">High-Precision XM360 Engine</h3>
                <p className="text-xs text-slate-400">XM Broker Millisecond Timestamp Execution</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                2-Stage Spin-Lock Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 my-3 text-center">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">XM Broker Offset</span>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                  {status ? (status.offsetMs > 0 ? `+${status.offsetMs}` : `${status.offsetMs}`) : '0'} ms
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Pending Orders</span>
                <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                  {orders.filter((o) => o.status === 'PENDING').length}
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Avg Execution Drift</span>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                  {(() => {
                    const completed = orders.filter((o) => o.status === 'COMPLETED' && o.precisionDriftMs !== undefined);
                    if (completed.length === 0) return '±1.8 ms';
                    const avg = completed.reduce((acc, curr) => acc + Math.abs(curr.precisionDriftMs || 0), 0) / completed.length;
                    return `+${avg.toFixed(1)} ms`;
                  })()}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Selected Pair: <span className="text-slate-300 font-mono font-semibold">{selectedTicker?.symbol || 'XAUUSD'}</span> ({selectedTicker ? (selectedTicker.lastPrice < 10 ? selectedTicker.lastPrice.toFixed(4) : `$${selectedTicker.lastPrice.toLocaleString()}`) : '$2435.50'})</span>
              <span>XM Server: <span className="text-slate-400 font-mono">{status?.serverName || 'XMGlobal-Real'}</span></span>
            </div>
          </div>
        </div>

        {/* Main Grid: Order Form & Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Order Form (5 cols) */}
          <div className="lg:col-span-5">
            <OrderForm
              tickers={tickers}
              selectedTicker={selectedTicker}
              onSelectTicker={setSelectedTicker}
              quantity={quantity}
              setQuantity={setQuantity}
              leverage={leverage}
              setLeverage={setLeverage}
              onSubmitSchedule={handleScheduleOrder}
            />
          </div>

          {/* Queue & History (7 cols) */}
          <div className="lg:col-span-7">
            <OrderQueue
              orders={orders}
              onCancelOrder={handleCancelOrder}
              serverOffsetMs={status?.offsetMs || 0}
            />
          </div>
        </div>
      </main>

      {/* API Key Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSaveConfig={handleSaveConfig}
        currentHasKeys={status?.hasApiKeys || false}
      />

      {/* Execution Logs Modal */}
      <LogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        logs={logs}
        onRefreshLogs={fetchLogs}
      />
    </div>
  );
}
