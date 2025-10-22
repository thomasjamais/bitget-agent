#!/usr/bin/env tsx

/**
 * Test simple des logs avec la nouvelle syntaxe Pino
 */

import { logger } from '../src/utils/logger.js';

console.log('🧪 Test simple des logs Pino...\n');

// Test 1: Log simple avec objet
const testObject = {
  message: 'Test message',
  code: '40001',
  data: {
    symbol: 'BTCUSDT',
    quantity: 15.00,
    nested: {
      deep: 'value',
      array: [1, 2, 3]
    }
  }
};

console.log('--- Test 1: Log avec objet ---');
logger.error({ testObject }, '🚨 Test avec objet complet');

// Test 2: Log avec propriétés individuelles 
console.log('\n--- Test 2: Log avec propriétés individuelles ---');
logger.error({ message: testObject.message }, '🚨 Message seul');
logger.error({ code: testObject.code }, '🚨 Code seul');
logger.error({ data: testObject.data }, '🚨 Data seul');

// Test 3: Log avec objet complexe comme dans executor
console.log('\n--- Test 3: Log complexe comme executor ---');
const mockError = {
  message: 'Bad Request',
  statusCode: 400,
  response: {
    data: {
      code: '40001',
      msg: 'Invalid order size'
    }
  }
};

logger.error({ 
  error: mockError,
  symbol: 'BTCUSDT' 
}, '❌ Erreur comme dans executor');

// Test 4: Vérifier configuration logger
console.log('\n--- Test 4: Configuration logger ---');
console.log('Logger level:', (logger as any).level);
console.log('Logger options:', JSON.stringify((logger as any).options, null, 2));

console.log('\n✅ Test terminé - vérifiez si les objets sont visibles!');