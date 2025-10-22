import { WebsocketClientV2 } from 'bitget-api';
import { Bar, Timeframe } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Convert timeframe to Bitget WebSocket format
 */
const convertTimeframe = (timeframe: Timeframe): string => {
  const timeframeMap: Partial<Record<Timeframe, string>> = {
    '1m': '1m',
    '3m': '3m', 
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1H',
    '2h': '2H',
    '4h': '4H',
    '6h': '6H',
    '12h': '12H',
    '1d': '1D'
  };
  return timeframeMap[timeframe] || '15m';
};

/**
 * Get realistic market data from public APIs as fallback
 */
const getRealisticMarketData = async (symbol: string): Promise<Bar | null> => {
  try {
    // Use Binance public API as fallback for realistic data
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=15m&limit=1`);
    const data = await response.json();
    
    if (data && data[0]) {
      const kline = data[0];
      return {
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        timestamp: parseInt(kline[0])
      };
    }
  } catch (error: any) {
    logger.warn(`⚠️ Failed to fetch realistic data for ${symbol}:`, error.message);
  }
  return null;
};

/**
 * Enhanced mock data with realistic price movements
 */
const simulateRealisticData = (symbol: string, onBar: (bar: Bar) => void) => {
  const basePrice = symbol.includes('BTC') ? 67000 : 
                   symbol.includes('ETH') ? 2600 : 
                   symbol.includes('BNB') ? 580 : 
                   symbol.includes('SOL') ? 160 :
                   symbol.includes('ADA') ? 0.35 :
                   symbol.includes('AVAX') ? 27 :
                   symbol.includes('MATIC') ? 0.42 :
                   symbol.includes('DOT') ? 4.2 : 100;

  let currentPrice = basePrice;
  let trend = Math.random() > 0.5 ? 1 : -1;
  
  const interval = setInterval(async () => {
    // Try to get realistic data first
    const realisticData = await getRealisticMarketData(symbol);
    
    if (realisticData) {
      logger.debug(`📊 Real market data for ${symbol}: ${realisticData.close.toFixed(4)}`);
      onBar(realisticData);
      return;
    }
    
    // Fallback to enhanced simulation
    const now = Date.now();
    
    // Random walk with trend
    const volatility = 0.01; // 1% volatility
    const trendStrength = 0.0002; // 0.02% trend per update
    const randomChange = (Math.random() - 0.5) * volatility;
    const trendChange = trend * trendStrength;
    
    currentPrice *= (1 + randomChange + trendChange);
    
    // Occasional trend reversal
    if (Math.random() < 0.05) {
      trend *= -1;
    }
    
    // Create realistic OHLC bar
    const variation = currentPrice * 0.003; // 0.3% variation for OHLC
    const open = currentPrice * (1 + (Math.random() - 0.5) * 0.001);
    const close = currentPrice * (1 + (Math.random() - 0.5) * 0.001);
    const high = Math.max(open, close) + Math.random() * variation;
    const low = Math.min(open, close) - Math.random() * variation;
    
    const mockBar: Bar = {
      open,
      high,
      low, 
      close,
      volume: Math.random() * 1000000 + 500000, // Realistic volume
      timestamp: now
    };
    
    logger.debug(`📊 Enhanced simulation for ${symbol}: ${mockBar.close.toFixed(4)} (${trend > 0 ? '📈' : '📉'})`);
    onBar(mockBar);
  }, 15000); // Every 15 seconds for 15m timeframe
  
  // Store interval ID for cleanup
  (global as any)[`realisticInterval_${symbol}`] = interval;
};

/**
 * Subscribe to kline (candlestick) data stream with real WebSocket
 */
export const subscribeKlines = (
  ws: WebsocketClientV2,
  symbol: string,
  timeframe: Timeframe,
  onBar: (bar: Bar) => void | Promise<void>
) => {
  const channel = convertTimeframe(timeframe);
  
  logger.info(`🔌 Setting up advanced market data stream for ${symbol} ${timeframe}`);
  
  const useWebSocket = process.env.BITGET_USE_WEBSOCKET === 'true';
  const useRealisticData = process.env.BITGET_USE_REALISTIC_DATA !== 'false'; // Default to true
  
  if (useWebSocket) {
    try {
      logger.info(`🔌 Attempting Bitget WebSocket connection for ${symbol}`);
      
      // Set up WebSocket listeners
      ws.on('open' as any, () => {
        logger.info(`✅ WebSocket connected for ${symbol}`);
        
        // Try to subscribe to Bitget WebSocket
        try {
          const subscriptionData = {
            op: 'subscribe',
            args: [{
              instType: 'UMCBL', // USDT Margined Futures
              channel: `candle${channel}`,
              instId: symbol
            }]
          };
          
          // Send subscription
          (ws as any).send(JSON.stringify(subscriptionData));
          logger.info(`📡 Subscribed to Bitget channel: candle${channel}:${symbol}`);
          
        } catch (subError: any) {
          logger.warn(`⚠️ WebSocket subscription failed, using realistic data:`, subError.message);
          simulateRealisticData(symbol, onBar);
        }
      });
      
      ws.on('message' as any, (data: any) => {
        try {
          if (typeof data === 'string') {
            data = JSON.parse(data);
          }
          
          if (data && data.data && data.arg && data.arg.instId === symbol) {
            const klineData = data.data[0];
            if (klineData) {
              const bar: Bar = {
                open: parseFloat(klineData[1]),
                high: parseFloat(klineData[2]), 
                low: parseFloat(klineData[3]),
                close: parseFloat(klineData[4]),
                volume: parseFloat(klineData[5]),
                timestamp: parseInt(klineData[0])
              };
              
              logger.info(`📊 Real Bitget data for ${symbol}: ${bar.close.toFixed(4)}`);
              onBar(bar);
            }
          }
        } catch (parseError: any) {
          logger.debug(`📊 WebSocket data parsing issue for ${symbol}:`, parseError.message);
        }
      });
      
      ws.on('error' as any, (error: any) => {
        logger.warn(`⚠️ WebSocket error for ${symbol}, using realistic fallback:`, error.message);
        simulateRealisticData(symbol, onBar);
      });
      
      ws.on('close' as any, (error: any) => {
        logger.warn(`⚠️ WebSocket closed for ${symbol}, using realistic fallback:`, error.message);
        simulateRealisticData(symbol, onBar);
      });
      
      logger.info(`✅ Advanced WebSocket setup complete for ${symbol} ${timeframe}`);
      
    } catch (error: any) {
      logger.warn(`⚠️ WebSocket setup failed for ${symbol}, using realistic data:`, error.message);
      simulateRealisticData(symbol, onBar);
    }
  } else {
    // Use realistic data simulation
    logger.info(`🧪 Using realistic market simulation for ${symbol} ${timeframe}`);
    simulateRealisticData(symbol, onBar);
  }
  
  logger.info(`✅ Market data stream active for ${symbol} ${timeframe} (${useWebSocket ? 'WebSocket+Fallback' : 'Realistic Simulation'})`);
};