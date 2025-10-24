#!/usr/bin/env node

/**
 * Monitor trades to verify the 40774 error fix
 */

import axios from "axios";

let lastTradeCount = 0;
let errorCount = 0;
let successCount = 0;

async function monitorTrades() {
  try {
    const response = await axios.get("http://localhost:8080/api/bot/status");
    const data = response.data;

    const currentTrades = data.aggressiveTrading?.tradesExecuted || 0;
    const currentErrors = data.aggressiveTrading?.errors || 0;

    if (currentTrades > lastTradeCount) {
      console.log(`🎯 New trade executed! Total: ${currentTrades}`);
      successCount++;
    }

    if (currentErrors > errorCount) {
      console.log(`❌ New error detected! Total: ${currentErrors}`);
      errorCount = currentErrors;
    }

    lastTradeCount = currentTrades;

    console.log(
      `📊 Status: ${data.aggressiveTrading?.tradesExecuted || 0} trades, ${
        data.aggressiveTrading?.opportunitiesFound || 0
      } opportunities`
    );
    console.log(`💰 Balance: $${data.equity} USDT`);
    console.log(
      `🔄 Uptime: ${Math.floor(data.uptime / 60)}m ${data.uptime % 60}s`
    );
  } catch (error) {
    console.error("❌ Error monitoring bot:", error.message);
  }
}

console.log("🔍 Monitoring trades for 40774 error fix...");
console.log("Press Ctrl+C to stop");

// Monitor every 5 seconds
setInterval(monitorTrades, 5000);

// Initial check
monitorTrades();
