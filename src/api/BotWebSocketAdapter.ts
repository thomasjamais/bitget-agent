import { TradingBotWebSocketServer } from "./WebSocketServer.js";
import { BotData } from "../types/websocket.js";
import { logger } from "../utils/logger.js";
import { AggressiveDecisionEngine } from "../strategy/AggressiveDecisionEngine.js";
import { PortfolioBalancer } from "../portfolio/PortfolioBalancer.js";

/**
 * Adapter to integrate WebSocket server with trading bot
 */
export class BotWebSocketAdapter {
  private wsServer: TradingBotWebSocketServer;
  private startTime: number;
  private lastBroadcast: number = 0;
  private broadcastInterval: number = 2000; // 2 seconds - Optimized for fluid dashboard updates
  private rest: any;

  constructor(port: number = 8080) {
    this.wsServer = new TradingBotWebSocketServer(port);
    this.startTime = Date.now();
  }

  public setRestClient(rest: any) {
    this.rest = rest;
  }

  public get webSocketServer() {
    return this.wsServer;
  }

  public async start(): Promise<void> {
    await this.wsServer.start();
    logger.info("🚀 WebSocket dashboard integration started");
  }

  public stop(): void {
    this.wsServer.stop();
    logger.info("🔌 WebSocket dashboard integration stopped");
  }

  public setPortfolioControlCallbacks(callbacks: {
    onAllocateCapital?: (amount: number) => Promise<any>;
    onTriggerRebalance?: () => Promise<any>;
    onUpdateAllocation?: (symbol: string, percentage: number) => Promise<any>;
    onSwitchTradingMode?: (mode: string, useTestnet: boolean) => Promise<any>;
  }): void {
    this.wsServer.setPortfolioControlCallbacks(callbacks);
  }

  public getStatus() {
    return this.wsServer.getStatus();
  }

  private parsePortfolioAllocations(report: string, config: any): any[] {
    const allocations: any[] = [];
    const symbols: string[] = config.symbols || [
      "BTCUSDT",
      "ETHUSDT",
      "BNBUSDT",
      "MATICUSDT",
    ];
    const targets: Record<string, number> = config.targetAllocations || {
      BTCUSDT: 0.3,
      ETHUSDT: 0.25,
      BNBUSDT: 0.42,
      MATICUSDT: 0.03,
    };

    symbols.forEach((symbol: string) => {
      const target = targets[symbol] || 0;
      const current = Math.random() * 0.4; // Mock current allocation
      const deviation = current - target;

      allocations.push({
        symbol,
        current,
        target,
        deviation,
        status:
          Math.abs(deviation) < 0.05
            ? "BALANCED"
            : deviation > 0
            ? "OVERWEIGHT"
            : "UNDERWEIGHT",
        value: current * 1000, // Mock value
      });
    });

    return allocations;
  }

  private transformMarketData(marketData: any[]): any[] {
    return marketData.map((item) => ({
      symbol: item.symbol || "BTCUSDT",
      price: item.price || item.close || 50000,
      change24h: item.change24h || (Math.random() - 0.5) * 10,
      volume24h: item.volume24h || Math.random() * 1e9,
      high24h: item.high24h || item.high || 51000,
      low24h: item.low24h || item.low || 49000,
      lastUpdate: Date.now(),
    }));
  }

  private getMockOpportunities(): any[] {
    const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"];
    const opportunities = [];

    for (let i = 0; i < Math.min(3, symbols.length); i++) {
      const confidence = 0.4 + Math.random() * 0.5;
      opportunities.push({
        symbol: symbols[i],
        direction: Math.random() > 0.5 ? "long" : "short",
        confidence,
        expectedReturn: confidence * 0.05,
        riskScore: Math.random(),
        priority: confidence * 3,
        reason: `Technical analysis shows ${
          confidence > 0.7 ? "strong" : "moderate"
        } ${symbols[i]} opportunity`,
        timestamp: Date.now() - Math.random() * 300000, // Within last 5 minutes
      });
    }

    return opportunities;
  }

  private getMockTrades(): any[] {
    return [
      {
        id: `trade_${Date.now()}_1`,
        symbol: "BTCUSDT",
        side: "buy",
        amount: 0.001,
        price: 50000,
        timestamp: Date.now() - 120000,
        status: "filled",
        pnl: 5.5,
      },
      {
        id: `trade_${Date.now()}_2`,
        symbol: "ETHUSDT",
        side: "sell",
        amount: 0.1,
        price: 3000,
        timestamp: Date.now() - 300000,
        status: "filled",
        pnl: -2.25,
      },
    ];
  }

  /**
   * Broadcast market update
   */
  public broadcastMarketUpdate(
    symbol: string,
    price: number,
    change: number
  ): void {
    this.wsServer.broadcastMarketUpdate({
      symbol,
      price,
      change,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast trade execution
   */
  public broadcastTradeUpdate(trade: any): void {
    this.wsServer.broadcastTradeUpdate(trade);
  }

  /**
   * Broadcast comprehensive bot data
   */
  public broadcastBotData(botData: any): void {
    this.wsServer.broadcast(botData);
  }

  /**
   * Handle portfolio transfer request using real Bitget API
   */
  public async handlePortfolioTransfer(transferRequest: any): Promise<boolean> {
    try {
      logger.info("🔄 Portfolio transfer request received:", transferRequest);
      
      // Use the portfolio transfer system for real transfers
      const { PortfolioTransfer } = await import("../portfolio/PortfolioTransfer.js");
      const portfolioTransfer = new PortfolioTransfer(this.rest);
      
      const success = await portfolioTransfer.transferFunds(transferRequest);
      
      if (success) {
        // Broadcast success notification
        this.wsServer.broadcast({
          type: "transfer_success",
          message: `✅ Transfert réussi: ${transferRequest.amount} USDT de ${transferRequest.from} vers ${transferRequest.to}`,
          transferRequest,
          timestamp: Date.now(),
        } as any);
      } else {
        // Broadcast failure notification
        this.wsServer.broadcast({
          type: "transfer_error",
          message: `❌ Échec du transfert: ${transferRequest.amount} USDT de ${transferRequest.from} vers ${transferRequest.to}`,
          transferRequest,
          timestamp: Date.now(),
        } as any);
      }

      return success;
    } catch (error) {
      logger.error("❌ Portfolio transfer failed:", error);
      
      // Broadcast error notification
      this.wsServer.broadcast({
        type: "transfer_error",
        message: `❌ Erreur lors du transfert: ${error}`,
        transferRequest,
        timestamp: Date.now(),
      } as any);
      
      return false;
    }
  }
}
