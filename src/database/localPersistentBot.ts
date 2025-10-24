/**
 * Local Persistent Trading Bot
 * Uses local PostgreSQL database for state persistence
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../../.env");
dotenv.config({ path: envPath });

import { BitgetTradingBot } from "../simple-bot.js";
import { StateManager } from "./stateManager.js";
import {
  initializeLocalDatabase,
  createLocalDBConfig,
} from "./localConnection.js";
import { MigrationManager } from "./migrations.js";
import { logger } from "../utils/logger.js";
import { BotState, PositionIntent } from "../types/index.js";
import { configManager } from "../config/manager.js";
import { BotWebSocketAdapter } from "../api/BotWebSocketAdapter.js";
import { RiskManager } from "../risk/riskManager.js";
import { createBitget } from "../exchanges/bitget.js";
import { USDTTradingManager } from "../trading/USDTTradingManager.js";
import { PortfolioTransfer } from "../portfolio/PortfolioTransfer.js";
import {
  SpotAutoBalancer,
  AutoBalancerConfig,
} from "../portfolio/SpotAutoBalancer.js";

export class LocalPersistentTradingBot extends BitgetTradingBot {
  private stateManager: StateManager;
  private botInstanceId: string;
  private persistenceEnabled: boolean = false;
  private readonly persistentLogger = logger.child({
    component: "LocalPersistentTradingBot",
  });

  constructor() {
    super();
    this.botInstanceId = crypto.randomUUID();
    this.stateManager = new StateManager(this.botInstanceId);

    // Initialize WebSocket adapter for local development
    this.wsAdapter = new BotWebSocketAdapter(8081);
  }

  /**
   * Initialize local database connection
   */
  private async initializeDatabase(): Promise<boolean> {
    try {
      this.persistentLogger.info(
        "🔄 Initializing local database connection..."
      );

      // Check if database is configured
      if (!process.env.DB_HOST || !process.env.DB_NAME) {
        this.persistentLogger.warn(
          "⚠️ Database not configured, running without persistence"
        );
        return false;
      }

      // Initialize database connection
      const config = createLocalDBConfig();
      await initializeLocalDatabase(config);

      // Run migrations
      const { LocalMigrationManager } = await import("./localMigrations.js");
      const migrationManager = new LocalMigrationManager();
      await migrationManager.runMigrations();

      this.persistenceEnabled = true;
      this.persistentLogger.info("✅ Local database initialized successfully");
      return true;
    } catch (error: any) {
      this.persistentLogger.error(
        "❌ Local database initialization failed:",
        error
      );
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
      const botName = `local-trading-bot-${environment}`;

      await this.stateManager.initializeBotInstance(botName, environment, {
        config: config,
        version: process.env.npm_package_version || "1.0.0",
        nodeVersion: process.version,
        platform: process.platform,
        localDevelopment: true,
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
        this.persistentLogger.info(
          "📥 Loading bot state from local database..."
        );

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
      this.persistentLogger.error("❌ Error loading bot state:", error);
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
      // Initialize local database first
      await this.initializeDatabase();

      // Initialize bot instance
      await this.initializeBotInstance();

      // Load saved state
      await this.loadBotState();

      // Start WebSocket server for dashboard EARLY
      await this.wsAdapter.start();
      this.persistentLogger.info("📡 WebSocket dashboard server started");

      // Set WebSocket callbacks
      this.wsAdapter.setRestClient(this.rest);
      this.wsAdapter.webSocketServer.setRestClient(this.rest);
      this.wsAdapter.webSocketServer.setBotInstance(this);
      this.wsAdapter.setPortfolioControlCallbacks({
        onAllocateCapital: async (amount: number) =>
          await this.allocateCapitalToPortfolio(amount),
        onTriggerRebalance: async () => await this.triggerManualRebalance(),
        onUpdateAllocation: async (symbol: string, percentage: number) =>
          await this.updatePortfolioAllocation(symbol, percentage),
        onSwitchTradingMode: async (mode: string, useTestnet: boolean) =>
          await this.switchTradingMode(mode, useTestnet),
        onUpdateRiskStrategy: async (
          strategy: "moderate" | "intense" | "risky"
        ) => this.updateRiskStrategy(strategy),
      });

      // Call core bot startup logic (without WebSocket setup)
      await this.startBotCore();

      // Start periodic state saving
      this.startPeriodicStateSaving();

      this.persistentLogger.info(
        "✅ Local persistent trading bot started successfully"
      );
    } catch (error: any) {
      this.persistentLogger.error(
        "❌ Failed to start local persistent trading bot:",
        error
      );
      throw error;
    }
  }

  /**
   * Core bot startup logic (without WebSocket setup)
   */
  private async startBotCore(): Promise<void> {
    try {
      this.logger.info("Starting Bitget Trading Bot...");

      // 1. Load configuration
      const configPath = process.env.CONFIG_PATH || "./config/bot.yaml";
      const config = await configManager.loadConfig(configPath);

      // 2. Update risk manager
      this.riskManager = new RiskManager(
        config.globalRisk.maxEquityRisk,
        config.globalRisk.maxDailyLoss,
        config.globalRisk.maxConsecutiveLosses
      );

      // 3. Initialize Bitget clients
      const isTestnet = this.isTestnetMode();
      const { rest, ws } = createBitget(
        config.api.key,
        config.api.secret,
        config.api.passphrase,
        isTestnet
      );
      this.rest = rest;
      this.ws = ws;

      // 4. Validate API connection
      this.logger.info("🔍 Validating API connection...");
      await this.validateAPIConnection();

      // 5. Load AI engine
      await this.aiEngine.load();

      // 6. Initialize USDT Trading Manager with AI confirmation
      this.usdtTradingManager = new USDTTradingManager(
        this.rest,
        this.aiEngine
      );
      this.logger.info(
        "💰 USDT Trading Manager initialized with AI confirmation (40% weight)"
      );

      // 7. Initialize portfolio transfer system
      this.logger.info("🔄 Initializing dual portfolio system...");
      this.portfolioTransfer = new PortfolioTransfer(this.rest, {
        apiKey: process.env.BITGET_API_KEY || "",
        apiSecret: process.env.BITGET_API_SECRET || "",
        apiPassphrase: process.env.BITGET_API_PASSPHRASE || "",
      });
      this.logger.info("✅ Portfolio transfer system initialized");

      // 8. Initialize portfolio balancer
      this.logger.info("📊 Initializing portfolio balancer...");
      await this.portfolioBalancer.loadConfig();
      this.logger.info("✅ Portfolio balancer initialized");

      // 9. Initialize Spot Auto-Balancer
      this.logger.info("🎯 Initializing Spot Auto-Balancer...");
      const autoBalancerConfig: AutoBalancerConfig = {
        enabled: true,
        minUsdtThreshold: 10,
        checkIntervalMs: 60000,
        targetAllocations: {
          BTCUSDT: 0.3,
          ETHUSDT: 0.25,
          BNBUSDT: 0.42,
          MATICUSDT: 0.03,
        },
        force: "gtc",
      };
      this.spotAutoBalancer = new SpotAutoBalancer(
        this.rest,
        this.portfolioTransfer,
        autoBalancerConfig
      );
      this.spotAutoBalancer.setWebSocketAdapter(this.wsAdapter);
      this.logger.info("🚀 Starting Spot Auto-Balancer...");
      await this.spotAutoBalancer.start();
      this.logger.info("✅ Spot Auto-Balancer initialized and started");

      // 10. Get initial account balance
      await this.updateEquity();

      // 11. Subscribe to market data
      await this.subscribeToMarketData();

      // 12. Finalize startup
      this.isRunning = true;
      this.logger.info("✅ Trading bot started successfully");

      // 13. Start monitoring loop
      this.startMonitoring();
    } catch (error) {
      this.logger.error(`Failed to start bot: ${error}`);
      this.logger.error({ error }, `🔴 FULL BOT STARTUP ERROR`);
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
    if (this.persistenceEnabled) {
      await this.saveTradingPosition(position);
    }
    return true;
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
    if (this.persistenceEnabled) {
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
    return true;
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
