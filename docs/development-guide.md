# Development and Deployment Guide

## Quick Start for Development

### 1. Initial Setup
```bash
# Run the automated setup
./setup.sh

# Or manually:
npm install
mkdir -p logs
cp .env.example .env
npm run build
```

### 2. Configuration
Edit your `.env` file:
```bash
BITGET_API_KEY=your-api-key-here
BITGET_API_SECRET=your-api-secret-here
BITGET_API_PASSPHRASE=your-passphrase-here
BITGET_USE_TESTNET=true  # ALWAYS start with testnet!
CONFIG_PATH=./config/bot.yaml
```

### 3. Customize Investment Instructions
Edit `config/bot.yaml` to define your trading strategies:

```yaml
instructions:
  - id: "my-first-strategy"
    name: "Conservative BTC Strategy"
    enabled: true
    symbols: ["BTCUSDT"]
    timeframes: ["5m"]
    direction: "both"
    risk:
      maxRiskPerTrade: 1.0
      maxLeverage: 5
      maxPositionsPerSymbol: 1
      maxTotalPositions: 2
    signals:
      minConfidence: 0.7
      cooldownMs: 300000  # 5 minutes
```

### 4. Development Commands

```bash
# Development mode with hot reload
npm run dev

# Build the project
npm run build

# Run production build
npm start

# Code quality checks
npm run lint
npm run lint:fix

# Clean build directory
npm run clean
```

## Understanding the Configuration System

### Investment Instructions Structure

Each investment instruction is a complete trading strategy with these key sections:

#### 1. Basic Information
- `id`: Unique identifier for tracking
- `name`: Human-readable name for logs
- `enabled`: Boolean to activate/deactivate

#### 2. Trading Parameters
- `symbols`: Array of trading pairs (e.g., `["BTCUSDT", "ETHUSDT"]`)
- `timeframes`: Analysis periods (e.g., `["1m", "5m", "1h"]`) 
- `direction`: `"long"`, `"short"`, or `"both"`

#### 3. Risk Management
- `maxRiskPerTrade`: Percentage of equity to risk (0.5-5.0%)
- `maxLeverage`: Maximum leverage multiplier (1-50x)
- `maxPositionsPerSymbol`: Limit concurrent positions
- `stopLossPercent`: Automatic stop loss distance
- `takeProfitPercent`: Automatic profit taking

#### 4. Signal Configuration
- `minConfidence`: Threshold for signal quality (0.0-1.0)
- `cooldownMs`: Minimum time between trades
- `requiredSources`: Array of required AI engines

#### 5. Schedule (Optional)
- `daysOfWeek`: Restrict to certain days [0-6]
- `startTime`/`endTime`: Daily active hours
- `timezone`: Time zone for scheduling

### Example Strategies

#### Scalping Strategy
```yaml
- id: "btc-scalp"
  name: "Bitcoin Scalping"
  enabled: true
  symbols: ["BTCUSDT"]
  timeframes: ["1m", "3m"]
  direction: "both"
  risk:
    maxRiskPerTrade: 0.5
    maxLeverage: 20
    maxPositionsPerSymbol: 3
    maxTotalPositions: 8
    stopLossPercent: 0.2
    takeProfitPercent: 0.4
  signals:
    minConfidence: 0.8
    cooldownMs: 60000  # 1 minute
```

#### Swing Trading Strategy
```yaml
- id: "eth-swing"
  name: "Ethereum Swing"
  enabled: true
  symbols: ["ETHUSDT"]
  timeframes: ["1h", "4h"]
  direction: "both"
  risk:
    maxRiskPerTrade: 2.0
    maxLeverage: 5
    maxPositionsPerSymbol: 1
    maxTotalPositions: 3
    stopLossPercent: 3.0
    takeProfitPercent: 8.0
  signals:
    minConfidence: 0.6
    cooldownMs: 3600000  # 1 hour
```

## Extending the Bot

### Adding Custom AI Engines

1. Create a new engine in `src/signals/`:

```typescript
import { AIEngine } from './aiEngine.js';
import { Signal, Bar, Timeframe } from '../types/index.js';

export class CustomAIEngine extends AIEngine {
  async generate(bar: Bar, symbol: string, timeframe: Timeframe): Promise<Signal | null> {
    // Your custom logic here
    const technicalIndicators = this.calculateIndicators(bar);
    const mlPrediction = await this.runMLModel(technicalIndicators);
    
    return {
      at: Date.now(),
      symbol,
      timeframe,
      direction: mlPrediction.direction,
      confidence: mlPrediction.confidence,
      name: "custom-ml-engine",
      metadata: { indicators: technicalIndicators }
    };
  }
  
  private calculateIndicators(bar: Bar) {
    // RSI, MACD, Bollinger Bands, etc.
    return {};
  }
  
  private async runMLModel(indicators: any) {
    // ONNX, TensorFlow.js, or API call
    return { direction: 'long', confidence: 0.75 };
  }
}
```

2. Register in your configuration:

```yaml
ai:
  engines:
    - name: "custom-ml-engine"
      enabled: true
      modelPath: "./models/my-model.onnx"
      parameters:
        inputFeatures: 15
        threshold: 0.7
```

### Custom Risk Management

Extend the `RiskManager` class:

```typescript
export class CustomRiskManager extends RiskManager {
  checkVolatilityRisk(symbol: string, atr: number): boolean {
    // Custom volatility-based risk checks
    const volatilityThreshold = 0.05; // 5%
    return atr / this.getCurrentPrice(symbol) < volatilityThreshold;
  }
  
  checkCorrelationRisk(newSymbol: string, existingPositions: PositionIntent[]): boolean {
    // Prevent highly correlated positions
    const correlationLimit = 0.8;
    return this.calculateCorrelation(newSymbol, existingPositions) < correlationLimit;
  }
}
```

### Adding New Exchanges

1. Create exchange adapter in `src/exchanges/`:

```typescript
export class BinanceClient {
  constructor(config: ExchangeConfig) {
    // Initialize Binance API
  }
  
  async placeOrder(intent: PositionIntent) {
    // Binance-specific order placement
  }
}
```

2. Abstract the exchange interface:

```typescript
export interface ExchangeClient {
  placeOrder(intent: PositionIntent): Promise<OrderResult>;
  getBalance(): Promise<Balance>;
  getPositions(): Promise<Position[]>;
}
```

## Production Deployment

### Environment Setup

1. **Server Requirements:**
   - Node.js 18+ 
   - 2GB+ RAM
   - Stable internet connection
   - SSL certificates for webhooks

2. **Environment Variables:**
```bash
NODE_ENV=production
BITGET_USE_TESTNET=false
LOG_LEVEL=info
CONFIG_PATH=/app/config/production.yaml
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY config/ ./config/

USER node
CMD ["node", "dist/index.js"]
```

### Process Management

Using PM2:
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'bitget-bot',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Monitoring & Alerts

1. **Health Checks:**
```typescript
app.get('/health', (req, res) => {
  const status = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    equity: botState.equity.USDT,
    positions: botState.positions.length,
    status: botState.isActive ? 'running' : 'paused'
  };
  res.json(status);
});
```

2. **Discord/Slack Notifications:**
```yaml
notifications:
  enabled: true
  webhooks:
    - "https://discord.com/api/webhooks/YOUR/WEBHOOK"
  email:
    enabled: true
    smtp:
      host: "smtp.gmail.com"
      port: 587
      user: "alerts@yourcompany.com"
      password: "app-password"
    to: ["trader@yourcompany.com"]
```

### Security Best Practices

1. **API Key Management:**
   - Use environment variables only
   - Rotate keys regularly
   - Limit API permissions to trading only
   - Use subaccounts if available

2. **Network Security:**
   - Whitelist IP addresses on Bitget
   - Use VPN for additional security
   - Monitor for unusual API usage

3. **Code Security:**
   - Keep dependencies updated
   - Use TypeScript strict mode
   - Validate all inputs
   - Log security events

### Backup & Recovery

1. **Configuration Backup:**
```bash
# Backup configs and logs
tar -czf backup-$(date +%Y%m%d).tar.gz config/ logs/ .env

# Sync to remote storage
aws s3 cp backup-*.tar.gz s3://your-backup-bucket/
```

2. **Database Backup (if using):**
```bash
# MongoDB example
mongodump --db bitget-bot --out /backups/$(date +%Y%m%d)

# PostgreSQL example  
pg_dump bitget_bot > /backups/bitget_bot_$(date +%Y%m%d).sql
```

## Troubleshooting

### Common Issues

1. **API Connection Errors:**
```bash
# Check API credentials
curl -H "BG-ACCESS-KEY: $API_KEY" https://api.bitget.com/api/mix/v1/account/account

# Verify network connectivity
ping api.bitget.com
```

2. **WebSocket Disconnections:**
   - Check internet stability
   - Implement exponential backoff
   - Monitor connection health

3. **Memory Leaks:**
```bash
# Monitor memory usage
pm2 monit

# Check for leaks
node --inspect dist/index.js
```

4. **Performance Issues:**
   - Profile with Node.js built-in profiler
   - Monitor CPU usage
   - Optimize signal generation frequency

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Enable Node.js debugging
node --inspect-brk dist/index.js
```

### Error Recovery

```typescript
// Implement graceful error handling
process.on('uncaughtException', async (error) => {
  logger.fatal(`Uncaught exception: ${error}`);
  await bot.emergencyStop();
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  logger.fatal(`Unhandled rejection: ${reason}`);
  await bot.emergencyStop();
  process.exit(1);
});
```

This development guide should help you iterate and improve your Bitget trading bot systematically!