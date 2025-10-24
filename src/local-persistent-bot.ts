#!/usr/bin/env tsx

/**
 * Local Persistent Trading Bot Entry Point
 * This version uses local PostgreSQL database for state persistence
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../.env");
dotenv.config({ path: envPath });

import { LocalPersistentTradingBot } from "./database/localPersistentBot.js";
import { logger } from "./utils/logger.js";

async function main() {
  const mainLogger = logger.child({ component: "LocalMain" });

  try {
    mainLogger.info("🚀 Starting Local Persistent Bitget Trading Bot...");

    // Create local persistent bot instance
    const bot = new LocalPersistentTradingBot();

    // Start the bot
    await bot.start();

    // Log persistence status
    const persistenceStatus = bot.getPersistenceStatus();
    if (persistenceStatus.enabled) {
      mainLogger.info(
        `✅ Local state persistence enabled (Instance ID: ${persistenceStatus.botInstanceId})`
      );
    } else {
      mainLogger.warn(
        "⚠️ Local state persistence disabled - running in memory-only mode"
      );
    }

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      mainLogger.info(`📴 Received ${signal}, shutting down gracefully...`);

      try {
        await bot.stop();
        mainLogger.info("✅ Bot stopped successfully");
        process.exit(0);
      } catch (error: any) {
        mainLogger.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGUSR2", () => shutdown("SIGUSR2"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: any) => {
      mainLogger.error("❌ Uncaught exception:", error);
      shutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason: any, promise: any) => {
      mainLogger.error("❌ Unhandled rejection:", { reason, promise });
      shutdown("unhandledRejection");
    });

    mainLogger.info("✅ Local Persistent Trading Bot is running...");
  } catch (error: any) {
    mainLogger.error("❌ Failed to start local persistent trading bot:", error);
    process.exit(1);
  }
}

// Start the bot
main();
