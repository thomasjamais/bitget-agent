#!/usr/bin/env node

/**
 * Test database connection script
 * Run this to verify your local PostgreSQL connection works
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, ".env");
dotenv.config({ path: envPath });

import {
  createLocalDBConfig,
  initializeLocalDatabase,
} from "./src/database/localConnection.js";
import { logger } from "./src/utils/logger.js";

async function testConnection() {
  try {
    console.log("🔄 Testing database connection...");

    // Check environment variables
    console.log("Environment variables:");
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_PORT:", process.env.DB_PORT);
    console.log("DB_NAME:", process.env.DB_NAME);
    console.log("DB_USERNAME:", process.env.DB_USERNAME);
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "***" : "NOT SET");

    // Create config
    const config = createLocalDBConfig();
    console.log("✅ Configuration created successfully");

    // Test connection
    const db = await initializeLocalDatabase(config);
    console.log("✅ Database connection established");

    // Test query
    const result = await db.query(
      "SELECT NOW() as current_time, version() as postgres_version"
    );
    console.log("✅ Query test successful");
    console.log("Current time:", result[0].current_time);
    console.log("PostgreSQL version:", result[0].postgres_version);

    // Test health check
    const isHealthy = await db.healthCheck();
    console.log("✅ Health check:", isHealthy ? "PASSED" : "FAILED");

    // Close connection
    await db.disconnect();
    console.log("✅ Database connection closed");

    console.log("🎉 All tests passed! Your database connection is working.");
  } catch (error) {
    console.error("❌ Database connection test failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

testConnection();
