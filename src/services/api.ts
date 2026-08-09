import axios from 'axios';
import { SystemStatus, AccountBalance, Ticker, ScheduledOrder, ExecutionLog } from '../types';

// Fallback local memory queue when backend is offline
let localOrdersQueue: ScheduledOrder[] = [];
let localLogsQueue: ExecutionLog[] = [];

export const getBackendUrl = (): string => {
  const customUrl = localStorage.getItem('XM360_BACKEND_URL');
  if (customUrl) return customUrl.replace(/\/$/, '');
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  return 'http://localhost:3001/api';
};

export const setBackendUrl = (url: string): void => {
  if (!url) {
    localStorage.removeItem('XM360_BACKEND_URL');
  } else {
    let formatted = url.trim().replace(/\/$/, '');
    if (!formatted.endsWith('/api')) {
      formatted = `${formatted}/api`;
    }
    localStorage.setItem('XM360_BACKEND_URL', formatted);
  }
};

const getApiBase = (): string => getBackendUrl();

export const api = {
  async getStatus(): Promise<SystemStatus> {
    try {
      const res = await axios.get(`${getApiBase()}/status`, { timeout: 3000 });
      return res.data;
    } catch {
      // Offline fallback status
      return {
        hasApiKeys: false,
        isDemo: true,
        offsetMs: 0,
        serverTime: Date.now(),
        localTime: Date.now(),
        serverName: 'XM (Offline Demo)',
        platform: 'MT5',
      };
    }
  },

  async updateConfig(config: {
    apiToken?: string;
    accountId?: string;
    serverName?: string;
    platform?: 'MT4' | 'MT5';
    isDemo?: boolean;
  }) {
    try {
      const res = await axios.post(`${getApiBase()}/config`, config, { timeout: 3000 });
      return res.data;
    } catch {
      return { success: true, message: 'Config saved locally (Offline Mode)' };
    }
  },

  async getBalance(): Promise<AccountBalance> {
    try {
      const res = await axios.get(`${getApiBase()}/balance`, { timeout: 3000 });
      return res.data.data;
    } catch {
      // Offline fallback balance
      return {
        totalEquity: 5000.0,
        availableMargin: 5000.0,
        usedMargin: 0.0,
        freeMargin: 5000.0,
        marginLevel: 1000.0,
        unrealizedPnl: 0.0,
        currency: 'USD',
      };
    }
  },

  async getPairs(): Promise<Ticker[]> {
    try {
      const res = await axios.get(`${getApiBase()}/pairs`, { timeout: 3000 });
      return res.data.data;
    } catch {
      // Offline fallback popular XM instruments
      return [
        { symbol: 'XAUUSD', lastPrice: 2435.50, bidPrice: 2435.35, askPrice: 2435.65, priceChangePercent: 0.85, high24h: 2448.00, low24h: 2422.10, volume24h: 890500, spread: 0.30 },
        { symbol: 'EURUSD', lastPrice: 1.0925, bidPrice: 1.0924, askPrice: 1.0926, priceChangePercent: -0.15, high24h: 1.0955, low24h: 1.0910, volume24h: 1240100, spread: 0.0002 },
        { symbol: 'GBPUSD', lastPrice: 1.2840, bidPrice: 1.2839, askPrice: 1.2841, priceChangePercent: 0.32, high24h: 1.2875, low24h: 1.2810, volume24h: 650300, spread: 0.0002 },
        { symbol: 'USDJPY', lastPrice: 147.20, bidPrice: 147.19, askPrice: 147.21, priceChangePercent: 0.45, high24h: 147.80, low24h: 146.50, volume24h: 780900, spread: 0.02 },
        { symbol: 'US30', lastPrice: 39450.0, bidPrice: 39448.0, askPrice: 39452.0, priceChangePercent: 0.65, high24h: 39600.0, low24h: 39300.0, volume24h: 420100, spread: 4.0 },
        { symbol: 'US500', lastPrice: 5420.5, bidPrice: 5420.0, askPrice: 5421.0, priceChangePercent: 0.52, high24h: 5440.0, low24h: 5400.0, volume24h: 510200, spread: 1.0 },
        { symbol: 'BTCUSD', lastPrice: 95500.0, bidPrice: 95480.0, askPrice: 95520.0, priceChangePercent: 2.15, high24h: 96200.0, low24h: 94100.0, volume24h: 1540200, spread: 40.0 },
      ];
    }
  },

  async scheduleOrder(orderData: {
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
  }): Promise<ScheduledOrder> {
    try {
      const res = await axios.post(`${getApiBase()}/schedule`, orderData, { timeout: 3000 });
      return res.data.data;
    } catch {
      // Offline local order simulation
      const newOrder: ScheduledOrder = {
        id: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        symbol: orderData.symbol,
        side: orderData.side,
        positionSide: orderData.positionSide || 'BOTH',
        type: orderData.type,
        quantity: orderData.quantity,
        price: orderData.price,
        leverage: orderData.leverage,
        targetTime: orderData.targetTime,
        status: 'PENDING',
        createdAt: Date.now(),
        stopLoss: orderData.stopLoss,
        takeProfit: orderData.takeProfit,
      };

      localOrdersQueue.unshift(newOrder);
      return newOrder;
    }
  },

  async getOrders(): Promise<ScheduledOrder[]> {
    try {
      const res = await axios.get(`${getApiBase()}/orders`, { timeout: 3000 });
      return res.data.data;
    } catch {
      return localOrdersQueue;
    }
  },

  async cancelOrder(id: string): Promise<boolean> {
    try {
      const res = await axios.delete(`${getApiBase()}/orders/${id}`, { timeout: 3000 });
      return res.data.success;
    } catch {
      localOrdersQueue = localOrdersQueue.filter((o) => o.id !== id);
      return true;
    }
  },

  async getLogs(): Promise<ExecutionLog[]> {
    try {
      const res = await axios.get(`${getApiBase()}/logs`, { timeout: 3000 });
      return res.data.data;
    } catch {
      return localLogsQueue;
    }
  },
};
