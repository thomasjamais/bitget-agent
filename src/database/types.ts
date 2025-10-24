/**
 * Database types and interfaces for state persistence
 */

export interface BotInstance {
  id: string;
  name: string;
  environment: "testnet" | "live";
  status: "active" | "inactive" | "paused" | "error";
  created_at: Date;
  updated_at: Date;
  last_heartbeat?: Date;
  config_snapshot?: Record<string, any> | undefined;
}

export interface BotStateSnapshot {
  id: string;
  bot_instance_id: string;
  timestamp: Date;
  start_time: number;
  equity: Record<string, number>;
  daily_pnl: number;
  consecutive_losses: number;
  is_active: boolean;
  pause_reason?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface TradingPosition {
  id: string;
  bot_instance_id: string;
  symbol: string;
  side: "long" | "short";
  size: number;
  entry_price: number;
  mark_price?: number;
  unrealized_pnl: number;
  margin_used?: number;
  leverage?: number;
  created_at: Date;
  updated_at: Date;
  closed_at?: Date;
  status: "open" | "closed" | "liquidated";
  metadata?: Record<string, any> | undefined;
}

export interface TradeHistory {
  id: string;
  bot_instance_id: string;
  order_id?: string | undefined;
  symbol: string;
  side: "buy" | "sell";
  size: number;
  price: number;
  fee: number;
  pnl?: number | undefined;
  trade_type: "open" | "close" | "rebalance" | "stop_loss" | "take_profit";
  position_id?: string | undefined;
  executed_at: Date;
  metadata?: Record<string, any> | undefined;
}

export interface PortfolioAllocation {
  id: string;
  bot_instance_id: string;
  symbol: string;
  target_allocation: number;
  current_allocation: number;
  quantity: number;
  value_usdt: number;
  mark_price: number;
  timestamp: Date;
}

export interface RiskMetrics {
  id: string;
  bot_instance_id: string;
  timestamp: Date;
  max_equity_risk: number;
  max_daily_loss: number;
  max_consecutive_losses: number;
  current_equity_risk: number;
  daily_pnl: number;
  consecutive_losses: number;
  risk_level: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, any> | undefined;
}

export interface AIPrediction {
  id: string;
  bot_instance_id: string;
  symbol: string;
  prediction_type: string;
  confidence: number;
  predicted_value?: number | undefined;
  predicted_direction?: "up" | "down" | "sideways" | undefined;
  timeframe: string;
  model_name?: string | undefined;
  input_data?: Record<string, any> | undefined;
  created_at: Date;
  metadata?: Record<string, any> | undefined;
}

export interface MarketDataSnapshot {
  id: string;
  bot_instance_id: string;
  symbol: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
  metadata?: Record<string, any> | undefined;
}

export interface PerformanceMetrics {
  id: string;
  bot_instance_id: string;
  period_start: Date;
  period_end: Date;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  total_pnl: number;
  win_rate?: number;
  sharpe_ratio?: number;
  max_drawdown?: number;
  profit_factor?: number;
  created_at: Date;
}

// Database connection configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  max?: number;
}

// AWS RDS specific configuration
export interface AWSRDSConfig extends DatabaseConfig {
  region: string;
  ssl: true;
  sslmode: "require" | "prefer" | "allow" | "disable";
}

// Migration interface
export interface Migration {
  version: string;
  name: string;
  up: string;
  down: string;
  executed_at?: Date;
}

// Database operation results
export interface DatabaseResult<T> {
  success: boolean;
  data?: T | undefined;
  error?: string;
  rowsAffected?: number;
}

// Query options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
  where?: Record<string, any>;
}
