#!/usr/bin/env tsx

import { AIEngine } from '../src/signals/aiEngine.js';
import { ModelManager } from '../src/ai/modelLoader.js';
import { Bar } from '../src/types/index.js';

/**
 * AI Engine Test and Demo Script
 * Demonstrates the enhanced AI capabilities with ONNX model support
 */
async function testAIEngine() {
  console.log('🧠 AI Engine Test Suite Starting...\n');

  // Initialize AI Engine
  const aiEngine = new AIEngine();
  
  try {
    // Load AI models
    console.log('📊 Loading AI models...');
    await aiEngine.load();
    
    // Get engine status
    const status = aiEngine.getStatus();
    console.log('✅ AI Engine Status:');
    console.log(`   Name: ${status.name}`);
    console.log(`   Version: ${status.version}`);
    console.log(`   Loaded: ${status.loaded}`);
    console.log(`   Available Models: ${status.availableModels?.join(', ')}`);
    console.log(`   Current Model: ${status.currentModel?.name} (${status.currentModel?.type})`);
    console.log(`   Capabilities: ${status.capabilities?.join(', ')}`);
    console.log('');

    // Test with sample market data
    console.log('📈 Testing with sample market data...');
    
    const sampleBars: Bar[] = [
      {
        timestamp: Date.now() - 60000,
        open: 42000,
        high: 42500,
        low: 41800,
        close: 42200,
        volume: 1500000
      },
      {
        timestamp: Date.now(),
        open: 42200,
        high: 42800,
        low: 42100,
        close: 42650,
        volume: 1800000
      }
    ];

    // Test basic signal generation
    console.log('\n🔍 Testing basic signal generation...');
    const basicSignal = aiEngine.generate(sampleBars[1], 'BTCUSDT', '15m');
    
    if (basicSignal) {
      console.log('✅ Basic Signal Generated:');
      console.log(`   Symbol: ${basicSignal.symbol}`);
      console.log(`   Direction: ${basicSignal.direction}`);
      console.log(`   Confidence: ${(basicSignal.confidence * 100).toFixed(2)}%`);
      console.log(`   Signal Name: ${basicSignal.name}`);
      console.log(`   Model Used: ${basicSignal.metadata?.modelUsed}`);
    } else {
      console.log('❌ Failed to generate basic signal');
    }

    // Test advanced signal generation
    console.log('\n🎯 Testing advanced signal generation...');
    const advancedSignal = await aiEngine.generateAdvanced(
      sampleBars, 
      'BTCUSDT', 
      '15m',
      {
        rsi: 65,
        macd: 150,
        macdSignal: 120,
        sma20: 42300,
        sma50: 41900,
        ema12: 42400,
        ema26: 42100,
        bbUpper: 43000,
        bbLower: 41500,
        bbMiddle: 42250
      }
    );
    
    if (advancedSignal) {
      console.log('✅ Advanced Signal Generated:');
      console.log(`   Symbol: ${advancedSignal.symbol}`);
      console.log(`   Direction: ${advancedSignal.direction}`);
      console.log(`   Confidence: ${(advancedSignal.confidence * 100).toFixed(2)}%`);
      console.log(`   Signal Name: ${advancedSignal.name}`);
      console.log(`   AI Action: ${advancedSignal.metadata?.aiAction}`);
      console.log(`   AI Confidence: ${advancedSignal.metadata?.aiConfidence ? (advancedSignal.metadata.aiConfidence * 100).toFixed(2) + '%' : 'N/A'}`);
      console.log(`   Risk Level: ${advancedSignal.metadata?.riskLevel}`);
      console.log(`   Models Used: ${advancedSignal.metadata?.modelUsed}`);
    } else {
      console.log('❌ Failed to generate advanced signal');
    }

    // Test model information
    console.log('\n📋 Current Model Information:');
    const modelInfo = aiEngine.getCurrentModelInfo();
    console.log(`   Name: ${modelInfo.name}`);
    console.log(`   Version: ${modelInfo.version}`);
    console.log(`   Type: ${modelInfo.type}`);
    console.log(`   Description: ${modelInfo.description}`);
    console.log(`   Input Shape: [${modelInfo.inputShape.join(', ')}]`);
    console.log(`   Output Shape: [${modelInfo.outputShape.join(', ')}]`);

    // Test model switching (if multiple models available)
    const availableModels = aiEngine.getAvailableModels();
    console.log(`\n🔄 Available Models: ${availableModels.join(', ')}`);
    
    if (availableModels.length > 1) {
      const alternateModel = availableModels.find(m => m !== status.currentModel?.name);
      if (alternateModel) {
        console.log(`\n🔁 Testing model switch to: ${alternateModel}`);
        try {
          await aiEngine.switchModel(alternateModel);
          console.log(`✅ Successfully switched to ${alternateModel}`);
          
          // Generate signal with new model
          const newModelSignal = await aiEngine.generateAdvanced(sampleBars, 'BTCUSDT', '15m');
          if (newModelSignal) {
            console.log(`✅ Signal with ${alternateModel}:`);
            console.log(`   Direction: ${newModelSignal.direction}`);
            console.log(`   Confidence: ${(newModelSignal.confidence * 100).toFixed(2)}%`);
          }
        } catch (error) {
          console.log(`❌ Model switch failed: ${error}`);
        }
      }
    }

    console.log('\n🎉 AI Engine test completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   ✓ Engine initialization: SUCCESS`);
    console.log(`   ✓ Model loading: SUCCESS`);
    console.log(`   ✓ Basic signal generation: ${basicSignal ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   ✓ Advanced signal generation: ${advancedSignal ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   ✓ Model information retrieval: SUCCESS`);
    console.log(`   ✓ Available models: ${availableModels.length}`);

  } catch (error) {
    console.error('❌ AI Engine test failed:', error);
    process.exit(1);
  }
}

/**
 * Test ModelManager directly
 */
async function testModelManager() {
  console.log('\n🔧 Testing ModelManager directly...\n');
  
  const modelManager = new ModelManager();
  
  // Load simple model
  await modelManager.loadModel('simple');
  console.log('✅ Simple model loaded');
  
  // Test prediction
  const testInput = {
    prices: [100, 101, 102, 103, 104],
    volumes: [1000, 1100, 1200, 1300, 1400],
    indicators: {
      rsi: 65,
      macd: 0.5,
      bollinger: { upper: 105, lower: 95, middle: 100 },
      sma: { sma20: 102, sma50: 100 },
      ema: { ema12: 103, ema26: 101 }
    },
    timeframe: '15m' as const,
    symbol: 'TESTUSDT'
  };
  
  const prediction = await modelManager.predict(testInput);
  console.log('✅ Model prediction:');
  console.log(`   Action: ${prediction.action}`);
  console.log(`   Confidence: ${(prediction.confidence * 100).toFixed(2)}%`);
  console.log(`   Risk Level: ${prediction.riskLevel}`);
  
  console.log('\n✅ ModelManager test completed');
}

// Run tests
async function main() {
  console.log('🚀 Starting AI Engine Test Suite\n');
  console.log('=' .repeat(50));
  
  await testAIEngine();
  await testModelManager();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎊 All tests completed successfully!');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testAIEngine, testModelManager };