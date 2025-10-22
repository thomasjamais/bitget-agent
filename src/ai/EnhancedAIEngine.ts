/**
 * Enhanced AI Engine with Geopolitical Intelligence
 * Combines technical analysis with news sentiment and geopolitical events
 */

import { AIEngine } from '../signals/aiEngine.js';
import { NewsIntelligenceEngine, NewsAnalysis } from '../intelligence/NewsIntelligenceEngine.js';
import { Bar, Signal, Timeframe } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface EnhancedSignal extends Signal {
  newsImpact: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    adjustment: number;
  };
  geopoliticalFactors: string[];
  combinedConfidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  technicalScore: number;
  newsScore: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  ema: {
    fast: number;
    slow: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  volume: {
    current: number;
    average: number;
    ratio: number;
  };
}

export class EnhancedAIEngine extends AIEngine {
  private newsEngine: NewsIntelligenceEngine;
  private technicalCache: Map<string, TechnicalIndicators> = new Map();

  constructor() {
    super();
    this.newsEngine = new NewsIntelligenceEngine();
  }

  /**
   * Initialize enhanced AI engine with news intelligence
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🧠 Initializing Enhanced AI Engine...');
      logger.info('📊 ENHANCED AI CONFIG:', { newsEngine: !!this.newsEngine });

      // Load base AI engine
      await super.load();

      // Initialize news intelligence engine
      await this.newsEngine.initialize();

      logger.info('✅ Enhanced AI Engine initialized successfully');
      logger.info('📊 ENHANCED AI FINAL STATE:', { newsEngineReady: !!this.newsEngine });

    } catch (error) {
      logger.error('❌ Failed to initialize Enhanced AI Engine:', error);
      throw error;
    }
  }

  /**
   * Generate enhanced signal combining technical and geopolitical analysis
   */
  generateEnhanced(bar: Bar, symbol: string, timeframe: string): EnhancedSignal | null {
    try {
      // Get base technical signal
      const technicalSignal = super.generate(bar, symbol, timeframe as Timeframe);

      // Calculate technical indicators
      const indicators = this.calculateTechnicalIndicators(bar, symbol);

      // Check if technical signal is valid
      if (!technicalSignal) {
        return null;
      }

      // Get news analysis
      const newsAnalysis = this.newsEngine.getLatestAnalysis(symbol.replace('USDT', ''));

      // Generate enhanced signal
      const enhancedSignal = this.combineSignals(technicalSignal, indicators, newsAnalysis, symbol);

      logger.debug(`🔮 Enhanced signal for ${symbol}:`, {
        technical: technicalSignal?.confidence || 0,
        news: enhancedSignal.newsImpact.confidence,
        combined: enhancedSignal.combinedConfidence,
        direction: enhancedSignal.direction
      });

      return enhancedSignal;

    } catch (error) {
      logger.error(`❌ Failed to generate enhanced signal for ${symbol}:`, error);
      
      // Fallback to technical signal
      const fallbackSignal = super.generate(bar, symbol, timeframe as Timeframe);
      if (!fallbackSignal) {
        return null;
      }
      return {
        ...fallbackSignal,
        newsImpact: {
          sentiment: 'neutral' as const,
          confidence: 0,
          adjustment: 1.0
        },
        geopoliticalFactors: [],
        combinedConfidence: fallbackSignal.confidence * 0.8,
        riskLevel: 'medium' as const,
        technicalScore: 0.5,
        newsScore: 0
      };
    }
  }

  /**
   * Calculate comprehensive technical indicators
   */
  private calculateTechnicalIndicators(bar: Bar, symbol: string): TechnicalIndicators {
    // Simple implementation - in production, you'd want more sophisticated calculation
    const rsi = this.calculateRSI(bar);
    const ema = this.calculateEMA(bar);
    const bollinger = this.calculateBollingerBands(bar);
    
    const indicators: TechnicalIndicators = {
      rsi,
      macd: {
        line: ema.fast - ema.slow,
        signal: (ema.fast - ema.slow) * 0.9, // Simplified
        histogram: (ema.fast - ema.slow) * 0.1
      },
      ema,
      bollingerBands: bollinger,
      volume: {
        current: bar.volume,
        average: bar.volume * 0.8, // Simplified
        ratio: 1.25 // Simplified
      }
    };

    this.technicalCache.set(symbol, indicators);
    return indicators;
  }

  /**
   * Simple RSI calculation
   */
  private calculateRSI(bar: Bar): number {
    // Simplified RSI based on price position
    const priceChange = ((bar.close - bar.open) / bar.open) * 100;
    
    if (priceChange > 2) return 75; // Overbought
    if (priceChange < -2) return 25; // Oversold
    if (priceChange > 0) return 55 + priceChange * 10;
    return 45 + priceChange * 10;
  }

  /**
   * Simple EMA calculation
   */
  private calculateEMA(bar: Bar): { fast: number; slow: number } {
    const price = (bar.high + bar.low + bar.close) / 3;
    return {
      fast: price * 1.02, // Simplified fast EMA
      slow: price * 0.98  // Simplified slow EMA
    };
  }

  /**
   * Simple Bollinger Bands calculation
   */
  private calculateBollingerBands(bar: Bar): { upper: number; middle: number; lower: number } {
    const middle = (bar.high + bar.low + bar.close) / 3;
    const volatility = (bar.high - bar.low) / bar.close;
    
    return {
      upper: middle * (1 + volatility * 2),
      middle: middle,
      lower: middle * (1 - volatility * 2)
    };
  }

  /**
   * Combine technical and news signals
   */
  private combineSignals(
    technicalSignal: Signal,
    indicators: TechnicalIndicators,
    newsAnalysis: NewsAnalysis | null,
    symbol: string
  ): EnhancedSignal {
    
    // News impact analysis
    const newsImpact = {
      sentiment: newsAnalysis?.overallSentiment || 'neutral' as const,
      confidence: newsAnalysis?.confidence || 0,
      adjustment: this.newsEngine.getNewsSignalAdjustment(symbol.replace('USDT', ''))
    };

    // Technical score (0-1)
    const technicalScore = this.calculateTechnicalScore(indicators);

    // News score (-1 to 1)
    const newsScore = this.calculateNewsScore(newsAnalysis);

    // Combined direction
    const combinedDirection = this.determineCombinedDirection(
      technicalSignal.direction,
      technicalScore,
      newsScore,
      newsImpact.sentiment
    );

    // Combined confidence
    const combinedConfidence = this.calculateCombinedConfidence(
      technicalSignal.confidence,
      technicalScore,
      newsImpact.confidence,
      newsScore
    );

    // Risk assessment
    const riskLevel = this.assessRiskLevel(indicators, newsAnalysis);

    // Geopolitical factors
    const geopoliticalFactors = newsAnalysis?.recommendations.slice(0, 3) || [];

    return {
      ...technicalSignal,
      direction: combinedDirection,
      confidence: combinedConfidence,
      newsImpact,
      geopoliticalFactors,
      combinedConfidence,
      riskLevel,
      technicalScore,
      newsScore
    };
  }

  /**
   * Calculate technical analysis score
   */
  private calculateTechnicalScore(indicators: TechnicalIndicators): number {
    let score = 0.5; // Neutral baseline

    // RSI analysis
    if (indicators.rsi < 30) score += 0.3; // Oversold (bullish)
    else if (indicators.rsi > 70) score -= 0.3; // Overbought (bearish)

    // MACD analysis
    if (indicators.macd.line > indicators.macd.signal) score += 0.2;
    else score -= 0.2;

    // EMA analysis
    if (indicators.ema.fast > indicators.ema.slow) score += 0.2;
    else score -= 0.2;

    // Volume analysis
    if (indicators.volume.ratio > 1.5) score += 0.1; // High volume
    else if (indicators.volume.ratio < 0.8) score -= 0.1; // Low volume

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate news sentiment score
   */
  private calculateNewsScore(newsAnalysis: NewsAnalysis | null): number {
    if (!newsAnalysis || newsAnalysis.confidence < 0.3) return 0;

    const sentimentScore = newsAnalysis.overallSentiment === 'bullish' ? 1 :
                          newsAnalysis.overallSentiment === 'bearish' ? -1 : 0;

    const impactScore = (newsAnalysis.marketImpact.shortTerm + newsAnalysis.marketImpact.mediumTerm) / 2;

    return sentimentScore * newsAnalysis.confidence * (0.5 + Math.abs(impactScore) * 0.5);
  }

  /**
   * Determine combined trading direction
   */
  private determineCombinedDirection(
    technicalDirection: 'long' | 'short',
    technicalScore: number,
    newsScore: number,
    newsSentiment: 'bullish' | 'bearish' | 'neutral'
  ): 'long' | 'short' {
    
    // Strong news sentiment can override technical
    if (Math.abs(newsScore) > 0.7) {
      return newsScore > 0 ? 'long' : 'short';
    }

    // Strong technical signal with supportive news
    if (technicalScore > 0.7 && newsScore >= 0) return 'long';
    if (technicalScore < 0.3 && newsScore <= 0) return 'short';

    // Conflicting signals - favor technical
    return technicalDirection;
  }

  /**
   * Calculate combined confidence score
   */
  private calculateCombinedConfidence(
    technicalConfidence: number,
    technicalScore: number,
    newsConfidence: number,
    newsScore: number
  ): number {
    
    // Weight technical and news confidence
    const techWeight = 0.7;
    const newsWeight = 0.3;

    // Bonus for aligned signals
    const alignmentBonus = Math.abs(newsScore) > 0.1 && 
                          ((technicalScore > 0.5 && newsScore > 0) || 
                           (technicalScore < 0.5 && newsScore < 0)) ? 0.1 : 0;

    const combined = (technicalConfidence * techWeight) + 
                    (newsConfidence * newsWeight) + 
                    alignmentBonus;

    return Math.max(0, Math.min(1, combined));
  }

  /**
   * Assess overall risk level
   */
  private assessRiskLevel(
    indicators: TechnicalIndicators, 
    newsAnalysis: NewsAnalysis | null
  ): 'low' | 'medium' | 'high' {
    
    let riskScore = 0;

    // Technical risk factors
    if (indicators.rsi > 80 || indicators.rsi < 20) riskScore += 1; // Extreme levels
    if (indicators.volume.ratio > 2.0) riskScore += 1; // Unusual volume
    if (Math.abs(indicators.macd.histogram) > 0.5) riskScore += 1; // Strong momentum

    // News risk factors
    if (newsAnalysis) {
      if (newsAnalysis.confidence > 0.8) riskScore += 1; // High certainty events
      if (Math.abs(newsAnalysis.marketImpact.shortTerm) > 0.7) riskScore += 1; // High impact
    }

    if (riskScore >= 3) return 'high';
    if (riskScore >= 1) return 'medium';
    return 'low';
  }

  /**
   * Generate intelligence-enhanced market report
   */
  async generateIntelligenceReport(symbols: string[]): Promise<string> {
    try {
      const newsReport = await this.newsEngine.generateIntelligenceReport(
        symbols.map(s => s.replace('USDT', ''))
      );

      let report = newsReport + '\n';
      report += '🔧 TECHNICAL + NEWS FUSION SIGNALS\n';
      report += '═══════════════════════════════════\n';

      for (const symbol of symbols) {
        const indicators = this.technicalCache.get(symbol);
        if (indicators) {
          report += `📊 ${symbol}:\n`;
          report += `   RSI: ${indicators.rsi.toFixed(1)} | MACD: ${indicators.macd.histogram.toFixed(3)}\n`;
          report += `   EMA: ${(indicators.ema.fast/indicators.ema.slow).toFixed(3)} | VOL: ${indicators.volume.ratio.toFixed(2)}x\n\n`;
        }
      }

      return report;

    } catch (error) {
      logger.error('❌ Failed to generate intelligence report:', error);
      return '❌ Intelligence report generation failed';
    }
  }

  /**
   * Get enhanced status including news engine
   */
  getEnhancedStatus() {
    const baseStatus = super.getStatus();
    const newsStatus = this.newsEngine.getStatus();

    return {
      ...baseStatus,
      newsEngine: newsStatus,
      technicalIndicatorsCached: this.technicalCache.size,
      features: [
        'Technical Analysis',
        'News Sentiment',
        'Geopolitical Intelligence', 
        'Risk Assessment',
        'Multi-timeframe Fusion'
      ]
    };
  }

  /**
   * Check if enhanced features are ready
   */
  isEnhanced(): boolean {
    return this.newsEngine.isReady();
  }

  /**
   * Get news engine for external access (testing)
   */
  getNewsEngine() {
    return this.newsEngine;
  }

  /**
   * Fetch and analyze news for a symbol (public interface)
   */
  async fetchAndAnalyzeNews(symbol: string) {
    return await this.newsEngine.fetchAndAnalyzeNews(symbol);
  }
}