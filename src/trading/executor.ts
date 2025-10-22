import { RestClientV2 } from 'bitget-api';
import { PositionIntent } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Execute a position opening order using Bitget API v2
 */
export const open = async (rest: RestClientV2, intent: PositionIntent) => {
  try {
    const side = intent.direction === "long" ? "buy" : "sell" as "buy" | "sell";
    const leverage = String(intent.leverage);
    const marginCoin = "USDT";
    
    logger.info(`🚀 Opening ${intent.direction} position for ${intent.symbol}: ${intent.quantity} @ leverage ${leverage}`);

    // 1. Set leverage first
    try {
      await rest.setFuturesLeverage({
        productType: "USDT-FUTURES" as const,
        symbol: intent.symbol,
        marginCoin,
        leverage,
        holdSide: intent.direction === "long" ? "long" : "short"
      });
      logger.info(`✅ Leverage set to ${leverage}x for ${intent.symbol}`);
    } catch (leverageError: any) {
      // Leverage might already be set, continue if it's just a "no change" error
      if (!leverageError.message?.includes('leverage') && !leverageError.message?.includes('40008')) {
        throw leverageError;
      }
      logger.warn(`Leverage setting skipped (may already be set): ${leverageError.message}`);
    }

    // 2. Place the main order
    const orderParams = {
      productType: "USDT-FUTURES" as const,
      symbol: intent.symbol,
      marginCoin,
      marginMode: "crossed" as const,
      size: String(intent.quantity),
      side,
      orderType: (intent.orderType === "limit" ? "limit" : "market") as "market" | "limit",
      ...(intent.reduceOnly && { reduceOnly: "YES" as const }),
      ...(intent.orderType === "limit" && intent.price && { price: String(intent.price) }),
      clientOid: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    logger.info(`📝 Submitting order:`, orderParams);
    const orderResult = await rest.futuresSubmitOrder(orderParams);
    
    logger.info(`✅ Order placed successfully: ${orderResult.data.orderId}`);
    
    return { 
      orderId: orderResult.data.orderId, 
      status: 'success',
      clientOid: orderParams.clientOid,
      details: orderResult.data
    };
  } catch (error: any) {
    logger.error(`❌ Failed to open position for ${intent.symbol}:`, {
      error: error.message,
      code: error.code,
      intent: {
        symbol: intent.symbol,
        direction: intent.direction,
        quantity: intent.quantity,
        leverage: intent.leverage
      }
    });
    throw error;
  }
};

/**
 * Close a position by placing a reverse order
 */
export const close = async (rest: RestClientV2, symbol: string, quantity: number, side: "buy" | "sell") => {
  try {
    logger.info(`🔄 Closing position for ${symbol}: ${quantity} (${side})`);
    
    const orderParams = {
      productType: "USDT-FUTURES" as const,
      symbol,
      marginCoin: "USDT",
      marginMode: "crossed" as const,
      size: String(quantity),
      side,
      orderType: "market" as const,
      reduceOnly: "YES" as const,
      clientOid: `close_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const result = await rest.futuresSubmitOrder(orderParams);
    logger.info(`✅ Position closed: ${result.data.orderId}`);
    
    return { 
      success: true, 
      orderId: result.data.orderId,
      clientOid: orderParams.clientOid
    };
  } catch (error: any) {
    logger.error(`❌ Failed to close position for ${symbol}:`, error.message);
    throw error;
  }
};

/**
 * Place stop-loss and take-profit orders
 */
export const placeStopOrders = async (rest: RestClientV2, intent: PositionIntent, mainOrder: any) => {
  try {
    logger.info(`🛡️ Placing stop orders for ${intent.symbol}`);
    
    const results = [];
    
    // Place stop-loss if specified
    if (intent.stopLoss) {
      const stopLossParams = {
        productType: "USDT-FUTURES" as const,
        symbol: intent.symbol,
        marginCoin: "USDT",
        planType: "loss_plan" as const,
        triggerPrice: String(intent.stopLoss),
        executePrice: String(intent.stopLoss),
        size: String(intent.quantity),
        side: intent.direction === "long" ? "sell" : "buy",
        triggerType: "fill_price" as const,
        holdSide: (intent.direction === "long" ? "long" : "short") as "long" | "short",
        clientOid: `sl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      const slResult = await rest.futuresSubmitTPSLOrder(stopLossParams);
      results.push({ type: 'stop-loss', orderId: slResult.data.orderId });
      logger.info(`✅ Stop-loss placed: ${slResult.data.orderId}`);
    }
    
    // Place take-profit if specified
    if (intent.takeProfit) {
      const takeProfitParams = {
        productType: "USDT-FUTURES" as const,
        symbol: intent.symbol,
        marginCoin: "USDT",
        planType: "profit_plan" as const,
        triggerPrice: String(intent.takeProfit),
        executePrice: String(intent.takeProfit),
        size: String(intent.quantity),
        side: intent.direction === "long" ? "sell" : "buy",
        triggerType: "fill_price" as const,
        holdSide: (intent.direction === "long" ? "long" : "short") as "long" | "short",
        clientOid: `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      const tpResult = await rest.futuresSubmitTPSLOrder(takeProfitParams);
      results.push({ type: 'take-profit', orderId: tpResult.data.orderId });
      logger.info(`✅ Take-profit placed: ${tpResult.data.orderId}`);
    }
    
    return { success: true, orders: results };
  } catch (error: any) {
    logger.error(`❌ Failed to place stop orders for ${intent.symbol}:`, error.message);
    throw error;
  }
};

/**
 * Get current positions
 */
export const getPositions = async (rest: RestClientV2, symbol?: string) => {
  try {
    logger.info(`📊 Getting positions${symbol ? ` for ${symbol}` : ''}`);
    
    const params = {
      productType: "USDT-FUTURES" as const,
      symbol: symbol || "",
      marginCoin: "USDT"
    };
    
    const result = await rest.getFuturesPosition(params);
    logger.info(`✅ Retrieved ${result.data.length} positions`);
    
    return { data: result.data };
  } catch (error: any) {
    logger.error(`❌ Failed to get positions:`, error.message);
    throw error;
  }
};

/**
 * Get account balance
 */
export const getBalance = async (rest: RestClientV2) => {
  try {
    logger.info(`💰 Getting account balance`);
    
    const result = await rest.getFuturesAccountAssets({
      productType: "USDT-FUTURES" as const
    });
    
    logger.info(`✅ Retrieved account balance`);
    return { data: result.data };
  } catch (error: any) {
    console.log(error)
    logger.error(`❌ Failed to get balance:`, error.message);
    throw error;
  }
};

/**
 * Cancel all orders for a symbol
 */
export const cancelAllOrders = async (rest: RestClientV2, symbol: string) => {
  try {
    logger.info(`🚫 Cancelling all orders for ${symbol}`);
    
    const result = await rest.futuresCancelAllOrders({
      symbol,
      productType: "USDT-FUTURES" as const,
      marginCoin: "USDT"
    });
    
    logger.info(`✅ Cancelled orders for ${symbol}`);
    return { success: true, result: result.data };
  } catch (error: any) {
    logger.error(`❌ Failed to cancel orders for ${symbol}:`, error.message);
    throw error;
  }
};

/**
 * Get order history
 */
export const getOrderHistory = async (rest: RestClientV2, symbol?: string, limit: number = 50) => {
  try {
    logger.info(`📈 Getting order history${symbol ? ` for ${symbol}` : ''}`);
    
    const endTime = Date.now();
    const startTime = endTime - (7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    const params = {
      productType: "USDT-FUTURES" as const,
      startTime: String(startTime),
      endTime: String(endTime),
      limit: String(limit),
      ...(symbol && { symbol })
    };
    
    const result = await rest.getFuturesHistoricOrders(params);
    logger.info(`✅ Retrieved ${result.data.entrustedList?.length || 0} historical orders`);
    
    return { data: result.data.entrustedList || [] };
  } catch (error: any) {
    logger.error(`❌ Failed to get order history:`, error.message);
    throw error;
  }
};