#!/usr/bin/env tsx

import { PortfolioTransfer } from "../src/portfolio/PortfolioTransfer.js";
import { RestClientV2 } from "bitget-api";

async function testTransfer() {
  console.log("🧪 Testing Portfolio Transfer with detailed logging...");

  // Create a mock REST client with valid format
  const rest = new RestClientV2({
    apiKey: "bg_test_key_12345678901234567890",
    apiSecret: "test_secret_12345678901234567890123456789012345678901234567890",
    apiPassphrase: "test_passphrase_12345678901234567890",
    baseUrl: "https://api.bitget.com",
  });

  // Create PortfolioTransfer with test credentials
  const portfolioTransfer = new PortfolioTransfer(rest, {
    apiKey: "test_api_key",
    apiSecret: "test_api_secret",
    apiPassphrase: "test_api_passphrase",
  });

  console.log("📤 Testing transfer: 10 USDT from spot to futures");

  try {
    const result = await portfolioTransfer.transferFunds({
      from: "spot",
      to: "futures",
      amount: 10,
      currency: "USDT",
    });

    console.log("✅ Transfer result:", result);
  } catch (error) {
    console.error("❌ Transfer failed:", error);
  }
}

testTransfer().catch(console.error);
