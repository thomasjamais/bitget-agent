/**
 * State persistence manager for trading bot
 * Handles saving and loading bot state from database
 */

import { BotStateRepository } from "./repository.js";
import { BotState, PositionIntent, Bar } from "../types/index.js";
import { logger } from "../utils/logger.js";
import {
  BotInstance,
  BotStateSnapshot,
  TradingPosition,
  TradeHistory,
  PortfolioAllocation,
  RiskMetrics,
  AIPrediction,
  MarketDataSnapshot,
} from "./types.js";

export class StateManager {
  private repository: BotStateRepository;
  private botInstanceId: string;
  private readonly stateLogger = logger.child({ component: "StateManager" });

  constructor(botInstanceId: string) {
    this.repository = new BotStateRepository();
    this.botInstanceId = botInstanceId;
  }

  /**
   * Initialize bot instance in database
   */
  async initializeBotInstance(
    name: string,
    environment: "testnet" | "live",
    configSnapshot?: Record<string, any>
  ): Promise<boolean> {
    try {
      const result = await this.repository.upsertBotInstance({
        id: this.botInstanceId,
        name,
        environment,
        status: "active",
        config_snapshot: configSnapshot,
        last_heartbeat: new Date(),
      });

      if (result.success) {
        this.stateLogger.info("✅ Bot instance initialized in database");
        return true;
      } else {
        this.stateLogger.error(
          "❌ Failed to initialize bot instance:",
          result.error
        );
        return false;
      }
    } catch (error: any) {
      this.stateLogger.error("❌ Error initializing bot instance:", error);
      return false;
    }
  }

  /**
   * Save current bot state
   */
  async saveBotState(botState: BotState): Promise<boolean> {
    try {
      const snapshot: Omit<BotStateSnapshot, "id" | "timestamp"> = {
        bot_instance_id: this.botInstanceId,
        start_time: botState.startTime,
        equity: botState.equity,
        daily_pnl: botState.dailyPnL,
        consecutive_losses: botState.consecutiveLosses,
        is_active: botState.isActive,
        pause_reason: botState.pauseReason,
        metadata: {
          lastTradeTime: botState.lastTradeTime,
        },
      };

      const result = await this.repository.saveBotStateSnapshot(snapshot);

      if (result.success) {
        this.stateLogger.debug("✅ Bot state saved to database");
        return true;
      } else {
        this.stateLogger.error("❌ Failed to save bot state:", result.error);
        return false;
      }
    } catch (error: any) {
      this.stateLogger.error("❌ Error saving bot state:", error);
      return false;
    }
  }

  /**
   * Load latest bot state from database
   */
  async loadBotState(): Promise<BotState | null> {
    try {
      const result = await this.repository.getLatestBotState(
        this.botInstanceId
      );

      if (result.success && result.data) {
        const snapshot = result.data;
        const botState: BotState = {
          startTime: snapshot.start_time,
          equity: snapshot.equity,
          positions: [], // Will be loaded separately
          dailyPnL: snapshot.daily_pnl,
          consecutiveLosses: snapshot.consecutive_losses,
          lastTradeTime: snapshot.metadata?.lastTradeTime || {},
          isActive: snapshot.is_active,
          pauseReason: snapshot.pause_reason,
        };

        this.stateLogger.info("✅ Bot state loaded from database");
        return botState;
      } else {
        this.stateLogger.warn("⚠️ No bot state found in database");
        return null;
      }
    } catch (error: any) {
      this.stateLogger.error("❌ Error loading bot state:", error);
      return null;
    }
  }

  /**
   * Save trading position
   */
  async saveTradingPosition(position: PositionIntent): Promise<boolean> {
    try {
      const dbPosition: Omit<
        TradingPosition,
        "id" | "created_at" | "updated_at"
      > = {
        bot_instance_id: this.botInstanceId,
        symbol: position.symbol,
        side: position.direction,
        size: position.quantity,
        entry_price: position.price || 0,
        mark_price: position.price || 0,
        unrealized_pnl: 0,
        margin_used: 0,
        leverage: position.leverage,
        status: "open",
        metadata: {},
      };

      const result = await this.repository.saveTradingPosition(dbPosition);

      if (result.success) {
        this.stateLogger.debug(`✅ Trading position saved: ${position.symbol}`);
        return true;
      } else {
        this.stateLogger.error(
          "❌ Failed to save trading position:",
          result.error
        );
        return false;
      }
    } catch (error: any) {
      this.stateLogger.error("❌ Error saving trading position:", error);
      return false;
    }
  }

  /**
   * Update trading position
   */
  async updateTradingPosition(
    positionId: string,
    updates: {
      markPrice?: number;
      unrealizedPnl?: number;
      status?: "open" | "closed" | "liquidated";
      closedAt?: Date;
    }
  ): Promise<boolean> {
    try {
      const result = await this.repository.updateTradingPosition(
        positionId,
        updates
      );

      if (result.success) {
        this.stateLogger.debug(`✅ Trading position updated: ${positionId}`);
        return true;
      } else {
        this.stateLogger.error(
          "❌ Failed to update trading position:",
          result.error
        );
        return false;
      }
    } catch (error: any) {
      this.stateLogger.error("❌ Error updating trading position:", error);
      return false;
    }
  }

  /**
   * Load open positions from database
   */
  async loadOpenPositions(): Promise<PositionIntent[]> {
    try {
      const result = await this.repository.getOpenPositions(this.botInstanceId);

      if (result.success && result.data) {
        const positions: PositionIntent[] = result.data.map((pos) => ({
          symbol: pos.symbol,
          direction: pos.side as "long" | "short",
          quantity: pos.size,
          leverage: pos.leverage || 1,
          price: pos.mark_price,
          orderType: pos.metadata?.orderType,
          stopLoss: pos.metadata?.stopLoss,
          takeProfit: pos.metadata?.takeProfit,
          reduceOnly: pos.metadata?.reduceOnly,
        }));

        this.stateLogger.info(
          `✅ Loaded ${positions.length} open positions from database`
        );
        return positions;
      } else {
        this.stateLogger.warn("⚠️ No open positions found in database");
        return [];
      }
    } catch (error: any) {
      this.stateLogger.error("❌ Error loading open positions:", error);
      return [];
    }
  }

  /**
   * Save trade to history
   */
  async saveTradeHistory(trade: {
    orderId?: string;
    symbol: string;
    side: "buy" | "sell";
    size: number;
    price: number;
    fee: number;
    pnl?: number;
    tradeType: "open" | "close" | "rebalance" | "stop_loss" | "take_profit";
    positionId?: string;
    metadata?: Record<string, any> | undefined;
  }): Promise<boolean> {
    try {
      const dbTrade: Omit<TradeHistory, "id" | "executed_at"> = {
        bot_instance_id: this.botInstanceId,
        order_id: trade.orderId,
        symbol: trade.symbol,
        side: trade.side,
        size: trade.size,
        price: trade.price,
        fee: trade.fee,
        pnl: trade.pnl,
        trade_type: trade.tradeType,
        position_id: trade.positionId,
        metadata: trade.metadata,
      };

      const result = await this.repository.saveTradeHistory(dbTrade);

      if (result.success) {
        this.stateLogger.debug(
          `✅ Trade saved to history: ${trade.symbol} ${trade.side}`
        );
        return true;
      } else {
        this.stateLogger.error(
          "❌ Failed to save trade history:",
          result.error
        );
        return false;
      }
    } catch (error: any) {
      this.stateLogger.error("❌ Error saving trade history:", error);
      return false;
    }
  }

  /**
   * Save portfolio allocation
   */
  async savePortfolioAllocation(allocation: {
    symbol: string;
    targetAllocation: number;
    currentAllocation: number;
    quantity: number;
    valueUsdt: number;
    markPrice: number;
  }): Promise<boolean> {
    try {
      const dbAllocation: Omit<PortfolioAllocation, "id" | "timestamp"> = {
        bot_instance_id: this.botInstanceId,
        symbol: allocation.symbol,
        target_allocation: allocation.targetAllocation,
        current_allocation: allocation.currentAllocation,
        quantity: allocation.quantity,
        value_usdt: allocation.valueUsdt,
        mark_price: allocation.markPrice,
      };

      const result = await this.repository.savePortfolioAllocation(
        dbAllocation
      );

      if (result.success) {
        this.stateLogger.debug(
          `✅ Portfolio allocation saved: ${allocation.symbol}`
        );
        return true;
      } else {
        this.stateLogger.error(
          "❌ Failed to save portfolio allocation:",
          result.error
        );
        return false;
      }
    } catch (error: any) {
      this.stateLogger.error("❌ Error saving portfolio allocation:", error);
      return false;
    }
  }

  /**
   * Save risk metrics
   */
  async saveRiskMetrics(metrics: {
    maxEquityRisk: number;
    maxDailyLoss: number;
    maxConsecutiveLosses: number;
    currentEquityRisk: number;
    dailyPnl: number;
    consecutiveLosses: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    metadata?: Record<string, any> | undefined;
  }): Promise<boolean> {
    try {
      const dbMetrics: Omit<RiskMetrics, "id" | "timestamp"> = {
        bot_instance_id: this.botInstanceId,
        max_equity_risk: metrics.maxEquityRisk,
        max_daily_loss: metrics.maxDailyLoss,
        max_consecutive_losses: metrics.maxConsecutiveLosses,
        current_equity_risk: metrics.currentEquityRisk,
        daily_pnl: metrics.dailyPnl,
        consecutive_losses: metrics.consecutiveLosses,
        risk_level: metrics.riskLevel,
        metadata: metrics.metadata,
      };

      const result = await this.repository.saveRiskMetrics(dbMetrics);

      if (result.success) {
        this.stateLogger.debug("✅ Risk metrics saved to database");
        return true;
      } else {
        this.stateLogger.error("❌ Failed to save risk metrics:", result.error);
        return false;
      }
    } catch (error: any) {
      this.stateLogger.error("❌ Error saving risk metrics:", error);
      return false;
    }
  }

  /**
   * Save AI prediction
   */
  async saveAIPrediction(prediction: {
    symbol: string;
    predictionType: string;
    confidence: number;
    predictedValue?: number;
    predictedDirection?: "up" | "down" | "sideways";
    timeframe: string;
    modelName?: string;
    inputData?: Record<string, any>;
    metadata?: Record<string, any> | undefined;
  }): Promise<boolean> {
    try {
      const dbPrediction: Omit<AIPrediction, "id" | "created_at"> = {
        bot_instance_id: this.botInstanceId,
        symbol: prediction.symbol,
        prediction_type: prediction.predictionType,
        confidence: prediction.confidence,
        predicted_value: prediction.predictedValue,
        predicted_direction: prediction.predictedDirection,
        timeframe: prediction.timeframe,
        model_name: prediction.modelName,
        input_data: prediction.inputData,
        metadata: prediction.metadata,
      };

      const result = await this.repository.saveAIPrediction(dbPrediction);

      if (result.success) {
        this.stateLogger.debug(`✅ AI prediction saved: ${prediction.symbol}`);
        return true;
      } else {
        this.stateLogger.error(
          "❌ Failed to save AI prediction:",
          result.error
        );
        return false;
      }
    } catch (error: any) {
      this.stateLogger.error("❌ Error saving AI prediction:", error);
      return false;
    }
  }

  /**
   * Save market data snapshot
   */
  async saveMarketDataSnapshot(snapshot: {
    symbol: string;
    timeframe: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timestamp: Date;
    metadata?: Record<string, any> | undefined;
  }): Promise<boolean> {
    try {
      const dbSnapshot: Omit<MarketDataSnapshot, "id"> = {
        bot_instance_id: this.botInstanceId,
        symbol: snapshot.symbol,
        timeframe: snapshot.timeframe,
        open: snapshot.open,
        high: snapshot.high,
        low: snapshot.low,
        close: snapshot.close,
        volume: snapshot.volume,
        timestamp: snapshot.timestamp,
        metadata: snapshot.metadata,
      };

      const result = await this.repository.saveMarketDataSnapshot(dbSnapshot);

      if (result.success) {
        this.stateLogger.debug(
          `✅ Market data snapshot saved: ${snapshot.symbol}`
        );
        return true;
      } else {
        this.stateLogger.error(
          "❌ Failed to save market data snapshot:",
          result.error
        );
        return false;
      }
    } catch (error: any) {
      this.stateLogger.error("❌ Error saving market data snapshot:", error);
      return false;
    }
  }

  /**
   * Get recent trade history
   */
  async getRecentTradeHistory(limit: number = 100): Promise<TradeHistory[]> {
    try {
      const result = await this.repository.getRecentTradeHistory(
        this.botInstanceId,
        limit
      );

      if (result.success && result.data) {
        this.stateLogger.debug(
          `✅ Loaded ${result.data.length} recent trades from database`
        );
        return result.data;
      } else {
        this.stateLogger.warn("⚠️ No trade history found in database");
        return [];
      }
    } catch (error: any) {
      this.stateLogger.error("❌ Error loading trade history:", error);
      return [];
    }
  }

  /**
   * Update bot heartbeat
   */
  async updateHeartbeat(): Promise<boolean> {
    try {
      const result = await this.repository.upsertBotInstance({
        id: this.botInstanceId,
        last_heartbeat: new Date(),
      });

      return result.success;
    } catch (error: any) {
      this.stateLogger.error("❌ Error updating heartbeat:", error);
      return false;
    }
  }
}
