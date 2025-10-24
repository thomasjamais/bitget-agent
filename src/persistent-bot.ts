#!/usr/bin/env tsx

/**
 * Persistent Trading Bot Entry Point
 * This version includes state persistence for AWS deployment
 */

import "dotenv/config";
import { PersistentTradingBot } from "./database/persistentBot.js";
import { logger } from "./utils/logger.js";

async function main() {
  const mainLogger = logger.child({ component: "Main" });

  try {
    mainLogger.info("🚀 Starting Persistent Bitget Trading Bot...");

    // Create persistent bot instance
    const bot = new PersistentTradingBot();

    // Start the bot
    await bot.start();

    // Log persistence status
    const persistenceStatus = bot.getPersistenceStatus();
    if (persistenceStatus.enabled) {
      mainLogger.info(
        `✅ State persistence enabled (Instance ID: ${persistenceStatus.botInstanceId})`
      );
    } else {
      mainLogger.warn(
        "⚠️ State persistence disabled - running in memory-only mode"
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

    mainLogger.info("✅ Persistent Trading Bot is running...");
  } catch (error: any) {
    mainLogger.error("❌ Failed to start persistent trading bot:", error);
    process.exit(1);
  }
}

// Start the bot
main();
