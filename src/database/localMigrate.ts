#!/usr/bin/env tsx

/**
 * Local database migration script
 * Run this to apply all pending migrations to your local PostgreSQL
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../../.env");
console.log({ envPath });
dotenv.config({ path: envPath });

import {
  initializeLocalDatabase,
  createLocalDBConfig,
} from "./localConnection.js";
import { LocalMigrationManager } from "./localMigrations.js";
import { logger } from "../utils/logger.js";

async function main() {
  try {
    logger.info("🔄 Starting local database migration...");

    // Initialize database connection
    const config = createLocalDBConfig();
    console.log({ config });
    await initializeLocalDatabase(config);

    // Run migrations
    const migrationManager = new LocalMigrationManager();
    await migrationManager.runMigrations();

    logger.info("✅ Local database migration completed successfully");
    process.exit(0);
  } catch (error: any) {
    logger.error("❌ Local migration failed:", error);
    process.exit(1);
  }
}

main();
