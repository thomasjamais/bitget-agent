#!/usr/bin/env node
/**
 * Test script for Enhanced AI Engine with News Intelligence
 */

import 'dotenv/config';
import { EnhancedAIEngine } from '../src/ai/EnhancedAIEngine.js';
import { Bar } from '../src/types/index.js';
import { logger } from '../src/utils/logger.js';

async function testEnhancedAI() {
  console.log('🧠 Testing Enhanced AI Engine with Geopolitical Intelligence...\n');

  // Check environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    console.log('Please add your OpenAI API key to your .env file:');
    console.log('OPENAI_API_KEY=your_api_key_here\n');
    return;
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    console.error('❌ PERPLEXITY_API_KEY not found in environment variables');
    console.log('Please add your Perplexity API key to your .env file:');
    console.log('PERPLEXITY_API_KEY=your_api_key_here\n');
    return;
  }

  try {
    // Initialize Enhanced AI Engine
    const enhancedAI = new EnhancedAIEngine();
    console.log('✅ Enhanced AI Engine created');

    // Initialize the engine
    console.log('🔧 Initializing Enhanced AI Engine (this may take a moment)...');
    await enhancedAI.initialize();
    console.log('✅ Enhanced AI Engine initialized successfully\n');

    // Create sample market data
    const sampleBars: Bar[] = [
      {
        open: 67500,
        high: 68200,
        low: 67300,
        close: 67800,
        volume: 1250000,
        timestamp: new Date('2025-10-22T10:00:00Z').getTime()
      },
      {
        open: 67800,
        high: 68500,
        low: 67700,
        close: 68200,
        volume: 1450000,
        timestamp: new Date('2025-10-22T10:15:00Z').getTime()
      }
    ];

    console.log('📊 Sample market data:');
    console.log(`  BTCUSDT: $${sampleBars[1].close.toLocaleString()} (${((sampleBars[1].close - sampleBars[0].close) / sampleBars[0].close * 100).toFixed(2)}%)`);
    console.log(`  Volume: ${sampleBars[1].volume.toLocaleString()}`);
    console.log();

    // Test symbols
    const testSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

    for (const symbol of testSymbols) {
      console.log(`🔍 Testing ${symbol}...`);

      try {
        // Fetch latest news analysis
        console.log(`  📰 Fetching news analysis for ${symbol.replace('USDT', '')}...`);
        const newsAnalysis = await enhancedAI['newsEngine'].fetchAndAnalyzeNews(symbol.replace('USDT', ''));
        
        console.log(`  📈 News Sentiment: ${newsAnalysis.overallSentiment.toUpperCase()} (${(newsAnalysis.confidence * 100).toFixed()}% confidence)`);
        console.log(`  📊 Market Impact: ST:${newsAnalysis.marketImpact.shortTerm.toFixed(2)} MT:${newsAnalysis.marketImpact.mediumTerm.toFixed(2)} LT:${newsAnalysis.marketImpact.longTerm.toFixed(2)}`);
        
        if (newsAnalysis.recommendations.length > 0) {
          console.log(`  💡 Key Insight: ${newsAnalysis.recommendations[0]}`);
        }

        // Generate enhanced signal
        console.log(`  🤖 Generating enhanced trading signal...`);
        const enhancedSignal = enhancedAI.generateEnhanced(sampleBars[1], symbol, '15m');
        
        if (enhancedSignal) {
          console.log(`  🎯 Enhanced Signal:`);
          console.log(`     Direction: ${enhancedSignal.direction.toUpperCase()}`);
          console.log(`     Technical Confidence: ${(enhancedSignal.confidence * 100).toFixed()}%`);
          console.log(`     Combined Confidence: ${(enhancedSignal.combinedConfidence * 100).toFixed()}%`);
          console.log(`     News Impact: ${enhancedSignal.newsImpact.sentiment} (${(enhancedSignal.newsImpact.confidence * 100).toFixed()}%)`);
          console.log(`     Risk Level: ${enhancedSignal.riskLevel.toUpperCase()}`);
          console.log(`     Technical Score: ${enhancedSignal.technicalScore.toFixed(3)}`);
          console.log(`     News Score: ${enhancedSignal.newsScore.toFixed(3)}`);
          
          if (enhancedSignal.geopoliticalFactors.length > 0) {
            console.log(`     Geopolitical Factor: ${enhancedSignal.geopoliticalFactors[0]}`);
          }
        } else {
          console.log(`  ⚠️ No signal generated for ${symbol}`);
        }

      } catch (symbolError: any) {
        console.error(`  ❌ Error testing ${symbol}:`, symbolError?.message || symbolError);
      }

      console.log();
    }

    // Generate comprehensive intelligence report
    console.log('📋 Generating comprehensive intelligence report...');
    const intelligenceReport = await enhancedAI.generateIntelligenceReport(testSymbols);
    console.log('\n' + intelligenceReport);

    // Show enhanced status
    console.log('📊 Enhanced AI Engine Status:');
    const status = enhancedAI.getEnhancedStatus();
    console.log(`  Enhanced Mode: ${enhancedAI.isEnhanced() ? '✅ ACTIVE' : '❌ DISABLED'}`);
    console.log(`  Available Models: ${status.availableModels.join(', ')}`);
    console.log(`  Current Model: ${status.currentModel.name}`);
    console.log(`  Technical Indicators Cached: ${status.technicalIndicatorsCached}`);
    console.log(`  News Engine: ${status.newsEngine.initialized ? '✅ READY' : '❌ NOT READY'}`);
    console.log(`  Features: ${status.features.join(', ')}`);

    console.log('\n✅ Enhanced AI Engine test completed successfully!');

  } catch (error) {
    console.error('❌ Enhanced AI Engine test failed:', error);
    
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      console.log('\n💡 Make sure you have a valid OpenAI API key in your .env file');
    }
    
    if (error instanceof Error && error.message.includes('PERPLEXITY_API_KEY')) {
      console.log('\n💡 Make sure you have a valid Perplexity API key in your .env file');
    }
  }
}

async function demonstrateFeatures() {
  console.log('\n🚀 Enhanced AI Engine Features:\n');
  
  console.log('📈 TECHNICAL ANALYSIS:');
  console.log('  • RSI (Relative Strength Index)');
  console.log('  • MACD (Moving Average Convergence Divergence)');
  console.log('  • EMA (Exponential Moving Averages)');
  console.log('  • Bollinger Bands');
  console.log('  • Volume Analysis\n');
  
  console.log('🌍 GEOPOLITICAL INTELLIGENCE:');
  console.log('  • Real-time news sentiment analysis');
  console.log('  • Regulatory developments tracking');
  console.log('  • Institutional adoption monitoring');
  console.log('  • Geopolitical events impact assessment');
  console.log('  • Market correlation with traditional assets\n');
  
  console.log('🧠 AI-POWERED FUSION:');
  console.log('  • Combined technical + news confidence scoring');
  console.log('  • Dynamic risk level assessment');
  console.log('  • Conflicting signal resolution');
  console.log('  • Multi-timeframe analysis');
  console.log('  • Adaptive signal weighting\n');
  
  console.log('📊 ENHANCED REPORTING:');
  console.log('  • Comprehensive market intelligence');
  console.log('  • Geopolitical factor identification');
  console.log('  • Risk-adjusted trading recommendations');
  console.log('  • Real-time sentiment tracking');
  console.log('  • Multi-asset correlation analysis\n');
}

// Run the test
console.log('🧪 Enhanced AI Engine Test Suite');
console.log('===============================================\n');

demonstrateFeatures().then(() => {
  testEnhancedAI().catch(console.error);
});

export { testEnhancedAI };