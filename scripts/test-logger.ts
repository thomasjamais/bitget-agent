#!/usr/bin/env tsx

import { logger, logWithObject } from '../src/utils/logger';

console.log('🧪 Testing logger configuration...\n');

// Test basique
logger.info('Test message simple');

// Test avec objet (nouvelle syntaxe)
logger.info({ testData: { symbol: 'BTCUSDT', price: 65000, metadata: { volume: 1500 } } }, 'Test avec objet intégré');

// Test avec notre fonction utilitaire
logWithObject.info('Test avec fonction utilitaire', {
  allocations: [
    { symbol: 'BTCUSDT', amount: 15.00, valid: true },
    { symbol: 'ETHUSDT', amount: 12.50, valid: true },
    { symbol: 'ADAUSDT', amount: 8.00, valid: false, reason: 'Below minimum' }
  ],
  summary: {
    total: 35.50,
    validCount: 2,
    rejectedCount: 1
  }
});

// Test avec erreur
logWithObject.error('Test erreur avec objet', {
  error: {
    message: 'Bad Request',
    code: 400,
    response: {
      data: {
        code: '40001',
        msg: 'Invalid order size'
      }
    }
  }
});

console.log('\n✅ Tests terminés');