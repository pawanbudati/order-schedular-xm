export interface SystemStatus {
  status: string;
  serverTime: number;
  localTime: number;
  offsetMs: number;
  hasApiKeys: boolean;
  isDemo: boolean;
  accountId?: string;
  serverName?: string;
  platform?: string;
  mt5DockerStatus?: {
    containerRunning: boolean;
    containerExists: boolean;
    accountId?: string;
  };
}

export interface AccountBalance {
  asset: string;
  balance: number;
  equity: number;
  availableMargin: number;
  usedMargin: number;
  currency?: string;
  marginLevel?: number;
}

export interface Ticker {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  bidPrice?: number;
  askPrice?: number;
  spread?: number;
}

export interface ScheduledOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  positionSide: 'LONG' | 'SHORT' | 'BOTH';
  type: 'MARKET' | 'LIMIT';
  price?: number;
  quantity: number;
  leverage: number;
  targetTime: number;
  targetTimeFormatted: string;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  actualTime?: number;
  precisionDriftMs?: number;
  xmOrderId?: string;
  brokerOrderId?: string;
  errorMessage?: string;
  createdAt: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface ExecutionLog {
  id: string;
  orderId: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  details?: any;
}
