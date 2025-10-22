#!/usr/bin/env tsx

import axios from "axios";
import crypto from "crypto";

async function testDirectTransfer() {
  console.log("🧪 Testing Direct Bitget Transfer API...");
  
  // Test credentials (these will fail but we'll see the detailed logs)
  const apiKey = "test_api_key_12345678901234567890";
  const apiSecret = "test_secret_12345678901234567890123456789012345678901234567890";
  const apiPassphrase = "test_passphrase_12345678901234567890";
  
  const transferParams = {
    fromType: "spot",
    toType: "mix_usdt_futures", 
    amount: "10",
    coin: "USDT"
  };
  
  console.log("📤 Transfer parameters:", transferParams);
  
  try {
    // Create timestamp and signature
    const timestamp = Date.now().toString();
    const method = 'POST';
    const requestPath = '/api/v2/spot/wallet/transfer';
    const body = JSON.stringify(transferParams);
    
    // Bitget signature format
    const message = timestamp + method + requestPath + body;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(message)
      .digest('base64');
    
    console.log("🔐 Signature details:", {
      timestamp,
      method,
      requestPath,
      body,
      signature: signature.substring(0, 10) + "..."
    });
    
    // Make the API call
    const response = await axios.post(
      `https://api.bitget.com${requestPath}`,
      transferParams,
      {
        headers: {
          'ACCESS-KEY': apiKey,
          'ACCESS-SIGN': signature,
          'ACCESS-TIMESTAMP': timestamp,
          'ACCESS-PASSPHRASE': apiPassphrase,
          'Content-Type': 'application/json',
          'locale': 'en-US'
        },
        timeout: 10000
      }
    );
    
    console.log("📥 Transfer response:", response.data);
    
    if (response.data && response.data.code === '00000') {
      console.log("✅ Transfer successful:", response.data);
    } else {
      console.log("❌ Transfer failed:", {
        code: response.data?.code,
        msg: response.data?.msg,
        data: response.data
      });
    }
  } catch (error: any) {
    console.error("❌ Transfer failed:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
  }
}

testDirectTransfer().catch(console.error);
