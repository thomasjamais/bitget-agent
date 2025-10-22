# 🚀 Bitget Trading Bot - Enhanced AI & Real-Time Dashboard

A comprehensive TypeScript-based automated trading bot for Bitget exchange with **enhanced AI intelligence**, **aggressive trading engine**, **automatic portfolio balancing**, and **real-time web dashboard**.

## ✨ Latest Features (v2.0)

### 🧠 **Enhanced AI Engine**
- **Geopolitical Intelligence**: OpenAI GPT-4 + Perplexity API for news analysis
- **Technical + Fundamental Fusion**: Combines market data with geopolitical events
- **Real-time News Processing**: Automated sentiment analysis and impact assessment
- **Advanced Signal Generation**: Multi-layer confidence scoring

### ⚡ **Aggressive Trading Engine**
- **Low Confidence Threshold**: 35% minimum (vs typical 60-80%)
- **High-Frequency Trading**: Up to 15 trades per day per symbol
- **Opportunity Maximization**: Designed to capture maximum daily trading opportunities
- **Dynamic Risk Assessment**: Portfolio-aware position sizing

### ⚖️ **Automatic Portfolio Balancing**
- **8 Cryptocurrency Portfolio**: BTC, ETH, BNB, SOL, ADA, AVAX, MATIC, DOT
- **Target Allocations**: Configurable percentage targets per asset
- **Auto-Rebalancing**: Every 6 hours with 5% deviation threshold
- **Smart Execution**: Coordinated with trading engine for optimal timing

### 📊 **Real-Time Web Dashboard**
- **Live Monitoring**: WebSocket-powered real-time updates
- **Portfolio Overview**: Visual asset allocations and performance tracking
- **Trading Metrics**: Success rates, daily trades, opportunities identified
- **Market Data**: Live price feeds with 24h changes and volume
- **Trade History**: Complete P&L tracking with status indicators

## 🚀 Core Features

- **Advanced AI Integration**: Multiple AI models with geopolitical analysis
- **Real-time Market Data**: WebSocket integration for live price feeds  
- **Comprehensive Risk Management**: Position sizing, stop losses, and portfolio balancing
- **Web Dashboard**: Next.js-based real-time monitoring interface
- **Flexible Configuration**: YAML-based configuration with hot reloading
- **Production Ready**: Comprehensive logging, error handling, and monitoring

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

### 3. Configure Trading Bot

The bot comes with pre-configured settings for aggressive trading and portfolio balancing:

```yaml
# Enhanced AI Configuration
enhancedAI:
  enabled: true
  openai:
    model: "gpt-4"
    apiKey: "${OPENAI_API_KEY}"
  perplexity:
    apiKey: "${PERPLEXITY_API_KEY}"

# Aggressive Trading Configuration  
aggressiveTrading:
  enabled: true
  minConfidenceThreshold: 0.35    # Low threshold for maximum opportunities
  maxTradesPerSymbol: 15          # High daily limit
  riskPerTrade: 0.02              # 2% risk per trade

# Portfolio Balancing
portfolio:
  symbols: ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT", "AVAXUSDT", "MATICUSDT", "DOTUSDT"]
  targetAllocations:
    BTCUSDT: 0.30      # 30% Bitcoin
    ETHUSDT: 0.25      # 25% Ethereum
    BNBUSDT: 0.15      # 15% BNB
    SOLUSDT: 0.10      # 10% Solana
    ADAUSDT: 0.08      # 8% Cardano
    AVAXUSDT: 0.07     # 7% Avalanche
    MATICUSDT: 0.03    # 3% Polygon
    DOTUSDT: 0.02      # 2% Polkadot
```

### 4. Start Bot + Dashboard

```bash
# Method 1: Run bot + dashboard together (Recommended)
npm run dev:full

# Method 2: Run separately
# Terminal 1: Trading bot
npm run dev

# Terminal 2: Web dashboard  
npm run web:dev

# Method 3: Using script
chmod +x scripts/dev-with-dashboard.sh
./scripts/dev-with-dashboard.sh

# Production mode
npm run build
npm run web:build
npm start
```

## 📊 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Web Dashboard** | http://localhost:3000 | Real-time monitoring interface |
| **WebSocket API** | ws://localhost:8080/ws | Live data stream |
| **Bot Logs** | Terminal | Detailed trading activity |

## 📱 Dashboard Features

### 🖥️ **Real-Time Web Interface**
- **Portfolio Overview**: Live asset allocations with target vs current percentages
- **Trading Metrics**: Daily trades counter, success rate, opportunities found
- **Market Data**: Real-time price feeds for all 8 cryptocurrencies
- **Trading Opportunities**: AI-identified signals with confidence scores and analysis
- **Recent Trades**: Complete trade history with P&L tracking
- **Connection Status**: Live WebSocket connection indicator

### 📊 **Monitoring Capabilities**
- **30-Second Updates**: All data refreshed automatically
- **Auto-Reconnection**: Dashboard reconnects if connection drops  
- **Visual Indicators**: Color-coded profit/loss and allocation status
- **Responsive Design**: Works on desktop, tablet, and mobile

### 🎨 **Dashboard Preview**
```
┌─────────────────────────────────────────────────────────────┐
│  🚀 Bitget Trading Bot Dashboard              ✅ Connected  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💰 Portfolio Overview        ⚡ Aggressive Trading        │
│  Total Equity: $1,234.56      Daily Trades: 12/15         │
│  Daily P&L: +$45.67          Success Rate: 83.5%          │
│                                                             │
│  BTC: 30.2% ████████● (30.0%) 🟢 BALANCED                 │
│  ETH: 28.1% ███████● (25.0%) 🔴 OVERWEIGHT               │
│                                                             │
│  📊 Market Data              🎯 Trading Opportunities      │
│  BTC: $67,234 (+2.4%)       🥇 ETHUSDT LONG              │
│  ETH: $3,456 (-0.8%)           Confidence: 87.3%          │
└─────────────────────────────────────────────────────────────┘
```
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
# Bot Commands
npm run dev                    # Development with hot reload
npm run build                  # Build TypeScript
npm start                      # Run built application

# Dashboard Commands  
npm run web:install            # Install dashboard dependencies
npm run web:dev               # Start dashboard development server
npm run web:build             # Build dashboard for production
npm run web:start             # Start production dashboard

# Combined Commands
npm run dev:full              # Run bot + dashboard together

# Testing Commands
npm run test:aggressive       # Test aggressive trading engine
npm run test:enhanced-ai      # Test enhanced AI capabilities
npm run test:technical        # Test technical analysis
npm run test:trading          # Test real trading functionality

# Utility Commands
npm run lint                  # Check code quality
npm run clean                 # Clean build directories
```

## ❓ FAQ

**Q: How does the aggressive trading engine work?**
A: It uses a 35% minimum confidence threshold (vs typical 60-80%) to capture more opportunities, with up to 15 trades per day per symbol and intelligent risk management.

**Q: Can I customize the portfolio allocations?**
A: Yes, modify the `targetAllocations` in `config/bot.yaml` to set your preferred cryptocurrency percentages.

**Q: How accurate is the enhanced AI?**
A: The AI combines technical analysis with real-time geopolitical intelligence using OpenAI GPT-4 and Perplexity APIs for comprehensive market analysis.

**Q: Can I run multiple bots simultaneously?**
A: Yes, use different configuration files, separate API keys, and different ports for the dashboard.

**Q: What happens if the WebSocket connection drops?**
A: The dashboard automatically reconnects, and the bot continues trading independently with full logging.

**Q: How do I add new cryptocurrencies to the portfolio?**
A: Add symbols to both `marketData.symbols` and `portfolio.symbols` arrays, then set target allocations.

**Q: Can I disable the aggressive trading or portfolio balancing?**
A: Yes, set `aggressiveTrading.enabled: false` or modify settings in `config/bot.yaml`.

**Q: How do I configure the geopolitical intelligence?**
A: Set your OpenAI and Perplexity API keys in the environment variables and enable `enhancedAI.enabled: true`.

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

## 🆕 Recent Updates

### Version 2.0 - Enhanced AI & Real-Time Dashboard
- ✅ **Enhanced AI Engine**: Geopolitical intelligence with OpenAI + Perplexity
- ✅ **Aggressive Trading**: 35% confidence threshold for maximum opportunities  
- ✅ **Portfolio Balancing**: Automatic 8-crypto portfolio management
- ✅ **Web Dashboard**: Real-time monitoring with WebSocket streaming
- ✅ **Production Ready**: Comprehensive logging, error handling, and monitoring

### Quick Links
- 📊 **Dashboard Guide**: [DASHBOARD.md](DASHBOARD.md)
- 🧠 **AI Implementation**: [ENHANCED_AI_COMPLETE.md](ENHANCED_AI_COMPLETE.md)  
- ⚡ **Aggressive Trading**: [AI_IMPLEMENTATION_COMPLETE.md](AI_IMPLEMENTATION_COMPLETE.md)
- 🔧 **Setup Guide**: [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)

---

**Happy Trading with Enhanced AI! 🚀🧠�**