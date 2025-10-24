/**
 * Database repository for trading bot state persistence
 */

import { getDatabaseConnection } from "./connection.js";
import {
  BotInstance,
  BotStateSnapshot,
  TradingPosition,
  TradeHistory,
  PortfolioAllocation,
  RiskMetrics,
  AIPrediction,
  MarketDataSnapshot,
  PerformanceMetrics,
  DatabaseResult,
  QueryOptions,
} from "./types.js";
import { logger } from "../utils/logger.js";

export class BotStateRepository {
  private readonly dbLogger = logger.child({ component: "BotStateRepository" });

  /**
   * Create or update bot instance
   */
  async upsertBotInstance(
    instance: Partial<BotInstance>
  ): Promise<DatabaseResult<BotInstance>> {
    try {
      const db = getDatabaseConnection();

      const query = `
        INSERT INTO bot_instances (id, name, environment, status, config_snapshot, last_heartbeat)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name, environment) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          config_snapshot = EXCLUDED.config_snapshot,
          last_heartbeat = EXCLUDED.last_heartbeat,
          updated_at = NOW()
        RETURNING *
      `;

      const result = await db.query<BotInstance>(query, [
        instance.id || crypto.randomUUID(),
        instance.name,
        instance.environment,
        instance.status || "inactive",
        instance.config_snapshot
          ? JSON.stringify(instance.config_snapshot)
          : null,
        instance.last_heartbeat || new Date(),
      ]);

      return {
        success: true,
        data: result[0] || undefined,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to upsert bot instance:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save bot state snapshot
   */
  async saveBotStateSnapshot(
    snapshot: Omit<BotStateSnapshot, "id" | "timestamp">
  ): Promise<DatabaseResult<BotStateSnapshot>> {
    try {
      const db = getDatabaseConnection();

      const query = `
        INSERT INTO bot_state_snapshots (bot_instance_id, start_time, equity, daily_pnl, consecutive_losses, is_active, pause_reason, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await db.query<BotStateSnapshot>(query, [
        snapshot.bot_instance_id,
        snapshot.start_time,
        JSON.stringify(snapshot.equity),
        snapshot.daily_pnl,
        snapshot.consecutive_losses,
        snapshot.is_active,
        snapshot.pause_reason,
        snapshot.metadata ? JSON.stringify(snapshot.metadata) : null,
      ]);

      return {
        success: true,
        data: result[0] || undefined,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to save bot state snapshot:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get latest bot state snapshot
   */
  async getLatestBotState(
    botInstanceId: string
  ): Promise<DatabaseResult<BotStateSnapshot>> {
    try {
      const db = getDatabaseConnection();

      const query = `
        SELECT * FROM bot_state_snapshots 
        WHERE bot_instance_id = $1 
        ORDER BY timestamp DESC 
        LIMIT 1
      `;

      const result = await db.query<BotStateSnapshot>(query, [botInstanceId]);

      return {
        success: true,
        data: result[0] || undefined,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to get latest bot state:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save trading position
   */
  async saveTradingPosition(
    position: Omit<TradingPosition, "id" | "created_at" | "updated_at">
  ): Promise<DatabaseResult<TradingPosition>> {
    try {
      const db = getDatabaseConnection();

      const query = `
        INSERT INTO trading_positions (bot_instance_id, symbol, side, size, entry_price, mark_price, unrealized_pnl, margin_used, leverage, status, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await db.query<TradingPosition>(query, [
        position.bot_instance_id,
        position.symbol,
        position.side,
        position.size,
        position.entry_price,
        position.mark_price,
        position.unrealized_pnl,
        position.margin_used,
        position.leverage,
        position.status,
        position.metadata ? JSON.stringify(position.metadata) : null,
      ]);

      return {
        success: true,
        data: result[0] || undefined,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to save trading position:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update trading position
   */
  async updateTradingPosition(
    id: string,
    updates: Partial<TradingPosition>
  ): Promise<DatabaseResult<TradingPosition>> {
    try {
      const db = getDatabaseConnection();

      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updates.mark_price !== undefined) {
        setClause.push(`mark_price = $${paramCount++}`);
        values.push(updates.mark_price);
      }
      if (updates.unrealized_pnl !== undefined) {
        setClause.push(`unrealized_pnl = $${paramCount++}`);
        values.push(updates.unrealized_pnl);
      }
      if (updates.status !== undefined) {
        setClause.push(`status = $${paramCount++}`);
        values.push(updates.status);
      }
      if (updates.closed_at !== undefined) {
        setClause.push(`closed_at = $${paramCount++}`);
        values.push(updates.closed_at);
      }

      if (setClause.length === 0) {
        return { success: true, data: undefined };
      }

      values.push(id);
      const query = `
        UPDATE trading_positions 
        SET ${setClause.join(", ")}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query<TradingPosition>(query, values);

      return {
        success: true,
        data: result[0] || undefined,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to update trading position:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get open positions for bot instance
   */
  async getOpenPositions(
    botInstanceId: string
  ): Promise<DatabaseResult<TradingPosition[]>> {
    try {
      const db = getDatabaseConnection();

      const query = `
        SELECT * FROM trading_positions 
        WHERE bot_instance_id = $1 AND status = 'open'
        ORDER BY created_at DESC
      `;

      const result = await db.query<TradingPosition>(query, [botInstanceId]);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to get open positions:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save trade history
   */
  async saveTradeHistory(
    trade: Omit<TradeHistory, "id" | "executed_at">
  ): Promise<DatabaseResult<TradeHistory>> {
    try {
      const db = getDatabaseConnection();

      const query = `
        INSERT INTO trade_history (bot_instance_id, order_id, symbol, side, size, price, fee, pnl, trade_type, position_id, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await db.query<TradeHistory>(query, [
        trade.bot_instance_id,
        trade.order_id,
        trade.symbol,
        trade.side,
        trade.size,
        trade.price,
        trade.fee,
        trade.pnl,
        trade.trade_type,
        trade.position_id,
        trade.metadata ? JSON.stringify(trade.metadata) : null,
      ]);

      return {
        success: true,
        data: result[0] || undefined,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to save trade history:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save portfolio allocation
   */
  async savePortfolioAllocation(
    allocation: Omit<PortfolioAllocation, "id" | "timestamp">
  ): Promise<DatabaseResult<PortfolioAllocation>> {
    try {
      const db = getDatabaseConnection();

      const query = `
        INSERT INTO portfolio_allocations (bot_instance_id, symbol, target_allocation, current_allocation, quantity, value_usdt, mark_price)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await db.query<PortfolioAllocation>(query, [
        allocation.bot_instance_id,
        allocation.symbol,
        allocation.target_allocation,
        allocation.current_allocation,
        allocation.quantity,
        allocation.value_usdt,
        allocation.mark_price,
      ]);

      return {
        success: true,
        data: result[0] || undefined,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to save portfolio allocation:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save risk metrics
   */
  async saveRiskMetrics(
    metrics: Omit<RiskMetrics, "id" | "timestamp">
  ): Promise<DatabaseResult<RiskMetrics>> {
    try {
      const db = getDatabaseConnection();

      const query = `
        INSERT INTO risk_metrics (bot_instance_id, max_equity_risk, max_daily_loss, max_consecutive_losses, current_equity_risk, daily_pnl, consecutive_losses, risk_level, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await db.query<RiskMetrics>(query, [
        metrics.bot_instance_id,
        metrics.max_equity_risk,
        metrics.max_daily_loss,
        metrics.max_consecutive_losses,
        metrics.current_equity_risk,
        metrics.daily_pnl,
        metrics.consecutive_losses,
        metrics.risk_level,
        metrics.metadata ? JSON.stringify(metrics.metadata) : null,
      ]);

      return {
        success: true,
        data: result[0] || undefined,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to save risk metrics:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save AI prediction
   */
  async saveAIPrediction(
    prediction: Omit<AIPrediction, "id" | "created_at">
  ): Promise<DatabaseResult<AIPrediction>> {
    try {
      const db = getDatabaseConnection();

      const query = `
        INSERT INTO ai_predictions (bot_instance_id, symbol, prediction_type, confidence, predicted_value, predicted_direction, timeframe, model_name, input_data, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await db.query<AIPrediction>(query, [
        prediction.bot_instance_id,
        prediction.symbol,
        prediction.prediction_type,
        prediction.confidence,
        prediction.predicted_value,
        prediction.predicted_direction,
        prediction.timeframe,
        prediction.model_name,
        prediction.input_data ? JSON.stringify(prediction.input_data) : null,
        prediction.metadata ? JSON.stringify(prediction.metadata) : null,
      ]);

      return {
        success: true,
        data: result[0] || undefined,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to save AI prediction:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save market data snapshot
   */
  async saveMarketDataSnapshot(
    snapshot: Omit<MarketDataSnapshot, "id">
  ): Promise<DatabaseResult<MarketDataSnapshot>> {
    try {
      const db = getDatabaseConnection();

      const query = `
        INSERT INTO market_data_snapshots (bot_instance_id, symbol, timeframe, open, high, low, close, volume, timestamp, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await db.query<MarketDataSnapshot>(query, [
        snapshot.bot_instance_id,
        snapshot.symbol,
        snapshot.timeframe,
        snapshot.open,
        snapshot.high,
        snapshot.low,
        snapshot.close,
        snapshot.volume,
        snapshot.timestamp,
        snapshot.metadata ? JSON.stringify(snapshot.metadata) : null,
      ]);

      return {
        success: true,
        data: result[0] || undefined,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to save market data snapshot:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get recent trade history
   */
  async getRecentTradeHistory(
    botInstanceId: string,
    limit: number = 100
  ): Promise<DatabaseResult<TradeHistory[]>> {
    try {
      const db = getDatabaseConnection();

      const query = `
        SELECT * FROM trade_history 
        WHERE bot_instance_id = $1 
        ORDER BY executed_at DESC 
        LIMIT $2
      `;

      const result = await db.query<TradeHistory>(query, [
        botInstanceId,
        limit,
      ]);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to get recent trade history:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get performance metrics for a period
   */
  async getPerformanceMetrics(
    botInstanceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DatabaseResult<PerformanceMetrics[]>> {
    try {
      const db = getDatabaseConnection();

      const query = `
        SELECT * FROM performance_metrics 
        WHERE bot_instance_id = $1 
        AND period_start >= $2 
        AND period_end <= $3
        ORDER BY period_start DESC
      `;

      const result = await db.query<PerformanceMetrics>(query, [
        botInstanceId,
        startDate,
        endDate,
      ]);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      this.dbLogger.error("Failed to get performance metrics:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
