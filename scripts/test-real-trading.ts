import { AIEngine } from '../src/signals/aiEngine.js';
import { createBitget } from '../src/exchanges/bitget.js';
import { configManager } from '../src/config/manager.js';
import { open } from '../src/trading/executor.js';
import { logger } from '../src/utils/logger.js';
import { PositionIntent, Bar } from '../src/types/index.js';

/**
 * Test script to force the bot to execute a real trade
 * This simulates optimal market conditions to trigger trading signals
 */
async function testRealTrading() {
  logger.info('🚀 Starting REAL TRADING TEST');

  try {
    // Load configuration
    const config = await configManager.loadConfig('./config/bot.yaml');
    
    // Initialize Bitget API
    const { rest } = createBitget(
      config.api.key,
      config.api.secret,
      config.api.passphrase,
      true // testnet
    );

    // Initialize AI Engine
    const aiEngine = new AIEngine();
    await aiEngine.load();

    logger.info('✅ Trading setup initialized');

    // Create optimal trading conditions for signal generation
    const optimalBars: Bar[] = [
      // Previous bar - bearish
      {
        open: 67000,
        high: 67200,
        low: 66500,
        close: 66700, // Down trend
        volume: 1200000,
        timestamp: Date.now() - 900000 // 15 minutes ago
      },
      // Current bar - bullish reversal
      {
        open: 66700,
        high: 67500,
        low: 66600,
        close: 67300, // Strong reversal up
        volume: 2500000, // High volume confirmation
        timestamp: Date.now()
      }
    ];

    logger.info('📈 Testing with optimal market conditions:');
    logger.info(`   Previous: ${optimalBars[0].close} (bearish)`);
    logger.info(`   Current: ${optimalBars[1].close} (bullish reversal)`);
    logger.info(`   Volume surge: ${(optimalBars[1].volume / optimalBars[0].volume * 100).toFixed(1)}%`);

    // Generate AI signal
    const currentBar = optimalBars[1];
    const signal = aiEngine.generate(currentBar, 'BTCUSDT', '15m');

    if (!signal) {
      logger.error('❌ No signal generated - AI engine issue');
      return;
    }

    logger.info('🎯 AI Signal Generated:', {
      symbol: 'BTCUSDT',
      direction: signal.direction,
      confidence: (signal.confidence * 100).toFixed(1) + '%',
      name: signal.name,
      price: currentBar.close
    });

    // Check if signal meets trading criteria
    if (signal.confidence < 0.6) {
      logger.warn(`⚠️ Signal confidence too low: ${(signal.confidence * 100).toFixed(1)}%`);
      
      // Force a high-confidence signal for testing
      signal.confidence = 0.85;
      logger.info('🔧 Boosted confidence to 85% for testing');
    }

    // Find matching trading instruction
    const instruction = config.instructions.find((inst: any) => 
      inst.enabled && 
      inst.symbols.includes('BTCUSDT') &&
      signal.confidence >= (inst.signals?.minConfidence || 0.7)
    );

    if (!instruction) {
      logger.error('❌ No matching instruction found for BTCUSDT');
      logger.info('Available instructions:', config.instructions.map((i: any) => ({
        id: i.id,
        symbols: i.symbols,
        enabled: i.enabled,
        minConfidence: i.signals?.minConfidence
      })));
      return;
    }

    logger.info('✅ Matched trading instruction:', {
      id: instruction.id,
      name: instruction.name,
      minConfidence: (instruction.signals.minConfidence * 100).toFixed(1) + '%'
    });

    // Calculate position parameters
    const equity = 131.13; // Current testnet balance
    const riskPercent = instruction.risk.maxRiskPerTrade;
    const leverage = instruction.risk.maxLeverage;
    const currentPrice = currentBar.close;
    
    // Calculate stop loss and take profit
    const stopLossPercent = instruction.risk.stopLossPercent || 2.5;
    const takeProfitPercent = instruction.risk.takeProfitPercent || 5.0;
    
    const stopLossPrice = signal.direction === 'long'
      ? currentPrice * (1 - stopLossPercent / 100)
      : currentPrice * (1 + stopLossPercent / 100);
    
    const takeProfitPrice = signal.direction === 'long'
      ? currentPrice * (1 + takeProfitPercent / 100)
      : currentPrice * (1 - takeProfitPercent / 100);
    
    // Calculate position size
    const riskAmount = equity * (riskPercent / 100);
    const priceRisk = Math.abs(currentPrice - stopLossPrice);
    const quantity = Math.floor((riskAmount / priceRisk) * 100) / 100;

    logger.info('📊 Position Calculation:', {
      equity: `$${equity}`,
      riskPercent: `${riskPercent}%`,
      riskAmount: `$${riskAmount.toFixed(2)}`,
      leverage: `${leverage}x`,
      quantity: quantity,
      stopLoss: stopLossPrice.toFixed(2),
      takeProfit: takeProfitPrice.toFixed(2)
    });

    // Create position intent
    const intent: PositionIntent = {
      symbol: 'BTCUSDT',
      direction: signal.direction,
      quantity: quantity,
      leverage: leverage,
      orderType: 'market',
      price: currentPrice,
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice
    };

    logger.info('🔥 EXECUTING REAL TRADE:', {
      symbol: intent.symbol,
      direction: intent.direction,
      quantity: intent.quantity,
      price: intent.price,
      leverage: intent.leverage,
      tradeValue: `$${(quantity * currentPrice * leverage).toFixed(2)}`
    });

    // Execute the trade
    try {
      const result = await open(rest, intent);
      
      logger.info('🎉 TRADE EXECUTED SUCCESSFULLY!', {
        orderId: result?.orderId || 'unknown',
        status: result?.status || 'submitted',
        symbol: intent.symbol,
        direction: intent.direction,
        quantity: intent.quantity,
        price: intent.price
      });

      // Log detailed trade summary
      logger.info('📋 TRADE SUMMARY:', {
        symbol: 'BTCUSDT',
        side: signal.direction.toUpperCase(),
        quantity: `${quantity} BTC`,
        entryPrice: `$${currentPrice}`,
        leverage: `${leverage}x`,
        notionalValue: `$${(quantity * currentPrice * leverage).toFixed(2)}`,
        stopLoss: `$${stopLossPrice.toFixed(2)}`,
        takeProfit: `$${takeProfitPrice.toFixed(2)}`,
        maxRisk: `$${riskAmount.toFixed(2)}`,
        potentialProfit: `$${(quantity * Math.abs(takeProfitPrice - currentPrice)).toFixed(2)}`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ TRADE EXECUTION FAILED:', {
        error: error instanceof Error ? error.message : String(error),
        symbol: intent.symbol,
        direction: intent.direction
      });
      
      if (error instanceof Error) {
        logger.debug('Full error details:', {
          message: error.message,
          stack: error.stack
        });
      }
    }

  } catch (error) {
    logger.error('❌ Test setup failed:', error);
  }
}

// Run the test
testRealTrading().then(() => {
  logger.info('✅ Real trading test completed');
  process.exit(0);
}).catch(error => {
  logger.error('❌ Fatal error in trading test:', error);
  process.exit(1);
});