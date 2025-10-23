import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import express, { Request, Response } from "express";
import cors from "cors";
import { logger } from "../utils/logger.js";
import { BotData, WSMessage } from "../types/websocket.js";

export class TradingBotWebSocketServer {
  private wss: WebSocketServer;
  private server: any;
  private app: express.Application;
  private clients: Set<WebSocket> = new Set();
  private port: number;
  private latestBotData: BotData | null = null;
  private rest: any;
  private portfolioControlCallbacks: {
    onAllocateCapital?: (amount: number) => Promise<any>;
    onTriggerRebalance?: () => Promise<any>;
    onUpdateAllocation?: (symbol: string, percentage: number) => Promise<any>;
    onSwitchTradingMode?: (mode: string, useTestnet: boolean) => Promise<any>;
    onTransfer?: (request: any) => Promise<boolean>;
  } = {};

  constructor(port: number = 8080) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server, path: "/ws" });
    this.setupExpress();
    this.setupWebSocket();
  }

  private setupExpress() {
    // Middleware
    this.app.use(
      cors({
        origin: [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3001",
          "http://localhost:3333",
          "http://127.0.0.1:3333",
        ],
        credentials: true,
      })
    );
    this.app.use(express.json());

    // Health check
    this.app.get("/health", (req: Request, res: Response) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Get current bot data
    this.app.get("/api/bot/status", (req: Request, res: Response) => {
      res.json(this.latestBotData || {});
    });

    // Portfolio control endpoints
    this.app.post(
      "/api/portfolio/allocate",
      async (req: Request, res: Response) => {
        try {
          const { amount } = req.body;

          if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
          }

          logger.info(`🎛️ API: Allocating ${amount} USDT to portfolio`);

          const result = await this.triggerPortfolioAllocation(amount);

          return res.json({
            success: true,
            message: `Allocated ${amount} USDT to portfolio`,
            result,
          });
        } catch (error: any) {
          logger.error("❌ Portfolio allocation failed:", error);
          return res
            .status(500)
            .json({ error: "Failed to allocate capital: " + error.message });
        }
      }
    );

    this.app.post(
      "/api/portfolio/rebalance",
      async (req: Request, res: Response) => {
        try {
          logger.info("🎛️ API: Triggering portfolio rebalance");

          const result = await this.triggerPortfolioRebalance();

          return res.json({
            success: true,
            message: "Portfolio rebalancing triggered",
            result,
          });
        } catch (error: any) {
          logger.error("❌ Portfolio rebalance failed:", error);
          return res
            .status(500)
            .json({ error: "Failed to trigger rebalance: " + error.message });
        }
      }
    );

    this.app.put(
      "/api/portfolio/allocation/:symbol",
      async (req: Request, res: Response) => {
        try {
          const { symbol } = req.params;
          const { percentage } = req.body;

          if (!symbol) {
            return res.status(400).json({ error: "Symbol is required" });
          }

          if (percentage === undefined || percentage < 0 || percentage > 1) {
            return res
              .status(400)
              .json({ error: "Invalid percentage (must be 0-1)" });
          }

          logger.info(
            `🎛️ API: Updating ${symbol} allocation to ${percentage * 100}%`
          );

          const result = await this.updateAllocation(symbol, percentage);

          return res.json({
            success: true,
            message: `Updated ${symbol} allocation to ${percentage * 100}%`,
            result,
          });
        } catch (error: any) {
          logger.error("❌ Allocation update failed:", error);
          return res
            .status(500)
            .json({ error: "Failed to update allocation: " + error.message });
        }
      }
    );

    // Trading mode toggle endpoint
    this.app.post("/api/bot/mode", async (req: Request, res: Response) => {
      try {
        const { mode, useTestnet } = req.body;

        if (!mode || (mode !== "testnet" && mode !== "production")) {
          return res
            .status(400)
            .json({ error: 'Invalid mode. Use "testnet" or "production"' });
        }

        if (typeof useTestnet !== "boolean") {
          return res
            .status(400)
            .json({ error: "useTestnet must be a boolean" });
        }

        logger.info(
          `🎛️ API: Switching to ${mode} mode (useTestnet: ${useTestnet})`
        );

        const result = await this.switchTradingMode(mode, useTestnet);

        return res.json({
          success: true,
          message: `Switched to ${mode} mode`,
          mode,
          useTestnet,
          result,
        });
      } catch (error: any) {
        logger.error("❌ Mode switch failed:", error);
        return res
          .status(500)
          .json({ error: "Failed to switch mode: " + error.message });
      }
    });

    // Portfolio transfer endpoint
    this.app.post("/api/transfer", async (req: Request, res: Response) => {
      try {
        const { from, to, amount, currency } = req.body;

        if (!from || !to || !amount || !currency) {
          return res.status(400).json({
            error: "Missing required fields: from, to, amount, currency",
          });
        }

        if (amount <= 0) {
          return res
            .status(400)
            .json({ error: "Amount must be greater than 0" });
        }

        if (from === to) {
          return res
            .status(400)
            .json({ error: "Cannot transfer to the same wallet" });
        }

        logger.info(
          `🔄 API: Transfer request - ${amount} ${currency} from ${from} to ${to}`
        );

        // Use PortfolioTransfer directly
        const { PortfolioTransfer } = await import(
          "../portfolio/PortfolioTransfer.js"
        );
        const portfolioTransfer = new PortfolioTransfer(this.rest, {
          apiKey: process.env.BITGET_API_KEY || "",
          apiSecret: process.env.BITGET_API_SECRET || "",
          apiPassphrase: process.env.BITGET_API_PASSPHRASE || "",
        });
        const success = await portfolioTransfer.transferFunds({
          from,
          to,
          amount,
          currency,
        });

        if (success) {
          return res.json({
            success: true,
            message: `Transfer completed: ${amount} ${currency} from ${from} to ${to}`,
            transferId: `transfer_${Date.now()}`,
          });
        } else {
          return res.status(500).json({
            error: "Transfer failed",
            message: `Failed to transfer ${amount} ${currency} from ${from} to ${to}`,
          });
        }
      } catch (error: any) {
        logger.error("❌ Transfer failed:", error);
        return res
          .status(500)
          .json({ error: "Transfer failed: " + error.message });
      }
    });
  }

  private setupWebSocket() {
    this.wss.on("connection", (ws: WebSocket, req) => {
      const clientId = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
      logger.info(`🔗 WebSocket client connected: ${clientId}`);

      this.clients.add(ws);

      // Send latest data immediately to new client
      if (this.latestBotData) {
        this.sendToClient(ws, {
          type: "bot_update",
          data: this.latestBotData,
          timestamp: Date.now(),
        });
      }

      ws.on("message", (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          this.handleClientMessage(ws, parsed);
        } catch (error) {
          logger.error("Failed to parse WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        logger.info(`🔌 WebSocket client disconnected: ${clientId}`);
        this.clients.delete(ws);
      });

      ws.on("error", (error) => {
        logger.error(`❌ WebSocket error for ${clientId}:`, error);
        this.clients.delete(ws);
      });
    });
  }

  private handleClientMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case "ping":
        this.sendToClient(ws, {
          type: "pong",
          data: { timestamp: Date.now() },
          timestamp: Date.now(),
        });
        break;

      case "request_update":
        if (this.latestBotData) {
          this.sendToClient(ws, {
            type: "bot_update",
            data: this.latestBotData,
            timestamp: Date.now(),
          });
        }
        break;

      default:
        logger.warn("Unknown WebSocket message type:", message.type);
    }
  }

  private sendToClient(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error("Failed to send WebSocket message:", error);
      }
    }
  }

  // Broadcast data to all connected clients
  public broadcast(data: BotData) {
    this.latestBotData = data;

    const message: WSMessage = {
      type: "bot_update",
      data,
      timestamp: Date.now(),
    };

    const messageStr = JSON.stringify(message);
    const deadClients: WebSocket[] = [];

    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
        } catch (error) {
          logger.error("Failed to broadcast message:", error);
          deadClients.push(ws);
        }
      } else {
        deadClients.push(ws);
      }
    });

    // Remove dead clients
    deadClients.forEach((ws) => this.clients.delete(ws));

    if (this.clients.size > 0) {
      logger.info(`📡 Broadcasted data to ${this.clients.size} clients`);
    }
  }

  // Broadcast market update
  public broadcastMarketUpdate(marketData: any) {
    const message: WSMessage = {
      type: "market_update",
      data: marketData,
      timestamp: Date.now(),
    };

    this.clients.forEach((ws) => {
      this.sendToClient(ws, message);
    });
  }

  // Broadcast trade update
  public broadcastTradeUpdate(trade: any) {
    const message: WSMessage = {
      type: "trade_update",
      data: trade,
      timestamp: Date.now(),
    };

    this.clients.forEach((ws) => {
      this.sendToClient(ws, message);
    });
  }

  // Portfolio control methods
  public setPortfolioControlCallbacks(callbacks: {
    onAllocateCapital?: (amount: number) => Promise<any>;
    onTriggerRebalance?: () => Promise<any>;
    onUpdateAllocation?: (symbol: string, percentage: number) => Promise<any>;
    onSwitchTradingMode?: (mode: string, useTestnet: boolean) => Promise<any>;
    onTransfer?: (request: any) => Promise<boolean>;
  }) {
    this.portfolioControlCallbacks = callbacks;
    logger.info("🎛️ Portfolio control callbacks registered");
  }

  public setRestClient(rest: any) {
    this.rest = rest;
  }

  private async triggerPortfolioAllocation(amount: number) {
    if (this.portfolioControlCallbacks.onAllocateCapital) {
      return await this.portfolioControlCallbacks.onAllocateCapital(amount);
    } else {
      logger.warn("⚠️ No portfolio allocation callback registered");
      throw new Error("No allocation handler configured");
    }
  }

  private async triggerPortfolioRebalance() {
    if (this.portfolioControlCallbacks.onTriggerRebalance) {
      return await this.portfolioControlCallbacks.onTriggerRebalance();
    } else {
      logger.warn("⚠️ No portfolio rebalance callback registered");
      throw new Error("No rebalance handler configured");
    }
  }

  private async updateAllocation(symbol: string, percentage: number) {
    if (this.portfolioControlCallbacks.onUpdateAllocation) {
      return await this.portfolioControlCallbacks.onUpdateAllocation(
        symbol,
        percentage
      );
    } else {
      logger.warn("⚠️ No allocation update callback registered");
      throw new Error("No allocation update handler configured");
    }
  }

  private async switchTradingMode(mode: string, useTestnet: boolean) {
    if (this.portfolioControlCallbacks.onSwitchTradingMode) {
      return await this.portfolioControlCallbacks.onSwitchTradingMode(
        mode,
        useTestnet
      );
    } else {
      logger.warn("⚠️ No trading mode switch callback registered");
      throw new Error("No mode switch handler configured");
    }
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        logger.info(`🚀 WebSocket server started on port ${this.port}`);
        logger.info(`📊 Dashboard available at: http://localhost:3000`);
        logger.info(`🔗 WebSocket endpoint: ws://localhost:${this.port}/ws`);
        logger.info(`📡 API endpoints: http://localhost:${this.port}/api/*`);
        resolve();
      });
    });
  }

  public stop() {
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    this.wss.close(() => {
      this.server.close(() => {
        logger.info("🔌 WebSocket server stopped");
      });
    });
  }

  public getStatus() {
    return {
      port: this.port,
      connectedClients: this.clients.size,
      isRunning: this.server.listening,
    };
  }

  private async handleTransfer(request: any): Promise<boolean> {
    if (this.portfolioControlCallbacks.onTransfer) {
      return await this.portfolioControlCallbacks.onTransfer(request);
    } else {
      logger.warn("⚠️ No transfer callback registered");
      throw new Error("No transfer handler configured");
    }
  }
}
