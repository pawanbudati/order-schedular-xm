import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Zap } from 'lucide-react';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { OrderForm } from './components/OrderForm';
import { OrderQueue } from './components/OrderQueue';
import { ConfigModal } from './components/ConfigModal';
import { LogsModal } from './components/LogsModal';
import { PasscodeModal } from './components/PasscodeModal';
import { api } from './services/api';
import { SystemStatus, AccountBalance, Ticker, ScheduledOrder, ExecutionLog } from './types';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('XM360_THEME');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('XM360_IS_AUTHENTICATED') === 'true';
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

  const handleAuthenticate = (enteredPin: string): boolean => {
    const savedPin = localStorage.getItem('XM360_PASSCODE') || '1234';
    if (enteredPin === savedPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('XM360_IS_AUTHENTICATED', 'true');
      return true;
    }
    return false;
  };

  const handleLockScreen = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('XM360_IS_AUTHENTICATED');
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
    const avail = balance?.availableMargin || balance?.equity || 0;
    const currentPrice = selectedTicker?.lastPrice || 1;
    const sym = (selectedTicker?.symbol || 'XAUUSD').toUpperCase();
    
    // Determine MT5 Contract Size (1 Lot = 100 oz for Gold, 100k for Forex)
    let contractSize = 1;
    if (sym.includes('XAU') || sym.includes('GOLD')) {
      contractSize = 100; // 1 Lot = 100 oz (0.01 Lot = 1 oz)
    } else if (sym.includes('EUR') || sym.includes('GBP') || sym.includes('AUD') || sym.includes('USD') || sym.includes('CAD') || sym.includes('NZD') || sym.includes('CHF') || sym.includes('JPY')) {
      if (!sym.includes('US30') && !sym.includes('US500') && !sym.includes('USTECH') && !sym.includes('BTC') && !sym.includes('ETH')) {
        contractSize = 100000; // 1 Lot = 100,000 units for Forex
      }
    }

    if (avail > 0 && currentPrice > 0) {
      const marginForPct = avail * (pct / 100);
      const marginPerLot = (contractSize * currentPrice) / (leverage || 1);
      const computedLots = marginPerLot > 0 ? marginForPct / marginPerLot : 0.01;

      // Min 0.01 Lot (Micro Lot)
      const roundedLots = Math.max(0.01, Math.floor(computedLots * 100) / 100);
      setQuantity(roundedLots.toFixed(2));
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

  // Delete order history handler
  const handleDeleteOrderHistory = async (id: string) => {
    await api.deleteOrderHistory(id);
    await fetchOrders();
  };

  // Clear all completed/failed order history handler
  const handleClearOrderHistory = async () => {
    await api.clearOrderHistory();
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
      {/* Passcode Security Lock Screen Modal */}
      <PasscodeModal
        isAuthenticated={isAuthenticated}
        onAuthenticate={handleAuthenticate}
      />

      {/* Header */}
      <Header
        status={status}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenLogs={() => setIsLogsOpen(true)}
        onLock={handleLockScreen}
      />

      {/* Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-5 md:p-6 space-y-3 sm:space-y-5">
        {/* Ultra-Compact Top Engine Status Bar */}
        <div className="glass-panel px-3 py-2 rounded-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />
            <span className="font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 text-[11px] sm:text-xs">XM 1ms Spin-Lock Active</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 hidden sm:inline">| {status?.serverName || 'XMGlobal-Real'}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-slate-400 dark:text-slate-400 light:text-slate-600">Sync: <strong className="text-cyan-400 dark:text-cyan-400 light:text-cyan-600">{status ? (status.offsetMs > 0 ? `+${status.offsetMs}` : `${status.offsetMs}`) : '0'} ms</strong></span>
            <span className="text-slate-400 dark:text-slate-400 light:text-slate-600">Pending: <strong className="text-amber-400 dark:text-amber-400 light:text-amber-600">{orders.filter((o) => o.status === 'PENDING').length}</strong></span>
          </div>
        </div>

        {/* Balance Card Section */}
        <div>
          <BalanceCard
            balance={balance}
            selectedTicker={selectedTicker}
            leverage={leverage}
            onSelectPercentage={handleSelectPercentage}
            onRefreshBalance={fetchBalance}
            isLoading={isBalanceLoading}
          />
        </div>

        {/* Main Grid: Order Form & Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6">
          {/* Order Form (5 cols) */}
          <div id="schedule-order-section" className="lg:col-span-5 scroll-mt-4">
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
          <div id="orders-queue-section" className="lg:col-span-7 scroll-mt-4">
            <OrderQueue
              orders={orders}
              onCancelOrder={handleCancelOrder}
              onDeleteOrderHistory={handleDeleteOrderHistory}
              onClearOrderHistory={handleClearOrderHistory}
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
