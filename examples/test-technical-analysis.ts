import 'dotenv/config';
import { TechnicalAnalysisEngine } from '../src/signals/technicalEngine.js';
import { Bar } from '../src/types/index.js';
import { logger } from '../src/utils/logger.js';

/**
 * Example: Testing Technical Analysis Strategies
 * Run this to see how RSI, MACD, and Bollinger Bands strategies work
 */

const technicalEngine = new TechnicalAnalysisEngine();

// Mock price data for testing (Bitcoin-like price movements)
const mockBars: Bar[] = [
  // Simulate a price trend with various patterns
  { open: 50000, high: 50200, low: 49800, close: 50100, volume: 1000000, timestamp: Date.now() - 50000 },
  { open: 50100, high: 50300, low: 50000, close: 50250, volume: 1200000, timestamp: Date.now() - 49000 },
  { open: 50250, high: 50400, low: 50100, close: 50350, volume: 980000, timestamp: Date.now() - 48000 },
  { open: 50350, high: 50500, low: 50200, close: 50450, volume: 1100000, timestamp: Date.now() - 47000 },
  { open: 50450, high: 50600, low: 50300, close: 50550, volume: 1300000, timestamp: Date.now() - 46000 },
  
  // Price starts to decline (potential short setup)
  { open: 50550, high: 50600, low: 50300, close: 50400, volume: 1400000, timestamp: Date.now() - 45000 },
  { open: 50400, high: 50450, low: 50200, close: 50250, volume: 1500000, timestamp: Date.now() - 44000 },
  { open: 50250, high: 50300, low: 50000, close: 50100, volume: 1600000, timestamp: Date.now() - 43000 },
  { open: 50100, high: 50150, low: 49800, close: 49900, volume: 1700000, timestamp: Date.now() - 42000 },
  { open: 49900, high: 50000, low: 49600, close: 49700, volume: 1800000, timestamp: Date.now() - 41000 },
  
  // Oversold bounce (potential long setup)
  { open: 49700, high: 49750, low: 49400, close: 49500, volume: 2000000, timestamp: Date.now() - 40000 },
  { open: 49500, high: 49600, low: 49300, close: 49400, volume: 2100000, timestamp: Date.now() - 39000 },
  { open: 49400, high: 49500, low: 49200, close: 49300, volume: 2200000, timestamp: Date.now() - 38000 },
  { open: 49300, high: 49800, low: 49250, close: 49750, volume: 2500000, timestamp: Date.now() - 37000 },
  { open: 49750, high: 50000, low: 49700, close: 49950, volume: 2300000, timestamp: Date.now() - 36000 },
];

// Generate more bars to have enough data for indicators
function generateMoreBars(baseBars: Bar[], count: number): Bar[] {
  const allBars = [...baseBars];
  let lastPrice = baseBars[baseBars.length - 1].close;
  
  for (let i = 0; i < count; i++) {
    const volatility = 0.02; // 2% max move
    const change = (Math.random() - 0.5) * volatility * lastPrice;
    const newPrice = lastPrice + change;
    
    const high = newPrice + Math.random() * 0.01 * newPrice;
    const low = newPrice - Math.random() * 0.01 * newPrice;
    const volume = 1000000 + Math.random() * 1000000;
    
    allBars.push({
      open: lastPrice,
      high: Math.max(high, newPrice, lastPrice),
      low: Math.min(low, newPrice, lastPrice),
      close: newPrice,
      volume,
      timestamp: Date.now() - (35000 - i * 1000)
    });
    
    lastPrice = newPrice;
  }
  
  return allBars;
}

async function testTechnicalStrategies() {
  logger.info('🚀 Testing Technical Analysis Strategies (RSI + MACD + Bollinger Bands)');
  logger.info('================================================================');
  
  // Generate enough data for indicators (need at least 50 for getIndicators to work)
  const allBars = generateMoreBars(mockBars, 80); // Generate more bars to ensure we have enough
  
  logger.info(`📊 Generated ${allBars.length} price bars for analysis`);
  logger.info(`🔧 Note: Processing all bars, signals will start appearing after 50+ data points`);
  
  // Process ALL bars through the technical analysis engine (needed for proper data accumulation)
  for (let i = 0; i < allBars.length; i++) {
    const bar = allBars[i];
    const signal = await technicalEngine.analyze(bar, 'BTCUSDT', '5m');
    
    // Only show some signals after we have enough data (avoid spam)
    if (signal && i >= 50 && (i - 50) % 5 === 0) { // Show every 5th signal
      logger.info(`📈 SIGNAL #${Math.floor((i - 50) / 5) + 1}: ${signal.name.toUpperCase()}`, {
        direction: signal.direction,
        confidence: `${(signal.confidence * 100).toFixed(1)}%`,
        price: bar.close.toFixed(2)
      });
    }
  }
  
  logger.info('✅ Technical analysis test completed');
  
  // Show final indicator values
  const finalIndicators = technicalEngine.getIndicators('BTCUSDT');
  
  if (finalIndicators) {
    logger.info('📊 Final Indicator Values:');
    logger.info(`  RSI: ${finalIndicators.rsi.toFixed(2)}`);
    logger.info(`  MACD Line: ${finalIndicators.macd.macdLine.toFixed(4)}`);
    logger.info(`  MACD Signal: ${finalIndicators.macd.signalLine.toFixed(4)}`);
    logger.info(`  MACD Histogram: ${finalIndicators.macd.histogram.toFixed(4)}`);
    logger.info(`  BB Upper: ${finalIndicators.bb.upper.toFixed(2)}`);
    logger.info(`  BB Middle: ${finalIndicators.bb.middle.toFixed(2)}`);
    logger.info(`  BB Lower: ${finalIndicators.bb.lower.toFixed(2)}`);
    logger.info(`  BB Bandwidth: ${(finalIndicators.bb.bandwidth * 100).toFixed(2)}%`);
    logger.info(`  Data Points: ${finalIndicators.dataPoints}`);
  } else {
    logger.warn('⚠️ No final indicators available - this might indicate an issue with data processing');
    
    // Let's try to get some debug info
    logger.info('🔧 Debug info - trying to understand why indicators are missing...');
    
    // Check if we can access the internal price history (for debugging only)
    logger.info(`🔍 Total bars processed: ${allBars.length}`);
    logger.info(`� Bars analyzed (from index 50): ${allBars.length - 50}`);
    
    // Process ALL bars one more time to ensure data is in memory
    logger.info('🔄 Reprocessing all bars to ensure data is loaded...');
    for (let i = 0; i < allBars.length; i++) {
      const bar = allBars[i];
      await technicalEngine.analyze(bar, 'BTCUSDT', '5m');
    }
    
    // Process the last bar one more time to see what happens
    const lastBar = allBars[allBars.length - 1];
    logger.info(`📊 Last bar: Price=${lastBar.close.toFixed(2)}, Volume=${lastBar.volume.toLocaleString()}`);
    
    // Try to get indicators again after reprocessing
    const retryIndicators = technicalEngine.getIndicators('BTCUSDT');
    if (retryIndicators) {
      logger.info('✅ Success after reprocessing - Final Indicator Values:', {
        RSI: retryIndicators.rsi.toFixed(2),
        MACD: {
          line: retryIndicators.macd.macdLine.toFixed(4),
          signal: retryIndicators.macd.signalLine.toFixed(4),
          histogram: retryIndicators.macd.histogram.toFixed(4)
        },
        BollingerBands: {
          upper: retryIndicators.bb.upper.toFixed(2),
          middle: retryIndicators.bb.middle.toFixed(2),
          lower: retryIndicators.bb.lower.toFixed(2),
          bandwidth: `${(retryIndicators.bb.bandwidth * 100).toFixed(2)}%`
        },
        dataPoints: retryIndicators.dataPoints
      });
    } else {
      logger.error('❌ Still no indicators available even after reprocessing all bars');
      logger.error('🐛 This suggests there might be a bug in the TechnicalAnalysisEngine');
    }
  }
}

// Strategy explanations
function explainStrategies() {
  logger.info('');
  logger.info('🎯 STRATEGY EXPLANATIONS:');
  logger.info('========================');
  
  logger.info('1️⃣ RSI-MACD Reversal:');
  logger.info('   • LONG: RSI < 30 (oversold) + MACD bullish crossover');
  logger.info('   • SHORT: RSI > 70 (overbought) + MACD bearish crossover'); 
  logger.info('   • Best for: Range-bound markets, swing trading');
  logger.info('');
  
  logger.info('2️⃣ Bollinger Bands Mean Reversion:');
  logger.info('   • LONG: Price touches lower BB + RSI < 40');
  logger.info('   • SHORT: Price touches upper BB + RSI > 60');
  logger.info('   • Best for: Volatile sideways markets');
  logger.info('');
  
  logger.info('3️⃣ Triple Indicator Trend Following:');
  logger.info('   • LONG: RSI > 60 + MACD > 0 + Price > BB middle');
  logger.info('   • SHORT: RSI < 40 + MACD < 0 + Price < BB middle');
  logger.info('   • Best for: Strong trending markets');
  logger.info('');
  
  logger.info('4️⃣ Bollinger Bands Breakout:');
  logger.info('   • LONG: Price breaks above upper BB + volume spike + RSI > 55');
  logger.info('   • SHORT: Price breaks below lower BB + volume spike + RSI < 45');
  logger.info('   • Best for: Volatility expansions, news events');
  logger.info('');
  
  logger.info('5️⃣ MACD Momentum:');
  logger.info('   • LONG: MACD histogram increasing + price in BB middle range');
  logger.info('   • SHORT: MACD histogram decreasing + price in BB middle range');
  logger.info('   • Best for: Momentum trading, filtering false breakouts');
  logger.info('');
}

// Run the test
async function main() {
  explainStrategies();
  await testTechnicalStrategies();
  
  logger.info('');
  logger.info('💡 To use these strategies:');
  logger.info('1. Copy config/technical-strategies.yaml to config/bot.yaml');
  logger.info('2. Add your Bitget API credentials to .env'); 
  logger.info('3. Set BITGET_USE_TESTNET=true for safety');
  logger.info('4. Run: npm run dev');
  logger.info('');
  logger.info('⚠️  Always test on paper/demo first!');
}

main().catch(console.error);