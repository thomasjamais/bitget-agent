# API Implementation Guide

This guide helps you complete the Bitget API v3 integration for the trading bot.

## Current Status

The bot is scaffolded with **placeholder implementations** for Bitget API calls. You need to update these with the actual Bitget API v3 methods.

### Files Requiring API Updates

1. **`src/exchanges/bitget.ts`** - Client initialization
2. **`src/trading/executor.ts`** - Order execution 
3. **`src/marketdata/stream.ts`** - WebSocket data streams

## Bitget API v3 Resources

- **Official Documentation:** https://bitgetlimited.github.io/apidoc/en/mix
- **Node.js SDK:** https://github.com/tiagosiebler/bitget-api
- **API Endpoints:** https://api.bitget.com/api/mix/v1/

## Implementation Steps

### 1. Update Client Initialization

Current placeholder in `src/exchanges/bitget.ts`:
```typescript
export const createBitget = (apiKey: string, apiSecret: string, apiPassphrase: string, useTestnet: boolean = false) => {
  const config = {
    apiKey,
    apiSecret,
    apiPassphrase,
    baseUrl: useTestnet ? 'https://api.bitgetapi.com' : 'https://api.bitget.com',
  };

  const rest = new FuturesClient(config);
  const ws = new WebsocketClientV2(config);

  return { rest, ws };
};
```

**Research needed:**
- Verify correct client class names in bitget-api v3
- Confirm configuration parameters
- Check testnet/mainnet URLs

### 2. Update Order Execution

Current placeholder in `src/trading/executor.ts`:
```typescript
export const open = async (rest: FuturesClient, intent: PositionIntent) => {
  // TODO: Update these method calls to match Bitget API v3
  // Set leverage first (method signature may vary)
  // await rest.setLeverage(symbol, marginCoin, leverage, holdSide);

  // Place the main order (method signature may vary)
  // const orderResult = await rest.submitOrder({
  //   symbol: intent.symbol,
  //   marginCoin: "USDT",
  //   size: String(intent.quantity),
  //   side,
  //   orderType: intent.orderType || "market",
  //   reduceOnly: intent.reduceOnly
  // });
  
  logger.warn('Order execution placeholder - update with actual Bitget API v3 methods');
  return { orderId: 'placeholder', status: 'success' };
};
```

**Methods to implement:**
- Set leverage: `setLeverage()`
- Place orders: `submitOrder()` or `placeOrder()`
- Get positions: `getPositions()`
- Get balance: `getBalance()`
- Cancel orders: `cancelOrder()`, `cancelAllOrders()`
- Order history: `getOrderHistory()`

### 3. Update WebSocket Streams

Current placeholder in `src/marketdata/stream.ts`:
```typescript
export const subscribeKlines = (
  ws: WebsocketClientV2,
  symbol: string,
  timeframe: Timeframe,
  onBar: (bar: Bar) => void | Promise<void>
) => {
  // TODO: Update this based on Bitget API v3 WebSocket documentation
  logger.info(`WebSocket subscription placeholder for ${symbol} ${timeframe}`);
  
  // Mock data simulation for development
  // Replace with actual WebSocket implementation
};
```

**WebSocket topics needed:**
- Candlestick/Kline data: `candle1m`, `candle5m`, etc.
- Order updates: `orders`
- Position updates: `positions`
- Balance updates: `account`

## Research Tasks

### 1. Study the Bitget API Documentation

Visit: https://bitgetlimited.github.io/apidoc/en/mix

Key sections to review:
- **Authentication:** API key, secret, passphrase setup
- **Futures Trading:** Order placement, position management
- **WebSocket:** Real-time data subscriptions
- **Rate Limits:** Request frequency limits
- **Error Codes:** Common error responses

### 2. Examine the Node.js SDK

Repository: https://github.com/tiagosiebler/bitget-api

Key files to check:
- Client initialization patterns
- Method signatures and parameters
- WebSocket event handling
- Error handling approaches

### 3. Test API Connectivity

Create a simple test script:
```typescript
import { FuturesClient } from 'bitget-api';

const client = new FuturesClient({
  apiKey: 'your-key',
  apiSecret: 'your-secret', 
  apiPassphrase: 'your-passphrase',
  // Add other required config
});

// Test basic connectivity
async function testConnection() {
  try {
    const balance = await client.getBalance();
    console.log('✅ API connection successful:', balance);
  } catch (error) {
    console.error('❌ API connection failed:', error);
  }
}

testConnection();
```

## Implementation Checklist

### Phase 1: Basic API Integration
- [ ] Update `FuturesClient` initialization
- [ ] Implement `getBalance()` method
- [ ] Implement `getPositions()` method
- [ ] Test basic API connectivity

### Phase 2: Order Management
- [ ] Implement `setLeverage()` method
- [ ] Implement `placeOrder()` method
- [ ] Implement `cancelOrder()` method
- [ ] Test order placement on testnet

### Phase 3: WebSocket Integration
- [ ] Update `WebsocketClientV2` setup
- [ ] Implement kline/candlestick subscription
- [ ] Handle WebSocket reconnection
- [ ] Test real-time data flow

### Phase 4: Advanced Features
- [ ] Implement stop-loss orders
- [ ] Implement take-profit orders
- [ ] Add order status tracking
- [ ] Add position monitoring

## Code Templates

### Order Placement Template
```typescript
export const open = async (rest: FuturesClient, intent: PositionIntent) => {
  try {
    // 1. Set leverage
    await rest.setLeverage({
      symbol: intent.symbol,
      marginCoin: "USDT",
      leverage: String(intent.leverage),
      holdSide: intent.direction === "long" ? "long" : "short"
    });

    // 2. Place order
    const orderParams = {
      symbol: intent.symbol,
      marginCoin: "USDT",
      size: String(intent.quantity),
      side: intent.direction === "long" ? "buy" : "sell",
      orderType: "market", // or "limit"
      // Add other required parameters
    };

    const result = await rest.placeOrder(orderParams);
    
    logger.info(`Order placed: ${result.orderId}`);
    return result;
    
  } catch (error) {
    logger.error(`Order failed: ${error}`);
    throw error;
  }
};
```

### WebSocket Template
```typescript
export const subscribeKlines = (
  ws: WebsocketClientV2,
  symbol: string,
  timeframe: Timeframe,
  onBar: (bar: Bar) => void
) => {
  const topic = `candle${timeframe}:${symbol}`;
  
  ws.on('update', (data) => {
    if (data.topic === topic) {
      const klineData = data.data[0];
      const bar: Bar = {
        open: parseFloat(klineData.open),
        high: parseFloat(klineData.high),
        low: parseFloat(klineData.low),
        close: parseFloat(klineData.close),
        volume: parseFloat(klineData.volume),
        timestamp: parseInt(klineData.timestamp)
      };
      
      onBar(bar);
    }
  });

  ws.subscribe([topic]);
  logger.info(`Subscribed to ${topic}`);
};
```

## Testing Strategy

### 1. Unit Tests
```typescript
// tests/trading.test.ts
describe('Trading Executor', () => {
  it('should place market order correctly', async () => {
    const mockClient = createMockClient();
    const intent = createTestIntent();
    
    const result = await open(mockClient, intent);
    
    expect(result.orderId).toBeDefined();
    expect(mockClient.placeOrder).toHaveBeenCalled();
  });
});
```

### 2. Integration Tests
```typescript
// tests/integration.test.ts
describe('Bitget Integration', () => {
  it('should connect to testnet successfully', async () => {
    const client = createTestnetClient();
    const balance = await client.getBalance();
    
    expect(balance).toBeDefined();
    expect(balance.data.length).toBeGreaterThan(0);
  });
});
```

### 3. Manual Testing Checklist
- [ ] API connection to testnet
- [ ] Balance retrieval
- [ ] Position queries
- [ ] Order placement (small amounts)
- [ ] Order cancellation
- [ ] WebSocket data reception
- [ ] Error handling

## Error Handling Patterns

### API Errors
```typescript
try {
  const result = await rest.placeOrder(params);
  return result;
} catch (error: any) {
  if (error.code === '40001') {
    throw new Error('Invalid API credentials');
  } else if (error.code === '40002') {
    throw new Error('Insufficient balance');
  } else if (error.code === '40003') {
    throw new Error('Symbol not supported');
  }
  
  throw error; // Re-throw unknown errors
}
```

### WebSocket Errors
```typescript
ws.on('error', (error) => {
  logger.error(`WebSocket error: ${error}`);
  
  // Implement exponential backoff reconnection
  setTimeout(() => {
    ws.reconnect();
  }, reconnectDelay * Math.pow(2, retryAttempt));
});
```

## Security Considerations

1. **API Key Management:**
   - Store keys in environment variables only
   - Use read-only keys for testing
   - Rotate keys regularly

2. **Rate Limiting:**
   - Implement request queuing
   - Respect API limits (typically 10-20 req/sec)
   - Add retry logic with backoff

3. **Data Validation:**
   - Validate all API responses
   - Sanitize user inputs
   - Check order parameters before submission

## Next Steps

1. **Start with Documentation:** Thoroughly read Bitget API v3 docs
2. **Simple Tests:** Create basic connectivity tests
3. **Incremental Implementation:** Update one method at a time
4. **Testnet First:** Always test on testnet before mainnet
5. **Production Deployment:** Only after thorough testing

Remember: The current bot provides a solid foundation with proper architecture, configuration management, and risk controls. The main task is connecting it to the real Bitget API!