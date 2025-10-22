/**
 * Portfolio Balancer - Automatic crypto portfolio rebalancing
 * Maintains target allocations across multiple cryptocurrencies
 */

import { logger } from '../utils/logger.js';
import { configManager } from '../config/manager.js';

export interface PortfolioConfig {
  symbols: string[];
  targetAllocations: Record<string, number>;
  rebalanceThreshold: number;
  minTradeAmount: number;
  maxTradeAmount: number;
  rebalanceInterval: number; // hours
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  markPrice: number;
  unrealizedPnl: number;
  percentage: number;
  valueUSDT: number;
}

export interface RebalanceAction {
  symbol: string;
  action: 'buy' | 'sell';
  targetQuantity: number;
  currentQuantity: number;
  amountUSDT: number;
  priority: number;
  reason: string;
}

export class PortfolioBalancer {
  private config: PortfolioConfig;
  private lastRebalance = 0;
  private positions: Map<string, PortfolioPosition> = new Map();
  private readonly logger = logger.child({ component: 'PortfolioBalancer' });

  constructor() {
    this.config = {
      symbols: [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT',
        'ADAUSDT', 'AVAXUSDT', 'MATICUSDT', 'DOTUSDT'
      ],
      targetAllocations: {
        'BTCUSDT': 0.30,    // 30% - King of crypto
        'ETHUSDT': 0.25,    // 25% - Smart contracts leader  
        'BNBUSDT': 0.15,    // 15% - Exchange ecosystem
        'SOLUSDT': 0.10,    // 10% - High performance blockchain
        'ADAUSDT': 0.08,    // 8% - Academic approach
        'AVAXUSDT': 0.07,   // 7% - Avalanche ecosystem
        'MATICUSDT': 0.03,  // 3% - Polygon scaling
        'DOTUSDT': 0.02     // 2% - Polkadot interoperability
      },
      rebalanceThreshold: 0.05, // 5% deviation triggers rebalance
      minTradeAmount: 10,       // Minimum $10 USDT trade
      maxTradeAmount: 1000,     // Maximum $1000 USDT per rebalance trade
      rebalanceInterval: 6      // Rebalance every 6 hours max
    };
  }

  /**
   * Load portfolio configuration from config file
   */
  async loadConfig(): Promise<void> {
    try {
      const botConfig = await configManager.getConfig();
      
      // Override with config file settings if available
      if ((botConfig as any).portfolio) {
        this.config = { ...this.config, ...(botConfig as any).portfolio };
      }

      this.logger.info('📊 Portfolio balancer configured:', {
        symbols: this.config.symbols.length,
        rebalanceThreshold: `${(this.config.rebalanceThreshold * 100).toFixed(1)}%`,
        interval: `${this.config.rebalanceInterval}h`
      });

    } catch (error) {
      this.logger.error('❌ Failed to load portfolio config:', error);
    }
  }

  /**
   * Update current portfolio positions
   */
  updatePositions(positions: any[], currentPrices: Map<string, number>): void {
    this.positions.clear();

    let totalValue = 0;

    // Calculate total portfolio value first
    for (const pos of positions) {
      const price = currentPrices.get(pos.symbol) || pos.markPrice || 0;
      const value = Math.abs(pos.size) * price;
      totalValue += value;
    }

    // Calculate percentages
    for (const pos of positions) {
      const price = currentPrices.get(pos.symbol) || pos.markPrice || 0;
      const valueUSDT = Math.abs(pos.size) * price;
      const percentage = totalValue > 0 ? valueUSDT / totalValue : 0;

      this.positions.set(pos.symbol, {
        symbol: pos.symbol,
        quantity: Math.abs(pos.size),
        markPrice: price,
        unrealizedPnl: pos.unrealizedPnl || 0,
        percentage,
        valueUSDT
      });
    }

    this.logger.debug('📊 Portfolio positions updated:', {
      totalValue: `$${totalValue.toFixed(2)}`,
      positions: this.positions.size
    });
  }

  /**
   * Check if rebalancing is needed and generate actions
   */
  async evaluateRebalancing(totalEquityUSDT: number): Promise<RebalanceAction[]> {
    try {
      const now = Date.now();
      const hoursSinceLastRebalance = (now - this.lastRebalance) / (1000 * 60 * 60);

      // Don't rebalance too frequently
      if (hoursSinceLastRebalance < this.config.rebalanceInterval) {
        return [];
      }

      const actions: RebalanceAction[] = [];
      let needsRebalancing = false;

      // Analyze each symbol
      for (const symbol of this.config.symbols) {
        const targetAllocation = this.config.targetAllocations[symbol] || 0;
        const currentPosition = this.positions.get(symbol);
        const currentAllocation = currentPosition?.percentage || 0;
        
        const deviation = Math.abs(currentAllocation - targetAllocation);
        
        if (deviation > this.config.rebalanceThreshold) {
          needsRebalancing = true;
          
          const targetValueUSDT = totalEquityUSDT * targetAllocation;
          const currentValueUSDT = currentPosition?.valueUSDT || 0;
          const differenceUSDT = targetValueUSDT - currentValueUSDT;
          
          const action: RebalanceAction = {
            symbol,
            action: differenceUSDT > 0 ? 'buy' : 'sell',
            targetQuantity: 0, // Will be calculated later with current price
            currentQuantity: currentPosition?.quantity || 0,
            amountUSDT: Math.abs(differenceUSDT),
            priority: deviation / this.config.rebalanceThreshold, // Higher deviation = higher priority
            reason: `${(deviation * 100).toFixed(1)}% deviation from target (${(targetAllocation * 100).toFixed(1)}%)`
          };

          // Only include if trade amount is meaningful
          if (action.amountUSDT >= this.config.minTradeAmount) {
            // Cap trade amount to maximum
            action.amountUSDT = Math.min(action.amountUSDT, this.config.maxTradeAmount);
            actions.push(action);
          }
        }
      }

      if (needsRebalancing) {
        this.lastRebalance = now;
        
        // Sort by priority (highest deviation first)
        actions.sort((a, b) => b.priority - a.priority);

        this.logger.info(`⚖️ Portfolio rebalancing needed:`, {
          actions: actions.length,
          totalValue: `$${totalEquityUSDT.toFixed(2)}`,
          hoursSinceLast: hoursSinceLastRebalance.toFixed(1)
        });

        // Log each action
        actions.forEach(action => {
          this.logger.info(`  ${action.action.toUpperCase()} ${action.symbol}: $${action.amountUSDT.toFixed(2)} (${action.reason})`);
        });
      }

      return actions;

    } catch (error) {
      this.logger.error('❌ Error evaluating rebalancing:', error);
      return [];
    }
  }

  /**
   * Calculate optimal trade sizes for rebalancing
   */
  calculateTradeSizes(actions: RebalanceAction[], currentPrices: Map<string, number>): RebalanceAction[] {
    return actions.map(action => {
      const price = currentPrices.get(action.symbol) || 1;
      
      if (action.action === 'buy') {
        action.targetQuantity = action.currentQuantity + (action.amountUSDT / price);
      } else {
        action.targetQuantity = Math.max(0, action.currentQuantity - (action.amountUSDT / price));
      }

      return action;
    });
  }

  /**
   * Get portfolio allocation report
   */
  getPortfolioReport(): string {
    let report = '📊 PORTFOLIO ALLOCATION REPORT\n';
    report += '═══════════════════════════════════════\n';

    let totalValue = 0;
    for (const position of this.positions.values()) {
      totalValue += position.valueUSDT;
    }

    report += `💰 Total Portfolio Value: $${totalValue.toFixed(2)} USDT\n\n`;

    for (const symbol of this.config.symbols) {
      const target = this.config.targetAllocations[symbol] || 0;
      const position = this.positions.get(symbol);
      const current = position?.percentage || 0;
      const deviation = current - target;
      const status = Math.abs(deviation) > this.config.rebalanceThreshold ? 
        (deviation > 0 ? '🔴 OVERWEIGHT' : '🟡 UNDERWEIGHT') : '🟢 BALANCED';

      report += `${symbol}:\n`;
      report += `  Current: ${(current * 100).toFixed(1)}% | Target: ${(target * 100).toFixed(1)}% | ${status}\n`;
      report += `  Value: $${(position?.valueUSDT || 0).toFixed(2)} | Deviation: ${(deviation * 100).toFixed(1)}%\n\n`;
    }

    return report;
  }

  /**
   * Get rebalancing recommendations
   */
  getRebalancingRecommendations(totalEquityUSDT: number): string {
    let report = '⚖️ REBALANCING RECOMMENDATIONS\n';
    report += '═══════════════════════════════════════\n';

    const imbalanced = [];
    
    for (const symbol of this.config.symbols) {
      const target = this.config.targetAllocations[symbol] || 0;
      const position = this.positions.get(symbol);
      const current = position?.percentage || 0;
      const deviation = Math.abs(current - target);
      
      if (deviation > this.config.rebalanceThreshold) {
        const targetValue = totalEquityUSDT * target;
        const currentValue = position?.valueUSDT || 0;
        const difference = targetValue - currentValue;
        
        imbalanced.push({
          symbol,
          deviation,
          action: difference > 0 ? 'BUY' : 'SELL',
          amount: Math.abs(difference)
        });
      }
    }

    if (imbalanced.length === 0) {
      report += '✅ Portfolio is well balanced - no rebalancing needed\n';
    } else {
      report += `🎯 ${imbalanced.length} positions need rebalancing:\n\n`;
      
      imbalanced
        .sort((a, b) => b.deviation - a.deviation)
        .forEach(item => {
          report += `${item.action} ${item.symbol}: $${item.amount.toFixed(2)}\n`;
          report += `  Deviation: ${(item.deviation * 100).toFixed(1)}% from target\n\n`;
        });
    }

    const nextRebalance = this.lastRebalance + (this.config.rebalanceInterval * 60 * 60 * 1000);
    const hoursUntilNext = Math.max(0, (nextRebalance - Date.now()) / (1000 * 60 * 60));
    
    report += `⏰ Next rebalancing window: ${hoursUntilNext.toFixed(1)} hours\n`;

    return report;
  }

  /**
   * Update target allocations
   */
  updateTargetAllocations(newAllocations: Record<string, number>): void {
    // Validate allocations sum to 1.0
    const total = Object.values(newAllocations).reduce((sum, weight) => sum + weight, 0);
    
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error(`Target allocations must sum to 1.0, got ${total.toFixed(3)}`);
    }

    this.config.targetAllocations = { ...newAllocations };
    this.logger.info('🎯 Target allocations updated:', newAllocations);
  }

  /**
   * Get current configuration
   */
  getConfig(): PortfolioConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PortfolioConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('⚙️ Portfolio balancer config updated');
  }
}