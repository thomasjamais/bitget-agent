# 📊 Bitget Trading Bot - Real-Time Dashboard

## Overview

The Bitget Trading Bot now includes a **real-time web dashboard** for monitoring all trading activities, portfolio balancing, and aggressive trading engine performance.

## 🚀 Quick Start

### Method 1: Run Everything Together

```bash
# Install all dependencies
npm run web:install

# Start bot + dashboard simultaneously  
npm run dev:full
```

### Method 2: Run Separately

```bash
# Terminal 1: Start the trading bot
npm run dev

# Terminal 2: Start the dashboard
npm run web:dev
```

### Method 3: Using Script

```bash
# Make script executable
chmod +x scripts/dev-with-dashboard.sh

# Run the development script
./scripts/dev-with-dashboard.sh
```

## 🔗 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Web Dashboard** | http://localhost:3000 | Main monitoring interface |
| **WebSocket API** | ws://localhost:8080/ws | Real-time data stream |
| **Bot Logs** | Terminal output | Detailed bot activity |

## 📊 Dashboard Features

### Main Dashboard
- **Portfolio Overview**: Real-time asset allocations and balances
- **Aggressive Trading Metrics**: Daily trades, success rates, opportunities
- **Market Data**: Live price feeds for all monitored cryptocurrencies
- **Trading Opportunities**: AI-identified trading signals with confidence scores
- **Recent Trades**: Complete trade history with P&L tracking

### Real-Time Updates
- ⚡ **30-second refresh cycle** for all data
- 🔄 **Auto-reconnection** if WebSocket disconnects
- 🟢 **Live connection indicator** in the header
- 📊 **Visual charts** and progress bars

### Portfolio Monitoring
- 🎯 **Target allocations** vs current positions
- ⚖️ **Rebalancing recommendations** with deviation alerts
- 📈 **Performance tracking** with P&L calculations
- 🔄 **Automatic updates** every 6 hours

### Aggressive Trading Engine
- ⚡ **35% minimum confidence** threshold (vs typical 60-80%)
- 📈 **15 trades per day** maximum per symbol
- 🎯 **Opportunity scoring** with priority ranking
- 📉 **Success rate tracking** and performance metrics

## 🎨 Dashboard Screenshots

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🚀 Bitget Trading Bot Dashboard                              ✅ Connected  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  💰 Portfolio Overview        ⚡ Aggressive Trading               │
│  Total Equity: $1,234.56        Daily Trades: 12/15                   │
│  Daily P&L: +$45.67             Success Rate: 83.5%                   │
│                                                                           │
│  BTC: 30.2% ───────● (30.0% target) 🟢 BALANCED                │
│  ETH: 28.1% ───────● (25.0% target) 🔴 OVERWEIGHT            │
│  BNB: 12.4% ────●     (15.0% target) 🟡 UNDERWEIGHT          │
│                                                                           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  📊 Market Data              🎯 Trading Opportunities            │
│  BTC: $67,234.56 (+2.4%)        🥇 ETHUSDT LONG                      │
│  ETH: $3,456.78  (-0.8%)           Confidence: 87.3%                   │
│  BNB: $567.89    (+1.2%)           Expected Return: 3.2%               │
│                                     Risk Score: 0.65                     │
│                                                                           │
│  📈 Recent Trades                                                    │
│  BTC  BUY   0.001  $67,200  +$12.34  ✅ FILLED  14:23:45             │
│  ETH  SELL  0.1    $3,450   -$5.67   ✅ FILLED  14:18:32             │
│                                                                           │
└────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Architecture

### Components

```
Bot Process (Port 8080)
├── Trading Engine
├── Portfolio Balancer  
├── Aggressive Decision Engine
└── WebSocket Server ─────────▶ Dashboard (Port 3000)
                            ├── React Components
                            ├── Real-time Charts
                            ├── WebSocket Client
                            └── Tailwind Styling
```

### Data Flow

1. **Bot generates data** (portfolio, trades, opportunities)
2. **WebSocket server broadcasts** every 30 seconds
3. **Dashboard receives updates** via WebSocket client
4. **UI components re-render** with new data
5. **Charts and tables update** in real-time

### Message Types

```typescript
// Complete bot status update
type: 'bot_update'
data: {
  timestamp, uptime, equity, dailyPnL,
  portfolio, aggressiveTrading, marketData,
  opportunities, recentTrades, aiEngine
}

// Individual market price update  
type: 'market_update'
data: { symbol, price, change, timestamp }

// Trade execution notification
type: 'trade_update'  
data: { symbol, side, amount, price, status }
```

## 🎨 Customization

### Adding New Metrics

1. **Update `BotData` interface** in `src/types/websocket.ts`
2. **Modify broadcast function** in `BotWebSocketAdapter.ts`
3. **Create new component** in `web/src/components/`
4. **Add to dashboard** in `web/src/app/page.tsx`

### Styling Changes

- **Colors**: Modify `tailwind.config.js` trading theme
- **Layout**: Update component CSS classes
- **Animations**: Add custom Tailwind animations

### New Pages

1. **Create page** in `web/src/app/[page]/page.tsx`
2. **Add navigation link** in layout sidebar
3. **Implement components** for the page content

## 🚫 Troubleshooting

### Connection Issues

```bash
# Check if WebSocket server is running
curl -I http://localhost:8080

# Check dashboard development server
curl -I http://localhost:3000

# Verify bot is broadcasting data
# Look for: "📡 Broadcasted data to X clients" in logs
```

### Build Issues

```bash
# Clear all dependencies and reinstall
rm -rf node_modules web/node_modules
npm install
npm run web:install

# Check for TypeScript errors
npx tsc --noEmit
cd web && npx tsc --noEmit
```

### Performance Issues

- **Reduce broadcast frequency** in `BotWebSocketAdapter.ts`
- **Limit data history** in components (e.g., last 50 trades)
- **Optimize React renders** with `useMemo` and `useCallback`

### Data Issues

- **Check WebSocket messages** in browser DevTools > Network > WS
- **Verify bot data structure** matches TypeScript interfaces
- **Test with mock data** if bot is not generating real data

## 🛡️ Security Considerations

### Development
- Dashboard runs on localhost only
- No authentication required for local development
- WebSocket server accepts all local connections

### Production 
- **Add authentication** to WebSocket server
- **Use HTTPS/WSS** for encrypted connections  
- **Configure firewall** to restrict access
- **Add rate limiting** to prevent abuse

## 🚀 Next Steps

1. **Start the dashboard**: `npm run dev:full`
2. **Open browser**: http://localhost:3000
3. **Monitor your bot**: Watch real-time trading activity
4. **Customize interface**: Add your own metrics and views
5. **Deploy to production**: Configure for live trading

Enjoy your real-time trading dashboard! 📊⚡🚀
