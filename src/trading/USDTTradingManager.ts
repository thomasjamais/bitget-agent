/**
 * USDT Trading Manager
 * Handles automatic USDT trading with AI confirmation for all USDT pairs
 */

import { RestClientV2 } from "bitget-api";
import { logger } from "../utils/logger.js";
import {
  AIConfirmationEngine,
  OrderIntention,
} from "../ai/AIConfirmationEngine.js";
import { AIEngine } from "../signals/aiEngine.js";
import { EnhancedAIEngine } from "../ai/EnhancedAIEngine.js";
import { Bar } from "../types/index.js";
import { open, getBalance } from "./executor.js";

export interface USDTTradingConfig {
  enabled: boolean;
  minUSDTBalance: number;
  maxPositionSize: number;
  maxLeverage: number;
  aiConfirmationRequired: boolean;
  supportedPairs: string[];
  riskManagement: {
    maxRiskPerTrade: number; // percentage
    stopLossPercentage: number;
    takeProfitPercentage: number;
  };
}

export interface USDTTradeResult {
  success: boolean;
  orderId?: string;
  symbol: string;
  direction: "long" | "short";
  quantity: number;
  leverage: number;
  aiConfirmed: boolean;
  confidence: number;
  reasoning: string;
  error?: string;
}

export class USDTTradingManager {
  private rest: RestClientV2;
  private aiConfirmationEngine: AIConfirmationEngine;
  private config: USDTTradingConfig;
  private readonly logger = logger.child({ component: "USDTTradingManager" });
  private activeTrades: Map<string, any> = new Map();
  private lastBalanceCheck = 0;
  private cachedUSDTBalance = 0;
  private readonly BALANCE_CHECK_INTERVAL = 30000; // 30 seconds

  constructor(rest: RestClientV2, aiEngine: AIEngine) {
    this.rest = rest;
    this.aiConfirmationEngine = new AIConfirmationEngine(aiEngine);
    this.config = this.getDefaultConfig();
    this.logger.info("💰 USDT Trading Manager initialized");
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): USDTTradingConfig {
    return {
      enabled: true,
      minUSDTBalance: 10, // Minimum USDT balance to start trading
      maxPositionSize: 15, // Maximum position size in USDT (safe for $20 balance)
      maxLeverage: 10, // Maximum leverage allowed
      aiConfirmationRequired: true,
      supportedPairs: [
        "BTCUSDT",
        "ETHUSDT",
        "BNBUSDT",
        "ADAUSDT",
        "SOLUSDT",
        "MATICUSDT",
        "DOTUSDT",
        "AVAXUSDT",
        "LINKUSDT",
        "UNIUSDT",
      ],
      riskManagement: {
        maxRiskPerTrade: 10, // Default 10% - will be overridden by strategy
        stopLossPercentage: 2.5, // 2.5% stop loss
        takeProfitPercentage: 5.0, // 5% take profit
      },
    };
  }

  /**
   * Main method to process USDT trading opportunities
   */
  async processTradingOpportunity(
    symbol: string,
    marketData: Bar,
    signal: any
  ): Promise<USDTTradeResult | null> {
    try {
      // Check if USDT trading is enabled
      if (!this.config.enabled) {
        this.logger.debug("USDT trading is disabled");
        return null;
      }

      // Check if symbol is supported
      if (!this.config.supportedPairs.includes(symbol)) {
        this.logger.debug(`Symbol ${symbol} not supported for USDT trading`);
        return null;
      }

      // Check USDT balance
      const usdtBalance = await this.getUSDTBalance();
      if (usdtBalance < this.config.minUSDTBalance) {
        this.logger.info(
          `💰 Insufficient USDT balance: ${usdtBalance} < ${this.config.minUSDTBalance}`
        );
        return null;
      }

      // Check if we already have an active trade for this symbol
      if (this.activeTrades.has(symbol)) {
        this.logger.debug(`Active trade already exists for ${symbol}`);
        return null;
      }

      // Create order intention
      const orderIntention = this.createOrderIntention(
        symbol,
        marketData,
        signal,
        usdtBalance
      );

      if (!orderIntention) {
        this.logger.debug(`No valid order intention created for ${symbol}`);
        return null;
      }

      // Get AI confirmation if required
      let aiConfirmation = null;
      if (this.config.aiConfirmationRequired) {
        aiConfirmation = await this.aiConfirmationEngine.confirmOrderIntention(
          orderIntention,
          marketData
        );

        if (!aiConfirmation.confirmed) {
          this.logger.info(
            `❌ AI rejected trade for ${symbol}: ${aiConfirmation.reasoning}`
          );
          return {
            success: false,
            symbol,
            direction: orderIntention.direction,
            quantity: orderIntention.quantity,
            leverage: orderIntention.leverage,
            aiConfirmed: false,
            confidence: aiConfirmation.confidence,
            reasoning: aiConfirmation.reasoning,
          };
        }

        this.logger.info(
          `✅ AI approved trade for ${symbol}: ${aiConfirmation.reasoning}`
        );
      }

      // Execute the trade
      const tradeResult = await this.executeTrade(
        orderIntention,
        aiConfirmation
      );

      return tradeResult;
    } catch (error: any) {
      this.logger.error(
        `❌ USDT trading error for ${symbol}: ${error.message}`,
        { error }
      );
      return {
        success: false,
        symbol,
        direction: "long", // fallback
        quantity: 0,
        leverage: 1,
        aiConfirmed: false,
        confidence: 0,
        reasoning: `Error: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Create order intention based on signal and market data
   */
  private createOrderIntention(
    symbol: string,
    marketData: Bar,
    signal: any,
    usdtBalance: number
  ): OrderIntention | null {
    try {
      // Determine direction from signal
      const direction =
        signal.direction || (signal.action === "buy" ? "long" : "short");

      // Calculate position size based on risk management
      const maxRiskAmount =
        usdtBalance * (this.config.riskManagement.maxRiskPerTrade / 100);
      const positionSize = Math.min(
        maxRiskAmount,
        this.config.maxPositionSize,
        usdtBalance * 0.1, // Never risk more than 10% of balance
        usdtBalance * 0.8 // Never use more than 80% of available balance
      );

      if (positionSize < 5) {
        // Minimum position size
        this.logger.debug(`Position size too small: ${positionSize}`);
        return null;
      }

      // Calculate leverage based on signal confidence and risk
      const leverage = this.calculateOptimalLeverage(
        signal.confidence || 0.5,
        positionSize,
        usdtBalance
      );

      // Calculate expected return and risk score
      const expectedReturn = this.calculateExpectedReturn(signal, marketData);
      const riskScore = this.calculateRiskScore(signal, marketData, leverage);

      return {
        symbol,
        direction,
        quantity: positionSize,
        leverage,
        expectedReturn,
        riskScore,
        timestamp: Date.now(),
        source: "ai",
      };
    } catch (error: any) {
      this.logger.error(`Failed to create order intention: ${error.message}`);
      return null;
    }
  }

  /**
   * Calculate optimal leverage based on confidence and risk
   */
  private calculateOptimalLeverage(
    confidence: number,
    positionSize: number,
    balance: number
  ): number {
    // Base leverage on confidence (higher confidence = higher leverage)
    let leverage = Math.round(confidence * 8); // 0.5 confidence = 4x leverage

    // Cap at maximum leverage
    leverage = Math.min(leverage, this.config.maxLeverage);

    // Ensure minimum leverage
    leverage = Math.max(leverage, 1);

    // Reduce leverage for large positions
    const positionRatio = positionSize / balance;
    if (positionRatio > 0.1) {
      // More than 10% of balance
      leverage = Math.max(1, Math.round(leverage * 0.7));
    }

    return leverage;
  }

  /**
   * Calculate expected return based on signal and market conditions
   */
  private calculateExpectedReturn(signal: any, marketData: Bar): number {
    const baseReturn = (signal.confidence || 0.5) * 5; // 0.5 confidence = 2.5% expected return
    const volatility =
      Math.abs(marketData.high - marketData.low) / marketData.close;

    // Adjust for market volatility
    const adjustedReturn = baseReturn * (1 + volatility * 2);

    return Math.min(adjustedReturn, 15); // Cap at 15% expected return
  }

  /**
   * Calculate risk score for the trade
   */
  private calculateRiskScore(
    signal: any,
    marketData: Bar,
    leverage: number
  ): number {
    let riskScore = 0;

    // Leverage risk
    riskScore += (leverage - 1) * 0.1;

    // Market volatility risk
    const volatility =
      Math.abs(marketData.high - marketData.low) / marketData.close;
    riskScore += volatility * 2;

    // Signal confidence risk (lower confidence = higher risk)
    riskScore += (1 - (signal.confidence || 0.5)) * 0.3;

    return Math.min(riskScore, 1);
  }

  /**
   * Execute the actual trade
   */
  private async executeTrade(
    orderIntention: OrderIntention,
    aiConfirmation: any
  ): Promise<USDTTradeResult> {
    try {
      this.logger.info(
        `🚀 Executing USDT trade: ${orderIntention.symbol} ${orderIntention.direction} ${orderIntention.quantity} USDT @ ${orderIntention.leverage}x`
      );

      // Create position intent for executor
      const positionIntent = {
        symbol: orderIntention.symbol,
        direction: orderIntention.direction,
        quantity: orderIntention.quantity,
        leverage: orderIntention.leverage,
        orderType: "market" as const,
      };

      // Execute the trade
      const result = await open(this.rest, positionIntent);

      if (result.status === "success") {
        // Track active trade
        this.activeTrades.set(orderIntention.symbol, {
          orderId: result.orderId,
          timestamp: Date.now(),
          intention: orderIntention,
          aiConfirmation,
        });

        this.logger.info(
          `✅ USDT trade executed successfully: ${result.orderId}`
        );

        return {
          success: true,
          orderId: result.orderId,
          symbol: orderIntention.symbol,
          direction: orderIntention.direction,
          quantity: orderIntention.quantity,
          leverage: orderIntention.leverage,
          aiConfirmed: aiConfirmation?.confirmed || false,
          confidence: aiConfirmation?.confidence || 0,
          reasoning: aiConfirmation?.reasoning || "No AI confirmation required",
        };
      } else {
        throw new Error(`Trade execution failed: ${result.status}`);
      }
    } catch (error: any) {
      this.logger.error(`❌ Trade execution failed: ${error.message}`, {
        error,
      });
      return {
        success: false,
        symbol: orderIntention.symbol,
        direction: orderIntention.direction,
        quantity: orderIntention.quantity,
        leverage: orderIntention.leverage,
        aiConfirmed: aiConfirmation?.confirmed || false,
        confidence: aiConfirmation?.confidence || 0,
        reasoning: `Execution failed: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Get current USDT balance
   */
  private async getUSDTBalance(): Promise<number> {
    try {
      const now = Date.now();
      if (now - this.lastBalanceCheck < this.BALANCE_CHECK_INTERVAL) {
        // Return cached balance if recently checked
        return this.cachedUSDTBalance;
      }

      const balance = await getBalance(this.rest);

      const usdtBalance =
        balance.data?.find((item: any) => item.marginCoin === "USDT")
          ?.available || "0";

      this.cachedUSDTBalance = parseFloat(usdtBalance);
      this.lastBalanceCheck = now;

      return this.cachedUSDTBalance;
    } catch (error: any) {
      this.logger.error(`Failed to get USDT balance: ${error.message}`);
      return this.cachedUSDTBalance; // Return cached balance on error
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<USDTTradingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info("🔄 USDT Trading configuration updated", {
      config: this.config,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): USDTTradingConfig {
    return { ...this.config };
  }

  /**
   * Update risk based on trading strategy
   */
  updateRiskStrategy(strategy: "moderate" | "intense" | "risky"): void {
    let riskPercentage: number;

    switch (strategy) {
      case "moderate":
        riskPercentage = 10; // 10% risk
        break;
      case "intense":
        riskPercentage = 20; // 20% risk
        break;
      case "risky":
        riskPercentage = 50; // 50% risk
        break;
      default:
        riskPercentage = 10;
    }

    this.config.riskManagement.maxRiskPerTrade = riskPercentage;

    this.logger.info(
      `🎯 Risk strategy updated to ${strategy}: ${riskPercentage}% max risk per trade`
    );
  }

  /**
   * Get active trades
   */
  getActiveTrades(): Map<string, any> {
    return new Map(this.activeTrades);
  }

  /**
   * Remove completed trade
   */
  removeActiveTrade(symbol: string): void {
    this.activeTrades.delete(symbol);
    this.logger.info(`🗑️ Removed active trade for ${symbol}`);
  }

  /**
   * Get AI confirmation engine
   */
  getAIConfirmationEngine(): AIConfirmationEngine {
    return this.aiConfirmationEngine;
  }

  /**
   * Check if USDT trading is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable/disable USDT trading
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.logger.info(`🔄 USDT trading ${enabled ? "enabled" : "disabled"}`);
  }
}
