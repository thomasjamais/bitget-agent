import { PositionIntent } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Calculate position size based on risk percentage
 */
export const sizeByRisk = (
  equity: number,
  maxRiskPct: number,
  price: number,
  leverage: number,
  stopLossPercent?: number
): number => {
  try {
    // If stop loss is defined, calculate size based on stop distance
    if (stopLossPercent && stopLossPercent > 0) {
      const riskAmount = equity * (maxRiskPct / 100);
      const stopDistance = price * (stopLossPercent / 100);
      const maxNotional = riskAmount / stopDistance * price;
      const quantity = (maxNotional / price) * leverage;
      return Math.max(0, Number(quantity.toFixed(6)));
    }
    
    // Standard calculation: max notional based on risk and leverage
    const maxNotional = equity * (maxRiskPct / 100) * leverage;
    const quantity = maxNotional / price;
    
    return Math.max(0, Number(quantity.toFixed(6)));
  } catch (error) {
    logger.error(`Error calculating position size: ${error}`);
    return 0;
  }
};

/**
 * Calculate position size using volatility-based method
 */
export const sizeByVolatility = (
  equity: number,
  maxRiskPct: number,
  price: number,
  leverage: number,
  atr: number, // Average True Range
  atrMultiplier: number = 2.0
): number => {
  try {
    const riskAmount = equity * (maxRiskPct / 100);
    const volatilityStop = atr * atrMultiplier;
    const maxNotional = riskAmount / volatilityStop * price;
    const quantity = (maxNotional / price) * leverage;
    
    return Math.max(0, Number(quantity.toFixed(6)));
  } catch (error) {
    logger.error(`Error calculating volatility-based position size: ${error}`);
    return 0;
  }
};

/**
 * Throttle position intents by maximum positions per symbol
 */
export const throttleByOpenPositions = (
  intents: PositionIntent[],
  maxPerSymbol: number
): PositionIntent[] => {
  const symbolCount = new Map<string, number>();
  
  return intents.filter(intent => {
    const currentCount = symbolCount.get(intent.symbol) || 0;
    
    if (currentCount >= maxPerSymbol) {
      logger.debug(`Throttling ${intent.symbol}: max positions (${maxPerSymbol}) reached`);
      return false;
    }
    
    symbolCount.set(intent.symbol, currentCount + 1);
    return true;
  });
};

/**
 * Risk management class for comprehensive position and portfolio risk
 */
export class RiskManager {
  private consecutiveLosses = 0;
  private dailyPnL = 0;
  private lastResetDate = new Date().toDateString();
  private readonly logger = logger.child({ component: 'RiskManager' });

  constructor(
    private maxEquityRisk: number,
    private maxDailyLoss: number,
    private maxConsecutiveLosses: number
  ) {}

  /**
   * Check if new position passes risk checks
   */
  checkPositionRisk(
    intent: PositionIntent,
    currentEquity: number,
    currentPositions: PositionIntent[]
  ): { allowed: boolean; reason?: string } {
    // Check daily loss limit
    const currentDate = new Date().toDateString();
    if (currentDate !== this.lastResetDate) {
      this.resetDaily();
    }

    if (this.dailyPnL <= -this.maxDailyLoss) {
      return { 
        allowed: false, 
        reason: `Daily loss limit exceeded: ${this.dailyPnL.toFixed(2)}%` 
      };
    }

    // Check consecutive losses
    if (this.consecutiveLosses >= this.maxConsecutiveLosses) {
      return {
        allowed: false,
        reason: `Max consecutive losses reached: ${this.consecutiveLosses}`
      };
    }

    // Check total risk exposure
    const currentRisk = this.calculateTotalRisk(currentPositions, currentEquity);
    const newPositionRisk = this.calculatePositionRisk(intent, currentEquity);
    
    if (currentRisk + newPositionRisk > this.maxEquityRisk) {
      return {
        allowed: false,
        reason: `Total risk would exceed limit: ${(currentRisk + newPositionRisk).toFixed(2)}%`
      };
    }

    return { allowed: true };
  }

  /**
   * Update risk metrics after a trade
   */
  updateAfterTrade(pnlPercent: number): void {
    this.dailyPnL += pnlPercent;
    
    if (pnlPercent < 0) {
      this.consecutiveLosses++;
      this.logger.warn(`Trade loss: ${pnlPercent.toFixed(2)}%, consecutive losses: ${this.consecutiveLosses}`);
    } else {
      this.consecutiveLosses = 0;
      this.logger.info(`Trade profit: ${pnlPercent.toFixed(2)}%, consecutive losses reset`);
    }
    
    this.logger.info(`Daily PnL: ${this.dailyPnL.toFixed(2)}%`);
  }

  /**
   * Calculate total portfolio risk
   */
  private calculateTotalRisk(positions: PositionIntent[], equity: number): number {
    return positions.reduce((total, pos) => {
      return total + this.calculatePositionRisk(pos, equity);
    }, 0);
  }

  /**
   * Calculate risk for a single position
   */
  private calculatePositionRisk(intent: PositionIntent, equity: number): number {
    const notional = intent.quantity * (intent.price || 1);
    const leveragedNotional = notional * intent.leverage;
    
    // Use stop loss if defined, otherwise assume 100% risk
    const stopLossRisk = intent.stopLoss 
      ? Math.abs(intent.price! - intent.stopLoss) / intent.price!
      : 1.0;
    
    const riskAmount = leveragedNotional * stopLossRisk;
    return (riskAmount / equity) * 100;
  }

  /**
   * Reset daily metrics
   */
  private resetDaily(): void {
    this.dailyPnL = 0;
    this.lastResetDate = new Date().toDateString();
    this.logger.info('Daily risk metrics reset');
  }

  /**
   * Get current risk status
   */
  getRiskStatus() {
    return {
      consecutiveLosses: this.consecutiveLosses,
      dailyPnL: this.dailyPnL,
      maxDailyLoss: this.maxDailyLoss,
      maxConsecutiveLosses: this.maxConsecutiveLosses,
      maxEquityRisk: this.maxEquityRisk,
      lastResetDate: this.lastResetDate,
      riskLimitReached: this.dailyPnL <= -this.maxDailyLoss || 
                      this.consecutiveLosses >= this.maxConsecutiveLosses
    };
  }

  /**
   * Force reset risk counters (emergency use)
   */
  forceReset(): void {
    this.consecutiveLosses = 0;
    this.resetDaily();
    this.logger.warn('Risk manager forcefully reset');
  }
}