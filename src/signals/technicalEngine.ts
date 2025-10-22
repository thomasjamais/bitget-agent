import { Signal, Bar, Timeframe } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Technical Analysis Engine with RSI, MACD, and Bollinger Bands
 */
export class TechnicalAnalysisEngine {
  private readonly logger = logger.child({ component: 'TechnicalEngine' });
  private priceHistory: Map<string, Bar[]> = new Map();

  constructor(private historyLength: number = 100) {}

  /**
   * Update price history and generate signals
   */
  async analyze(bar: Bar, symbol: string, timeframe: Timeframe): Promise<Signal | null> {
    try {
      // Update price history
      this.updateHistory(symbol, bar);
      
      const history = this.priceHistory.get(symbol) || [];
      if (history.length < 50) return null; // Need enough data
      
      const closes = history.map(b => b.close);
      const highs = history.map(b => b.high);
      const lows = history.map(b => b.low);
      const volumes = history.map(b => b.volume);
      
      // Calculate indicators
      const rsi = this.calculateRSI(closes);
      const macd = this.calculateMACD(closes);
      const bb = this.calculateBollingerBands(closes);
      
      // Generate signals based on different strategies
      const signals = [
        this.rsiMacdReversalSignal(rsi, macd, symbol, timeframe),
        this.bollingerMeanReversionSignal(rsi, bb, closes, symbol, timeframe),
        this.tripleIndicatorTrendSignal(rsi, macd, bb, closes, symbol, timeframe),
        this.bollingerBreakoutSignal(bb, closes, volumes, rsi, symbol, timeframe),
        this.macdMomentumSignal(macd, bb, closes, rsi, symbol, timeframe)
      ].filter(Boolean);
      
      // Return the highest confidence signal
      if (signals.length === 0) return null;
      
      return signals.reduce((best, current) => 
        current!.confidence > best!.confidence ? current : best
      );
      
    } catch (error) {
      this.logger.error(`Error in technical analysis for ${symbol}: ${error}`);
      this.logger.error({ error, symbol }, `🔴 FULL TECHNICAL ANALYSIS ERROR`);
      return null;
    }
  }

  /**
   * Strategy 1: RSI-MACD Reversal
   */
  private rsiMacdReversalSignal(
    rsi: number,
    macd: any,
    symbol: string,
    timeframe: Timeframe
  ): Signal | null {
    let direction: "long" | "short" | null = null;
    let confidence = 0;

    // Long signal: RSI oversold + MACD bullish crossover
    if (rsi < 30 && macd.macdLine > macd.signalLine && macd.histogram > 0) {
      direction = "long";
      confidence = 0.7;
      
      // Boost confidence if RSI is extremely oversold
      if (rsi < 25) confidence += 0.1;
      // Boost if MACD just crossed over
      if (macd.histogram > 0 && macd.prevHistogram <= 0) confidence += 0.1;
    }
    
    // Short signal: RSI overbought + MACD bearish crossover  
    else if (rsi > 70 && macd.macdLine < macd.signalLine && macd.histogram < 0) {
      direction = "short";
      confidence = 0.7;
      
      if (rsi > 75) confidence += 0.1;
      if (macd.histogram < 0 && macd.prevHistogram >= 0) confidence += 0.1;
    }

    if (!direction) return null;

    return {
      at: Date.now(),
      symbol,
      timeframe,
      direction,
      confidence: Math.min(0.95, confidence),
      name: "rsi-macd-reversal",
      metadata: { rsi, macd: macd.macdLine, signal: macd.signalLine, histogram: macd.histogram }
    };
  }

  /**
   * Strategy 2: Bollinger Bands Mean Reversion
   */
  private bollingerMeanReversionSignal(
    rsi: number,
    bb: any,
    closes: number[],
    symbol: string,
    timeframe: Timeframe
  ): Signal | null {
    const currentPrice = closes[closes.length - 1];
    if (!currentPrice || !bb.upper || !bb.lower) return null;
    
    const bbPosition = (currentPrice - bb.lower) / (bb.upper - bb.lower);
    
    let direction: "long" | "short" | null = null;
    let confidence = 0;

    // Long signal: Price at lower BB + RSI confirmation
    if (bbPosition < 0.1 && rsi < 40) {
      direction = "long";
      confidence = 0.65;
      
      // Boost if price is actually below lower band
      if (currentPrice < bb.lower) confidence += 0.1;
      // Boost if RSI is oversold
      if (rsi < 30) confidence += 0.1;
    }
    
    // Short signal: Price at upper BB + RSI confirmation
    else if (bbPosition > 0.9 && rsi > 60) {
      direction = "short"; 
      confidence = 0.65;
      
      if (currentPrice > bb.upper) confidence += 0.1;
      if (rsi > 70) confidence += 0.1;
    }

    if (!direction) return null;

    return {
      at: Date.now(),
      symbol,
      timeframe,
      direction,
      confidence: Math.min(0.95, confidence),
      name: "bb-mean-reversion",
      metadata: { 
        bbPosition, 
        rsi, 
        bbUpper: bb.upper, 
        bbLower: bb.lower, 
        bbMiddle: bb.middle,
        bandwidth: bb.bandwidth
      }
    };
  }

  /**
   * Strategy 3: Triple Indicator Trend Following
   */
  private tripleIndicatorTrendSignal(
    rsi: number,
    macd: any,
    bb: any,
    closes: number[],
    symbol: string,
    timeframe: Timeframe
  ): Signal | null {
    const currentPrice = closes[closes.length - 1];
    if (!currentPrice || !bb.middle || !bb.upper || !bb.lower) return null;
    
    let direction: "long" | "short" | null = null;
    let confidence = 0;

    // Strong bullish alignment
    if (rsi > 60 && macd.macdLine > 0 && currentPrice > bb.middle) {
      direction = "long";
      confidence = 0.75;
      
      // Perfect alignment bonuses
      if (rsi > 65) confidence += 0.05;
      if (macd.histogram > 0) confidence += 0.05;
      if (currentPrice > bb.upper) confidence += 0.05;
    }
    
    // Strong bearish alignment
    else if (rsi < 40 && macd.macdLine < 0 && currentPrice < bb.middle) {
      direction = "short";
      confidence = 0.75;
      
      if (rsi < 35) confidence += 0.05;
      if (macd.histogram < 0) confidence += 0.05;
      if (currentPrice < bb.lower) confidence += 0.05;
    }

    if (!direction) return null;

    return {
      at: Date.now(),
      symbol,
      timeframe,
      direction,
      confidence: Math.min(0.95, confidence),
      name: "triple-trend-follow",
      metadata: { rsi, macd: macd.macdLine, bbPosition: currentPrice / bb.middle }
    };
  }

  /**
   * Strategy 4: Bollinger Bands Breakout
   */
  private bollingerBreakoutSignal(
    bb: any,
    closes: number[],
    volumes: number[],
    rsi: number,
    symbol: string,
    timeframe: Timeframe
  ): Signal | null {
    const currentPrice = closes[closes.length - 1];
    const prevPrice = closes[closes.length - 2];
    const currentVolume = volumes[volumes.length - 1];
    if (!currentPrice || !prevPrice || !currentVolume) return null;
    
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b) / 20;
    
    // Check for BB squeeze (low volatility)
    const isSqueezed = bb.bandwidth < 0.02; // 2% bandwidth
    const volumeSpike = currentVolume > avgVolume * 1.5;
    
    let direction: "long" | "short" | null = null;
    let confidence = 0;

    // Bullish breakout
    if (currentPrice > bb.upper && prevPrice <= bb.upper && volumeSpike && rsi > 55) {
      direction = "long";
      confidence = 0.8;
      
      if (isSqueezed) confidence += 0.1; // Breakout from squeeze
      if (rsi > 60) confidence += 0.05;
    }
    
    // Bearish breakdown
    else if (currentPrice < bb.lower && prevPrice >= bb.lower && volumeSpike && rsi < 45) {
      direction = "short";
      confidence = 0.8;
      
      if (isSqueezed) confidence += 0.1;
      if (rsi < 40) confidence += 0.05;
    }

    if (!direction) return null;

    return {
      at: Date.now(),
      symbol,
      timeframe, 
      direction,
      confidence: Math.min(0.95, confidence),
      name: "bb-breakout",
      metadata: { 
        bandwidth: bb.bandwidth, 
        volumeRatio: currentVolume / avgVolume, 
        rsi,
        squeezed: isSqueezed
      }
    };
  }

  /**
   * Strategy 5: MACD Momentum
   */
  private macdMomentumSignal(
    macd: any,
    bb: any,
    closes: number[],
    rsi: number,
    symbol: string,
    timeframe: Timeframe
  ): Signal | null {
    const currentPrice = closes[closes.length - 1];
    if (!currentPrice || !bb.upper || !bb.lower) return null;
    
    const bbPosition = (currentPrice - bb.lower) / (bb.upper - bb.lower);
    
    // Only trade when price is in middle 60% of BB range
    if (bbPosition < 0.2 || bbPosition > 0.8) return null;
    
    let direction: "long" | "short" | null = null;
    let confidence = 0;

    // Bullish momentum
    if (macd.histogram > 0 && macd.histogram > macd.prevHistogram && rsi > 45) {
      direction = "long";
      confidence = 0.7;
      
      if (macd.macdLine > macd.signalLine) confidence += 0.05;
      if (rsi > 50 && rsi < 70) confidence += 0.05; // Sweet spot
    }
    
    // Bearish momentum
    else if (macd.histogram < 0 && macd.histogram < macd.prevHistogram && rsi < 55) {
      direction = "short";
      confidence = 0.7;
      
      if (macd.macdLine < macd.signalLine) confidence += 0.05;
      if (rsi < 50 && rsi > 30) confidence += 0.05;
    }

    if (!direction) return null;

    return {
      at: Date.now(),
      symbol,
      timeframe,
      direction,
      confidence: Math.min(0.95, confidence),
      name: "macd-momentum",
      metadata: { 
        histogram: macd.histogram, 
        bbPosition, 
        rsi,
        momentum: macd.histogram - macd.prevHistogram
      }
    };
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length < period + 1) return 50; // Neutral if not enough data
    
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < closes.length; i++) {
      const current = closes[i];
      const previous = closes[i - 1];
      if (current === undefined || previous === undefined) continue;
      
      const change = current - previous;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(closes: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): any {
    if (closes.length < slowPeriod) {
      return { macdLine: 0, signalLine: 0, histogram: 0, prevHistogram: 0 };
    }
    
    const emaFast = this.calculateEMA(closes, fastPeriod);
    const emaSlow = this.calculateEMA(closes, slowPeriod);
    
    const macdLine = emaFast - emaSlow;
    
    // For signal line, we'd need to calculate EMA of MACD line
    // Simplified version - using SMA for now
    const recentMacd = closes.slice(-signalPeriod).map((_, i) => {
      const idx = closes.length - signalPeriod + i;
      if (idx < 0) return 0;
      const fast = this.calculateEMA(closes.slice(0, idx + 1), fastPeriod);
      const slow = this.calculateEMA(closes.slice(0, idx + 1), slowPeriod);
      return fast - slow;
    });
    
    const signalLine = recentMacd.reduce((a, b) => a + b) / recentMacd.length;
    const histogram = macdLine - signalLine;
    
    // Calculate previous histogram for momentum
    const prevMacdLine = closes.length > 1 ? 
      this.calculateEMA(closes.slice(0, -1), fastPeriod) - this.calculateEMA(closes.slice(0, -1), slowPeriod) : 0;
    const prevHistogram = prevMacdLine - signalLine;
    
    return { macdLine, signalLine, histogram, prevHistogram };
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(closes: number[], period = 20, stdDev = 2.0): any {
    if (closes.length < period) {
      const price = closes[closes.length - 1] || 0;
      return { upper: price * 1.02, middle: price, lower: price * 0.98, bandwidth: 0.04 };
    }
    
    const recentPrices = closes.slice(-period);
    const sma = recentPrices.reduce((a, b) => a + b) / period;
    
    const variance = recentPrices.reduce((sum, price) => 
      sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    const upper = sma + (standardDeviation * stdDev);
    const lower = sma - (standardDeviation * stdDev);
    const bandwidth = (standardDeviation * stdDev * 2) / sma;
    
    return { upper, middle: sma, lower, bandwidth };
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(values: number[], period: number): number {
    if (values.length === 0) return 0;
    const lastValue = values[values.length - 1];
    if (values.length < period) return lastValue || 0;
    
    const multiplier = 2 / (period + 1);
    let ema = values.slice(0, period).reduce((a, b) => a + b) / period;
    
    for (let i = period; i < values.length; i++) {
      const value = values[i];
      if (value !== undefined) {
        ema = (value * multiplier) + (ema * (1 - multiplier));
      }
    }
    
    return ema;
  }

  /**
   * Update price history for a symbol
   */
  private updateHistory(symbol: string, bar: Bar): void {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol)!;
    history.push(bar);
    
    // Keep only recent history
    if (history.length > this.historyLength) {
      history.shift();
    }
  }

  /**
   * Get current indicators for a symbol (for debugging)
   */
  getIndicators(symbol: string): any {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < 50) return null;
    
    const closes = history.map(b => b.close);
    
    return {
      rsi: this.calculateRSI(closes),
      macd: this.calculateMACD(closes),
      bb: this.calculateBollingerBands(closes),
      dataPoints: closes.length
    };
  }
}