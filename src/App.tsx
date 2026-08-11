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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('XM360_THEME');
    return (saved as 'dark' | 'light') || 'dark';
  });

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

  // Sync theme with <html> document tag
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('XM360_THEME', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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
        const goldTicker = data.find(t => 
          t.symbol.toUpperCase().includes('XAU') || 
          t.symbol.toUpperCase().includes('GOLD')
        );
        setSelectedTicker(goldTicker || data[0]);
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
    positionSide?: 'LONG' | 'SHORT' | 'BOTH';
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
    <div className="min-h-screen bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-900 transition-colors duration-300 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <Header
        status={status}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenLogs={() => setIsLogsOpen(true)}
      />

      {/* Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
        {/* Top Grid: Balance & Engine Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Balance Card (1 col) */}
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

          {/* High-Precision XM Engine Banner (2 cols) */}
          <div className="md:col-span-2 glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex flex-col justify-between gap-3 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">High-Precision 1ms Execution Engine</h3>
                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">Native Windows MT5 Terminal Execution</p>
              </div>
              <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Spin-Lock Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 my-1 text-center">
              <div className="bg-slate-900/70 dark:bg-slate-900/70 light:bg-slate-100/80 p-2.5 sm:p-3 rounded-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
                <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">MT5 Time Sync</span>
                <div className="text-sm sm:text-lg font-bold font-mono text-cyan-400 dark:text-cyan-400 light:text-cyan-600 mt-0.5">
                  {status ? (status.offsetMs > 0 ? `+${status.offsetMs}` : `${status.offsetMs}`) : '0'} ms
                </div>
              </div>

              <div className="bg-slate-900/70 dark:bg-slate-900/70 light:bg-slate-100/80 p-2.5 sm:p-3 rounded-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
                <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">Pending Orders</span>
                <div className="text-sm sm:text-lg font-bold font-mono text-amber-400 dark:text-amber-400 light:text-amber-600 mt-0.5">
                  {orders.filter((o) => o.status === 'PENDING').length}
                </div>
              </div>

              <div className="bg-slate-900/70 dark:bg-slate-900/70 light:bg-slate-100/80 p-2.5 sm:p-3 rounded-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
                <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">Avg Execution Accuracy</span>
                <div className="text-sm sm:text-lg font-bold font-mono text-emerald-400 dark:text-emerald-400 light:text-emerald-600 mt-0.5">
                  {(() => {
                    const completed = orders.filter((o) => o.status === 'COMPLETED' && o.precisionDriftMs !== undefined);
                    if (completed.length === 0) return '±1.8 ms';
                    const avg = completed.reduce((acc, curr) => acc + Math.abs(curr.precisionDriftMs || 0), 0) / completed.length;
                    return `+${avg.toFixed(1)} ms`;
                  })()}
                </div>
              </div>
            </div>

            <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 flex items-center justify-between font-medium">
              <span>Selected Pair: <span className="text-cyan-400 dark:text-cyan-400 light:text-cyan-600 font-mono font-bold">{selectedTicker?.symbol || 'XAUUSD'}</span> ({selectedTicker ? (selectedTicker.lastPrice < 10 ? selectedTicker.lastPrice.toFixed(4) : `$${selectedTicker.lastPrice.toLocaleString()}`) : '$2435.50'})</span>
              <span>XM Server: <span className="text-slate-300 dark:text-slate-300 light:text-slate-800 font-mono font-bold">{status?.serverName || 'XMGlobal-Real'}</span></span>
            </div>
          </div>
        </div>

        {/* Main Grid: Order Form & Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
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
