import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Zap } from 'lucide-react';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { OrderForm } from './components/OrderForm';
import { OrderQueue } from './components/OrderQueue';
import { ConfigModal } from './components/ConfigModal';
import { LogsModal } from './components/LogsModal';
import { PasscodeModal } from './components/PasscodeModal';
import { AccountManagerModal } from './components/AccountManagerModal';
import { api } from './services/api';
import { SystemStatus, AccountBalance, Ticker, ScheduledOrder, ExecutionLog, AccountConfig } from './types';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('XM360_THEME');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [userRole, setUserRole] = useState<'ADMIN' | 'GUEST'>(() => {
    const savedRole = sessionStorage.getItem('XM360_USER_ROLE');
    return (savedRole as 'ADMIN' | 'GUEST') || 'GUEST';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('XM360_IS_AUTHENTICATED') === 'true';
  });

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [accounts, setAccounts] = useState<AccountConfig[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>('');
  const [detectedInstances, setDetectedInstances] = useState<any[]>([]);
  const [configuredPaths, setConfiguredPaths] = useState<string[]>([]);
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
  const [isAccountsOpen, setIsAccountsOpen] = useState<boolean>(false);

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

  const handleAuthenticateAdmin = async (enteredPin: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.verifyPasscode(enteredPin);
    if (res.success) {
      setUserRole('ADMIN');
      setIsAuthenticated(true);
      sessionStorage.setItem('XM360_USER_ROLE', 'ADMIN');
      sessionStorage.setItem('XM360_IS_AUTHENTICATED', 'true');
      return { success: true, message: res.message || 'Admin authentication successful' };
    }
    return { success: false, message: res.message || 'Incorrect Admin PIN or Password' };
  };

  const handleGuestAccess = () => {
    setUserRole('GUEST');
    setIsAuthenticated(true);
    sessionStorage.setItem('XM360_USER_ROLE', 'GUEST');
    sessionStorage.setItem('XM360_IS_AUTHENTICATED', 'true');
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

  // Load accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.getAccounts();
      if (res.accounts) setAccounts(res.accounts);
      if (res.activeAccountId) setActiveAccountId(res.activeAccountId);
      if (res.detectedInstances) setDetectedInstances(res.detectedInstances);
      if (res.configuredPaths) setConfiguredPaths(res.configuredPaths);
    } catch (err) {
      console.warn('Failed to fetch accounts:', err);
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
        const goldTicker = data.find((t) => t.symbol.toUpperCase().includes('XAU') || t.symbol.toUpperCase().includes('GOLD'));
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
    fetchAccounts();
    fetchBalance();
    fetchPairs();
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
      fetchStatus();
    }, 1500);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchAccounts, fetchBalance, fetchPairs, fetchOrders]);

  // Account Switch handler
  const handleSwitchAccount = async (id: string) => {
    const res = await api.switchAccount(id);
    if (res.success) {
      setActiveAccountId(res.activeAccountId || id);
      await fetchStatus();
      await fetchBalance();
      await fetchPairs();
    } else {
      alert(res.error || 'Failed to switch active account');
    }
  };

  // Add Account handler
  const handleAddAccount = async (accountData: any) => {
    const res = await api.addAccount(accountData);
    if (res.success) {
      await fetchAccounts();
      await fetchStatus();
      await fetchBalance();
    } else {
      throw new Error(res.error || 'Failed to add MT5 account');
    }
  };

  // Delete Account handler
  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this account?')) {
      const res = await api.deleteAccount(id);
      if (res.success) {
        await fetchAccounts();
        await fetchStatus();
        await fetchBalance();
      }
    }
  };

  // Handle % selection for available funds calculation
  const handleSelectPercentage = (pct: number) => {
    const avail = balance?.availableMargin || balance?.equity || 0;
    const currentPrice = selectedTicker?.lastPrice || 1;
    const sym = (selectedTicker?.symbol || 'XAUUSD').toUpperCase();

    // Determine MT5 Contract Size (1 Lot = 100 oz for Gold, 100k for Forex)
    let contractSize = 1;
    if (sym.includes('XAU') || sym.includes('GOLD')) {
      contractSize = 100; // 1 Lot = 100 oz (0.01 Lot = 1 oz)
    } else if (
      sym.includes('EUR') ||
      sym.includes('GBP') ||
      sym.includes('AUD') ||
      sym.includes('USD') ||
      sym.includes('CAD') ||
      sym.includes('NZD') ||
      sym.includes('CHF') ||
      sym.includes('JPY')
    ) {
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
    stopLoss?: number;
    takeProfit?: number;
    accountId?: string;
    accountName?: string;
    serverName?: string;
    terminalPath?: string;
  }) => {
    if (userRole === 'GUEST') {
      // Create local GUEST sandbox mock order
      const mockOrder: ScheduledOrder = {
        id: `MOCK-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        symbol: orderData.symbol,
        side: orderData.side,
        positionSide: orderData.positionSide || 'BOTH',
        type: orderData.type,
        quantity: orderData.quantity,
        price: orderData.price,
        leverage: orderData.leverage,
        targetTime: orderData.targetTime,
        targetTimeFormatted: `${new Date(orderData.targetTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}.${String(new Date(orderData.targetTime).getMilliseconds()).padStart(3, '0')} IST`,
        status: 'PENDING',
        createdAt: Date.now(),
        stopLoss: orderData.stopLoss,
        takeProfit: orderData.takeProfit,
        isMock: true,
        xmOrderId: 'GUEST-MOCK-TICKET',
        accountId: orderData.accountId || 'GUEST-ACC',
        accountName: orderData.accountName || 'Guest Sandbox Account',
      };

      setOrders((prev) => [mockOrder, ...prev]);

      // Set simulated completion timer for Guest Mock Order
      const delay = Math.max(0, orderData.targetTime - Date.now());
      setTimeout(() => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === mockOrder.id
              ? {
                  ...o,
                  status: 'COMPLETED',
                  precisionDriftMs: Math.floor(Math.random() * 4),
                  actualTime: Date.now(),
                }
              : o
          )
        );
      }, delay);

      alert(
        `📌 GUEST DEMO MODE:\nOrder scheduled as a sandbox simulation.\n\nSince you are in Guest Mode, this order will NOT be executed on live MT5.\n\nTo place live MT5 orders, unlock Admin mode with your Admin PIN.`
      );
      return;
    }

    // ADMIN MODE: Live MT5 Order Placement
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
  const handleSaveConfig = async (config: { apiToken: string; accountId: string; serverName: string; platform: 'MT4' | 'MT5' }) => {
    if (userRole === 'GUEST') {
      alert('🔒 Guest Mode: Admin PIN required to modify live MT5 configuration.');
      return;
    }
    await api.updateConfig(config);
    await fetchStatus();
    await fetchAccounts();
    await fetchBalance();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col font-sans selection:bg-cyan-500 selection:text-white dark:selection:text-slate-950">
      {/* Passcode Security & Role Access Lock Modal */}
      <PasscodeModal isAuthenticated={isAuthenticated} onAuthenticateAdmin={handleAuthenticateAdmin} onGuestAccess={handleGuestAccess} />

      {/* Header */}
      <Header
        status={status}
        theme={theme}
        userRole={userRole}
        accounts={accounts}
        activeAccountId={activeAccountId}
        detectedInstances={detectedInstances}
        onSwitchAccount={handleSwitchAccount}
        onToggleTheme={toggleTheme}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenLogs={() => setIsLogsOpen(true)}
        onOpenAccounts={() => setIsAccountsOpen(true)}
        onLock={handleLockScreen}
      />

      {/* Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-5 md:p-6 space-y-3 sm:space-y-5">
        {/* Ultra-Compact Top Engine Status Bar */}
        <div className="glass-panel px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 fill-current" />
            <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] sm:text-xs">XM 1ms Spin-Lock Active</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              | {status?.accountName || status?.serverName || 'XMGlobal-Real'}
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-slate-600 dark:text-slate-400">
              Sync:{' '}
              <strong className="text-cyan-700 dark:text-cyan-400">
                {status ? (status.offsetMs > 0 ? `+${status.offsetMs}` : `${status.offsetMs}`) : '0'} ms
              </strong>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Pending: <strong className="text-amber-700 dark:text-amber-400">{orders.filter((o) => o.status === 'PENDING').length}</strong>
            </span>
          </div>
        </div>

        {/* Top Row Grid: Balance Card & Order Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-6">
          {/* Balance Card Section (5 cols) */}
          <div className="md:col-span-5">
            <BalanceCard
              balance={balance}
              selectedTicker={selectedTicker}
              leverage={leverage}
              onSelectPercentage={handleSelectPercentage}
              onRefreshBalance={fetchBalance}
              isLoading={isBalanceLoading}
            />
          </div>

          {/* Order Form Section (7 cols) */}
          <div id="schedule-order-section" className="md:col-span-7 scroll-mt-4">
            <OrderForm
              userRole={userRole}
              tickers={tickers}
              selectedTicker={selectedTicker}
              onSelectTicker={setSelectedTicker}
              quantity={quantity}
              setQuantity={setQuantity}
              leverage={leverage}
              setLeverage={setLeverage}
              accounts={accounts}
              activeAccountId={activeAccountId}
              onSubmitSchedule={handleScheduleOrder}
            />
          </div>
        </div>

        {/* Bottom Section: Unified Pending Orders Queue & History */}
        <div id="orders-queue-section" className="w-full scroll-mt-4">
          <OrderQueue
            orders={orders}
            accounts={accounts}
            onCancelOrder={handleCancelOrder}
            onDeleteOrderHistory={handleDeleteOrderHistory}
            onClearOrderHistory={handleClearOrderHistory}
            serverOffsetMs={status?.offsetMs || 0}
          />
        </div>
      </main>

      {/* Account Manager Modal */}
      <AccountManagerModal
        isOpen={isAccountsOpen}
        onClose={() => setIsAccountsOpen(false)}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSwitchAccount={handleSwitchAccount}
        onAddAccount={handleAddAccount}
        onDeleteAccount={handleDeleteAccount}
        detectedInstances={detectedInstances}
        configuredPaths={configuredPaths}
      />

      {/* API Key Modal */}
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} onSaveConfig={handleSaveConfig} currentHasKeys={status?.hasApiKeys || false} />

      {/* Execution Logs Modal */}
      <LogsModal isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} logs={logs} onRefreshLogs={fetchLogs} />
    </div>
  );
}

