/**
 * News Intelligence Engine for Crypto Trading
 * Combines geopolitical events, regulatory news, and market sentiment
 */

import { OpenAI } from 'openai';
import axios from 'axios';
import cron from 'node-cron';
import { logger } from '../utils/logger.js';

export interface NewsEvent {
  id: string;
  title: string;
  content: string;
  source: string;
  publishedAt: Date;
  relevanceScore: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  affectedSymbols: string[];
  categories: NewsCategory[];
}

export interface NewsCategory {
  type: 'regulatory' | 'adoption' | 'technology' | 'geopolitical' | 'economic' | 'institutional';
  confidence: number;
}

export interface NewsAnalysis {
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  keyEvents: NewsEvent[];
  marketImpact: {
    shortTerm: number; // -1 to 1
    mediumTerm: number; // -1 to 1
    longTerm: number; // -1 to 1
  };
  recommendations: string[];
}

export interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role?: string;
      content?: string;
    };
  }>;
}

export class NewsIntelligenceEngine {
  private openai: OpenAI;
  private perplexityApiKey: string;
  private newsCache: Map<string, NewsEvent[]> = new Map();
  private lastAnalysis: Map<string, NewsAnalysis> = new Map();
  private isInitialized = false;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
  }

  /**
   * Initialize the news intelligence engine
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🧠 Initializing News Intelligence Engine...');

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not found in environment variables');
      }

      if (!this.perplexityApiKey) {
        throw new Error('PERPLEXITY_API_KEY not found in environment variables');
      }

      // Test API connections
      await this.testConnections();

      // Schedule regular news updates
      this.scheduleNewsUpdates();

      this.isInitialized = true;
      logger.info('✅ News Intelligence Engine initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize News Intelligence Engine:', error);
      throw error;
    }
  }

  /**
   * Test API connections
   */
  private async testConnections(): Promise<void> {
    try {
      // Test OpenAI connection
      await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 5
      });
      logger.info('✅ OpenAI connection validated');

      // Test Perplexity connection (optional)
      try {
        await this.queryPerplexity('What is Bitcoin?', 50);
        logger.info('✅ Perplexity connection validated');
      } catch (perplexityError: any) {
        logger.warn('⚠️ Perplexity connection failed, will use OpenAI only:', perplexityError.message);
        // Don't throw error, continue with OpenAI only
      }

    } catch (error) {
      logger.error('❌ API connection test failed:', error);
      throw error;
    }
  }

  /**
   * Schedule regular news updates
   */
  private scheduleNewsUpdates(): void {
    // Update news every 5 minutes - High frequency mode for better market reactivity
    cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('🔄 Scheduled news update starting...');
        const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'AVAXUSDT', 'MATICUSDT', 'DOTUSDT'];
        
        for (const symbol of symbols) {
          await this.fetchAndAnalyzeNews(symbol.replace('USDT', ''));
        }
        
        logger.info('✅ Scheduled news update completed');
      } catch (error) {
        logger.error('❌ Scheduled news update failed:', error);
      }
    });

    logger.info('📅 News update scheduler activated (5-minute intervals) - HIGH FREQUENCY MODE');
  }

  /**
   * Query Perplexity for real-time news and analysis
   */
  private async queryPerplexity(query: string, maxTokens: number = 1000): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-3.1-sonar-large-128k-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a cryptocurrency market analyst. Provide recent news and analysis about crypto markets.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: Math.max(100, maxTokens),
          temperature: 0.2,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result: PerplexityResponse = response.data;
      return result.choices[0]?.message?.content || '';

    } catch (error: any) {
      logger.warn('⚠️ Perplexity API error (fallback to OpenAI):', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data?.error
      });
      
      // Fallback to OpenAI for news analysis
      return await this.queryOpenAIForNews(query, maxTokens);
    }
  }

  /**
   * Query OpenAI as fallback for news analysis
   */
  private async queryOpenAIForNews(query: string, maxTokens: number): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency market analyst. Provide analysis based on your training data about crypto markets, regulations, and major events.'
          },
          {
            role: 'user',
            content: `${query} Please provide a brief analysis based on general cryptocurrency market knowledge and trends.`
          }
        ],
        max_tokens: Math.max(100, maxTokens),
        temperature: 0.3
      });
      
      return completion.choices[0]?.message?.content || 'No analysis available';
    } catch (error) {
      logger.error('❌ OpenAI fallback failed:', error);
      throw error;
    }
  }

  /**
   * Fetch and analyze news for a specific cryptocurrency
   */
  async fetchAndAnalyzeNews(symbol: string): Promise<NewsAnalysis> {
    try {
      logger.info(`🔍 Fetching news for ${symbol}...`);

      // Query Perplexity for recent news
      const newsQuery = `
        Find the latest news from the last 24 hours about ${symbol} cryptocurrency, focusing on:
        1. Regulatory developments and government actions
        2. Major institutional adoption or rejections  
        3. Technical developments and upgrades
        4. Geopolitical events affecting crypto markets
        5. Major market movements and their causes
        
        For each news item, provide:
        - Title and brief summary
        - Date and source
        - Potential market impact (bullish/bearish/neutral)
        - Relevance score (1-10)
        
        Format as structured data that can be parsed.
      `;

      const newsContent = await this.queryPerplexity(newsQuery, 1500);

      // Analyze news sentiment and impact using OpenAI
      const analysis = await this.analyzeNewsImpact(symbol, newsContent);

      // Cache the results
      this.lastAnalysis.set(symbol, analysis);

      logger.info(`✅ News analysis completed for ${symbol}`, {
        sentiment: analysis.overallSentiment,
        confidence: analysis.confidence,
        keyEvents: analysis.keyEvents.length
      });

      return analysis;

    } catch (error) {
      logger.error(`❌ Failed to fetch news for ${symbol}:`, error);
      
      // Return neutral analysis on error
      return {
        overallSentiment: 'neutral',
        confidence: 0,
        keyEvents: [],
        marketImpact: { shortTerm: 0, mediumTerm: 0, longTerm: 0 },
        recommendations: ['Unable to fetch current news data']
      };
    }
  }

  /**
   * Analyze news impact using OpenAI
   */
  private async analyzeNewsImpact(symbol: string, newsContent: string): Promise<NewsAnalysis> {
    try {
      const prompt = `
        As a professional crypto market analyst, analyze the following news about ${symbol} and provide a structured assessment:

        NEWS CONTENT:
        ${newsContent}

        Please analyze and respond with a JSON object containing:
        {
          "overallSentiment": "bullish|bearish|neutral",
          "confidence": 0.0-1.0,
          "marketImpact": {
            "shortTerm": -1.0 to 1.0,
            "mediumTerm": -1.0 to 1.0, 
            "longTerm": -1.0 to 1.0
          },
          "keyFactors": ["list", "of", "key", "factors"],
          "recommendations": ["trading", "recommendations"],
          "riskLevel": "low|medium|high"
        }

        Consider:
        - Regulatory impact and legal developments
        - Institutional adoption trends
        - Geopolitical tensions and economic policies
        - Technical developments and network upgrades
        - Market sentiment and social media buzz
        - Correlation with traditional markets
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3
      });

      const analysisText = completion.choices[0]?.message?.content || '{}';
      
      try {
        const analysisData = JSON.parse(analysisText);
        
        return {
          overallSentiment: analysisData.overallSentiment || 'neutral',
          confidence: Math.max(0, Math.min(1, analysisData.confidence || 0)),
          keyEvents: [], // Will be populated from parsed news
          marketImpact: {
            shortTerm: Math.max(-1, Math.min(1, analysisData.marketImpact?.shortTerm || 0)),
            mediumTerm: Math.max(-1, Math.min(1, analysisData.marketImpact?.mediumTerm || 0)),
            longTerm: Math.max(-1, Math.min(1, analysisData.marketImpact?.longTerm || 0))
          },
          recommendations: analysisData.recommendations || []
        };

      } catch (parseError) {
        logger.warn('⚠️ Failed to parse OpenAI analysis response, using fallback');
        return {
          overallSentiment: 'neutral',
          confidence: 0.1,
          keyEvents: [],
          marketImpact: { shortTerm: 0, mediumTerm: 0, longTerm: 0 },
          recommendations: ['Analysis parsing failed - manual review recommended']
        };
      }

    } catch (error) {
      logger.error('❌ OpenAI analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get cached news analysis for a symbol
   */
  getLatestAnalysis(symbol: string): NewsAnalysis | null {
    return this.lastAnalysis.get(symbol) || null;
  }

  /**
   * Get news-based signal adjustment factor
   */
  getNewsSignalAdjustment(symbol: string): number {
    const analysis = this.getLatestAnalysis(symbol);
    if (!analysis || analysis.confidence < 0.3) {
      return 1.0; // No adjustment if no reliable news
    }

    // Convert sentiment to multiplier
    const sentimentMultiplier = analysis.overallSentiment === 'bullish' ? 1.2 :
                               analysis.overallSentiment === 'bearish' ? 0.8 : 1.0;

    // Weight by confidence and short-term impact
    const impactWeight = 1 + (analysis.marketImpact.shortTerm * 0.3);
    const confidenceWeight = 0.7 + (analysis.confidence * 0.3);

    return sentimentMultiplier * impactWeight * confidenceWeight;
  }

  /**
   * Generate comprehensive market intelligence report
   */
  async generateIntelligenceReport(symbols: string[]): Promise<string> {
    try {
      const analyses = symbols.map(symbol => ({
        symbol,
        analysis: this.getLatestAnalysis(symbol)
      })).filter(item => item.analysis !== null);

      if (analyses.length === 0) {
        return '📰 No recent news analysis available';
      }

      let report = '🌍 GEOPOLITICAL & NEWS INTELLIGENCE REPORT\n';
      report += '══════════════════════════════════════════\n\n';

      for (const { symbol, analysis } of analyses) {
        if (!analysis) continue;

        const sentimentEmoji = analysis.overallSentiment === 'bullish' ? '🟢' :
                              analysis.overallSentiment === 'bearish' ? '🔴' : '🟡';

        report += `${sentimentEmoji} ${symbol}:\n`;
        report += `   Sentiment: ${analysis.overallSentiment.toUpperCase()} (${(analysis.confidence * 100).toFixed()}% confidence)\n`;
        report += `   Impact: ST:${analysis.marketImpact.shortTerm.toFixed(2)} MT:${analysis.marketImpact.mediumTerm.toFixed(2)} LT:${analysis.marketImpact.longTerm.toFixed(2)}\n`;
        
        if (analysis.recommendations.length > 0) {
          report += `   Key: ${analysis.recommendations[0]}\n`;
        }
        report += '\n';
      }

      return report;

    } catch (error) {
      logger.error('❌ Failed to generate intelligence report:', error);
      return '❌ Intelligence report generation failed';
    }
  }

  /**
   * Check if the engine is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get status information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      cachedSymbols: this.lastAnalysis.size,
      lastUpdate: Array.from(this.lastAnalysis.entries()).reduce((latest, [symbol, analysis]) => {
        return latest; // Would need timestamp in analysis
      }, 'Unknown')
    };
  }
}