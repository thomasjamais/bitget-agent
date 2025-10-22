import { RestClientV2, WebsocketClientV2 } from 'bitget-api';
import { logger } from '../utils/logger.js';

/**
 * Create Bitget API clients using v2 REST API
 */
export const createBitget = (apiKey: string, apiSecret: string, apiPassphrase: string, useTestnet: boolean = false) => {
  logger.info(`🔗 Connecting to Bitget ${useTestnet ? 'TESTNET' : 'MAINNET'}...`);
  
  // Log configuration for debugging (without exposing secrets)
  logger.info(`API Key: ${apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING'}`);
  logger.info(`API Secret: ${apiSecret ? 'PROVIDED' : 'MISSING'}`);
  logger.info(`API Passphrase: ${apiPassphrase ? 'PROVIDED' : 'MISSING'}`);
  
  const restConfig = {
    apiKey: apiKey,
    apiSecret: apiSecret,
    apiPass: apiPassphrase, // Note: bitget-api uses 'apiPass', not 'apiPassphrase'
    // Use correct URLs for Bitget
    baseUrl: 'https://api.bitget.com',
    // Enable sandbox mode for testnet
    enableDemoTrading: useTestnet,
    recvWindow: 10000,
  };

  const wsConfig = {
    apiKey: apiKey,
    apiSecret: apiSecret,
    apiPass: apiPassphrase, // Note: bitget-api uses 'apiPass', not 'apiPassphrase'
    // WebSocket configuration
    testnet: useTestnet,
    enableDemoTrading: useTestnet,
  };

  const rest = new RestClientV2(restConfig);
  const ws = new WebsocketClientV2(wsConfig);

  logger.info(`✅ Bitget API v2 client initialized (testnet: ${useTestnet})`);

  return { rest, ws };
};