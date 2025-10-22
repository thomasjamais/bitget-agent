#!/usr/bin/env tsx

/**
 * Diagnostic script to test allocation with different amounts
 * Helps identify the minimum working allocation amounts
 */

import { ConfigManager } from '../src/config/manager';

async function testAllocationAmounts() {
  console.log('🔍 Testing allocation amounts...');
  
  // Load configuration
  const configManager = new ConfigManager();
  const config = await configManager.loadConfig('./config/bot.yaml');
  if (!config?.portfolio?.targetAllocations) {
    console.error('❌ No portfolio configuration found');
    return;
  }

  const portfolio = config.portfolio;
  const minTradeAmount = portfolio.minTradeAmount || 10;
  console.log(`💰 Minimum trade amount: ${minTradeAmount} USDT`);
  console.log('📊 Target allocations:');
  
  // Show current allocations
  Object.entries(portfolio.targetAllocations).forEach(([symbol, percent]) => {
    const percentNum = percent as number;
    console.log(`   ${symbol}: ${(percentNum * 100).toFixed(1)}%`);
  });

  // Test different allocation amounts
  const testAmounts = [20, 30, 40, 50, 75, 100];
  
  console.log('\n🧪 Testing allocation amounts:');
  
  testAmounts.forEach(amount => {
    console.log(`\n💵 Testing ${amount} USDT:`);
    let validAllocations = 0;
    let totalValidPercent = 0;
    
    Object.entries(portfolio.targetAllocations).forEach(([symbol, percent]) => {
      const percentNum = percent as number;
      const symbolAmount = amount * percentNum;
      const isValid = symbolAmount >= minTradeAmount;
      
      console.log(`   ${symbol}: ${symbolAmount.toFixed(2)} USDT ${isValid ? '✅' : '❌'}`);
      
      if (isValid) {
        validAllocations++;
        totalValidPercent += percentNum;
      }
    });
    
    console.log(`   Result: ${validAllocations}/${Object.keys(portfolio.targetAllocations).length} valid (${(totalValidPercent * 100).toFixed(1)}% coverage)`);
  });

  // Calculate minimum required amount for full allocation
  const percentValues = Object.values(portfolio.targetAllocations) as number[];
  const maxPercent = Math.max(...percentValues);
  const minRequiredAmount = Math.ceil(minTradeAmount / maxPercent);
  
  console.log(`\n🎯 Minimum amount for full allocation: ${minRequiredAmount} USDT`);
  console.log(`   (Based on largest allocation: ${(maxPercent * 100).toFixed(1)}%)`);
}

// Run the test
testAllocationAmounts().catch(console.error);