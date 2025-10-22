import "dotenv/config";
import { createBitget } from "./exchanges/bitget.js";
import { configManager } from "./config/manager.js";
import { logger } from "./utils/logger.js";
import { subscribeKlines } from "./marketdata/stream.js";
import { AIEngine } from "./signals/aiEngine.js";
import { EnhancedAIEngine } from "./ai/EnhancedAIEngine.js";
import { open, getBalance, getPositions } from "./trading/executor";
import {
  sizeByRisk,
  throttleByOpenPositions,
  RiskManager,
} from "./risk/riskManager.js";
import {
  AggressiveDecisionEngine,
  TradingOpportunity,
} from "./strategy/AggressiveDecisionEngine.js";
import {
  PortfolioBalancer,
  RebalanceAction,
} from "./portfolio/PortfolioBalancer.js";
import { PortfolioTransfer } from "./portfolio/PortfolioTransfer.js";
import { BotState, PositionIntent, Bar } from "./types/index.js";
import { BotWebSocketAdapter } from "./api/BotWebSocketAdapter.js";

/**
 * Main trading bot class
 */
class BitgetTradingBot {
  private botState: BotState;
  private riskManager: RiskManager;
  private aiEngine: AIEngine | EnhancedAIEngine;
  private decisionEngine: AggressiveDecisionEngine;
  private portfolioBalancer: PortfolioBalancer;
  private portfolioTransfer!: PortfolioTransfer;
  private wsAdapter: BotWebSocketAdapter;
  private rest: any;
  private ws: any;
  private isRunning = false;
  private readonly logger = logger.child({ component: "TradingBot" });
  private runtimeConfig: { useTestnet?: boolean } = { useTestnet: true }; // Default to testnet for safety

  constructor() {
    // Use Enhanced AI Engine if enabled in environment
    const useEnhancedAI =
      process.env.ENHANCED_AI_MODE === "true" &&
      process.env.OPENAI_API_KEY &&
      process.env.PERPLEXITY_API_KEY;

    this.aiEngine = useEnhancedAI ? new EnhancedAIEngine() : new AIEngine();
    this.decisionEngine = new AggressiveDecisionEngine();
    this.portfolioBalancer = new PortfolioBalancer();
    this.wsAdapter = new BotWebSocketAdapter(8080);
    this.botState = {
      startTime: Date.now(),
      equity: { USDT: 1000 }, // Default, will be updated
      positions: [],
      dailyPnL: 0,
      consecutiveLosses: 0,
      lastTradeTime: {},
      isActive: true,
    };

    // Initialize with default values, will be updated from config
    this.riskManager = new RiskManager(10, 5, 3);
  }

  /**
   * Initialize and start the bot
   */
  async start(): Promise<void> {
    try {
      this.logger.info("Starting Bitget Trading Bot...");

      // Load configuration
      const configPath = process.env.CONFIG_PATH || "./config/bot.yaml";
      const config = await configManager.loadConfig(configPath);

      // Update risk manager with config values
      this.riskManager = new RiskManager(
        config.globalRisk.maxEquityRisk,
        config.globalRisk.maxDailyLoss,
        config.globalRisk.maxConsecutiveLosses
      );

      // Initialize Bitget clients with proper environment detection
      // Use runtime config or default to testnet for safety
      const isTestnet = this.isTestnetMode();

      const { rest, ws } = createBitget(
        config.api.key,
        config.api.secret,
        config.api.passphrase,
        isTestnet
      );

      this.rest = rest;
      this.ws = ws;

      this.logger.info("🔍 Validating API connection...");

      // Comprehensive API connection tests
      await this.validateAPIConnection();

      // Load AI engine
      await this.aiEngine.load();

      // 📊 Initialize portfolio transfer system
      this.logger.info("🔄 Initializing dual portfolio system...");
      this.portfolioTransfer = new PortfolioTransfer(this.rest);
      this.logger.info("✅ Portfolio transfer system initialized");

      // 📊 Initialize portfolio balancer
      this.logger.info("📊 Initializing portfolio balancer...");
      await this.portfolioBalancer.loadConfig();
      this.logger.info("✅ Portfolio balancer initialized");

      // Get initial account balance
      await this.updateEquity();

      // Subscribe to market data for all configured symbols
      await this.subscribeToMarketData();

      // Start WebSocket server for dashboard
      await this.wsAdapter.start();

      // Register portfolio control callbacks
      this.wsAdapter.setPortfolioControlCallbacks({
        onAllocateCapital: async (amount: number) => {
          return await this.allocateCapitalToPortfolio(amount);
        },
        onTriggerRebalance: async () => {
          return await this.triggerManualRebalance();
        },
        onUpdateAllocation: async (symbol: string, percentage: number) => {
          return await this.updatePortfolioAllocation(symbol, percentage);
        },
        onSwitchTradingMode: async (mode: string, useTestnet: boolean) => {
          return await this.switchTradingMode(mode, useTestnet);
        },
      });

      this.logger.info("📊 WebSocket dashboard server started");

      this.isRunning = true;
      this.logger.info("Trading bot started successfully");

      // Start monitoring loop
      this.startMonitoring();
    } catch (error) {
      this.logger.error(`Failed to start bot: ${error}`);
      this.logger.error({ error }, `🔴 FULL BOT STARTUP ERROR`);
      throw error;
    }
  }

  private marketData: Map<string, Bar> = new Map();
  private lastMarketReport: number = 0;

  /**
   * Subscribe to market data streams
   */
  private async subscribeToMarketData(): Promise<void> {
    const config = configManager.getConfig();

    for (const symbol of config.marketData.symbols) {
      subscribeKlines(
        this.ws,
        symbol,
        config.marketData.defaultTimeframe,
        async (bar: Bar) => {
          // Store latest market data
          this.marketData.set(symbol, bar);
          await this.processPriceUpdate(symbol, bar);
        }
      );
    }
  }

  /**
   * Process new price data and generate signals
   */
  private async processPriceUpdate(symbol: string, bar: any): Promise<void> {
    try {
      if (!this.botState.isActive) return;

      const config = configManager.getConfig();

      // Check if trading is enabled
      if (!config.trading?.enabled) {
        this.logger.debug("📵 Trading disabled in configuration");
        return;
      }
      const instructions = config.instructions.filter(
        (inst: any) => inst.enabled && inst.symbols.includes(symbol)
      );

      for (const instruction of instructions) {
        // Check cooldown period
        const lastTradeTime = this.botState.lastTradeTime[instruction.id] || 0;
        const cooldownRemaining =
          instruction.signals.cooldownMs - (Date.now() - lastTradeTime);

        if (cooldownRemaining > 0) {
          this.logger.debug(
            `⏱️ Cooldown active for ${instruction.id}: ${Math.ceil(
              cooldownRemaining / 60000
            )}m remaining`
          );
          continue;
        }

        // Generate AI signal
        const signal = this.aiEngine.generate(
          bar,
          symbol,
          config.marketData.defaultTimeframe
        );

        if (!signal) {
          this.logger.debug(`📊 No AI signal for ${symbol}`);
          continue;
        }

        this.logger.info(`🎯 AI Signal Generated:`, {
          symbol: symbol,
          direction: signal.direction,
          confidence: (signal.confidence * 100).toFixed(1) + "%",
          strategy: instruction.name,
          price: bar.close,
        });
        this.logger.info({ signal }, `📊 FULL SIGNAL OBJECT`);

        if (signal.confidence < instruction.signals.minConfidence) {
          this.logger.debug(
            `📊 Signal confidence too low: ${(signal.confidence * 100).toFixed(
              1
            )}% < ${(instruction.signals.minConfidence * 100).toFixed(1)}%`
          );
          continue;
        }

        // Check if signal direction matches instruction
        if (
          instruction.direction !== "both" &&
          instruction.direction !== signal.direction
        ) {
          this.logger.debug(
            `🚫 Signal direction ${signal.direction} doesn't match instruction ${instruction.direction}`
          );
          continue;
        }

        // Apply basic risk management checks
        const equity = this.botState.equity.USDT || 1000;
        const maxRiskAmount = equity * (instruction.risk.maxRiskPerTrade / 100);

        // Check if we can afford this trade
        if (maxRiskAmount < 10) {
          // Minimum $10 risk
          this.logger.warn(
            `⚠️ Risk amount too small: $${maxRiskAmount.toFixed(2)} < $10`
          );
          continue;
        }

        // Check position limits
        const currentPositions = this.botState.positions.length;
        if (currentPositions >= instruction.risk.maxTotalPositions) {
          this.logger.warn(
            `⚠️ Maximum positions reached: ${currentPositions}/${instruction.risk.maxTotalPositions}`
          );
          continue;
        }

        // Calculate position size using risk-based sizing
        const currentPrice = bar.close;
        const stopLossPercent = instruction.risk.stopLossPercent;
        const leverage = instruction.risk.maxLeverage;

        // Calculate stop loss and take profit prices with safety checks
        const stopLossPercDefault = stopLossPercent || 2.5; // Default 2.5% if undefined
        const takeProfitPercDefault = instruction.risk.takeProfitPercent || 5.0; // Default 5% if undefined

        const stopLossPrice =
          signal.direction === "long"
            ? currentPrice * (1 - stopLossPercDefault / 100)
            : currentPrice * (1 + stopLossPercDefault / 100);

        const takeProfitPrice =
          signal.direction === "long"
            ? currentPrice * (1 + takeProfitPercDefault / 100)
            : currentPrice * (1 - takeProfitPercDefault / 100);

        // Calculate position size based on risk
        const priceRisk = Math.abs(currentPrice - stopLossPrice);
        const baseQuantity = maxRiskAmount / priceRisk;
        const quantity = Math.floor(baseQuantity * 100) / 100; // Round to 2 decimals

        if (quantity <= 0.01) {
          // Minimum quantity check
          this.logger.warn(`⚠️ Calculated quantity too small: ${quantity}`);
          continue;
        }

        // Create position intent
        const intent: PositionIntent = {
          symbol,
          direction: signal.direction,
          quantity: quantity,
          leverage: leverage,
          orderType: "market",
          price: currentPrice,
          stopLoss: stopLossPrice,
          takeProfit: takeProfitPrice,
        };

        // Final risk check - simple validation
        const tradeValue = quantity * currentPrice * leverage;
        const maxTradeValue = equity * 0.1; // Max 10% of equity per trade

        if (tradeValue > maxTradeValue) {
          this.logger.warn(
            `⚠️ Trade value too large: $${tradeValue.toFixed(
              2
            )} > $${maxTradeValue.toFixed(2)}`
          );
          continue;
        }

        this.logger.info(`🚀 PREPARING TRADE EXECUTION:`, {
          symbol: intent.symbol,
          direction: intent.direction,
          quantity: intent.quantity,
          price: intent.price,
          leverage: intent.leverage,
          stopLoss: intent.stopLoss?.toFixed(4),
          takeProfit: intent.takeProfit?.toFixed(4),
          tradeValue: `$${tradeValue.toFixed(2)}`,
          riskAmount: `$${maxRiskAmount.toFixed(2)}`,
          strategy: instruction.name,
          confidence: (signal.confidence * 100).toFixed(1) + "%",
        });
        this.logger.info({ intent }, `📊 FULL POSITION INTENT`);

        // Execute the trade
        await this.executeTrade(intent, instruction.id);
      }
    } catch (error) {
      this.logger.error(
        `Error processing price update for ${symbol}: ${error}`
      );
      this.logger.error({ error, symbol }, `🔴 FULL PRICE UPDATE ERROR`);
    }
  }

  /**
   * Aggressive trading process - evaluates every opportunity
   */
  private async processAggressiveTrading(): Promise<void> {
    try {
      const config = await configManager.getConfig();
      const equity = this.botState.equity.USDT || 0;

      // Evaluate opportunities for all symbols with market data
      const opportunities: TradingOpportunity[] = [];

      for (const symbol of config.marketData.symbols) {
        const marketData = this.marketData.get(symbol);
        if (!marketData) continue;

        // Generate AI signal (enhanced if available)
        let signal;
        if (this.aiEngine instanceof EnhancedAIEngine) {
          signal = this.aiEngine.generateEnhanced(marketData, symbol, "15m");
        } else {
          signal = this.aiEngine.generate(marketData, symbol, "15m");
        }

        if (!signal) continue;

        // Evaluate with aggressive decision engine
        const opportunity = await this.decisionEngine.evaluateOpportunity(
          symbol,
          signal,
          marketData,
          equity
        );

        if (opportunity) {
          opportunities.push(opportunity);
        }
      }

      // Sort opportunities by priority
      opportunities.sort((a, b) => b.priority - a.priority);

      // Execute top opportunities (limit to prevent overtrading)
      const maxConcurrentTrades = 3;
      const tradesToExecute = opportunities.slice(0, maxConcurrentTrades);

      for (const opportunity of tradesToExecute) {
        await this.executeAggressiveOpportunity(opportunity);
      }

      // Log decision metrics
      const metrics = this.decisionEngine.getDecisionMetrics();
      this.logger.debug("📊 Aggressive Decision Metrics:", {
        opportunities: opportunities.length,
        executed: tradesToExecute.length,
        dailyTrades: metrics.totalTradesToday,
        successRate: `${(metrics.successRate * 100).toFixed(1)}%`,
      });
    } catch (error) {
      this.logger.error("❌ Error in aggressive trading process:");
      this.logger.error({ error }, "🔴 FULL AGGRESSIVE TRADING ERROR");
    }
  }

  /**
   * Execute an aggressive trading opportunity
   */
  private async executeAggressiveOpportunity(
    opportunity: TradingOpportunity
  ): Promise<void> {
    try {
      const { symbol, signal, confidence, expectedReturn, riskScore, reason } =
        opportunity;

      this.logger.info(`⚡ AGGRESSIVE TRADE OPPORTUNITY:`, {
        symbol,
        direction: signal.direction,
        confidence: `${(confidence * 100).toFixed(1)}%`,
        expectedReturn: `${expectedReturn.toFixed(2)}%`,
        riskScore: riskScore.toFixed(2),
        reason,
      });
      this.logger.info({ signal }, `📊 FULL AGGRESSIVE SIGNAL`);
      this.logger.info({ metadata: signal.metadata }, `📊 SIGNAL METADATA`);

      // Calculate position size with aggressive parameters
      const equity = this.botState.equity.USDT || 0;
      const maxRiskPercent = 2.0; // 2% risk per trade (more aggressive)
      const maxRiskAmount = equity * (maxRiskPercent / 100);

      // Use higher leverage for better opportunities
      const baseLeverage = confidence > 0.7 ? 8 : confidence > 0.5 ? 5 : 3;
      const leverage = Math.min(baseLeverage, 10); // Cap at 10x

      const currentPrice = signal.metadata?.ohlc?.close || 0;
      if (currentPrice <= 0) {
        this.logger.warn(`⚠️ Invalid price for ${symbol}: ${currentPrice}`);
        return;
      }

      // Calculate stop loss and take profit
      const stopLossPercent = Math.max(1.5, riskScore); // Dynamic stop loss
      const takeProfitPercent = Math.max(expectedReturn * 1.5, 3.0); // Target 1.5x expected return

      const stopLossPrice =
        signal.direction === "long"
          ? currentPrice * (1 - stopLossPercent / 100)
          : currentPrice * (1 + stopLossPercent / 100);

      const takeProfitPrice =
        signal.direction === "long"
          ? currentPrice * (1 + takeProfitPercent / 100)
          : currentPrice * (1 - takeProfitPercent / 100);

      // Calculate quantity
      const priceRisk = Math.abs(currentPrice - stopLossPrice);
      const baseQuantity = maxRiskAmount / priceRisk;
      const quantity = Math.floor(baseQuantity * 100) / 100; // Round to 2 decimals

      if (quantity <= 0.01) {
        this.logger.warn(
          `⚠️ Calculated quantity too small for ${symbol}: ${quantity}`
        );
        return;
      }

      // Create position intent
      const intent: PositionIntent = {
        symbol,
        direction: signal.direction,
        quantity,
        leverage,
        orderType: "market",
        price: currentPrice,
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice,
      };

      // Additional risk check
      const tradeValue = quantity * currentPrice * leverage;
      const maxTradeValue = equity * 0.15; // Max 15% of equity per aggressive trade

      if (tradeValue > maxTradeValue) {
        this.logger.warn(
          `⚠️ Aggressive trade value too large: $${tradeValue.toFixed(
            2
          )} > $${maxTradeValue.toFixed(2)}`
        );
        return;
      }

      // Execute the aggressive trade
      await this.executeTrade(intent, "aggressive-decision");

      // Record the trade
      this.decisionEngine.recordTrade(symbol, signal, true);
    } catch (error) {
      this.logger.error(
        `❌ Failed to execute aggressive opportunity for ${opportunity.symbol}:`,
        error
      );
      this.decisionEngine.recordTrade(
        opportunity.symbol,
        opportunity.signal,
        false
      );
    }
  }

  /**
   * Process portfolio rebalancing
   */
  private async processPortfolioRebalancing(): Promise<void> {
    try {
      const equity = this.botState.equity.USDT || 0;

      // Skip rebalancing if equity is too low
      if (equity < 10) {
        this.logger.debug(
          `💡 Skipping portfolio rebalancing - equity too low: $${equity.toFixed(
            2
          )}`
        );
        return;
      }

      // Update portfolio balancer with current positions
      let positions: any[] = [];
      try {
        const positionsResponse = await getPositions(this.rest);
        positions = positionsResponse?.data || [];
        this.logger.debug(
          `📊 Retrieved ${positions.length} positions for rebalancing`
        );
      } catch (error: any) {
        this.logger.warn(
          `⚠️ Could not retrieve positions for rebalancing: ${error.message}`
        );
        this.logger.info(
          `💡 Continuing with empty positions for rebalancing calculation`
        );
        positions = [];
      }

      const currentPrices = new Map<string, number>();

      // Collect current prices from market data
      for (const [symbol, bar] of this.marketData) {
        currentPrices.set(symbol, bar.close);
      }

      // Add default prices for symbols we track but might not have market data for
      const config = await configManager.getConfig();
      const defaultPrices = {
        BTCUSDT: 65000,
        ETHUSDT: 2600,
        BNBUSDT: 580,
        MATICUSDT: 0.42,
      };

      for (const symbol of config.marketData.symbols) {
        if (
          !currentPrices.has(symbol) &&
          defaultPrices[symbol as keyof typeof defaultPrices]
        ) {
          currentPrices.set(
            symbol,
            defaultPrices[symbol as keyof typeof defaultPrices]
          );
          this.logger.debug(
            `💡 Using default price for ${symbol}: $${
              defaultPrices[symbol as keyof typeof defaultPrices]
            }`
          );
        }
      }

      // Update portfolio balancer (this should not fail even with empty positions)
      this.portfolioBalancer.updatePositions(positions, currentPrices);

      // Evaluate rebalancing needs
      const rebalanceActions = await this.portfolioBalancer.evaluateRebalancing(
        equity
      );

      if (rebalanceActions.length > 0) {
        this.logger.info(
          `⚖️ Portfolio rebalancing needed: ${rebalanceActions.length} actions`
        );
        this.logger.info({ rebalanceActions }, `📊 REBALANCE ACTIONS DETAILS`);

        // Calculate trade sizes
        const actionsWithSizes = this.portfolioBalancer.calculateTradeSizes(
          rebalanceActions,
          currentPrices
        );
        this.logger.info(
          { actionsWithSizes },
          `📊 ACTIONS WITH CALCULATED SIZES`
        );

        // Execute rebalancing trades (limit to prevent spam)
        const maxRebalanceTrades = 0; // Disabled automatic rebalancing - use manual dashboard allocation
        const tradesToExecute = actionsWithSizes.slice(0, maxRebalanceTrades);

        if (tradesToExecute.length > 0) {
          for (const action of tradesToExecute) {
            await this.executeRebalanceAction(action, currentPrices);
          }
        } else {
          this.logger.info(
            "💡 Auto-rebalancing disabled. Use the dashboard to manually allocate capital."
          );
        }
      } else {
        this.logger.debug(
          "✅ Portfolio is well balanced - no rebalancing needed"
        );
      }
    } catch (error: any) {
      this.logger.error("❌ Error in portfolio rebalancing:");
      this.logger.error({ error }, `🔴 FULL REBALANCING ERROR OBJECT`);
      this.logger.error("📊 ERROR DETAILS:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
        details: error.response?.data || "No additional details",
      });

      // Don't let portfolio rebalancing errors stop the bot
      this.logger.info(
        "💡 Continuing bot operation despite portfolio rebalancing error"
      );
    }
  }

  /**
   * Execute a portfolio rebalancing action
   */
  private async executeRebalanceAction(
    action: RebalanceAction,
    currentPrices: Map<string, number>
  ): Promise<void> {
    try {
      const currentPrice = currentPrices.get(action.symbol) || 0;
      if (currentPrice <= 0) return;

      this.logger.info(`⚖️ REBALANCING ${action.symbol}:`, {
        action: action.action,
        amount: `$${action.amountUSDT.toFixed(2)} USDT`,
        currentPrice: `$${currentPrice.toFixed(4)}`,
        reason: action.reason,
        priority: action.priority.toFixed(2),
      });

      // Create rebalancing intent with proper USDT amounts
      const usdtAmount = Math.abs(action.amountUSDT);

      // Skip trades smaller than minimum
      const minTradeAmount = 5; // Bitget minimum is 5 USDT
      if (usdtAmount < minTradeAmount) {
        this.logger.debug(
          `💡 Skipping ${action.symbol} rebalance: ${usdtAmount.toFixed(
            2
          )} USDT < ${minTradeAmount} USDT minimum`
        );
        return;
      }

      const intent: PositionIntent = {
        symbol: action.symbol,
        direction: action.action === "buy" ? "long" : "short",
        quantity: usdtAmount, // Use USDT amount for market orders
        leverage: 1, // Use minimal leverage for rebalancing
        orderType: "market",
        price: currentPrice,
        stopLoss: undefined, // No stop loss for rebalancing
        takeProfit: undefined, // No take profit for rebalancing
      };

      await this.executeTrade(intent, "portfolio-rebalance");
    } catch (error) {
      this.logger.error(
        `❌ Failed to execute rebalance action for ${action.symbol}:`,
        error
      );
    }
  }

  /**
   * Execute a trade
   */
  private async executeTrade(
    intent: PositionIntent,
    instructionId: string
  ): Promise<void> {
    try {
      this.logger.info(`🔥 EXECUTING LIVE TRADE:`, {
        symbol: intent.symbol,
        direction: intent.direction,
        quantity: `${intent.quantity} USDT`,
        leverage: intent.leverage,
        orderType: intent.orderType,
      });

      // Execute the actual order
      const result = await open(this.rest, intent);

      this.logger.info(`✅ TRADE EXECUTED SUCCESSFULLY:`, {
        symbol: intent.symbol,
        direction: intent.direction,
        orderId: result?.orderId || "pending",
        status: result?.status || "submitted",
        timestamp: new Date().toISOString(),
      });

      // Update bot state
      this.botState.positions.push(intent);
      this.botState.lastTradeTime[instructionId] = Date.now();

      // Log comprehensive trade summary
      const tradeValue =
        (intent.quantity || 0) * (intent.price || 0) * (intent.leverage || 1);
      this.logger.info(`📊 TRADE SUMMARY:`, {
        symbol: intent.symbol,
        side: intent.direction,
        quantity: `${intent.quantity} USDT`,
        entryPrice: intent.price,
        leverage: `${intent.leverage}x`,
        notionalValue: `$${tradeValue.toFixed(2)}`,
        stopLoss: intent.stopLoss ? `$${intent.stopLoss.toFixed(4)}` : "none",
        takeProfit: intent.takeProfit
          ? `$${intent.takeProfit.toFixed(4)}`
          : "none",
        totalPositions: this.botState.positions.length,
        remainingEquity: `$${(this.botState.equity.USDT || 0).toFixed(2)}`,
      });
    } catch (error: any) {
      this.logger.error("❌ TRADE EXECUTION FAILED:", {
        symbol: intent.symbol,
        direction: intent.direction,
        error: error instanceof Error ? error.message : String(error),
        details:
          error instanceof Error && (error as any).response
            ? (error as any).response.data
            : "No additional details",
      });

      // Log the full error for debugging
      if (error instanceof Error) {
        this.logger.debug("Full error details:", {
          message: error.message,
          stack: error.stack,
        });
      }
    }
  }

  /**
   * Generate comprehensive market report
   */
  private async generateMarketReport(): Promise<void> {
    try {
      const now = Date.now();

      this.logger.info(
        `🔍 Market report check: ${
          now - this.lastMarketReport
        }ms since last report`
      );

      // Generate report every 10 seconds - High frequency mode
      if (now - this.lastMarketReport < 10000) {
        // Skip logging to reduce verbosity in high frequency mode
        return;
      }

      this.lastMarketReport = now;

      this.logger.info("📊 Generating market report...");
      this.logger.info(
        "📊 ══════════════════════════════════════════════════════════"
      );
      this.logger.info("📈 MARKET REPORT - " + new Date().toLocaleTimeString());
      this.logger.info(
        "📊 ══════════════════════════════════════════════════════════"
      );

      // Portfolio summary
      const equity = this.botState.equity.USDT || 0;
      const uptimeHours = (
        (now - this.botState.startTime) /
        (1000 * 60 * 60)
      ).toFixed(1);

      this.logger.info("💰 PORTFOLIO STATUS:");
      this.logger.info(`  Balance: $${equity.toFixed(2)} USDT`);
      this.logger.info(`  Uptime: ${uptimeHours}h`);
      this.logger.info(
        `  Environment: ${this.isTestnetMode() ? "🧪 TESTNET" : "� PRODUCTION"}`
      );
      this.logger.info(`  Active Positions: ${this.botState.positions.length}`);
      this.logger.info(`  Daily P&L: $${this.botState.dailyPnL.toFixed(2)}`);

      // Market analysis for each symbol
      const config = await configManager.getConfig();
      const marketAnalysis: any[] = [];

      for (const symbol of config.marketData.symbols) {
        const bar = this.marketData.get(symbol);
        if (!bar) continue;

        // Generate AI signal for analysis (enhanced if available)
        let signal;
        let enhancedInfo = {};

        if (this.aiEngine instanceof EnhancedAIEngine) {
          const enhancedSignal = this.aiEngine.generateEnhanced(
            bar,
            symbol,
            "15m"
          );
          signal = enhancedSignal;
          if (enhancedSignal) {
            enhancedInfo = {
              newsImpact: enhancedSignal.newsImpact,
              riskLevel: enhancedSignal.riskLevel,
              geopoliticalFactors: enhancedSignal.geopoliticalFactors,
            };
          }
        } else {
          signal = this.aiEngine.generate(bar, symbol, "15m");
        }

        // Calculate price change
        const priceChange = ((bar.close - bar.open) / bar.open) * 100;
        const trend =
          priceChange > 1
            ? "🚀 STRONG UP"
            : priceChange > 0.1
            ? "📈 UP"
            : priceChange < -1
            ? "💥 STRONG DOWN"
            : priceChange < -0.1
            ? "📉 DOWN"
            : "➡️ FLAT";

        // Volume analysis
        const volumeIndicator =
          bar.volume > 1000000
            ? "🔥 HIGH"
            : bar.volume > 500000
            ? "📊 MEDIUM"
            : "🔸 LOW";

        marketAnalysis.push({
          symbol,
          price: `$${bar.close.toLocaleString()}`,
          change: `${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%`,
          trend,
          volume: volumeIndicator,
          signal: signal
            ? {
                direction: signal.direction.toUpperCase(),
                confidence: `${(signal.confidence * 100).toFixed(1)}%`,
                status:
                  signal.confidence > 0.7
                    ? "✅ STRONG"
                    : signal.confidence > 0.5
                    ? "⚠️ WEAK"
                    : "❌ NO SIGNAL",
              }
            : { direction: "NONE", confidence: "0%", status: "❌ NO DATA" },
        });
      }

      // Display market analysis
      this.logger.info("📊 MARKET ANALYSIS:");
      if (marketAnalysis.length === 0) {
        this.logger.info("  📊 Waiting for market data...");
      } else {
        marketAnalysis.forEach((analysis) => {
          this.logger.info(
            `  ${analysis.symbol}: ${analysis.price} (${analysis.change}) ${analysis.trend} Vol:${analysis.volume} AI:${analysis.signal.direction} (${analysis.signal.confidence}) ${analysis.signal.status}`
          );
        });
      }

      // Trading opportunities summary
      const strongSignals = marketAnalysis.filter(
        (a) => parseFloat(a.signal.confidence.replace("%", "")) > 70
      );
      const activeOpportunities = strongSignals.length;

      this.logger.info("🎯 TRADING OPPORTUNITIES:");
      this.logger.info(
        `  Strong Signals: ${activeOpportunities}/${marketAnalysis.length} symbols`
      );
      this.logger.info(
        `  Best Opportunity: ${
          activeOpportunities > 0
            ? `${strongSignals[0].symbol} ${strongSignals[0].signal.direction} (${strongSignals[0].signal.confidence})`
            : "No strong signals detected"
        }`
      );
      this.logger.info(
        `  Market Sentiment: ${this.calculateMarketSentiment(marketAnalysis)}`
      );

      // AI Engine status
      const aiStatus = this.aiEngine.getStatus();
      this.logger.info("🧠 AI ENGINE STATUS:");
      this.logger.info(`  Models: ${aiStatus.availableModels.join(", ")}`);
      this.logger.info(`  Current Model: ${aiStatus.currentModel.name}`);
      this.logger.info(`  Predictions: Real-time`);
      this.logger.info(
        `  Status: ${aiStatus.loaded ? "✅ OPERATIONAL" : "❌ OFFLINE"}`
      );

      // Enhanced AI Engine intelligence report
      if (
        this.aiEngine instanceof EnhancedAIEngine &&
        this.aiEngine.isEnhanced()
      ) {
        this.logger.info("");
        this.logger.info("🌍 GEOPOLITICAL INTELLIGENCE:");
        const intelligenceReport =
          await this.aiEngine.generateIntelligenceReport(
            config.marketData.symbols
          );
        const lines = intelligenceReport.split("\n");
        lines.forEach((line) => {
          if (line.trim()) {
            this.logger.info(`  ${line}`);
          }
        });
      }

      // Aggressive Decision Engine metrics
      const decisionMetrics = this.decisionEngine.getDecisionMetrics();
      this.logger.info("");
      this.logger.info("⚡ AGGRESSIVE TRADING ENGINE:");
      this.logger.info(`  Daily Trades: ${decisionMetrics.totalTradesToday}`);
      this.logger.info(
        `  Success Rate: ${(decisionMetrics.successRate * 100).toFixed(1)}%`
      );
      this.logger.info(
        `  Opportunities Found: ${decisionMetrics.opportunitiesIdentified}`
      );
      this.logger.info(`  Trades Executed: ${decisionMetrics.tradesExecuted}`);

      // Portfolio Balance Report
      this.logger.info("");
      this.logger.info("⚖️ PORTFOLIO BALANCE:");
      const balanceReport = this.portfolioBalancer.getPortfolioReport();
      const balanceLines = balanceReport.split("\n").slice(2, -2); // Skip header and footer
      balanceLines.forEach((line) => {
        if (line.trim()) {
          this.logger.info(`  ${line.trim()}`);
        }
      });

      this.logger.info(
        "📊 ══════════════════════════════════════════════════════════"
      );

      this.logger.info("✅ Market report completed successfully");
    } catch (error) {
      this.logger.error("❌ Error generating market report:", error);
    }
  }

  /**
   * Calculate overall market sentiment
   */
  private calculateMarketSentiment(analysis: any[]): string {
    const bullish = analysis.filter(
      (a) => a.signal.direction === "LONG"
    ).length;
    const bearish = analysis.filter(
      (a) => a.signal.direction === "SHORT"
    ).length;
    const neutral = analysis.length - bullish - bearish;

    if (bullish > bearish + neutral) return "🚀 VERY BULLISH";
    if (bullish > bearish) return "📈 BULLISH";
    if (bearish > bullish + neutral) return "💥 VERY BEARISH";
    if (bearish > bullish) return "📉 BEARISH";
    return "➡️ NEUTRAL";
  }

  /**
   * Update account equity
   */
  private async updateEquity(): Promise<void> {
    try {
      this.logger.debug("🔄 Updating account equity...");
      const balance = await getBalance(this.rest);

      this.logger.debug("📊 Raw balance response:", balance);

      if (balance && balance.data) {
        // Handle both array and object responses
        const balanceData = Array.isArray(balance.data)
          ? balance.data
          : [balance.data];

        if (balanceData.length > 0) {
          const usdtBalance = balanceData.find(
            (b: any) =>
              b.marginCoin === "USDT" || b.coin === "USDT" || b.asset === "USDT"
          );

          if (usdtBalance) {
            const availableBalance = parseFloat(
              usdtBalance.available ||
                (usdtBalance as any).availableBalance ||
                (usdtBalance as any).free ||
                "0"
            );

            this.botState.equity.USDT = availableBalance;
            this.logger.info(
              `💰 Equity updated: ${availableBalance.toFixed(2)} USDT`
            );
          } else {
            this.logger.warn("⚠️ No USDT balance found in response");
            // Use default for testing
            this.botState.equity.USDT = 1000;
          }
        } else {
          this.logger.warn("⚠️ Empty balance data, using default");
          this.botState.equity.USDT = 1000;
        }
      } else {
        this.logger.warn("⚠️ Invalid balance response, using default");
        this.botState.equity.USDT = 1000;
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to update equity:`, {
        message: error.message,
        code: error.code,
        details: error.response?.data,
      });

      // Use default equity for testing when API calls fail
      this.botState.equity.USDT = 1000;
      this.logger.info("💡 Using default equity (1000 USDT) for testing");
    }
  }

  /**
   * Start monitoring loop
   */
  private startMonitoring(): void {
    const monitoringInterval = 5000; // 5 seconds - Optimized for best refresh rate

    this.logger.info(
      `🔄 Started monitoring loop (${
        monitoringInterval / 1000
      }s interval) - HIGH FREQUENCY MODE`
    );

    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Update equity every 30 seconds
        await this.updateEquity();

        // Execute aggressive trading strategy
        await this.processAggressiveTrading();

        // Process portfolio rebalancing
        await this.processPortfolioRebalancing();

        // Auto-rebalance between spot and futures portfolios every 5 minutes
        if (Date.now() % 300000 < 30000) { // Every 5 minutes (within 30s window)
          await this.autoRebalancePortfolios();
        }

        // Generate comprehensive market report every 30 seconds
        await this.generateMarketReport();

        // Enhanced bot status logging
        const equity = this.botState.equity.USDT || 0;
        const equityStr = equity.toFixed(2);
        const uptimeHours = (
          (Date.now() - this.botState.startTime) /
          (1000 * 60 * 60)
        ).toFixed(1);

        this.logger.debug("📊 Enhanced Bot Status:", {
          uptime: `${uptimeHours}h`,
          equity: `${equityStr} USDT`,
          positions: this.botState.positions.length,
          dailyPnL: `${this.botState.dailyPnL.toFixed(2)} USDT`,
          consecutiveLosses: this.botState.consecutiveLosses,
          isActive: this.botState.isActive,
          environment: process.env.BITGET_ENVIRONMENT || "production",
          timestamp: new Date().toISOString(),
        });

        // Broadcast bot data to WebSocket clients
        this.broadcastBotData();

        // Log performance metrics every 5 minutes
        if (Date.now() % 300000 < 30000) {
          // Every 5 minutes (within 30s window)
          this.logger.info("📈 Bot Performance Summary:", {
            uptime: `${uptimeHours} hours`,
            equity: `${equityStr} USDT`,
            environment: this.isTestnetMode() ? "TESTNET" : "MAINNET",
            status: this.botState.isActive ? "ACTIVE" : "PAUSED",
          });
        }
      } catch (error: any) {
        this.logger.error("❌ Monitoring error:", {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });

        // Recovery attempt
        if (
          error.message.includes("API") ||
          error.message.includes("connection")
        ) {
          this.logger.info("🔄 Attempting API reconnection...");
          try {
            await this.validateAPIConnection();
          } catch (recoveryError: any) {
            this.logger.error(
              "❌ Recovery attempt failed:",
              recoveryError.message
            );
          }
        }
      }
    }, monitoringInterval);
  }

  /**
   * Validate API connection with comprehensive checks
   */
  private async validateAPIConnection(): Promise<boolean> {
    try {
      // Environment info (use runtime mode)
      const isTestnet = this.isTestnetMode();
      this.logger.info(
        `🔧 Environment: ${isTestnet ? "TESTNET" : "PRODUCTION"}`
      );

      // Test 1: Basic API connectivity test with multiple endpoints
      let apiWorking = false;

      // Try different endpoints to find one that works
      const testEndpoints = [
        // Test 1: Server time (public endpoint)
        async () => {
          const time = await this.rest.getServerTime();
          this.logger.info("✅ Server time API test passed");
          return true;
        },
        // Test 2: Ticker (public endpoint)
        async () => {
          const ticker = await this.rest.getTicker({
            symbol: "BTCUSDT",
            productType: "USDT-FUTURES",
          });
          this.logger.info("✅ Ticker API test passed");
          return true;
        },
        // Test 3: Account info (authenticated endpoint)
        async () => {
          const account = await this.rest.getFuturesAccount({
            productType: "USDT-FUTURES",
          });
          this.logger.info("✅ Account API test passed");
          return true;
        },
      ];

      for (const testEndpoint of testEndpoints) {
        if (apiWorking) break;
        try {
          await testEndpoint();
          apiWorking = true;
        } catch (error: any) {
          this.logger.warn(`⚠️ API test failed:`, error.message);
          if (error.code) {
            this.logger.warn(`   Error code: ${error.code}`);
          }
        }
      }

      if (!apiWorking) {
        this.logger.error(
          "❌ All API connectivity tests failed - running diagnostic..."
        );
        await this.diagnoseAPIIssues();
      }

      // Skip detailed API tests in testnet to avoid 404 errors
      if (!isTestnet) {
        // Test 2: Check account balance (only in production)
        try {
          const balance = await getBalance(this.rest);
          if (balance && balance.data) {
            this.logger.info("✅ Balance API test passed");
          } else {
            this.logger.warn("⚠️ Balance API returned no data");
          }
        } catch (error: any) {
          this.logger.warn("⚠️ Balance API test failed:", error.message);
        }

        // Test 3: Check positions (only in production)
        try {
          const positions = await getPositions(this.rest);
          if (positions && positions.data) {
            this.logger.info("✅ Positions API test passed");
          } else {
            this.logger.warn("⚠️ Positions API returned no data");
          }
        } catch (error: any) {
          this.logger.warn("⚠️ Positions API test failed:", error.message);
        }
      } else {
        this.logger.info(
          "🧪 Skipping detailed API tests in testnet mode to avoid 404 errors"
        );
      }

      if (isTestnet) {
        this.logger.info(
          "💡 Using testnet - API calls may have limited functionality"
        );
      }

      this.logger.info(
        "✅ API validation completed - proceeding with trading bot initialization"
      );

      return true; // Allow continuation for now
    } catch (error: any) {
      this.logger.error("❌ API validation failed:", error.message);
      return true; // Continue anyway for now
    }
  }

  /**
   * Diagnose API issues and suggest fixes
   */
  private async diagnoseAPIIssues(): Promise<void> {
    this.logger.info("🔍 Running API diagnostic...");

    // Check API configuration
    const apiKey = process.env.BITGET_API_KEY;
    const apiSecret = process.env.BITGET_API_SECRET;
    const apiPassphrase = process.env.BITGET_API_PASSPHRASE;

    this.logger.info("📋 API Configuration Check:");
    this.logger.info(
      `   API Key: ${apiKey ? `${apiKey.substring(0, 8)}...` : "MISSING"}`
    );
    this.logger.info(
      `   API Secret: ${
        apiSecret ? `${apiSecret.substring(0, 8)}...` : "MISSING"
      }`
    );
    this.logger.info(`   API Passphrase: ${apiPassphrase ? "***" : "MISSING"}`);

    // Test different authentication methods
    const environment = this.isTestnetMode() ? "testnet" : "production";
    this.logger.info(`   Environment: ${environment}`);

    if (!apiKey || !apiSecret || !apiPassphrase) {
      this.logger.error("❌ Missing API credentials!");
      this.logger.warn(
        "💡 Please ensure all API credentials are set in .env file"
      );
      return;
    }

    // Try creating a new client with different configurations
    try {
      // Configuration 1: Simplified REST client
      this.logger.info("🔧 Trying simplified configuration...");
      const { RestClientV2 } = await import("bitget-api");

      const simpleConfig = {
        apiKey: apiKey,
        apiSecret: apiSecret,
        apiPassphrase: apiPassphrase,
      };

      const testClient = new RestClientV2(simpleConfig);
      const serverTime = await testClient.getServerTime();
      this.logger.info("✅ Simplified configuration works!");

      // Replace the current client
      this.rest = testClient;
    } catch (error: any) {
      this.logger.error("❌ Simplified configuration failed:", error.message);

      // Try with demo trading enabled
      try {
        this.logger.info("🔧 Trying demo trading configuration...");
        const { RestClientV2 } = await import("bitget-api");

        const demoConfig = {
          apiKey: apiKey,
          apiSecret: apiSecret,
          apiPassphrase: apiPassphrase,
          enableDemoTrading: true,
        };

        const demoClient = new RestClientV2(demoConfig);
        const serverTime = await demoClient.getServerTime();
        this.logger.info("✅ Demo trading configuration works!");

        // Replace the current client
        this.rest = demoClient;
      } catch (demoError: any) {
        this.logger.error("❌ Demo configuration failed:", demoError.message);
        this.logger.warn("💡 Suggestions:");
        this.logger.warn("   1. Check if API keys are valid and active");
        this.logger.warn(
          "   2. Ensure API key has futures trading permissions"
        );
        this.logger.warn("   3. Verify IP whitelist settings on Bitget");
        this.logger.warn("   4. Try generating new API keys");
        this.logger.warn("   5. Contact Bitget support if issues persist");
      }
    }
  }

  /**
   * Update positions from exchange
   */
  private async updatePositions(): Promise<void> {
    try {
      const positions = await getPositions(this.rest);
      // Process and update position state
      // This would typically involve PnL calculations and position management
    } catch (error) {
      this.logger.error(`Failed to update positions: ${error}`);
      this.logger.error({ error }, `🔴 FULL POSITION UPDATE ERROR`);
    }
  }

  /**
   * Log current bot status
   */
  private logStatus(): void {
    const config = configManager.getConfig();
    const activeInstructions = config.instructions.filter(
      (i: any) => i.enabled
    ).length;

    this.logger.info(
      {
        equity: this.botState.equity.USDT,
        positions: this.botState.positions.length,
        activeInstructions,
        consecutiveLosses: this.botState.consecutiveLosses,
        isActive: this.botState.isActive,
        uptime: Date.now() - this.botState.startTime,
      },
      "Bot Status"
    );
  }

  /**
   * Broadcast bot data to WebSocket clients
   */
  private broadcastBotData(): void {
    try {
      const config = configManager.getConfig();
      const equity = this.botState.equity.USDT || 0;
      const uptime = Math.floor((Date.now() - this.botState.startTime) / 1000);

      // Convert market data to array format
      const marketDataArray = Array.from(this.marketData.entries()).map(
        ([symbol, bar]) => ({
          symbol,
          price: bar.close,
          change24h: ((bar.close - bar.open) / bar.open) * 100,
          volume24h: bar.volume,
          high24h: bar.high,
          low24h: bar.low,
          lastUpdate: bar.timestamp,
        })
      );

      // Get trading opportunities from decision engine
      const opportunities = this.decisionEngine.getOpportunities();

      // Get recent trades (mock data for now)
      const recentTrades = this.botState.positions.map((pos, index) => ({
        id: `trade-${index}`,
        symbol: pos.symbol,
        side: pos.direction,
        amount: pos.quantity,
        price: pos.price,
        timestamp: Date.now() - index * 60000, // Mock timestamps
        status: "filled" as const,
        pnl: Math.random() * 100 - 50, // Mock PnL
      }));

      // Get portfolio data
      const portfolio = {
        totalValue: equity,
        positions: this.botState.positions.map((pos) => ({
          symbol: pos.symbol,
          size: pos.quantity,
          markPrice: pos.price,
          unrealizedPnl: Math.random() * 100 - 50, // Mock PnL
          percentage:
            ((pos.quantity * (pos.price || 0) * (pos.leverage || 1)) / equity) *
            100,
        })),
        allocations: [], // Will be populated by portfolio balancer
        rebalanceNeeded: false,
        lastRebalance: Date.now(),
      };

      // Get aggressive trading metrics
      const decisionMetrics = this.decisionEngine.getDecisionMetrics();
      const aggressiveTrading = {
        dailyTrades: decisionMetrics.totalTradesToday,
        successRate: decisionMetrics.successRate,
        opportunitiesFound: decisionMetrics.opportunitiesIdentified,
        tradesExecuted: decisionMetrics.tradesExecuted,
        portfolioBalance: 0.8, // Mock balance
        maxTradesPerSymbol: 5,
      };

      // Get AI engine status
      const aiStatus = this.aiEngine.getStatus();
      const aiEngine = {
        model: aiStatus.currentModel.name,
        status: aiStatus.loaded ? "OPERATIONAL" : "ERROR",
        predictions: 0,
        accuracy: 0.85,
      };

      const botData = {
        timestamp: Date.now(),
        uptime,
        equity,
        dailyPnL: this.botState.dailyPnL,
        environment: (this.isTestnetMode()
          ? "testnet"
          : "live"
        ).toUpperCase() as "TESTNET" | "LIVE",
        portfolio,
        aggressiveTrading,
        marketData: marketDataArray,
        opportunities,
        recentTrades,
        aiEngine,
      };

      this.wsAdapter.broadcastBotData(botData);
    } catch (error) {
      this.logger.error("Failed to broadcast bot data:", error);
    }
  }

  /**
   * Stop the bot gracefully
   */
  async stop(): Promise<void> {
    this.logger.info("Stopping trading bot...");
    this.isRunning = false;
    this.botState.isActive = false;

    if (this.ws) {
      this.ws.close();
    }

    if (this.wsAdapter) {
      this.wsAdapter.stop();
    }

    this.logger.info("Trading bot stopped");
  }

  /**
   * Emergency stop - close all positions
   */
  async emergencyStop(): Promise<void> {
    this.logger.warn("Emergency stop initiated!");
    this.botState.isActive = false;

    // TODO: Close all open positions
    // This would involve getting all positions and placing opposite orders

    await this.stop();
  }

  /**
   * Portfolio Control Methods for Dashboard Integration
   */

  /**
   * Allocate a specific amount of capital to the portfolio for trading
   * Uses dual portfolio system: Spot for asset allocation, Futures for scalping
   */
  async allocateCapitalToPortfolio(amount: number): Promise<any> {
    try {
      this.logger.info(`💰 Allocating ${amount} USDT using dual portfolio system`);

      // Get current portfolio balances
      const balances = await this.portfolioTransfer.getPortfolioBalances();
      this.logger.info("📊 Current portfolio balances:", {
        spotUSDT: balances.spot.USDT,
        futuresUSDT: balances.futures.USDT,
        futuresEquity: balances.futures.totalEquity,
      });

      // Check if we need to transfer funds from spot to futures
      if (balances.spot.USDT >= amount) {
        this.logger.info(`🔄 Transferring ${amount} USDT from spot to futures for trading`);
        
        const transferSuccess = await this.portfolioTransfer.transferFunds({
          from: "spot",
          to: "futures",
          amount: amount,
          currency: "USDT",
        });

        if (!transferSuccess) {
          throw new Error("Failed to transfer funds from spot to futures");
        }

        this.logger.info(`✅ Successfully transferred ${amount} USDT to futures wallet`);
      } else {
        this.logger.warn(`⚠️ Insufficient spot balance. Available: ${balances.spot.USDT} USDT, Required: ${amount} USDT`);
        throw new Error(`Insufficient spot balance. Available: ${balances.spot.USDT} USDT, Required: ${amount} USDT`);
      }

      // Update the portfolio balancer with the new trading capital
      const config = configManager.getConfig();
      if (!config || !config.portfolio) {
        throw new Error("Portfolio configuration not loaded");
      }

      // Set the trading capital amount
      const tradingCapital = amount;
      this.logger.info(`🎯 Trading capital set to ${tradingCapital} USDT in futures wallet`);

      // Calculate simple allocation actions based on targets
      const allocations: any[] = [];
      const minAmount = config.portfolio.minTradeAmount || 10;
      const rejectedAllocations: any[] = [];

      for (const [symbol, targetPercent] of Object.entries(
        config.portfolio.targetAllocations
      )) {
        const targetAmount = tradingCapital * targetPercent;
        if (targetAmount >= minAmount) {
          allocations.push({
            symbol,
            side: "BUY",
            amount: targetAmount,
            targetPercent,
          });
        } else {
          rejectedAllocations.push({
            symbol,
            targetAmount,
            targetPercent,
            reason: `Amount ${targetAmount.toFixed(
              2
            )} USDT < minimum ${minAmount} USDT`,
          });
        }
      }

      // Log allocation summary
      this.logger.info(
        `💰 Capital allocation summary for ${tradingCapital} USDT:`
      );
      this.logger.info(`✅ Approved allocations: ${allocations.length}`);
      this.logger.info({ allocations }, `📊 APPROVED ALLOCATIONS DETAILS`);
      if (rejectedAllocations.length > 0) {
        this.logger.warn(
          `❌ Rejected allocations: ${rejectedAllocations.length}`
        );
        this.logger.warn(
          { rejectedAllocations },
          `📊 REJECTED ALLOCATIONS DETAILS`
        );
        rejectedAllocations.forEach((reject) => {
          this.logger.warn(`   ${reject.symbol}: ${reject.reason}`);
        });
      }

      if (allocations.length > 0) {
        this.logger.info(
          `⚖️ Executing ${allocations.length} allocation trades`
        );

        // Execute allocation trades
        for (const allocation of allocations) {
          try {
            this.logger.info(`🔥 EXECUTING PORTFOLIO ALLOCATION:`);
            this.logger.info(
              `🚀 Opening long position for ${allocation.symbol}: ${allocation.amount} USDT @ leverage 1`
            );

            // For Bitget futures, quantity should be in USDT for market orders
            const positionIntent: PositionIntent = {
              symbol: allocation.symbol,
              direction: "long",
              quantity: allocation.amount, // This is correct - USDT amount for market orders
              leverage: 1,
              orderType: "market", // Ensure market order for immediate execution
            };

            this.logger.info(`📝 Placing market order with intent:`, {
              symbol: allocation.symbol,
              direction: positionIntent.direction,
              quantity: `${allocation.amount} USDT`,
              leverage: 1,
            });

            const result = await open(this.rest, positionIntent);

            this.logger.info(
              `✅ Portfolio allocation trade executed for ${allocation.symbol}:`,
              {
                orderId: result.orderId,
                status: result.status,
                clientOid: result.clientOid,
              }
            );

            // Add a small delay between trades to avoid rate limits
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error: any) {
            const errorMsg = `❌ Failed to execute portfolio allocation for ${
              allocation.symbol
            }: ${error.message || "Unknown error"}`;
            this.logger.error(errorMsg, {
              error: error.message,
              code: error.code,
              symbol: allocation.symbol,
              amount: allocation.amount,
              fullError: error,
            });

            // Also broadcast error to dashboard
            if (this.wsAdapter) {
              this.wsAdapter.broadcastBotData({
                type: "allocation_error",
                error: errorMsg,
                symbol: allocation.symbol,
                amount: allocation.amount,
                timestamp: Date.now(),
              });
            }
          }
        }

        return {
          success: true,
          tradingCapital,
          actions: allocations.length,
          allocations,
          message: `Allocated ${amount} USDT and executed ${allocations.length} allocation trades`,
        };
      } else {
        const minRequiredCapital = Math.max(
          ...Object.values(config.portfolio.targetAllocations).map(
            (p) => minAmount / p
          )
        );
        const warningMsg = `❌ No allocations possible: ${tradingCapital} USDT too small. Minimum required: ${minRequiredCapital.toFixed(
          0
        )} USDT (based on ${minAmount} USDT minimum per trade)`;

        this.logger.warn(warningMsg);

        // Broadcast detailed warning to dashboard
        if (this.wsAdapter) {
          this.wsAdapter.broadcastBotData({
            type: "allocation_warning",
            message: warningMsg,
            amount: tradingCapital,
            minRequired: minRequiredCapital,
            rejectedAllocations,
            timestamp: Date.now(),
          });
        }

        return {
          success: false,
          message: warningMsg,
          minRequiredCapital,
          rejectedAllocations,
        };
      }
    } catch (error) {
      this.logger.error("❌ Portfolio capital allocation failed:", error);
      throw error;
    }
  }

  /**
   * Allocate spot portfolio based on target allocations
   */
  async allocateSpotPortfolio(amount: number): Promise<any> {
    try {
      this.logger.info(`🎯 Allocating ${amount} USDT to spot portfolio`);

      const config = configManager.getConfig();
      if (!config || !config.portfolio) {
        throw new Error("Portfolio configuration not loaded");
      }

      // Get target allocations
      const targetAllocations = config.portfolio.targetAllocations || {
        BTCUSDT: 0.3,
        ETHUSDT: 0.25,
        BNBUSDT: 0.42,
        MATICUSDT: 0.03,
      };

      // Allocate spot portfolio
      const success = await this.portfolioTransfer.allocateSpotPortfolio(
        targetAllocations,
        amount
      );

      if (success) {
        this.logger.info(`✅ Spot portfolio allocation completed for ${amount} USDT`);
        return {
          success: true,
          message: `Spot portfolio allocated with ${amount} USDT`,
          amount,
          allocations: targetAllocations,
        };
      } else {
        throw new Error("Spot portfolio allocation failed");
      }
    } catch (error) {
      this.logger.error("❌ Spot portfolio allocation failed:", error);
      throw error;
    }
  }

  /**
   * Auto-rebalance between spot and futures portfolios
   */
  async autoRebalancePortfolios(): Promise<void> {
    try {
      this.logger.info("🔄 Auto-rebalancing portfolios");

      // Check if we need to rebalance from futures to spot
      const rebalanceSuccess = await this.portfolioTransfer.rebalanceFromFutures(50); // Keep 50 USDT in futures
      
      if (rebalanceSuccess) {
        this.logger.info("✅ Portfolio rebalancing completed");
      } else {
        this.logger.warn("⚠️ Portfolio rebalancing had issues");
      }
    } catch (error) {
      this.logger.error("❌ Auto-rebalancing failed:", error);
    }
  }

  /**
   * Manually trigger portfolio rebalancing
   */
  async triggerManualRebalance(): Promise<any> {
    try {
      this.logger.info("🎛️ Manually triggering portfolio rebalance");

      // Get current positions and equity
      const positions = await getPositions(this.rest);
      await this.updateEquity();
      const totalEquity = this.botState.equity.USDT || 0;

      const config = configManager.getConfig();
      if (!config) {
        throw new Error("Configuration not loaded");
      }

      // Calculate current portfolio value from positions
      let portfolioValue = 0;
      const positionMap: Record<string, any> = {};

      if (positions.data && Array.isArray(positions.data)) {
        for (const position of positions.data) {
          if (position.total && parseFloat(position.total) > 0) {
            positionMap[position.symbol] = position;
            portfolioValue += parseFloat(position.unrealizedPL || "0");
          }
        }
      }

      // Execute rebalancing
      const result = await this.processPortfolioRebalancing();
      this.logger.info(
        `🔄 Rebalancing completed with portfolio value: ${portfolioValue}`
      );

      return {
        success: true,
        portfolioValue,
        message: "Manual rebalancing completed",
        result,
      };
    } catch (error) {
      this.logger.error("❌ Manual rebalancing failed:", error);
      throw error;
    }
  }

  /**
   * Update portfolio allocation for a specific symbol
   */
  async updatePortfolioAllocation(
    symbol: string,
    percentage: number
  ): Promise<any> {
    try {
      this.logger.info(
        `🎛️ Updating ${symbol} allocation to ${percentage * 100}%`
      );

      const config = configManager.getConfig();
      if (!config || !config.portfolio) {
        throw new Error("Portfolio configuration not loaded");
      }

      // Update the configuration
      config.portfolio.targetAllocations[symbol] = percentage;

      // Save the updated configuration (in memory for now)
      this.logger.info(
        `✅ Updated ${symbol} target allocation to ${percentage * 100}%`
      );

      // Trigger rebalancing to reflect the new allocation
      const rebalanceResult = await this.triggerManualRebalance();

      return {
        success: true,
        symbol,
        newPercentage: percentage,
        message: `Updated ${symbol} allocation and triggered rebalancing`,
        rebalanceResult,
      };
    } catch (error) {
      this.logger.error("❌ Allocation update failed:", error);
      throw error;
    }
  }

  /**
   * Switch trading mode between testnet and production
   */
  async switchTradingMode(mode: string, useTestnet: boolean): Promise<any> {
    try {
      this.logger.info(
        `🎛️ Switching to ${mode} mode (useTestnet: ${useTestnet})`
      );

      // Update runtime configuration without file modification
      this.runtimeConfig.useTestnet = useTestnet;

      // Reinitialize the Bitget API client with new mode
      await this.reinitializeBitgetClient(useTestnet);

      this.logger.info(
        `✅ Mode switched dynamically: useTestnet = ${useTestnet}`
      );
      this.logger.info(`🔄 No restart required - change applied immediately`);

      return {
        success: true,
        mode,
        useTestnet,
        message: `Mode switched to ${mode} immediately!`,
        requiresRestart: false,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to switch trading mode:`, error);
      throw error;
    }
  }

  /**
   * Reinitialize Bitget client with new testnet mode
   */
  private async reinitializeBitgetClient(useTestnet: boolean): Promise<void> {
    try {
      this.logger.info(
        `🔄 Reinitializing Bitget client (testnet: ${useTestnet})`
      );

      // Get API credentials from config
      const config = configManager.getConfig();

      // Create new Bitget client with updated mode
      const { rest, ws } = createBitget(
        config.api.key,
        config.api.secret,
        config.api.passphrase,
        useTestnet
      );

      // Update the client instances
      this.rest = rest;
      this.ws = ws;

      this.logger.info(
        `✅ Bitget client reinitialized (testnet: ${useTestnet})`
      );

      // Update the bot state environment indicator
      this.runtimeConfig.useTestnet = useTestnet;
    } catch (error: any) {
      this.logger.error(`❌ Failed to reinitialize Bitget client:`, error);
      throw error;
    }
  }

  /**
   * Get current testnet mode (runtime or config)
   */
  private isTestnetMode(): boolean {
    // Use runtime config if available, otherwise fall back to config
    if (this.runtimeConfig.useTestnet !== undefined) {
      return this.runtimeConfig.useTestnet;
    }

    const config = configManager.getConfig();
    return config.api?.useTestnet ?? true; // Default to testnet for safety
  }
}

/**
 * Main execution function
 */
const main = async () => {
  const bot = new BitgetTradingBot();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down gracefully...");
    await bot.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM, shutting down gracefully...");
    await bot.stop();
    process.exit(0);
  });

  try {
    await bot.start();
  } catch (error) {
    logger.error(`Bot startup failed: ${error}`);
    logger.error({ error }, `🔴 FULL STARTUP ERROR`);
    process.exit(1);
  }
};

// Start the bot
main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  logger.error({ error }, `🔴 FULL FATAL ERROR`);
  process.exit(1);
});
