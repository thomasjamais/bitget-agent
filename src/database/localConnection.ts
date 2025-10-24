/**
 * Local database connection configuration
 * For development with local PostgreSQL
 */

import { Pool, PoolClient, PoolConfig } from "pg";
import { logger } from "../utils/logger.js";
import { DatabaseConfig } from "./types.js";

export class LocalDatabaseConnection {
  private pool: Pool | null = null;
  private config: DatabaseConfig;
  private readonly dbLogger = logger.child({
    component: "LocalDatabaseConnection",
  });

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Initialize database connection pool
   */
  async connect(): Promise<void> {
    try {
      const poolConfig: PoolConfig = {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: false, // Local development doesn't need SSL
        connectionTimeoutMillis: this.config.connectionTimeoutMillis || 10000,
        idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
        max: this.config.max || 10,
        min: 1,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      };

      this.pool = new Pool(poolConfig);

      // Test connection
      const client = await this.pool.connect();
      await client.query("SELECT NOW()");
      client.release();

      this.dbLogger.info("✅ Local database connection established");
    } catch (error: any) {
      this.dbLogger.error("❌ Failed to connect to local database:", {
        error: error.message,
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
      });
      throw error;
    }
  }

  /**
   * Get a client from the pool
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return await this.pool.connect();
  }

  /**
   * Execute a query with automatic connection management
   */
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    if (!this.pool) {
      throw new Error("Database not connected. Call connect() first.");
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      this.dbLogger.debug("Query executed", {
        duration: `${duration}ms`,
        rows: result.rowCount,
      });

      return result.rows;
    } catch (error: any) {
      this.dbLogger.error("Query failed:", {
        error: error.message,
        query: text.substring(0, 100) + "...",
        params: params?.length || 0,
      });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    if (!this.pool) {
      throw new Error("Database not connected. Call connect() first.");
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.pool !== null;
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.dbLogger.info("Local database connection closed");
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool) {
        return false;
      }

      const result = await this.query("SELECT 1 as health");
      return result.length > 0;
    } catch (error) {
      this.dbLogger.error("Health check failed:", error);
      return false;
    }
  }
}

// Singleton instance
let localDbConnection: LocalDatabaseConnection | null = null;

/**
 * Get local database connection instance
 */
export function getLocalDatabaseConnection(): LocalDatabaseConnection {
  if (!localDbConnection) {
    throw new Error(
      "Local database not initialized. Call initializeLocalDatabase() first."
    );
  }
  return localDbConnection;
}

/**
 * Initialize local database connection
 */
export async function initializeLocalDatabase(
  config: DatabaseConfig
): Promise<LocalDatabaseConnection> {
  if (localDbConnection) {
    return localDbConnection;
  }

  localDbConnection = new LocalDatabaseConnection(config);
  await localDbConnection.connect();
  return localDbConnection;
}

/**
 * Create local PostgreSQL configuration from environment variables
 */
export function createLocalDBConfig(): DatabaseConfig {
  const requiredEnvVars = [
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USERNAME",
    "DB_PASSWORD",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.log(`Missing environment variable: ${envVar}`);
      console.log(
        "Available environment variables:",
        Object.keys(process.env).filter((k) => k.startsWith("DB_"))
      );
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    database: process.env.DB_NAME!,
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    ssl: false, // Local development doesn't need SSL
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || "10000"
    ),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
    max: parseInt(process.env.DB_MAX_CONNECTIONS || "10"),
  };
}
