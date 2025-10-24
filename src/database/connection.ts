/**
 * Database connection manager for AWS RDS PostgreSQL
 */

import { Pool, PoolClient, PoolConfig } from "pg";
import { logger } from "../utils/logger.js";
import { DatabaseConfig, AWSRDSConfig } from "./types.js";

export class DatabaseConnection {
  private pool: Pool | null = null;
  private config: DatabaseConfig;
  private readonly dbLogger = logger.child({ component: "DatabaseConnection" });

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
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis || 10000,
        idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
        max: this.config.max || 20,
        min: 2,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      };

      this.pool = new Pool(poolConfig);

      // Test connection
      const client = await this.pool.connect();
      await client.query("SELECT NOW()");
      client.release();

      this.dbLogger.info("✅ Database connection established");
    } catch (error: any) {
      this.dbLogger.error("❌ Failed to connect to database:", {
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
   * Get connection pool stats
   */
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.dbLogger.info("Database connection closed");
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
let dbConnection: DatabaseConnection | null = null;

/**
 * Get database connection instance
 */
export function getDatabaseConnection(): DatabaseConnection {
  if (!dbConnection) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return dbConnection;
}

/**
 * Initialize database connection
 */
export async function initializeDatabase(
  config: DatabaseConfig
): Promise<DatabaseConnection> {
  if (dbConnection) {
    return dbConnection;
  }

  dbConnection = new DatabaseConnection(config);
  await dbConnection.connect();
  return dbConnection;
}

/**
 * Create AWS RDS configuration from environment variables
 */
export function createAWSRDSConfig(): AWSRDSConfig {
  const requiredEnvVars = [
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USERNAME",
    "DB_PASSWORD",
    "AWS_REGION",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.log({ env: process.env, requiredEnvVars, envVar });
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    database: process.env.DB_NAME!,
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    ssl: true,
    sslmode: "require",
    region: process.env.AWS_REGION!,
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || "10000"
    ),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
    max: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
  };
}
