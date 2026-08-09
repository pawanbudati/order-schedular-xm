import axios from 'axios';
import { SystemStatus, AccountBalance, Ticker, ScheduledOrder, ExecutionLog } from '../types';

export const getBackendUrl = (): string => {
  const customUrl = localStorage.getItem('XM360_BACKEND_URL') || localStorage.getItem('BINGX_BACKEND_URL');
  if (customUrl) return customUrl.replace(/\/$/, '');
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  return 'http://localhost:3001/api';
};

export const setBackendUrl = (url: string): void => {
  if (!url) {
    localStorage.removeItem('XM360_BACKEND_URL');
    localStorage.removeItem('BINGX_BACKEND_URL');
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
    const res = await axios.get(`${getApiBase()}/status`);
    return res.data;
  },

  async updateConfig(config: {
    apiToken?: string;
    accountId?: string;
    serverName?: string;
    platform?: 'MT4' | 'MT5';
    isDemo?: boolean;
  }) {
    const res = await axios.post(`${getApiBase()}/config`, config);
    return res.data;
  },

  async getBalance(): Promise<AccountBalance> {
    const res = await axios.get(`${getApiBase()}/balance`);
    return res.data.data;
  },

  async getPairs(): Promise<Ticker[]> {
    const res = await axios.get(`${getApiBase()}/pairs`);
    return res.data.data;
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
    const res = await axios.post(`${getApiBase()}/schedule`, orderData);
    return res.data.data;
  },

  async getOrders(): Promise<ScheduledOrder[]> {
    const res = await axios.get(`${getApiBase()}/orders`);
    return res.data.data;
  },

  async cancelOrder(id: string): Promise<boolean> {
    const res = await axios.delete(`${getApiBase()}/orders/${id}`);
    return res.data.success;
  },

  async getLogs(): Promise<ExecutionLog[]> {
    const res = await axios.get(`${getApiBase()}/logs`);
    return res.data.data;
  },
};

