#!/usr/bin/env node

/**
 * 🔍 DIAGNOSTIC DES POSITIONS BITGET
 * Teste la récupération des positions et diagnostique les problèmes
 */

import 'dotenv/config';
import { createBitget } from '../src/exchanges/bitget.js';
import { getBalance, getPositions } from '../src/trading/executor.js';
import { logger } from '../src/utils/logger.js';

async function diagnosticPositions() {
  console.log('🔥 ================================================');
  console.log('🔍 DIAGNOSTIC DES POSITIONS BITGET');
  console.log('⚡ Test de connectivité et récupération des données');
  console.log('🔥 ================================================');
  console.log('');

  try {
    // 1. Test de configuration des clés API
    console.log('🔑 Vérification des clés API...');
    const apiKey = process.env.BITGET_API_KEY;
    const apiSecret = process.env.BITGET_API_SECRET;
    const apiPassphrase = process.env.BITGET_API_PASSPHRASE;
    
    if (!apiKey || !apiSecret || !apiPassphrase) {
      console.error('❌ Clés API manquantes!');
      console.log('💡 Vérifiez votre fichier .env');
      return;
    }
    
    console.log('✅ Clés API configurées');
    console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
    console.log('');

    // 2. Initialisation du client Bitget
    console.log('🔌 Connexion à Bitget...');
    const environment = process.env.BITGET_ENVIRONMENT || 'testnet';
    const isTestnet = environment === 'testnet';
    
    console.log(`   Environnement: ${isTestnet ? '🧪 TESTNET' : '💸 MAINNET'}`);
    
    const { rest } = createBitget(apiKey, apiSecret, apiPassphrase, isTestnet);
    console.log('✅ Client Bitget initialisé');
    console.log('');

    // 3. Test de connectivité de base
    console.log('⏰ Test de connectivité...');
    try {
      const serverTime = await rest.getServerTime();
      console.log('✅ Serveur Bitget accessible');
      console.log(`   Heure serveur: ${new Date(serverTime.data.serverTime).toLocaleString()}`);
    } catch (error: any) {
      console.error('❌ Impossible de contacter le serveur Bitget');
      console.error(`   Erreur: ${error.message}`);
      return;
    }
    console.log('');

    // 4. Test de récupération du solde
    console.log('💰 Test de récupération du solde...');
    try {
      const balance = await getBalance(rest);
      console.log('✅ Solde récupéré avec succès');
      
      if (balance.data && Array.isArray(balance.data)) {
        console.log(`   Nombre d'actifs: ${balance.data.length}`);
        
        // Chercher USDT
        const usdtBalance = balance.data.find((b: any) => 
          b.marginCoin === 'USDT' || b.coin === 'USDT' || b.asset === 'USDT'
        );
        
        if (usdtBalance) {
          const available = parseFloat(
            usdtBalance.available || 
            (usdtBalance as any).availableBalance || 
            (usdtBalance as any).free || 
            '0'
          );
          console.log(`   💵 Solde USDT disponible: ${available.toFixed(2)} USDT`);
          
          if (available < 10) {
            console.log('⚠️  Solde USDT très faible - trading limité');
          }
        } else {
          console.log('⚠️  Aucun solde USDT trouvé');
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération du solde');
      console.error(`   Message: ${error.message}`);
      if (error.code) console.error(`   Code: ${error.code}`);
    }
    console.log('');

    // 5. Test de récupération des positions
    console.log('📊 Test de récupération des positions...');
    try {
      const positions = await getPositions(rest);
      console.log('✅ Positions récupérées avec succès');
      console.log(`   Nombre de positions: ${positions.data.length}`);
      
      if (positions.data.length > 0) {
        console.log('');
        console.log('📋 Détails des positions:');
        positions.data.forEach((pos: any, index: number) => {
          console.log(`   ${index + 1}. ${pos.symbol}:`);
          console.log(`      Taille: ${pos.size}`);
          console.log(`      Côté: ${pos.side}`);
          console.log(`      Prix d'entrée: ${pos.entryPrice}`);
          console.log(`      P&L: ${pos.unrealizedPnl || pos.uPnl || 'N/A'}`);
        });
      } else {
        console.log('📋 Aucune position ouverte trouvée');
        console.log('💡 C\'est normal si vous n\'avez pas encore effectué de trades');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des positions');
      console.error(`   Message: ${error.message}`);
      if (error.code) console.error(`   Code: ${error.code}`);
      
      // Diagnostic supplémentaire
      console.log('');
      console.log('🔍 Diagnostic supplémentaire:');
      
      if (error.message.includes('40001')) {
        console.log('   → Problème d\'authentification API');
        console.log('   💡 Vérifiez vos clés API et permissions');
      } else if (error.message.includes('40004')) {
        console.log('   → Signature API invalide');
        console.log('   💡 Vérifiez votre passphrase API');
      } else if (error.message.includes('40008')) {
        console.log('   → Paramètres invalides');
        console.log('   💡 L\'API peut ne pas supporter certains paramètres');
      } else if (error.message.includes('40301')) {
        console.log('   → Ressource non trouvée');
        console.log('   💡 Aucune position n\'existe pour ce symbole');
      } else {
        console.log('   → Erreur inconnue');
        console.log('   💡 Contactez le support Bitget si le problème persiste');
      }
    }
    console.log('');

    // 6. Test avec symboles spécifiques
    console.log('🎯 Test avec symboles spécifiques...');
    const testSymbols = ['BTCUSDT', 'ETHUSDT'];
    
    for (const symbol of testSymbols) {
      try {
        console.log(`   Test ${symbol}...`);
        const positions = await getPositions(rest, symbol);
        const count = positions.data.length;
        console.log(`   ✅ ${symbol}: ${count} position(s)`);
      } catch (error: any) {
        console.log(`   ⚠️  ${symbol}: Erreur (${error.message})`);
      }
    }
    
    console.log('');
    console.log('🎉 Diagnostic terminé!');
    console.log('');
    console.log('📝 Résumé:');
    console.log('• Si vous voyez "✅ Positions récupérées", l\'API fonctionne');
    console.log('• Si vous avez 0 positions, c\'est normal - vous n\'avez pas encore tradé');
    console.log('• Le bot peut fonctionner même sans positions existantes');
    console.log('• Les erreurs 40301 (non trouvé) sont normales sans positions');
    
  } catch (error: any) {
    console.error('💥 Erreur critique dans le diagnostic:');
    console.error(error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Exécution du diagnostic
diagnosticPositions().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});