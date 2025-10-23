#!/usr/bin/env node

/**
 * Test script to manually trigger auto-balancing and see detailed errors
 */

import { RestClientV2 } from "bitget-api";
import { SpotAutoBalancer } from "./src/portfolio/SpotAutoBalancer.js";
import { PortfolioTransfer } from "./src/portfolio/PortfolioTransfer.js";

async function testAutoBalance() {
  console.log("🧪 Testing Auto-Balance System...");

  try {
    // Initialize Bitget client
    const rest = new RestClientV2(
      process.env.BITGET_API_KEY || "",
      process.env.BITGET_API_SECRET || "",
      process.env.BITGET_API_PASSPHRASE || "",
      true // testnet
    );

    // Initialize portfolio transfer
    const portfolioTransfer = new PortfolioTransfer(rest, {
      apiKey: process.env.BITGET_API_KEY || "",
      apiSecret: process.env.BITGET_API_SECRET || "",
      apiPassphrase: process.env.BITGET_API_PASSPHRASE || "",
    });

    // Test configuration
    const config = {
      enabled: true,
      minUsdtThreshold: 1, // Very low threshold for testing
      checkIntervalMs: 10000, // 10 seconds
      targetAllocations: {
        BTCUSDT: 0.3,
        ETHUSDT: 0.25,
        BNBUSDT: 0.42,
        MATICUSDT: 0.03,
      },
    };

    console.log("📊 Configuration:", config);

    // Initialize auto-balancer
    const autoBalancer = new SpotAutoBalancer(rest, portfolioTransfer, config);

    console.log("🔍 Checking current Spot balances...");

    // Get current balances
    const balances = await portfolioTransfer.getPortfolioBalances();
    console.log("💰 Current balances:", {
      spot: balances.spot,
      futures: balances.futures,
    });

    // Test the balancing logic
    console.log("🎯 Testing auto-balance logic...");
    await autoBalancer.checkAndBalance();

    console.log("✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed with error:");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error status:", error.status);
    console.error("Full error:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
  }
}

// Run the test
testAutoBalance().catch(console.error);
