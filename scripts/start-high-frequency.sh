#!/bin/bash

# 🚀 HIGH FREQUENCY TRADING BOT LAUNCHER
# Optimized for maximum refresh rate and responsiveness

echo "🔥 =================================================="
echo "🚀 BITGET HIGH FREQUENCY TRADING BOT"
echo "⚡ Maximum Refresh Rate Configuration"
echo "🔥 =================================================="
echo ""

# Set high frequency environment variables
export BITGET_ENVIRONMENT="HIGH_FREQUENCY"
export NODE_ENV="production"
export HIGH_FREQUENCY_MODE="true"

# Performance optimizations
export UV_THREADPOOL_SIZE=16
export NODE_MAX_OLD_SPACE_SIZE=4096

echo "🎯 Configuration Summary:"
echo "   • Monitoring Interval: 5 seconds (was 30s)"
echo "   • WebSocket Updates: 2 seconds (was 5s)"  
echo "   • Market Reports: 10 seconds (was 30s)"
echo "   • News Updates: 5 minutes (was 15min)"
echo "   • Default Timeframe: 1 minute (was 15min)"
echo "   • Max Daily Trades: 50 per symbol"
echo "   • Rebalancing: Every hour"
echo ""

echo "📊 Performance Metrics Expected:"
echo "   • 12x faster monitoring (5s vs 30s)"
echo "   • 2.5x faster dashboard updates (2s vs 5s)"
echo "   • 3x faster market analysis (10s vs 30s)"
echo "   • 3x more frequent news (5min vs 15min)"
echo "   • 15x faster timeframe analysis (1m vs 15m)"
echo ""

echo "⚠️  HIGH FREQUENCY MODE WARNINGS:"
echo "   • Higher API usage and potential costs"
echo "   • More intensive CPU and memory usage"
echo "   • Increased log file generation"
echo "   • More frequent trading (higher transaction fees)"
echo ""

read -p "🚀 Ready to start HIGH FREQUENCY mode? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔥 Starting High Frequency Trading Bot..."
    echo "📈 Using high-frequency configuration..."
    
    # Start with high frequency config
    npm start -- --config=config/high-frequency-bot.yaml
else
    echo "❌ High frequency mode cancelled"
    echo "💡 To use standard mode, run: npm start"
fi