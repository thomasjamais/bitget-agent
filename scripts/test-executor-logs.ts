#!/usr/bin/env tsx

/**
 * Test des logs de trading/executor avec la nouvelle syntaxe Pino
 */

import { logger } from '../src/utils/logger';

console.log('🧪 Test des logs de trading/executor...\n');

// Simuler une erreur Bitget typique
const mockBitgetError = {
  message: 'Bad Request',
  code: '40001', 
  statusCode: 400,
  data: {
    code: '40001',
    msg: 'Invalid order size',
    requestTime: 1729610592000,
    data: null
  },
  response: {
    status: 400,
    statusText: 'Bad Request',
    data: {
      code: '40001',
      msg: 'Invalid order size',
      requestTime: 1729610592000,
      data: null
    }
  },
  constructor: { name: 'Error' }
};

const mockIntent = {
  symbol: 'BTCUSDT',
  direction: 'long' as const,
  quantity: 15.00,
  leverage: 1
};

// Test des logs d'erreur comme dans executor.ts
logger.error({ error: mockBitgetError, symbol: mockIntent.symbol }, `🚨 FULL ERROR OBJECT for ${mockIntent.symbol}`);
logger.error({ errorType: typeof mockBitgetError }, `🚨 ERROR TYPE`);
logger.error({ constructor: mockBitgetError.constructor.name }, `🚨 ERROR CONSTRUCTOR`);
logger.error({ keys: Object.keys(mockBitgetError) }, `🚨 ERROR KEYS`);

logger.error({ message: mockBitgetError.message }, `🚨 ERROR MESSAGE`);
logger.error({ code: mockBitgetError.code }, `🚨 ERROR CODE`);
logger.error({ data: mockBitgetError.data }, `🚨 ERROR DATA`);
logger.error({ response: mockBitgetError.response }, `🚨 RESPONSE`);

logger.error({ status: mockBitgetError.response.status }, `🚨 HTTP STATUS`);
logger.error({ statusText: mockBitgetError.response.statusText }, `🚨 HTTP STATUS TEXT`);
logger.error({ httpData: mockBitgetError.response.data }, `🚨 HTTP DATA`);

// Test du log d'ordre
const mockOrderParams = {
  productType: "USDT-FUTURES",
  symbol: "BTCUSDT",
  marginCoin: "USDT",
  marginMode: "crossed",
  size: "15.00",
  side: "buy",
  orderType: "market",
  clientOid: "bot_1729610592000_abc123"
};

logger.info({
  originalQuantity: 15.00,
  formattedSize: "15.00",
  side: "buy",
  orderType: "market",
  marginMode: "crossed"
}, `📊 Order Details for BTCUSDT`);

logger.info({ orderParams: mockOrderParams }, `📝 Submitting order`);

// Test du log d'échec final
logger.error({
  error: mockBitgetError.message,
  code: mockBitgetError.code,
  data: mockBitgetError.data,
  response: mockBitgetError.response?.data,
  intent: {
    symbol: mockIntent.symbol,
    direction: mockIntent.direction,
    quantity: mockIntent.quantity,
    leverage: mockIntent.leverage
  }
}, `❌ Failed to open position for ${mockIntent.symbol}`);

console.log('\n✅ Test terminé - tous les objets devraient être visibles!');