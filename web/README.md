# Bitget Trading Bot - Web Dashboard

Real-time web dashboard for monitoring the Bitget trading bot with aggressive trading and portfolio balancing features.

## Features

📊 **Real-time Dashboard**
- Live portfolio overview with asset allocations
- Aggressive trading engine metrics
- Market data with price movements
- Trading opportunities analysis
- Recent trades history

⚡ **Aggressive Trading Monitoring**
- Daily trades counter
- Success rate tracking
- Opportunities identification
- Portfolio balance status

⚖️ **Portfolio Balancing**
- Target vs current allocations
- Deviation tracking
- Rebalancing recommendations
- Visual allocation charts

🔗 **WebSocket Integration**
- Real-time data streaming
- Auto-reconnection
- Error handling
- Connection status indicators

## Quick Start

### Development Mode

```bash
# Install dependencies
cd web
npm install

# Start development server
npm run dev

# Dashboard will be available at http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Architecture

```
web/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── globals.css      # Global styles with trading theme
│   │   ├── layout.tsx       # Root layout with sidebar navigation
│   │   └── page.tsx         # Main dashboard page
│   ├── components/          # React components
│   │   ├── DashboardHeader.tsx
│   │   ├── PortfolioOverview.tsx
│   │   ├── TradingMetrics.tsx
│   │   ├── MarketData.tsx
│   │   ├── TradingOpportunities.tsx
│   │   └── RecentTrades.tsx
│   ├── hooks/
│   │   └── useWebSocket.ts  # WebSocket connection hook
│   └── types/
│       └── bot.ts           # TypeScript type definitions
├── package.json
├── tsconfig.json
├── tailwind.config.js       # Tailwind CSS configuration
└── next.config.js           # Next.js configuration
```

## WebSocket API

The dashboard connects to the bot's WebSocket server at `ws://localhost:8080/ws`

### Message Types

```typescript
// Bot data update
{
  type: 'bot_update',
  data: BotData,
  timestamp: number
}

// Market data update
{
  type: 'market_update', 
  data: MarketData,
  timestamp: number
}

// Trade execution update
{
  type: 'trade_update',
  data: Trade,
  timestamp: number
}
```

## Configuration

### Environment Variables

Create `.env.local` in the web directory:

```bash
# WebSocket server URL
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# API endpoints
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Tailwind Theme

The dashboard uses a custom trading-focused theme with:
- Dark mode optimized for trading
- Color-coded profit/loss indicators
- Responsive grid layouts
- Real-time data animations

## Components Overview

### DashboardHeader
- Connection status indicator
- Last update timestamp
- Error notifications

### PortfolioOverview
- Total equity and portfolio value
- Asset allocation grid
- Deviation indicators
- Rebalancing status

### TradingMetrics
- Daily trades counter
- Success rate percentage
- Opportunities and executions
- System uptime

### MarketData
- Real-time price feeds
- 24h change indicators
- Volume and range data
- Price movement bars

### TradingOpportunities
- Confidence-based ranking
- Expected returns
- Risk scores
- Analysis reasoning

### RecentTrades
- Trade history table
- P&L calculations
- Status indicators
- Execution timestamps

## Development

### Adding New Components

1. Create component in `src/components/`
2. Add TypeScript interfaces
3. Import in main dashboard
4. Update WebSocket data structure if needed

### Styling Guidelines

- Use Tailwind utility classes
- Follow trading color conventions:
  - Green: profits, long positions
  - Red: losses, short positions
  - Yellow: warnings, pending
  - Blue: information, neutral

### WebSocket Integration

The `useWebSocket` hook handles:
- Automatic connection/reconnection
- Message parsing and validation
- Error handling and reporting
- Connection state management

## Production Deployment

For production deployment:

1. Build the application: `npm run build`
2. Configure reverse proxy (nginx/Apache)
3. Set up SSL certificates
4. Update WebSocket URLs for production
5. Configure environment variables

## Troubleshooting

**Connection Issues:**
- Check WebSocket server is running on port 8080
- Verify firewall settings
- Check browser console for WebSocket errors

**Build Issues:**
- Ensure Node.js version >= 18
- Clear node_modules and reinstall
- Check TypeScript compilation errors

**Styling Issues:**
- Verify Tailwind CSS is properly configured
- Check for conflicting CSS classes
- Ensure dark mode classes are applied

## License

MIT License - See main project LICENSE file.
