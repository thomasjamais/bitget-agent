import 'dotenv/config';
import { createBitget } from '../src/exchanges/bitget.js';
import { open, getBalance, getPositions } from '../src/trading/executor.js';
import { PositionIntent } from '../src/types/index.js';
import { logger } from '../src/utils/logger.js';

/**
 * Test real order execution on Bitget
 * ⚠️ WARNING: This will place REAL orders on Bitget!
 * Make sure you're using testnet or very small amounts!
 */

async function testRealOrderExecution() {
  logger.info('🚨 WARNING: This test will place REAL orders on Bitget!');
  logger.info('Make sure BITGET_USE_TESTNET=true in your .env file!');
  logger.info('===============================================');
  
  // Check environment variables
  const apiKey = process.env.BITGET_API_KEY;
  const apiSecret = process.env.BITGET_API_SECRET;
  const apiPassphrase = process.env.BITGET_API_PASSPHRASE;
  const useTestnet = process.env.BITGET_USE_TESTNET === 'true';
  
  if (!apiKey || !apiSecret || !apiPassphrase) {
    logger.error('❌ Missing Bitget API credentials in .env file');
    logger.error('Required: BITGET_API_KEY, BITGET_API_SECRET, BITGET_API_PASSPHRASE');
    process.exit(1);
  }
  
  if (!useTestnet) {
    logger.error('❌ SAFETY CHECK: Set BITGET_USE_TESTNET=true to use testnet!');
    logger.error('This prevents accidental real trades during testing');
    process.exit(1);
  }
  
  logger.info(`🔗 Connecting to Bitget ${useTestnet ? 'TESTNET' : 'MAINNET'}`);
  
  try {
    // Initialize Bitget client
    const { rest } = createBitget(apiKey, apiSecret, apiPassphrase, useTestnet);
    
    // Test 1: Get account balance
    logger.info('\\n📊 Test 1: Getting account balance...');
    const balance = await getBalance(rest);
    logger.info('Balance result:', balance);
    
    // Test 2: Get current positions
    logger.info('\\n📈 Test 2: Getting current positions...');
    const positions = await getPositions(rest);
    logger.info('Positions result:', positions);
    
    // Test 3: Place a small test order (DISABLED by default for safety)
    const ENABLE_ORDER_TEST = process.env.ENABLE_ORDER_TEST === 'true';
    
    if (ENABLE_ORDER_TEST) {
      logger.info('\\n🚀 Test 3: Placing small test order...');
      
      const testIntent: PositionIntent = {
        symbol: 'BTCUSDT_UMCBL', // Bitget futures symbol format
        direction: 'long',
        quantity: 0.001, // Very small amount for testing
        leverage: 2,
        orderType: 'market',
        stopLoss: undefined,
        takeProfit: undefined,
        reduceOnly: false
      };
      
      logger.warn('⚠️ About to place REAL order with these parameters:');
      logger.warn(JSON.stringify(testIntent, null, 2));
      logger.warn('Set ENABLE_ORDER_TEST=false to skip order placement');
      
      // Wait 3 seconds to allow user to cancel if needed
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const orderResult = await open(rest, testIntent);
      logger.info('✅ Order placed successfully:', orderResult);
      
      // Check positions after order
      logger.info('\\n📊 Checking positions after order...');
      const newPositions = await getPositions(rest, testIntent.symbol);
      logger.info('Updated positions:', newPositions);
      
    } else {
      logger.info('\\n⚠️ Test 3: Order placement DISABLED for safety');
      logger.info('Set ENABLE_ORDER_TEST=true in .env to enable real order testing');
    }
    
    logger.info('\\n✅ All API tests completed successfully!');
    logger.info('🎉 Real order execution is now ready!');
    
  } catch (error: any) {
    logger.error('❌ Test failed:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    process.exit(1);
  }
}

// Show usage instructions
function showInstructions() {
  logger.info('\\n💡 Setup Instructions:');
  logger.info('1. Create a .env file with your Bitget API credentials:');
  logger.info('   BITGET_API_KEY=your_api_key');
  logger.info('   BITGET_API_SECRET=your_api_secret');
  logger.info('   BITGET_API_PASSPHRASE=your_passphrase');
  logger.info('   BITGET_USE_TESTNET=true  # IMPORTANT: Use testnet for testing!');
  logger.info('   ENABLE_ORDER_TEST=false  # Set to true to enable real orders');
  logger.info('');
  logger.info('2. Get testnet credentials from: https://www.bitget.com/testnet');
  logger.info('3. Run: npm run test:orders');
  logger.info('');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  showInstructions();
  testRealOrderExecution().catch(console.error);
}

export { testRealOrderExecution };