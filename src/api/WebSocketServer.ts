import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { logger } from '../utils/logger.js';
import { BotData, WSMessage } from '../types/websocket.js';

export class TradingBotWebSocketServer {
  private wss: WebSocketServer;
  private server: any;
  private clients: Set<WebSocket> = new Set();
  private port: number;
  private latestBotData: BotData | null = null;

  constructor(port: number = 8080) {
    this.port = port;
    this.server = createServer();
    this.wss = new WebSocketServer({ server: this.server });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
      logger.info(`🔗 WebSocket client connected: ${clientId}`);
      
      this.clients.add(ws);

      // Send latest data immediately to new client
      if (this.latestBotData) {
        this.sendToClient(ws, {
          type: 'bot_update',
          data: this.latestBotData,
          timestamp: Date.now()
        });
      }

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          this.handleClientMessage(ws, parsed);
        } catch (error) {
          logger.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        logger.info(`🔌 WebSocket client disconnected: ${clientId}`);
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error(`❌ WebSocket error for ${clientId}:`, error);
        this.clients.delete(ws);
      });
    });
  }

  private handleClientMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: { timestamp: Date.now() },
          timestamp: Date.now()
        });
        break;
      
      case 'request_update':
        if (this.latestBotData) {
          this.sendToClient(ws, {
            type: 'bot_update',
            data: this.latestBotData,
            timestamp: Date.now()
          });
        }
        break;
        
      default:
        logger.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private sendToClient(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Failed to send WebSocket message:', error);
      }
    }
  }

  // Broadcast data to all connected clients
  public broadcast(data: BotData) {
    this.latestBotData = data;
    
    const message: WSMessage = {
      type: 'bot_update',
      data,
      timestamp: Date.now()
    };

    const messageStr = JSON.stringify(message);
    const deadClients: WebSocket[] = [];

    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
        } catch (error) {
          logger.error('Failed to broadcast message:', error);
          deadClients.push(ws);
        }
      } else {
        deadClients.push(ws);
      }
    });

    // Remove dead clients
    deadClients.forEach(ws => this.clients.delete(ws));
    
    if (this.clients.size > 0) {
      logger.info(`📡 Broadcasted data to ${this.clients.size} clients`);
    }
  }

  // Broadcast market update
  public broadcastMarketUpdate(marketData: any) {
    const message: WSMessage = {
      type: 'market_update',
      data: marketData,
      timestamp: Date.now()
    };

    this.clients.forEach(ws => {
      this.sendToClient(ws, message);
    });
  }

  // Broadcast trade update
  public broadcastTradeUpdate(trade: any) {
    const message: WSMessage = {
      type: 'trade_update',
      data: trade,
      timestamp: Date.now()
    };

    this.clients.forEach(ws => {
      this.sendToClient(ws, message);
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        logger.info(`🚀 WebSocket server started on port ${this.port}`);
        logger.info(`📊 Dashboard available at: http://localhost:3000`);
        logger.info(`🔗 WebSocket endpoint: ws://localhost:${this.port}/ws`);
        resolve();
      });
    });
  }

  public stop() {
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    
    this.wss.close(() => {
      this.server.close(() => {
        logger.info('🔌 WebSocket server stopped');
      });
    });
  }

  public getStatus() {
    return {
      port: this.port,
      connectedClients: this.clients.size,
      isRunning: this.server.listening
    };
  }
}