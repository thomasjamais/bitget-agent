# Bitget Trading Bot

A comprehensive TypeScript-based automated trading bot for Bitget exchange with advanced configuration management and risk controls.

## 🚀 Features

- **Configurable Investment Instructions**: Define multiple trading strategies with specific parameters
- **Advanced Risk Management**: Position sizing, stop losses, daily loss limits, and consecutive loss protection
- **Real-time Market Data**: WebSocket integration for live price feeds
- **AI Signal Generation**: Extensible signal engine with support for ML models
- **Comprehensive Logging**: Structured logging with multiple levels and file output
- **Flexible Configuration**: Support for JSON and YAML configuration files
- **Safety Features**: Emergency stops, circuit breakers, and position throttling

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- Bitget account with API access
- TypeScript knowledge for customization

## ⚡ Quick Start

### 1. Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd bitget-agent
npm install
```

### 2. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Bitget API credentials
nano .env
```

**Required Environment Variables:**
```bash
BITGET_API_KEY=your-bitget-api-key
BITGET_API_SECRET=your-bitget-api-secret  
BITGET_API_PASSPHRASE=your-bitget-passphrase
BITGET_USE_TESTNET=true
```

### 3. Configure Investment Instructions

Edit `config/bot.yaml` to define your trading strategies:

```yaml
instructions:
  - id: "btc-scalp"
    name: "Bitcoin Scalping"
    enabled: true
    symbols: ["BTCUSDT"]
    timeframes: ["1m", "5m"]
    direction: "both"  # "long", "short", or "both"
    risk:
      maxRiskPerTrade: 1.0      # 1% risk per trade
      maxLeverage: 10           # Max 10x leverage
      maxPositionsPerSymbol: 2  # Max 2 positions per symbol
      maxTotalPositions: 5      # Max 5 total positions
      stopLossPercent: 0.5      # 0.5% stop loss
      takeProfitPercent: 1.0    # 1.0% take profit
    signals:
      minConfidence: 0.7        # Minimum 70% confidence
      cooldownMs: 300000        # 5 minute cooldown
```

### 4. Run the Bot

```bash
# Development mode with hot reload
npm run dev

# Production build and run
npm run build
npm start
```

## 📊 Configuration Guide

### Investment Instructions

Each investment instruction defines a complete trading strategy:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `id` | string | Unique identifier | `"btc-momentum"` |
| `name` | string | Human-readable name | `"Bitcoin Momentum"` |
| `enabled` | boolean | Whether strategy is active | `true` |
| `symbols` | array | Trading pairs to monitor | `["BTCUSDT", "ETHUSDT"]` |
| `timeframes` | array | Analysis timeframes | `["5m", "1h"]` |
| `direction` | string | Trade direction | `"both"` / `"long"` / `"short"` |

### Risk Management

#### Per-Instruction Risk:
```yaml
risk:
  maxRiskPerTrade: 2.0          # Max 2% risk per trade
  maxLeverage: 5                # Max 5x leverage
  maxPositionsPerSymbol: 1      # One position per symbol
  maxTotalPositions: 3          # Max 3 total positions
  stopLossPercent: 2.0          # 2% stop loss
  takeProfitPercent: 4.0        # 4% take profit
```

#### Global Risk Controls:
```yaml
globalRisk:
  maxEquityRisk: 10.0           # Max 10% total equity at risk
  maxDailyLoss: 5.0             # Stop trading at 5% daily loss
  maxConsecutiveLosses: 3       # Pause after 3 consecutive losses
  sizingMethod: "percent"       # Position sizing method
```

### Signal Configuration

```yaml
signals:
  minConfidence: 0.6            # Minimum signal confidence (0-1)
  requiredSources: ["ai-v1"]    # Required signal sources
  cooldownMs: 3600000           # 1 hour between trades
```

### Scheduling

Restrict trading to specific times:

```yaml
schedule:
  daysOfWeek: [1, 2, 3, 4, 5]   # Monday to Friday (0=Sunday)
  startTime: "09:00"            # Start time (24h format)
  endTime: "17:00"              # End time (24h format)  
  timezone: "UTC"               # Timezone
```

## 🛠️ Customization

### Adding Custom AI Engines

Create your own signal generator by extending the AI engine:

```typescript
import { AIEngine } from './src/signals/aiEngine.js';

class CustomAIEngine extends AIEngine {
  async generate(bar: Bar, symbol: string, timeframe: Timeframe): Promise<Signal | null> {
    // Your custom logic here
    // Can integrate ML models, technical indicators, etc.
    
    return {
      at: Date.now(),
      symbol,
      timeframe,
      direction: "long", // or "short"
      confidence: 0.85,
      name: "custom-engine"
    };
  }
}
```

### Position Sizing Strategies

The bot supports multiple position sizing methods:

- **`percent`**: Fixed percentage of equity
- **`fixed`**: Fixed dollar amount
- **`kelly`**: Kelly criterion (requires win rate data)
- **`volatility`**: ATR-based sizing

## 🔧 API Reference

### Configuration Manager

```typescript
import { configManager } from './src/config/manager.js';

// Load configuration
await configManager.loadConfig('./config/bot.yaml');

// Get active instructions
const activeInstructions = configManager.getActiveInstructions();

// Get instructions for specific symbol
const btcInstructions = configManager.getInstructionsForSymbol('BTCUSDT');
```

### Risk Manager

```typescript
import { RiskManager } from './src/risk/riskManager.js';

const riskManager = new RiskManager(10, 5, 3); // maxEquity, maxDaily, maxConsecutive

// Check if position is allowed
const riskCheck = riskManager.checkPositionRisk(intent, equity, positions);
if (riskCheck.allowed) {
  // Execute trade
}
```

## 📈 Examples

### Conservative DCA Strategy

```yaml
- id: "btc-dca"
  name: "Bitcoin DCA"
  enabled: true
  symbols: ["BTCUSDT"]
  timeframes: ["4h"]
  direction: "long"
  risk:
    maxRiskPerTrade: 0.5
    maxLeverage: 2
    maxPositionsPerSymbol: 1
    maxTotalPositions: 1
  signals:
    minConfidence: 0.4
    cooldownMs: 14400000  # 4 hours
```

### Aggressive Scalping

```yaml
- id: "scalp-multi"
  name: "Multi-Coin Scalping"
  enabled: true
  symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
  timeframes: ["1m", "3m"]
  direction: "both"
  risk:
    maxRiskPerTrade: 2.0
    maxLeverage: 20
    maxPositionsPerSymbol: 3
    maxTotalPositions: 10
    stopLossPercent: 0.3
    takeProfitPercent: 0.6
  signals:
    minConfidence: 0.8
    cooldownMs: 60000  # 1 minute
```

## 🚨 Safety & Risk Warnings

⚠️ **IMPORTANT SAFETY INFORMATION**

- **Paper Trading First**: Always test with `BITGET_USE_TESTNET=true` before real money
- **Start Small**: Begin with minimal position sizes and low leverage
- **Monitor Constantly**: Automated trading requires active supervision  
- **Risk Management**: Never risk more than you can afford to lose
- **Market Volatility**: Crypto markets are highly volatile and unpredictable
- **No Guarantees**: Past performance does not guarantee future results

### Recommended Safety Practices

1. **Testnet Testing**: Run for at least 1 week on testnet
2. **Gradual Scaling**: Start with 1% risk, increase slowly
3. **Multiple Safeguards**: Use stop losses, daily limits, and position limits
4. **Regular Monitoring**: Check bot status every few hours
5. **Kill Switch**: Know how to emergency stop the bot

## 🔍 Monitoring & Logging

### Log Levels

- `trace`: Very detailed debugging
- `debug`: Detailed operational info  
- `info`: General operational info (recommended)
- `warn`: Warning conditions
- `error`: Error conditions

### Log Files

Logs are written to `logs/bitget-bot.log` by default. Configure in `bot.yaml`:

```yaml
logging:
  level: "info"
  file: "logs/bot.log"
  maxFiles: 7        # Keep 7 days
  maxSize: "10MB"    # Max 10MB per file
```

## 🛠️ Development

### Project Structure

```
bitget-agent/
├── src/
│   ├── config/         # Configuration management
│   ├── exchanges/      # Bitget API integration  
│   ├── marketdata/     # Real-time data streams
│   ├── risk/          # Risk management
│   ├── signals/       # AI signal generation
│   ├── trading/       # Order execution
│   ├── utils/         # Utilities and helpers
│   └── index.ts       # Main application
├── config/            # Configuration files
├── types/             # TypeScript type definitions
├── examples/          # Example configurations
└── logs/              # Log files
```

### Available Scripts

```bash
npm run dev          # Development with hot reload
npm run build        # Build TypeScript
npm start            # Run built application  
npm run lint         # Check code quality
npm test             # Run tests (when implemented)
npm run clean        # Clean build directory
```

## ❓ FAQ

**Q: Can I run multiple bots simultaneously?**
A: Yes, use different configuration files and separate API keys if needed.

**Q: How do I add new trading pairs?**
A: Add symbols to the `marketData.symbols` array and relevant instruction `symbols` arrays.

**Q: Can I use this on other exchanges?**  
A: The architecture is modular, but currently only Bitget is supported.

**Q: How accurate are the AI signals?**
A: The default AI is basic. Replace with your own models for better performance.

**Q: What happens if the bot crashes?**
A: Positions remain open. Implement monitoring and alerting for production use.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes  
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## ⚠️ Disclaimer

This software is for educational and research purposes. Trading cryptocurrencies carries significant financial risk. The authors are not responsible for any financial losses. Use at your own risk and never trade with money you cannot afford to lose.

---

**Happy Trading! 🚀📈**