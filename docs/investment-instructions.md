# Investment Instructions Documentation

This document explains how to create and configure investment instructions for your Bitget trading bot.

## Overview

Investment instructions are the core of your trading strategy. Each instruction defines:
- Which symbols to trade
- When to trade them  
- How much risk to take
- What signals to act on
- Risk management parameters

## Instruction Structure

```yaml
instructions:
  - id: "unique-strategy-id"
    name: "Human Readable Name"
    description: "Optional strategy description" 
    enabled: true
    symbols: ["BTCUSDT", "ETHUSDT"]
    timeframes: ["5m", "1h"]
    direction: "both"
    risk: { /* risk parameters */ }
    signals: { /* signal parameters */ }
    schedule: { /* optional schedule */ }
    parameters: { /* custom parameters */ }
```

## Detailed Parameters

### Basic Configuration

#### `id` (required)
Unique identifier for the strategy. Used internally for tracking.
```yaml
id: "btc-momentum-v1"
```

#### `name` (required)  
Human-readable name displayed in logs.
```yaml
name: "Bitcoin Momentum Strategy v1"
```

#### `enabled` (required)
Whether this instruction is active.
```yaml
enabled: true  # or false to disable
```

### Trading Configuration

#### `symbols` (required)
Array of trading pairs to monitor. Must be valid Bitget USDT-M futures symbols.
```yaml
symbols: 
  - "BTCUSDT"
  - "ETHUSDT"
  - "SOLUSDT"
```

#### `timeframes` (required)
Timeframes to analyze for signals. The bot will subscribe to market data for these intervals.
```yaml
timeframes: 
  - "1m"    # 1 minute
  - "5m"    # 5 minutes  
  - "15m"   # 15 minutes
  - "1h"    # 1 hour
  - "4h"    # 4 hours
  - "1d"    # 1 day
```

#### `direction` (required)
Allowed trade directions:
- `"long"` - Only buy/long positions
- `"short"` - Only sell/short positions  
- `"both"` - Allow both directions

```yaml
direction: "both"
```

### Risk Management

The `risk` section defines position sizing and risk controls:

```yaml
risk:
  maxRiskPerTrade: 1.0          # Max 1% of equity per trade
  maxLeverage: 10               # Maximum leverage to use
  maxPositionsPerSymbol: 2      # Max simultaneous positions per symbol
  maxTotalPositions: 5          # Max total positions across all symbols
  stopLossPercent: 0.5          # Stop loss at 0.5% (optional)
  takeProfitPercent: 1.5        # Take profit at 1.5% (optional)
```

#### Position Sizing

**`maxRiskPerTrade`**: Percentage of total equity to risk per trade
- Conservative: 0.5 - 1.0%
- Moderate: 1.0 - 2.0%  
- Aggressive: 2.0 - 5.0%

**`maxLeverage`**: Maximum leverage multiplier
- Conservative: 1-5x
- Moderate: 5-10x
- Aggressive: 10-50x (high risk)

#### Position Limits

**`maxPositionsPerSymbol`**: Prevents over-concentration in single assets
**`maxTotalPositions`**: Controls overall exposure

#### Stop Loss & Take Profit

**`stopLossPercent`**: Automatic stop loss distance (optional)
```yaml
stopLossPercent: 2.0  # Exit at 2% loss
```

**`takeProfitPercent`**: Automatic take profit distance (optional)  
```yaml
takeProfitPercent: 5.0  # Exit at 5% profit
```

### Signal Configuration

The `signals` section controls when trades are executed:

```yaml
signals:
  minConfidence: 0.7            # Minimum signal confidence (0.0 - 1.0)
  requiredSources: ["ai-v1"]    # Required AI engines (optional)
  cooldownMs: 300000            # 5 minutes between trades
```

**`minConfidence`**: Signal strength threshold
- Conservative: 0.8 - 0.9 (fewer, higher quality signals)
- Moderate: 0.6 - 0.8 (balanced approach)
- Aggressive: 0.4 - 0.6 (more signals, lower quality)

**`cooldownMs`**: Minimum time between trades in milliseconds
- Scalping: 60000 (1 minute)
- Short-term: 300000 (5 minutes)  
- Swing: 3600000 (1 hour)
- Position: 86400000 (24 hours)

### Schedule (Optional)

Restrict trading to specific times:

```yaml
schedule:
  daysOfWeek: [1, 2, 3, 4, 5]   # Monday-Friday (0=Sunday, 6=Saturday)
  startTime: "09:00"            # Start time (24h format)
  endTime: "17:00"              # End time (24h format)
  timezone: "UTC"               # Timezone
```

### Custom Parameters (Optional)

Add strategy-specific parameters:

```yaml
parameters:
  rsiOverbought: 70
  rsiOversold: 30
  volumeThreshold: 1.5
  trendStrength: 0.8
```

## Example Strategies

### 1. Conservative Bitcoin DCA

```yaml
- id: "btc-dca-conservative"
  name: "Bitcoin DCA (Conservative)"
  description: "Conservative dollar-cost averaging into Bitcoin"
  enabled: true
  symbols: ["BTCUSDT"]
  timeframes: ["1h", "4h"]
  direction: "long"
  risk:
    maxRiskPerTrade: 0.5
    maxLeverage: 2
    maxPositionsPerSymbol: 1
    maxTotalPositions: 1
    stopLossPercent: 10.0
    takeProfitPercent: 20.0
  signals:
    minConfidence: 0.5
    cooldownMs: 14400000  # 4 hours
  schedule:
    daysOfWeek: [1, 2, 3, 4, 5]
    startTime: "08:00"
    endTime: "18:00"
    timezone: "UTC"
```

### 2. Aggressive Multi-Asset Scalping

```yaml
- id: "multi-scalp-aggressive" 
  name: "Multi-Asset Scalping"
  description: "High-frequency scalping across major pairs"
  enabled: true
  symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "ADAUSDT"]
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
    requiredSources: ["ai-v1", "momentum-engine"]
    cooldownMs: 60000  # 1 minute
  parameters:
    volumeSpike: 2.0
    breakoutThreshold: 0.002
```

### 3. Trend Following Strategy

```yaml
- id: "trend-following"
  name: "Trend Following"
  description: "Follow strong trends with momentum confirmation"
  enabled: true
  symbols: ["BTCUSDT", "ETHUSDT"] 
  timeframes: ["1h", "4h"]
  direction: "both"
  risk:
    maxRiskPerTrade: 3.0
    maxLeverage: 5
    maxPositionsPerSymbol: 1
    maxTotalPositions: 2
    stopLossPercent: 5.0
    takeProfitPercent: 15.0
  signals:
    minConfidence: 0.75
    cooldownMs: 7200000  # 2 hours
  schedule:
    daysOfWeek: [1, 2, 3, 4, 5]
  parameters:
    trendStrength: 0.7
    momentumPeriod: 14
    volumeConfirmation: true
```

### 4. Range Trading Strategy

```yaml
- id: "range-trading"
  name: "Range Trading" 
  description: "Trade bounces in sideways markets"
  enabled: false  # Disabled by default
  symbols: ["ETHUSDT", "BNBUSDT"]
  timeframes: ["15m", "1h"]
  direction: "both"
  risk:
    maxRiskPerTrade: 1.5
    maxLeverage: 8
    maxPositionsPerSymbol: 2
    maxTotalPositions: 4
    stopLossPercent: 1.5
    takeProfitPercent: 3.0
  signals:
    minConfidence: 0.7
    cooldownMs: 1800000  # 30 minutes
  parameters:
    supportResistanceStrength: 0.8
    rangeSize: 0.05  # 5% range
```

## Best Practices

### Risk Management
1. **Start Conservative**: Begin with low risk per trade (0.5-1%)
2. **Diversify**: Don't put all capital in one strategy
3. **Test First**: Always test on demo/testnet first
4. **Monitor Closely**: Check bot performance regularly

### Signal Quality
1. **Higher Confidence**: Use higher `minConfidence` for better quality signals
2. **Cooldown Periods**: Prevent overtrading with appropriate cooldowns
3. **Multiple Sources**: Require consensus from multiple AI engines

### Position Management  
1. **Stop Losses**: Always use stop losses for risk control
2. **Position Limits**: Limit simultaneous positions to manage exposure
3. **Leverage Control**: Use lower leverage until proven profitable

### Strategy Development
1. **Single Focus**: Each instruction should have one clear strategy
2. **Backtesting**: Test strategies on historical data when possible
3. **Gradual Scaling**: Increase position sizes slowly as strategies prove profitable
4. **Documentation**: Keep detailed notes on strategy performance

## Validation Rules

The bot validates all instructions and will reject invalid configurations:

- `id` must be unique across all instructions
- `symbols` must be valid Bitget trading pairs
- `timeframes` must be supported values
- Risk percentages must be reasonable (0.1% - 10%)
- Leverage must be within Bitget limits (1 - 125x)
- Schedule times must be valid 24h format
- Stop loss must be less than take profit

## Testing Your Instructions

1. **Syntax Check**: Use YAML validator online
2. **Demo Mode**: Run with `BITGET_USE_TESTNET=true`  
3. **Small Positions**: Start with minimal position sizes
4. **Monitor Logs**: Watch for validation errors and trade execution
5. **Paper Trading**: Test for at least 1 week before real money

## Common Mistakes

1. **Too Aggressive**: High risk + high leverage = potential big losses
2. **No Stop Loss**: Always define exit strategies  
3. **Over-diversification**: Too many strategies can be hard to manage
4. **Insufficient Cooldown**: Can lead to overtrading and high fees
5. **Ignoring Schedule**: Trading during low liquidity periods

Remember: The goal is consistent, controlled profits over time, not quick gains!