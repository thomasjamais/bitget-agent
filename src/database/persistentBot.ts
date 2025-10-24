/**
 * Persistent Trading Bot Wrapper
 * Adds state persistence to the existing BitgetTradingBot
 */

import "dotenv/config";
import { BitgetTradingBot } from "../simple-bot.js";
import { StateManager } from "./stateManager.js";
import { initializeDatabase, createAWSRDSConfig } from "./connection.js";
import { MigrationManager } from "./migrations.js";
import { logger } from "../utils/logger.js";
import { BotState, PositionIntent } from "../types/index.js";
import { configManager } from "../config/manager.js";

export class PersistentTradingBot extends BitgetTradingBot {
  private stateManager: StateManager;
  private botInstanceId: string;
  private persistenceEnabled: boolean = false;
  private readonly persistentLogger = logger.child({
    component: "PersistentTradingBot",
  });

  constructor() {
    super();
    this.botInstanceId = crypto.randomUUID();
    this.stateManager = new StateManager(this.botInstanceId);
  }

  /**
   * Initialize database and run migrations
   */
  private async initializeDatabase(): Promise<boolean> {
    try {
      this.persistentLogger.info("🔄 Initializing database connection...");

      // Check if database is configured
      if (!process.env.DB_HOST || !process.env.DB_NAME) {
        this.persistentLogger.warn(
          "⚠️ Database not configured, running without persistence"
        );
        return false;
      }

      // Initialize database connection
      const config = createAWSRDSConfig();
      await initializeDatabase(config);

      // Run migrations
      const migrationManager = new MigrationManager();
      await migrationManager.runMigrations();

      this.persistenceEnabled = true;
      this.persistentLogger.info("✅ Database initialized successfully");
      return true;
    } catch (error: any) {
      this.persistentLogger.error("❌ Database initialization failed:", error);
      this.persistentLogger.warn("⚠️ Continuing without persistence");
      return false;
    }
  }

  /**
   * Initialize bot instance in database
   */
  private async initializeBotInstance(): Promise<void> {
    if (!this.persistenceEnabled) return;

    try {
      const config = await configManager.loadConfig(
        process.env.CONFIG_PATH || "./config/bot.yaml"
      );
      const environment = this.isTestnetMode() ? "testnet" : "live";
      const botName = `trading-bot-${environment}`;

      await this.stateManager.initializeBotInstance(botName, environment, {
        config: config,
        version: process.env.npm_package_version || "1.0.0",
        nodeVersion: process.version,
        platform: process.platform,
      });
    } catch (error: any) {
      this.persistentLogger.error(
        "❌ Failed to initialize bot instance:",
        error
      );
    }
  }

  /**
   * Load bot state from database
   */
  private async loadBotState(): Promise<void> {
    if (!this.persistenceEnabled) return;

    try {
      const savedState = await this.stateManager.loadBotState();
      if (savedState) {
        this.persistentLogger.info("📥 Loading bot state from database...");

        // Merge saved state with current state
        this.botState = {
          ...this.botState,
          ...savedState,
          positions: [], // Will be loaded separately
        };

        // Load open positions
        const savedPositions = await this.stateManager.loadOpenPositions();
        this.botState.positions = savedPositions;

        this.persistentLogger.info(
          `✅ Loaded bot state: ${savedPositions.length} positions, PnL: ${savedState.dailyPnL}`
        );
      }
    } catch (error: any) {
      this.persistentLogger.error("❌ Failed to load bot state:", error);
    }
  }

  /**
   * Save bot state to database
   */
  private async saveBotState(): Promise<void> {
    if (!this.persistenceEnabled) return;

    try {
      await this.stateManager.saveBotState(this.botState);
    } catch (error: any) {
      this.persistentLogger.error("❌ Failed to save bot state:", error);
    }
  }

  /**
   * Save trading position to database
   */
  private async saveTradingPosition(position: PositionIntent): Promise<void> {
    if (!this.persistenceEnabled) return;

    try {
      // Convert PositionIntent to TradingPosition format
      const tradingPosition = {
        symbol: position.symbol,
        side: position.direction,
        size: position.quantity,
        entryPrice: position.price || 0,
        markPrice: position.price || 0,
        unrealizedPnl: 0,
        marginUsed: 0,
        leverage: position.leverage,
        status: "open" as const,
        metadata: {
          orderType: position.orderType,
          stopLoss: position.stopLoss,
          takeProfit: position.takeProfit,
          reduceOnly: position.reduceOnly,
        },
      };

      await this.stateManager.saveTradingPosition(position);
    } catch (error: any) {
      this.persistentLogger.error("❌ Failed to save trading position:", error);
    }
  }

  /**
   * Update trading position in database
   */
  private async updateTradingPosition(
    positionId: string,
    updates: {
      markPrice?: number;
      unrealizedPnl?: number;
      status?: "open" | "closed" | "liquidated";
      closedAt?: Date;
    }
  ): Promise<void> {
    if (!this.persistenceEnabled) return;

    try {
      await this.stateManager.updateTradingPosition(positionId, updates);
    } catch (error: any) {
      this.persistentLogger.error(
        "❌ Failed to update trading position:",
        error
      );
    }
  }

  /**
   * Save trade to history
   */
  private async saveTradeHistory(trade: {
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
  }): Promise<void> {
    if (!this.persistenceEnabled) return;

    try {
      await this.stateManager.saveTradeHistory(trade);
    } catch (error: any) {
      this.persistentLogger.error("❌ Failed to save trade history:", error);
    }
  }

  /**
   * Save portfolio allocation
   */
  private async savePortfolioAllocation(allocation: {
    symbol: string;
    targetAllocation: number;
    currentAllocation: number;
    quantity: number;
    valueUsdt: number;
    markPrice: number;
  }): Promise<void> {
    if (!this.persistenceEnabled) return;

    try {
      await this.stateManager.savePortfolioAllocation(allocation);
    } catch (error: any) {
      this.persistentLogger.error(
        "❌ Failed to save portfolio allocation:",
        error
      );
    }
  }

  /**
   * Save risk metrics
   */
  private async saveRiskMetrics(): Promise<void> {
    if (!this.persistenceEnabled) return;

    try {
      const riskLevel = this.getRiskLevel();
      await this.stateManager.saveRiskMetrics({
        maxEquityRisk: this.riskManager.getRiskParameters().maxEquityRisk,
        maxDailyLoss: this.riskManager.getRiskParameters().maxDailyLoss,
        maxConsecutiveLosses:
          this.riskManager.getRiskParameters().maxConsecutiveLosses,
        currentEquityRisk: this.calculateCurrentEquityRisk(),
        dailyPnl: this.botState.dailyPnL,
        consecutiveLosses: this.botState.consecutiveLosses,
        riskLevel,
        metadata: {
          isActive: this.botState.isActive,
          pauseReason: this.botState.pauseReason,
        },
      });
    } catch (error: any) {
      this.persistentLogger.error("❌ Failed to save risk metrics:", error);
    }
  }

  /**
   * Get current risk level
   */
  private getRiskLevel(): "low" | "medium" | "high" | "critical" {
    const equityRisk = this.calculateCurrentEquityRisk();
    const dailyLoss = Math.abs(this.botState.dailyPnL);
    const consecutiveLosses = this.botState.consecutiveLosses;

    if (
      equityRisk > 0.8 ||
      dailyLoss > this.riskManager.getRiskParameters().maxDailyLoss * 0.8 ||
      consecutiveLosses >=
        this.riskManager.getRiskParameters().maxConsecutiveLosses
    ) {
      return "critical";
    } else if (
      equityRisk > 0.6 ||
      dailyLoss > this.riskManager.getRiskParameters().maxDailyLoss * 0.6 ||
      consecutiveLosses >=
        this.riskManager.getRiskParameters().maxConsecutiveLosses * 0.8
    ) {
      return "high";
    } else if (
      equityRisk > 0.4 ||
      dailyLoss > this.riskManager.getRiskParameters().maxDailyLoss * 0.4 ||
      consecutiveLosses >=
        this.riskManager.getRiskParameters().maxConsecutiveLosses * 0.6
    ) {
      return "medium";
    } else {
      return "low";
    }
  }

  /**
   * Calculate current equity risk
   */
  private calculateCurrentEquityRisk(): number {
    const totalEquity = Object.values(this.botState.equity).reduce(
      (sum, value) => sum + value,
      0
    );
    const totalExposure = this.botState.positions.reduce(
      (sum, pos) => sum + Math.abs(pos.quantity * (pos.price || 0)),
      0
    );

    return totalEquity > 0 ? totalExposure / totalEquity : 0;
  }

  /**
   * Update heartbeat
   */
  private async updateHeartbeat(): Promise<void> {
    if (!this.persistenceEnabled) return;

    try {
      await this.stateManager.updateHeartbeat();
    } catch (error: any) {
      this.persistentLogger.error("❌ Failed to update heartbeat:", error);
    }
  }

  /**
   * Override start method to include persistence initialization
   */
  async start(): Promise<void> {
    try {
      // Initialize database first
      await this.initializeDatabase();

      // Initialize bot instance
      await this.initializeBotInstance();

      // Load saved state
      await this.loadBotState();

      // Call parent start method
      await super.start();

      // Start periodic state saving
      this.startPeriodicStateSaving();

      this.persistentLogger.info(
        "✅ Persistent trading bot started successfully"
      );
    } catch (error: any) {
      this.persistentLogger.error(
        "❌ Failed to start persistent trading bot:",
        error
      );
      throw error;
    }
  }

  /**
   * Start periodic state saving
   */
  private startPeriodicStateSaving(): void {
    if (!this.persistenceEnabled) return;

    // Save state every 30 seconds
    setInterval(async () => {
      try {
        await this.saveBotState();
        await this.saveRiskMetrics();
        await this.updateHeartbeat();
      } catch (error: any) {
        this.persistentLogger.error("❌ Periodic state save failed:", error);
      }
    }, 30000);

    // Save state every 5 minutes
    setInterval(async () => {
      try {
        // Save all current positions
        for (const position of this.botState.positions) {
          await this.saveTradingPosition(position);
        }
      } catch (error: any) {
        this.persistentLogger.error("❌ Periodic position save failed:", error);
      }
    }, 300000);

    this.persistentLogger.info("🔄 Periodic state saving started");
  }

  /**
   * Override position opening to include persistence
   */
  protected async openPosition(position: PositionIntent): Promise<boolean> {
    // Note: The base class doesn't have openPosition method
    // This would need to be implemented based on the actual trading logic
    const result = true;

    if (result && this.persistenceEnabled) {
      await this.saveTradingPosition(position);
    }

    return result;
  }

  /**
   * Override position closing to include persistence
   */
  protected async closePosition(
    position: PositionIntent,
    reason: string
  ): Promise<boolean> {
    // Note: The base class doesn't have closePosition method
    // This would need to be implemented based on the actual trading logic
    const result = true;

    if (result && this.persistenceEnabled) {
      // Save trade to history
      await this.saveTradeHistory({
        symbol: position.symbol,
        side: position.direction === "long" ? "sell" : "buy",
        size: position.quantity,
        price: position.price || 0,
        fee: 0, // Will be updated when we get actual fee
        pnl: 0, // Will be calculated when position is closed
        tradeType: "close",
        metadata: {
          reason,
          leverage: position.leverage,
        },
      });
    }

    return result;
  }

  /**
   * Override portfolio rebalancing to include persistence
   */
  protected async rebalancePortfolio(actions: any[]): Promise<void> {
    // Note: The base class has autoRebalancePortfolios method instead
    // This would need to be implemented based on the actual rebalancing logic

    if (this.persistenceEnabled) {
      // Save portfolio allocations
      for (const action of actions) {
        if (action.type === "rebalance") {
          await this.savePortfolioAllocation({
            symbol: action.symbol,
            targetAllocation: action.targetAllocation,
            currentAllocation: action.currentAllocation,
            quantity: action.quantity,
            valueUsdt: action.valueUsdt,
            markPrice: action.markPrice,
          });
        }
      }
    }
  }

  /**
   * Get persistence status
   */
  getPersistenceStatus(): { enabled: boolean; botInstanceId: string } {
    return {
      enabled: this.persistenceEnabled,
      botInstanceId: this.botInstanceId,
    };
  }

  /**
   * Get recent trade history from database
   */
  async getRecentTradeHistory(limit: number = 100): Promise<any[]> {
    if (!this.persistenceEnabled) {
      return [];
    }

    try {
      return await this.stateManager.getRecentTradeHistory(limit);
    } catch (error: any) {
      this.persistentLogger.error("❌ Failed to get trade history:", error);
      return [];
    }
  }
}
