/**
 * Advanced Decision Engine - Aggressive Trading with Portfolio Balancing
 * Maximizes daily trades while maintaining risk management
 */

import { Signal, Bar } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { configManager } from "../config/manager.js";

export interface TradingOpportunity {
  symbol: string;
  signal: Signal;
  confidence: number;
  expectedReturn: number;
  riskScore: number;
  priority: number;
  reason: string;
  timeframe: string;
}

export interface PortfolioBalance {
  symbol: string;
  currentWeight: number;
  targetWeight: number;
  deviation: number;
  needsRebalancing: boolean;
  action: "buy" | "sell" | "hold";
  urgency: "low" | "medium" | "high";
}

export interface DecisionMetrics {
  totalTradesToday: number;
  successRate: number;
  avgReturn: number;
  riskUtilization: number;
  portfolioBalance: number;
  opportunitiesIdentified: number;
  tradesExecuted: number;
}

export class AggressiveDecisionEngine {
  private dailyTrades: Map<string, number> = new Map();
  private tradeHistory: any[] = [];
  private portfolioWeights: Map<string, number> = new Map();
  private targetAllocations: Map<string, number> = new Map();
  private lastRebalance = 0;
  private readonly logger = logger.child({ component: "AggressiveDecision" });

  constructor() {
    this.initializePortfolioTargets();
    this.resetDailyCounters();
  }

  /**
   * Initialize target portfolio allocations
   */
  private async initializePortfolioTargets(): Promise<void> {
    try {
      const config = await configManager.getConfig();

      // Default balanced allocation across symbols
      const symbols = config.marketData.symbols;
      const equalWeight = 1.0 / symbols.length;

      // You can customize these weights based on your preferences
      const customWeights = {
        BTCUSDT: 0.3, // 30% BTC (flagship crypto)
        ETHUSDT: 0.25, // 25% ETH (smart contracts leader)
        BNBUSDT: 0.42, // 42% BNB (exchange token)
        MATICUSDT: 0.03, // 3% MATIC (scaling solution)
      };

      for (const symbol of symbols) {
        const weight =
          customWeights[symbol as keyof typeof customWeights] || equalWeight;
        this.targetAllocations.set(symbol, weight);
      }

      this.logger.info("🎯 Portfolio targets initialized", {
        allocations: Object.fromEntries(this.targetAllocations),
      });
    } catch (error) {
      this.logger.error("❌ Failed to initialize portfolio targets:", error);
    }
  }

  /**
   * Reset daily counters at midnight
   */
  private resetDailyCounters(): void {
    const now = new Date();
    const lastReset = new Date(now);
    lastReset.setHours(0, 0, 0, 0);

    if (
      this.dailyTrades.size === 0 ||
      now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000
    ) {
      this.dailyTrades.clear();
      this.logger.info("🔄 Daily trade counters reset");
    }
  }

  /**
   * Aggressive decision making - looks for any profitable opportunity
   */
  async evaluateOpportunity(
    symbol: string,
    signal: Signal,
    marketData: Bar,
    currentEquity: number
  ): Promise<TradingOpportunity | null> {
    try {
      // Reset daily counters if needed
      this.resetDailyCounters();

      // Calculate opportunity metrics
      const confidence = this.calculateAgggressiveConfidence(
        signal,
        marketData
      );
      const expectedReturn = this.calculateExpectedReturn(signal, marketData);
      const riskScore = this.calculateRiskScore(signal, marketData, symbol);
      const priority = this.calculatePriority(
        symbol,
        signal,
        confidence,
        expectedReturn
      );

      // Aggressive threshold - lower than conservative approach
      const minConfidence = 0.35; // Much lower than typical 0.6-0.8
      const minExpectedReturn = 0.5; // 0.5% minimum expected return

      if (confidence >= minConfidence && expectedReturn >= minExpectedReturn) {
        // Check daily trade limits (higher for aggressive strategy)
        const dailyTradesForSymbol = this.dailyTrades.get(symbol) || 0;
        const maxDailyTrades = 15; // Allow up to 15 trades per symbol per day

        if (dailyTradesForSymbol >= maxDailyTrades) {
          this.logger.debug(
            `📊 Daily trade limit reached for ${symbol}: ${dailyTradesForSymbol}/${maxDailyTrades}`
          );
          return null;
        }

        const opportunity: TradingOpportunity = {
          symbol,
          signal,
          confidence,
          expectedReturn,
          riskScore,
          priority,
          reason: this.generateTradeReason(
            signal,
            confidence,
            expectedReturn,
            riskScore
          ),
          timeframe: signal.timeframe || "15m",
        };

        this.logger.info(`🎯 Opportunity identified for ${symbol}:`, {
          confidence: `${(confidence * 100).toFixed(1)}%`,
          expectedReturn: `${expectedReturn.toFixed(2)}%`,
          riskScore: riskScore.toFixed(2),
          priority: priority.toFixed(2),
          reason: opportunity.reason,
        });

        return opportunity;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `❌ Error evaluating opportunity for ${symbol}:`,
        error
      );
      return null;
    }
  }

  /**
   * Calculate aggressive confidence - more lenient scoring
   */
  private calculateAgggressiveConfidence(
    signal: Signal,
    marketData: Bar
  ): number {
    let confidence = signal.confidence || 0.5;

    // Boost confidence for strong price movements
    const priceChange = Math.abs(
      (marketData.close - marketData.open) / marketData.open
    );
    if (priceChange > 0.01) {
      // 1% movement
      confidence += priceChange * 2; // Boost confidence significantly
    }

    // Boost confidence for high volume
    if (marketData.volume > 1000000) {
      confidence += 0.1;
    }

    // Boost confidence during market hours (more activity)
    const hour = new Date().getHours();
    if ((hour >= 8 && hour <= 16) || (hour >= 20 && hour <= 23)) {
      // US/Asian market hours
      confidence += 0.05;
    }

    // Enhanced AI boost if available
    if ("newsImpact" in signal && (signal as any).newsImpact) {
      const newsImpact = (signal as any).newsImpact;
      if (newsImpact.sentiment === "bullish" && signal.direction === "long") {
        confidence += newsImpact.confidence * 0.2;
      } else if (
        newsImpact.sentiment === "bearish" &&
        signal.direction === "short"
      ) {
        confidence += newsImpact.confidence * 0.2;
      }
    }

    return Math.min(0.95, confidence); // Cap at 95%
  }

  /**
   * Calculate expected return with aggressive scaling
   */
  private calculateExpectedReturn(signal: Signal, marketData: Bar): number {
    const baseReturn = (signal.confidence || 0.5) * 2; // Base 0-2%

    // Scale by recent volatility
    const volatility = (marketData.high - marketData.low) / marketData.close;
    const volatilityBoost = volatility * 5; // Higher volatility = higher potential returns

    // Direction-based calculation
    const priceChange = (marketData.close - marketData.open) / marketData.open;
    let directionBoost = 0;

    if (signal.direction === "long" && priceChange > 0) {
      directionBoost = Math.abs(priceChange) * 100; // Convert to percentage
    } else if (signal.direction === "short" && priceChange < 0) {
      directionBoost = Math.abs(priceChange) * 100;
    }

    const expectedReturn = baseReturn + volatilityBoost + directionBoost;

    return Math.min(expectedReturn, 8); // Cap at 8% expected return
  }

  /**
   * Calculate risk score (lower is better)
   */
  private calculateRiskScore(
    signal: Signal,
    marketData: Bar,
    symbol: string
  ): number {
    let riskScore = 1.0; // Base risk

    // Increase risk during low volume periods
    if (marketData.volume < 500000) {
      riskScore += 0.3;
    }

    // Increase risk for very high volatility
    const volatility = (marketData.high - marketData.low) / marketData.close;
    if (volatility > 0.05) {
      // 5% volatility
      riskScore += volatility * 2;
    }

    // Reduce risk for major pairs
    if (["BTCUSDT", "ETHUSDT"].includes(symbol)) {
      riskScore *= 0.8;
    }

    // Increase risk if too many positions in this symbol
    const dailyTrades = this.dailyTrades.get(symbol) || 0;
    if (dailyTrades > 5) {
      riskScore += (dailyTrades - 5) * 0.1;
    }

    return riskScore;
  }

  /**
   * Calculate trade priority
   */
  private calculatePriority(
    symbol: string,
    signal: Signal,
    confidence: number,
    expectedReturn: number
  ): number {
    let priority = confidence * expectedReturn; // Base priority

    // Boost priority for portfolio rebalancing needs
    const currentWeight = this.portfolioWeights.get(symbol) || 0;
    const targetWeight = this.targetAllocations.get(symbol) || 0;
    const deviation = Math.abs(currentWeight - targetWeight);

    if (deviation > 0.05) {
      // 5% deviation
      priority += deviation * 10; // Significantly boost priority
    }

    // Boost priority for less traded symbols today
    const dailyTrades = this.dailyTrades.get(symbol) || 0;
    const avgDailyTrades =
      Array.from(this.dailyTrades.values()).reduce((a, b) => a + b, 0) /
        this.dailyTrades.size || 0;

    if (dailyTrades < avgDailyTrades) {
      priority += 0.5; // Boost undertraded symbols
    }

    return priority;
  }

  /**
   * Generate human-readable trade reason
   */
  private generateTradeReason(
    signal: Signal,
    confidence: number,
    expectedReturn: number,
    riskScore: number
  ): string {
    const reasons: string[] = [];

    if (confidence > 0.7) {
      reasons.push("High confidence signal");
    } else if (confidence > 0.5) {
      reasons.push("Moderate confidence signal");
    } else {
      reasons.push("Speculative opportunity");
    }

    if (expectedReturn > 3) {
      reasons.push("high return potential");
    } else if (expectedReturn > 1.5) {
      reasons.push("moderate return potential");
    } else {
      reasons.push("small profit opportunity");
    }

    if (riskScore < 1.2) {
      reasons.push("low risk");
    } else if (riskScore < 2.0) {
      reasons.push("moderate risk");
    } else {
      reasons.push("higher risk");
    }

    return reasons.join(" + ");
  }

  /**
   * Evaluate portfolio balance and suggest rebalancing trades
   */
  async evaluatePortfolioBalance(
    currentPositions: any[],
    currentEquity: number
  ): Promise<PortfolioBalance[]> {
    try {
      const balances: PortfolioBalance[] = [];

      // Calculate current weights
      this.updateCurrentWeights(currentPositions, currentEquity);

      for (const [symbol, targetWeight] of this.targetAllocations) {
        const currentWeight = this.portfolioWeights.get(symbol) || 0;
        const deviation = currentWeight - targetWeight;
        const absDeviation = Math.abs(deviation);

        let action: "buy" | "sell" | "hold" = "hold";
        let urgency: "low" | "medium" | "high" = "low";

        if (absDeviation > 0.1) {
          // 10% deviation
          action = deviation > 0 ? "sell" : "buy";
          urgency = "high";
        } else if (absDeviation > 0.05) {
          // 5% deviation
          action = deviation > 0 ? "sell" : "buy";
          urgency = "medium";
        } else if (absDeviation > 0.02) {
          // 2% deviation
          action = deviation > 0 ? "sell" : "buy";
          urgency = "low";
        }

        balances.push({
          symbol,
          currentWeight,
          targetWeight,
          deviation,
          needsRebalancing: absDeviation > 0.02,
          action,
          urgency,
        });
      }

      // Check if it's time to rebalance (every 4 hours minimum)
      const now = Date.now();
      if (now - this.lastRebalance > 4 * 60 * 60 * 1000) {
        this.lastRebalance = now;

        const needsRebalancing = balances.filter((b) => b.needsRebalancing);
        if (needsRebalancing.length > 0) {
          this.logger.info("⚖️ Portfolio rebalancing needed:", {
            imbalanced: needsRebalancing.length,
            total: balances.length,
          });
        }
      }

      return balances;
    } catch (error) {
      this.logger.error("❌ Error evaluating portfolio balance:", error);
      return [];
    }
  }

  /**
   * Update current portfolio weights
   */
  private updateCurrentWeights(positions: any[], totalEquity: number): void {
    this.portfolioWeights.clear();

    if (totalEquity <= 0) return;

    for (const position of positions) {
      const symbol = position.symbol;
      const value = Math.abs(position.size * position.markPrice || 0);
      const weight = value / totalEquity;
      this.portfolioWeights.set(symbol, weight);
    }
  }

  /**
   * Record trade execution for statistics
   */
  recordTrade(symbol: string, signal: Signal, executed: boolean): void {
    const dailyCount = this.dailyTrades.get(symbol) || 0;
    this.dailyTrades.set(symbol, dailyCount + 1);

    this.tradeHistory.push({
      timestamp: Date.now(),
      symbol,
      direction: signal.direction,
      confidence: signal.confidence,
      executed,
    });

    // Keep only last 100 trades for memory efficiency
    if (this.tradeHistory.length > 100) {
      this.tradeHistory = this.tradeHistory.slice(-100);
    }

    this.logger.debug(`📊 Trade recorded for ${symbol}:`, {
      dailyCount: this.dailyTrades.get(symbol),
      totalToday: Array.from(this.dailyTrades.values()).reduce(
        (a, b) => a + b,
        0
      ),
    });
  }

  /**
   * Get comprehensive decision metrics
   */
  getDecisionMetrics(): DecisionMetrics {
    const totalTradesToday = Array.from(this.dailyTrades.values()).reduce(
      (a, b) => a + b,
      0
    );
    const recentTrades = this.tradeHistory.filter(
      (t) => Date.now() - t.timestamp < 24 * 60 * 60 * 1000
    );
    const executedTrades = recentTrades.filter((t) => t.executed);

    return {
      totalTradesToday,
      successRate: executedTrades.length / Math.max(recentTrades.length, 1),
      avgReturn: 0, // Would need P&L data to calculate
      riskUtilization: 0.75, // Placeholder - would calculate from actual positions
      portfolioBalance: this.calculatePortfolioBalance(),
      opportunitiesIdentified: recentTrades.length,
      tradesExecuted: executedTrades.length,
    };
  }

  /**
   * Calculate overall portfolio balance score
   */
  private calculatePortfolioBalance(): number {
    let totalDeviation = 0;
    let count = 0;

    for (const [symbol, targetWeight] of this.targetAllocations) {
      const currentWeight = this.portfolioWeights.get(symbol) || 0;
      totalDeviation += Math.abs(currentWeight - targetWeight);
      count++;
    }

    const avgDeviation = totalDeviation / Math.max(count, 1);
    return Math.max(0, 1 - avgDeviation * 10); // Convert to 0-1 score
  }

  /**
   * Get current trading opportunities
   */
  getOpportunities(): TradingOpportunity[] {
    // Return empty array for now - opportunities are generated dynamically
    // This could be enhanced to store and return recent opportunities
    return [];
  }

  /**
   * Generate daily performance report
   */
  generateDailyReport(): string {
    const metrics = this.getDecisionMetrics();

    let report = "📊 AGGRESSIVE DECISION ENGINE - DAILY REPORT\n";
    report += "═══════════════════════════════════════════\n";
    report += `🎯 Total Trades Today: ${metrics.totalTradesToday}\n`;
    report += `✅ Success Rate: ${(metrics.successRate * 100).toFixed(1)}%\n`;
    report += `⚖️ Portfolio Balance: ${(metrics.portfolioBalance * 100).toFixed(
      1
    )}%\n`;
    report += `🔍 Opportunities Found: ${metrics.opportunitiesIdentified}\n`;
    report += `⚡ Trades Executed: ${metrics.tradesExecuted}\n\n`;

    report += "📈 TRADES BY SYMBOL:\n";
    for (const [symbol, count] of this.dailyTrades) {
      report += `  ${symbol}: ${count} trades\n`;
    }

    report += "\n⚖️ PORTFOLIO ALLOCATION:\n";
    for (const [symbol, target] of this.targetAllocations) {
      const current = this.portfolioWeights.get(symbol) || 0;
      const deviation = ((current - target) * 100).toFixed(1);
      report += `  ${symbol}: ${(current * 100).toFixed(1)}% (target: ${(
        target * 100
      ).toFixed(1)}%, deviation: ${deviation}%)\n`;
    }

    return report;
  }
}
