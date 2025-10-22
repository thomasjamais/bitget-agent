// WebSocket types for trading bot dashboard

export interface BotData {
  timestamp: number;
  uptime: number;
  equity: number;
  dailyPnL: number;
  environment: 'TESTNET' | 'LIVE';
  portfolio: Portfolio;
  aggressiveTrading: AggressiveTradingMetrics;
  marketData: MarketDataItem[];
  opportunities: TradingOpportunity[];
  recentTrades: TradeItem[];
  aiEngine: AIEngineStatus;
}

export interface Portfolio {
  totalValue: number;
  positions: Position[];
  allocations: Allocation[];
  rebalanceNeeded: boolean;
  lastRebalance: number;
}

export interface Position {
  symbol: string;
  size: number;
  markPrice: number;
  unrealizedPnl: number;
  percentage: number;
}

export interface Allocation {
  symbol: string;
  current: number;
  target: number;
  deviation: number;
  status: 'BALANCED' | 'OVERWEIGHT' | 'UNDERWEIGHT';
  value: number;
}

export interface AggressiveTradingMetrics {
  dailyTrades: number;
  successRate: number;
  opportunitiesFound: number;
  tradesExecuted: number;
  portfolioBalance: number;
  maxTradesPerSymbol: number;
}

export interface MarketDataItem {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdate: number;
}

export interface TradingOpportunity {
  symbol: string;
  direction: 'long' | 'short';
  confidence: number;
  expectedReturn: number;
  riskScore: number;
  priority: number;
  reason: string;
  timestamp: number;
}

export interface TradeItem {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: number;
  status: 'pending' | 'filled' | 'cancelled';
  pnl?: number;
}

export interface AIEngineStatus {
  model: string;
  status: 'OPERATIONAL' | 'ERROR' | 'LOADING';
  predictions: number;
  accuracy?: number;
}

// WebSocket message types
export interface WSMessage {
  type: 'bot_update' | 'market_update' | 'trade_update' | 'error' | 'ping' | 'pong';
  data: any;
  timestamp: number;
}

export interface WSError {
  message: string;
  code?: string;
  timestamp: number;
}