#!/usr/bin/env tsx

/**
 * Database rollback script
 * Run this to rollback the last migration
 */

import { initializeDatabase, createAWSRDSConfig } from "./connection.js";
import { MigrationManager } from "./migrations.js";
import { logger } from "../utils/logger.js";

async function main() {
  try {
    const migrationVersion = process.argv[2];

    if (!migrationVersion) {
      logger.error("❌ Please specify migration version to rollback");
      logger.info("Usage: npm run db:rollback <version>");
      process.exit(1);
    }

    logger.info(`🔄 Rolling back migration ${migrationVersion}...`);

    // Initialize database connection
    const config = createAWSRDSConfig();
    await initializeDatabase(config);

    // Rollback migration
    const migrationManager = new MigrationManager();
    const allMigrations = migrationManager["getAllMigrations"]();
    const migration = allMigrations.find((m) => m.version === migrationVersion);

    if (!migration) {
      logger.error(`❌ Migration ${migrationVersion} not found`);
      process.exit(1);
    }

    await migrationManager.rollbackMigration(migration);

    logger.info(`✅ Migration ${migrationVersion} rolled back successfully`);
    process.exit(0);
  } catch (error: any) {
    logger.error("❌ Rollback failed:", error);
    process.exit(1);
  }
}

main();
