#!/usr/bin/env tsx

/**
 * Test script for Aggressive Trading Engine and Portfolio Balancer
 */

import 'dotenv/config';
import { logger } from '../src/utils/logger.js';
import { AggressiveDecisionEngine } from '../src/strategy/AggressiveDecisionEngine.js';
import { PortfolioBalancer } from '../src/portfolio/PortfolioBalancer.js';
import { Bar, Signal } from '../src/types/index.js';

async function testAggressiveTradingEngine() {
  console.log('🚀 Testing Aggressive Trading Engine');
  console.log('═══════════════════════════════════════════════════════');

  const decisionEngine = new AggressiveDecisionEngine();

  // Test data - simulate market conditions
  const testSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
  const currentEquity = 1000; // $1000 USDT

  console.log('📊 Testing Opportunity Evaluation...');

  for (const symbol of testSymbols) {
    try {
      // Create mock market data
      const marketData: Bar = {
        open: 50000,
        high: 51000,
        low: 49500,
        close: 50500,
        volume: 2000000,
        timestamp: Date.now()
      };

      // Create mock signal
      const signal: Signal = {
        at: Date.now(),
        symbol,
        timeframe: '15m',
        direction: Math.random() > 0.5 ? 'long' : 'short',
        confidence: 0.3 + Math.random() * 0.5, // 0.3 to 0.8
        name: 'test-signal',
        metadata: {
          ohlc: {
            open: marketData.open,
            high: marketData.high,
            low: marketData.low,
            close: marketData.close
          }
        }
      };

      // Evaluate opportunity
      const opportunity = await decisionEngine.evaluateOpportunity(
        symbol,
        signal,
        marketData,
        currentEquity
      );

      if (opportunity) {
        console.log(`✅ ${symbol}:`);
        console.log(`  Direction: ${opportunity.signal.direction}`);
        console.log(`  Confidence: ${(opportunity.confidence * 100).toFixed(1)}%`);
        console.log(`  Expected Return: ${opportunity.expectedReturn.toFixed(2)}%`);
        console.log(`  Risk Score: ${opportunity.riskScore.toFixed(2)}`);
        console.log(`  Priority: ${opportunity.priority.toFixed(2)}`);
        console.log(`  Reason: ${opportunity.reason}`);
        
        // Record successful trade
        decisionEngine.recordTrade(symbol, signal, true);
      } else {
        console.log(`❌ ${symbol}: No opportunity found`);
        decisionEngine.recordTrade(symbol, signal, false);
      }

      console.log('');

    } catch (error: any) {
      console.error(`  ❌ Error testing ${symbol}:`, error?.message || error);
    }
  }

  // Display decision metrics
  console.log('📈 Decision Engine Metrics:');
  const metrics = decisionEngine.getDecisionMetrics();
  console.log(`  Total Trades Today: ${metrics.totalTradesToday}`);
  console.log(`  Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
  console.log(`  Portfolio Balance: ${(metrics.portfolioBalance * 100).toFixed(1)}%`);
  console.log(`  Opportunities Found: ${metrics.opportunitiesIdentified}`);
  console.log(`  Trades Executed: ${metrics.tradesExecuted}`);

  // Generate daily report
  console.log('');
  console.log('📋 Daily Report:');
  console.log(decisionEngine.generateDailyReport());
}

async function testPortfolioBalancer() {
  console.log('⚖️ Testing Portfolio Balancer');
  console.log('═══════════════════════════════════════════════════════');

  const balancer = new PortfolioBalancer();
  await balancer.loadConfig();

  // Mock current positions (imbalanced portfolio)
  const mockPositions = [
    {
      symbol: 'BTCUSDT',
      size: 0.02, // $1000 at 50k = heavy BTC allocation
      markPrice: 50000,
      unrealizedPnl: 50
    },
    {
      symbol: 'ETHUSDT', 
      size: 0.1, // $300 at 3k = low ETH allocation
      markPrice: 3000,
      unrealizedPnl: 15
    }
  ];

  const currentPrices = new Map([
    ['BTCUSDT', 50000],
    ['ETHUSDT', 3000],
    ['BNBUSDT', 400],
    ['SOLUSDT', 150],
    ['ADAUSDT', 0.5],
    ['AVAXUSDT', 35],
    ['MATICUSDT', 0.8],
    ['DOTUSDT', 6]
  ]);

  console.log('📊 Updating portfolio positions...');
  balancer.updatePositions(mockPositions, currentPrices);

  const totalEquity = 1300; // $1300 total

  console.log('⚖️ Evaluating rebalancing needs...');
  const rebalanceActions = await balancer.evaluateRebalancing(totalEquity);

  if (rebalanceActions.length > 0) {
    console.log(`✅ Found ${rebalanceActions.length} rebalancing actions:`);
    
    const actionsWithSizes = balancer.calculateTradeSizes(rebalanceActions, currentPrices);
    
    actionsWithSizes.forEach(action => {
      console.log(`  ${action.action.toUpperCase()} ${action.symbol}:`);
      console.log(`    Amount: $${action.amountUSDT.toFixed(2)} USDT`);
      console.log(`    Quantity: ${action.targetQuantity.toFixed(4)}`);
      console.log(`    Priority: ${action.priority.toFixed(2)}`);
      console.log(`    Reason: ${action.reason}`);
      console.log('');
    });
  } else {
    console.log('✅ Portfolio is balanced - no rebalancing needed');
  }

  // Display portfolio reports
  console.log('📊 Portfolio Allocation Report:');
  console.log(balancer.getPortfolioReport());

  console.log('💡 Rebalancing Recommendations:');
  console.log(balancer.getRebalancingRecommendations(totalEquity));

  // Test configuration updates
  console.log('⚙️ Testing configuration updates...');
  
  const newAllocations = {
    'BTCUSDT': 0.35,    // Increase BTC to 35%
    'ETHUSDT': 0.30,    // Increase ETH to 30%
    'BNBUSDT': 0.20,    // Increase BNB to 20%
    'SOLUSDT': 0.10,    // Increase SOL to 10%
    'ADAUSDT': 0.03,    // Reduce others
    'AVAXUSDT': 0.02,
    'MATICUSDT': 0.00,  // Remove MATIC
    'DOTUSDT': 0.00     // Remove DOT
  };

  try {
    balancer.updateTargetAllocations(newAllocations);
    console.log('✅ Successfully updated target allocations');
  } catch (error: any) {
    console.error('❌ Failed to update allocations:', error?.message);
  }

  console.log('');
  console.log('📋 Updated Portfolio Configuration:');
  const config = balancer.getConfig();
  console.log(`  Symbols: ${config.symbols.length}`);
  console.log(`  Rebalance Threshold: ${(config.rebalanceThreshold * 100).toFixed(1)}%`);
  console.log(`  Min Trade Amount: $${config.minTradeAmount}`);
  console.log(`  Max Trade Amount: $${config.maxTradeAmount}`);
  console.log(`  Rebalance Interval: ${config.rebalanceInterval}h`);
}

async function testIntegratedSystem() {
  console.log('🔄 Testing Integrated System');
  console.log('═══════════════════════════════════════════════════════');

  console.log('🎯 Simulating real trading scenario...');

  const decisionEngine = new AggressiveDecisionEngine();
  const balancer = new PortfolioBalancer();
  
  await balancer.loadConfig();

  // Simulate finding multiple opportunities
  const opportunities = [];
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];

  for (const symbol of symbols) {
    const marketData: Bar = {
      open: 1000 + Math.random() * 49000,
      high: 0,
      low: 0,
      close: 0,
      volume: 500000 + Math.random() * 2000000,
      timestamp: Date.now()
    };
    
    marketData.high = marketData.open * (1 + Math.random() * 0.05);
    marketData.low = marketData.open * (1 - Math.random() * 0.05);
    marketData.close = marketData.low + Math.random() * (marketData.high - marketData.low);

    const signal: Signal = {
      at: Date.now(),
      symbol,
      timeframe: '15m',
      direction: Math.random() > 0.5 ? 'long' : 'short',
      confidence: 0.4 + Math.random() * 0.4,
      name: 'integrated-test',
      metadata: {
        ohlc: {
          open: marketData.open,
          high: marketData.high,
          low: marketData.low,
          close: marketData.close
        }
      }
    };

    const opportunity = await decisionEngine.evaluateOpportunity(
      symbol,
      signal,
      marketData,
      2000 // $2000 equity
    );

    if (opportunity) {
      opportunities.push(opportunity);
    }
  }

  console.log(`🎯 Found ${opportunities.length} trading opportunities`);

  // Sort by priority and show top opportunities
  opportunities.sort((a, b) => b.priority - a.priority);
  
  const topOpportunities = opportunities.slice(0, 3);
  
  topOpportunities.forEach((opp, index) => {
    console.log(`${index + 1}. ${opp.symbol} ${opp.signal.direction.toUpperCase()}:`);
    console.log(`   Confidence: ${(opp.confidence * 100).toFixed(1)}%`);
    console.log(`   Expected Return: ${opp.expectedReturn.toFixed(2)}%`);
    console.log(`   Priority: ${opp.priority.toFixed(2)}`);
    console.log(`   Risk: ${opp.riskScore.toFixed(2)}`);
    console.log('');
  });

  // Simulate portfolio rebalancing need
  console.log('⚖️ Checking portfolio balance...');
  
  const mockPositions = opportunities.slice(0, 2).map(opp => ({
    symbol: opp.symbol,
    size: Math.random() * 0.1,
    markPrice: opp.signal.metadata?.ohlc?.close || 1000,
    unrealizedPnl: (Math.random() - 0.5) * 100
  }));

  const currentPrices = new Map();
  opportunities.forEach(opp => {
    currentPrices.set(opp.symbol, opp.signal.metadata?.ohlc?.close || 1000);
  });

  balancer.updatePositions(mockPositions, currentPrices);
  const rebalanceActions = await balancer.evaluateRebalancing(2000);

  if (rebalanceActions.length > 0) {
    console.log(`⚖️ Need to rebalance ${rebalanceActions.length} positions`);
    rebalanceActions.slice(0, 2).forEach(action => {
      console.log(`  ${action.action.toUpperCase()} ${action.symbol}: $${action.amountUSDT.toFixed(2)}`);
    });
  } else {
    console.log('✅ Portfolio is well balanced');
  }

  console.log('');
  console.log('📊 Final System Metrics:');
  const metrics = decisionEngine.getDecisionMetrics();
  console.log(`  Active Opportunities: ${opportunities.length}`);
  console.log(`  Top Priority Trade: ${topOpportunities.length > 0 ? topOpportunities[0].symbol : 'None'}`);
  console.log(`  Rebalance Actions: ${rebalanceActions.length}`);
  console.log(`  System Health: ${metrics.portfolioBalance > 0.8 ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION'}`);
}

async function runAllTests() {
  console.log('🧪 AGGRESSIVE TRADING & PORTFOLIO BALANCER TESTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  try {
    await testAggressiveTradingEngine();
    console.log('\n');
    
    await testPortfolioBalancer();
    console.log('\n');
    
    await testIntegratedSystem();

    console.log('\n');
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('  1. Configure your target allocations in config/bot.yaml');
    console.log('  2. Adjust aggressive trading parameters');
    console.log('  3. Run the bot with: npm run dev');
    console.log('  4. Monitor aggressive trading and rebalancing reports');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error?.message || error);
    console.error('\nStack trace:', error?.stack);
    process.exit(1);
  }
}

// Run tests
runAllTests();