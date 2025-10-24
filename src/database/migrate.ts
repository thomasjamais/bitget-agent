#!/usr/bin/env tsx

/**
 * Database migration script
 * Run this to apply all pending migrations
 */

import { initializeDatabase, createAWSRDSConfig } from "./connection.js";
import { MigrationManager } from "./migrations.js";
import { logger } from "../utils/logger.js";

async function main() {
  try {
    logger.info("🔄 Starting database migration...");

    // Initialize database connection
    const config = createAWSRDSConfig();
    await initializeDatabase(config);

    // Run migrations
    const migrationManager = new MigrationManager();
    await migrationManager.runMigrations();

    logger.info("✅ Database migration completed successfully");
    process.exit(0);
  } catch (error: any) {
    console.log(error);
    logger.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
