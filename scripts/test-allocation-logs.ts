#!/usr/bin/env tsx

/**
 * Test rapide de la nouvelle configuration de logger
 * pour l'allocation de portfolio
 */

import { logger } from '../src/utils/logger';

console.log('🧪 Test des logs d\'allocation...\n');

// Simuler les données d'allocation comme dans le bot
const allocations = [
  {
    symbol: 'BTCUSDT',
    side: 'BUY',
    amount: 15.00,
    targetPercent: 0.30
  },
  {
    symbol: 'ETHUSDT', 
    side: 'BUY',
    amount: 12.50,
    targetPercent: 0.25
  }
];

const rejectedAllocations = [
  {
    symbol: 'MATICUSDT',
    targetAmount: 1.50,
    targetPercent: 0.03,
    reason: 'Amount 1.50 USDT < minimum 10 USDT'
  },
  {
    symbol: 'DOTUSDT',
    targetAmount: 1.00,
    targetPercent: 0.02,
    reason: 'Amount 1.00 USDT < minimum 10 USDT'
  }
];

// Test des logs comme dans le bot réel
logger.info('💰 Capital allocation summary for 50.00 USDT:');
logger.info(`✅ Approved allocations: ${allocations.length}`);
logger.info({ allocations }, '📊 APPROVED ALLOCATIONS DETAILS');

if (rejectedAllocations.length > 0) {
  logger.warn(`❌ Rejected allocations: ${rejectedAllocations.length}`);
  logger.warn({ rejectedAllocations }, '📊 REJECTED ALLOCATIONS DETAILS');
}

// Test d'une erreur d'allocation
const allocationError = {
  message: 'Bad Request',
  code: 400,
  response: {
    data: {
      code: '40001',
      msg: 'Invalid order size',
      details: 'Order size must be at least 10 USDT'
    }
  },
  symbol: 'BTCUSDT',
  amount: 15.00
};

logger.error('❌ Failed to execute portfolio allocation for BTCUSDT: Bad Request');
logger.error({ error: allocationError }, '🔴 FULL ALLOCATION ERROR');

console.log('\n✅ Test terminé - vérifiez que tous les objets s\'affichent correctement!');