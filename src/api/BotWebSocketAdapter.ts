import { TradingBotWebSocketServer } from './WebSocketServer.js';
import { BotData } from '../types/websocket.js';
import { logger } from '../utils/logger.js';
import { AggressiveDecisionEngine } from '../strategy/AggressiveDecisionEngine.js';
import { PortfolioBalancer } from '../portfolio/PortfolioBalancer.js';

/**
 * Adapter to integrate WebSocket server with trading bot
 */
export class BotWebSocketAdapter {
  private wsServer: TradingBotWebSocketServer;
  private startTime: number;
  private lastBroadcast: number = 0;
  private broadcastInterval: number = 5000; // 5 seconds

  constructor(port: number = 8080) {
    this.wsServer = new TradingBotWebSocketServer(port);
    this.startTime = Date.now();
  }

  public async start(): Promise<void> {
    await this.wsServer.start();
    logger.info('🚀 WebSocket dashboard integration started');
  }

  public stop(): void {
    this.wsServer.stop();
    logger.info('🔌 WebSocket dashboard integration stopped');
  }

  public getStatus() {
    return this.wsServer.getStatus();
  }

  /**
   * Broadcast complete bot status to dashboard
   */
  public broadcastBotData(
    equity: number,
    dailyPnL: number,
    positions: any[],
    marketData: any[],
    aggressiveEngine: AggressiveDecisionEngine,
    portfolioBalancer: PortfolioBalancer,
    environment: 'TESTNET' | 'LIVE' = 'TESTNET'
  ): void {
    // Throttle broadcasts to avoid spam
    const now = Date.now();
    if (now - this.lastBroadcast < this.broadcastInterval) {
      return;
    }
    this.lastBroadcast = now;

    try {
      // Get metrics from aggressive engine
      const aggressiveMetrics = aggressiveEngine.getDecisionMetrics();
      
      // Get portfolio allocations from balancer
      const portfolioConfig = portfolioBalancer.getConfig();
      const portfolioReport = portfolioBalancer.getPortfolioReport();
      
      // Parse portfolio allocations from report
      const allocations = this.parsePortfolioAllocations(portfolioReport, portfolioConfig);
      
      // Transform market data
      const transformedMarketData = this.transformMarketData(marketData);
      
      // Get recent opportunities (mock for now)
      const opportunities = this.getMockOpportunities();
      
      // Get recent trades (mock for now)
      const recentTrades = this.getMockTrades();
      
      const botData: BotData = {
        timestamp: now,
        uptime: Math.floor((now - this.startTime) / 1000),
        equity,
        dailyPnL,
        environment,
        portfolio: {
          totalValue: positions.reduce((sum, pos) => sum + (pos.size * pos.markPrice), 0),
          positions: positions.map(pos => ({
            symbol: pos.symbol,
            size: pos.size,
            markPrice: pos.markPrice,
            unrealizedPnl: pos.unrealizedPnl || 0,
            percentage: 0 // Will be calculated
          })),
          allocations,
          rebalanceNeeded: allocations.some(a => Math.abs(a.deviation) > 0.05),
          lastRebalance: now - 3600000 // Mock: 1 hour ago
        },
        aggressiveTrading: {
          dailyTrades: aggressiveMetrics.totalTradesToday,
          successRate: aggressiveMetrics.successRate,
          opportunitiesFound: aggressiveMetrics.opportunitiesIdentified,
          tradesExecuted: aggressiveMetrics.tradesExecuted,
          portfolioBalance: aggressiveMetrics.portfolioBalance,
          maxTradesPerSymbol: 15 // From config
        },
        marketData: transformedMarketData,
        opportunities,
        recentTrades,
        aiEngine: {
          model: 'enhanced-ai',
          status: 'OPERATIONAL',
          predictions: Math.floor(Math.random() * 100),
          accuracy: 0.75 + Math.random() * 0.2
        }
      };

      this.wsServer.broadcast(botData);
      
      logger.info(`📡 Broadcasted bot data to ${this.wsServer.getStatus().connectedClients} dashboard clients`);
      
    } catch (error: any) {
      logger.error('❌ Error broadcasting bot data:', error?.message || error);
    }
  }

  private parsePortfolioAllocations(report: string, config: any): any[] {
    const allocations = [];
    const symbols = config.symbols || ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'AVAXUSDT', 'MATICUSDT', 'DOTUSDT'];
    const targets = config.targetAllocations || {
      'BTCUSDT': 0.30,
      'ETHUSDT': 0.25,
      'BNBUSDT': 0.15,
      'SOLUSDT': 0.10,
      'ADAUSDT': 0.08,
      'AVAXUSDT': 0.07,
      'MATICUSDT': 0.03,
      'DOTUSDT': 0.02
    };

    symbols.forEach(symbol => {
      const target = targets[symbol] || 0;
      const current = Math.random() * 0.4; // Mock current allocation
      const deviation = current - target;
      
      allocations.push({
        symbol,
        current,
        target,
        deviation,
        status: Math.abs(deviation) < 0.05 ? 'BALANCED' : 
                deviation > 0 ? 'OVERWEIGHT' : 'UNDERWEIGHT',
        value: current * 1000 // Mock value
      });
    });

    return allocations;
  }

  private transformMarketData(marketData: any[]): any[] {
    return marketData.map(item => ({
      symbol: item.symbol || 'BTCUSDT',
      price: item.price || item.close || 50000,
      change24h: item.change24h || (Math.random() - 0.5) * 10,
      volume24h: item.volume24h || Math.random() * 1e9,
      high24h: item.high24h || item.high || 51000,
      low24h: item.low24h || item.low || 49000,
      lastUpdate: Date.now()
    }));
  }

  private getMockOpportunities(): any[] {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    const opportunities = [];
    
    for (let i = 0; i < Math.min(3, symbols.length); i++) {
      const confidence = 0.4 + Math.random() * 0.5;
      opportunities.push({
        symbol: symbols[i],
        direction: Math.random() > 0.5 ? 'long' : 'short',
        confidence,
        expectedReturn: confidence * 0.05,
        riskScore: Math.random(),
        priority: confidence * 3,
        reason: `Technical analysis shows ${confidence > 0.7 ? 'strong' : 'moderate'} ${symbols[i]} opportunity`,
        timestamp: Date.now() - Math.random() * 300000 // Within last 5 minutes
      });
    }
    
    return opportunities;
  }

  private getMockTrades(): any[] {
    return [
      {
        id: `trade_${Date.now()}_1`,
        symbol: 'BTCUSDT',
        side: 'buy',
        amount: 0.001,
        price: 50000,
        timestamp: Date.now() - 120000,
        status: 'filled',
        pnl: 5.50
      },
      {
        id: `trade_${Date.now()}_2`,
        symbol: 'ETHUSDT',
        side: 'sell',
        amount: 0.1,
        price: 3000,
        timestamp: Date.now() - 300000,
        status: 'filled',
        pnl: -2.25
      }
    ];
  }

  /**
   * Broadcast market update
   */
  public broadcastMarketUpdate(symbol: string, price: number, change: number): void {
    this.wsServer.broadcastMarketUpdate({
      symbol,
      price,
      change,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast trade execution
   */
  public broadcastTradeUpdate(trade: any): void {
    this.wsServer.broadcastTradeUpdate(trade);
  }
}