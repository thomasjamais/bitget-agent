/**
 * Database migration system for schema updates
 */

import { getDatabaseConnection } from "./connection.js";
import { logger } from "../utils/logger.js";
import { Migration } from "./types.js";

export class MigrationManager {
  private readonly dbLogger = logger.child({ component: "MigrationManager" });

  /**
   * Initialize migrations table
   */
  async initializeMigrationsTable(): Promise<void> {
    try {
      const db = getDatabaseConnection();

      const query = `
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      await db.query(query);
      this.dbLogger.info("✅ Migrations table initialized");
    } catch (error: any) {
      this.dbLogger.error("❌ Failed to initialize migrations table:", error);
      throw error;
    }
  }

  /**
   * Get list of executed migrations
   */
  async getExecutedMigrations(): Promise<string[]> {
    try {
      const db = getDatabaseConnection();

      const query = "SELECT version FROM migrations ORDER BY executed_at";
      const result = await db.query<{ version: string }>(query);

      return result.map((row) => row.version);
    } catch (error: any) {
      this.dbLogger.error("Failed to get executed migrations:", error);
      return [];
    }
  }

  /**
   * Record migration as executed
   */
  async recordMigration(migration: Migration): Promise<void> {
    try {
      const db = getDatabaseConnection();

      const query = `
        INSERT INTO migrations (version, name, executed_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (version) DO NOTHING
      `;

      await db.query(query, [
        migration.version,
        migration.name,
        migration.executed_at || new Date(),
      ]);

      this.dbLogger.info(
        `✅ Recorded migration: ${migration.version} - ${migration.name}`
      );
    } catch (error: any) {
      this.dbLogger.error("Failed to record migration:", error);
      throw error;
    }
  }

  /**
   * Execute a migration
   */
  async executeMigration(migration: Migration): Promise<void> {
    try {
      const db = getDatabaseConnection();

      await db.transaction(async (client) => {
        // Execute the migration
        await client.query(migration.up);

        // Record the migration
        await client.query(
          "INSERT INTO migrations (version, name) VALUES ($1, $2)",
          [migration.version, migration.name]
        );
      });

      this.dbLogger.info(
        `✅ Executed migration: ${migration.version} - ${migration.name}`
      );
    } catch (error: any) {
      this.dbLogger.error(
        `❌ Failed to execute migration ${migration.version}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(migration: Migration): Promise<void> {
    try {
      const db = getDatabaseConnection();

      await db.transaction(async (client) => {
        // Execute the rollback
        await client.query(migration.down);

        // Remove the migration record
        await client.query("DELETE FROM migrations WHERE version = $1", [
          migration.version,
        ]);
      });

      this.dbLogger.info(
        `✅ Rolled back migration: ${migration.version} - ${migration.name}`
      );
    } catch (error: any) {
      this.dbLogger.error(
        `❌ Failed to rollback migration ${migration.version}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      await this.initializeMigrationsTable();

      const executedMigrations = await this.getExecutedMigrations();
      const allMigrations = this.getAllMigrations();

      const pendingMigrations = allMigrations.filter(
        (migration) => !executedMigrations.includes(migration.version)
      );

      if (pendingMigrations.length === 0) {
        this.dbLogger.info("✅ No pending migrations");
        return;
      }

      this.dbLogger.info(
        `🔄 Running ${pendingMigrations.length} pending migrations...`
      );

      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      this.dbLogger.info("✅ All migrations completed successfully");
    } catch (error: any) {
      this.dbLogger.error("❌ Migration failed:", error);
      throw error;
    }
  }

  /**
   * Get all available migrations
   */
  private getAllMigrations(): Migration[] {
    return [
      {
        version: "001",
        name: "create_initial_schema",
        up: `
          -- Bot instances table
          CREATE TABLE IF NOT EXISTS bot_instances (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name VARCHAR(255) NOT NULL,
              environment VARCHAR(50) NOT NULL CHECK (environment IN ('testnet', 'live')),
              status VARCHAR(50) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'paused', 'error')),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              last_heartbeat TIMESTAMP WITH TIME ZONE,
              config_snapshot JSONB,
              UNIQUE(name, environment)
          );

          -- Bot state snapshots
          CREATE TABLE IF NOT EXISTS bot_state_snapshots (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              bot_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
              timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              start_time BIGINT NOT NULL,
              equity JSONB NOT NULL,
              daily_pnl DECIMAL(20,8) NOT NULL DEFAULT 0,
              consecutive_losses INTEGER NOT NULL DEFAULT 0,
              is_active BOOLEAN NOT NULL DEFAULT true,
              pause_reason TEXT,
              metadata JSONB
          );

          -- Trading positions
          CREATE TABLE IF NOT EXISTS trading_positions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              bot_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
              symbol VARCHAR(50) NOT NULL,
              side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
              size DECIMAL(20,8) NOT NULL,
              entry_price DECIMAL(20,8) NOT NULL,
              mark_price DECIMAL(20,8),
              unrealized_pnl DECIMAL(20,8) DEFAULT 0,
              margin_used DECIMAL(20,8),
              leverage DECIMAL(5,2),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              closed_at TIMESTAMP WITH TIME ZONE,
              status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'liquidated')),
              metadata JSONB
          );

          -- Trade history
          CREATE TABLE IF NOT EXISTS trade_history (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              bot_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
              order_id VARCHAR(255),
              symbol VARCHAR(50) NOT NULL,
              side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
              size DECIMAL(20,8) NOT NULL,
              price DECIMAL(20,8) NOT NULL,
              fee DECIMAL(20,8) DEFAULT 0,
              pnl DECIMAL(20,8),
              trade_type VARCHAR(20) NOT NULL CHECK (trade_type IN ('open', 'close', 'rebalance', 'stop_loss', 'take_profit')),
              position_id UUID REFERENCES trading_positions(id),
              executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              metadata JSONB
          );

          -- Portfolio allocations
          CREATE TABLE IF NOT EXISTS portfolio_allocations (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              bot_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
              symbol VARCHAR(50) NOT NULL,
              target_allocation DECIMAL(5,4) NOT NULL,
              current_allocation DECIMAL(5,4) NOT NULL,
              quantity DECIMAL(20,8) NOT NULL,
              value_usdt DECIMAL(20,8) NOT NULL,
              mark_price DECIMAL(20,8) NOT NULL,
              timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(bot_instance_id, symbol, timestamp)
          );

          -- Risk metrics
          CREATE TABLE IF NOT EXISTS risk_metrics (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              bot_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
              timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              max_equity_risk DECIMAL(5,4) NOT NULL,
              max_daily_loss DECIMAL(5,4) NOT NULL,
              max_consecutive_losses INTEGER NOT NULL,
              current_equity_risk DECIMAL(5,4) NOT NULL,
              daily_pnl DECIMAL(20,8) NOT NULL,
              consecutive_losses INTEGER NOT NULL,
              risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
              metadata JSONB
          );

          -- AI predictions
          CREATE TABLE IF NOT EXISTS ai_predictions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              bot_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
              symbol VARCHAR(50) NOT NULL,
              prediction_type VARCHAR(50) NOT NULL,
              confidence DECIMAL(5,4) NOT NULL,
              predicted_value DECIMAL(20,8),
              predicted_direction VARCHAR(10),
              timeframe VARCHAR(20) NOT NULL,
              model_name VARCHAR(100),
              input_data JSONB,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              metadata JSONB
          );

          -- Market data snapshots
          CREATE TABLE IF NOT EXISTS market_data_snapshots (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              bot_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
              symbol VARCHAR(50) NOT NULL,
              timeframe VARCHAR(20) NOT NULL,
              open DECIMAL(20,8) NOT NULL,
              high DECIMAL(20,8) NOT NULL,
              low DECIMAL(20,8) NOT NULL,
              close DECIMAL(20,8) NOT NULL,
              volume DECIMAL(20,8) NOT NULL,
              timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
              metadata JSONB
          );

          -- Performance metrics
          CREATE TABLE IF NOT EXISTS performance_metrics (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              bot_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
              period_start TIMESTAMP WITH TIME ZONE NOT NULL,
              period_end TIMESTAMP WITH TIME ZONE NOT NULL,
              total_trades INTEGER NOT NULL DEFAULT 0,
              winning_trades INTEGER NOT NULL DEFAULT 0,
              losing_trades INTEGER NOT NULL DEFAULT 0,
              total_pnl DECIMAL(20,8) NOT NULL DEFAULT 0,
              win_rate DECIMAL(5,4),
              sharpe_ratio DECIMAL(10,4),
              max_drawdown DECIMAL(5,4),
              profit_factor DECIMAL(10,4),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
        down: `
          DROP TABLE IF EXISTS performance_metrics;
          DROP TABLE IF EXISTS market_data_snapshots;
          DROP TABLE IF EXISTS ai_predictions;
          DROP TABLE IF EXISTS risk_metrics;
          DROP TABLE IF EXISTS portfolio_allocations;
          DROP TABLE IF EXISTS trade_history;
          DROP TABLE IF EXISTS trading_positions;
          DROP TABLE IF EXISTS bot_state_snapshots;
          DROP TABLE IF EXISTS bot_instances;
        `,
      },
      {
        version: "002",
        name: "create_indexes",
        up: `
          -- Indexes for performance
          CREATE INDEX IF NOT EXISTS idx_bot_state_snapshots_bot_instance_id ON bot_state_snapshots(bot_instance_id);
          CREATE INDEX IF NOT EXISTS idx_bot_state_snapshots_timestamp ON bot_state_snapshots(timestamp);
          CREATE INDEX IF NOT EXISTS idx_trading_positions_bot_instance_id ON trading_positions(bot_instance_id);
          CREATE INDEX IF NOT EXISTS idx_trading_positions_symbol ON trading_positions(symbol);
          CREATE INDEX IF NOT EXISTS idx_trading_positions_status ON trading_positions(status);
          CREATE INDEX IF NOT EXISTS idx_trade_history_bot_instance_id ON trade_history(bot_instance_id);
          CREATE INDEX IF NOT EXISTS idx_trade_history_symbol ON trade_history(symbol);
          CREATE INDEX IF NOT EXISTS idx_trade_history_executed_at ON trade_history(executed_at);
          CREATE INDEX IF NOT EXISTS idx_portfolio_allocations_bot_instance_id ON portfolio_allocations(bot_instance_id);
          CREATE INDEX IF NOT EXISTS idx_portfolio_allocations_timestamp ON portfolio_allocations(timestamp);
          CREATE INDEX IF NOT EXISTS idx_risk_metrics_bot_instance_id ON risk_metrics(bot_instance_id);
          CREATE INDEX IF NOT EXISTS idx_risk_metrics_timestamp ON risk_metrics(timestamp);
          CREATE INDEX IF NOT EXISTS idx_ai_predictions_bot_instance_id ON ai_predictions(bot_instance_id);
          CREATE INDEX IF NOT EXISTS idx_ai_predictions_symbol ON ai_predictions(symbol);
          CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON ai_predictions(created_at);
          CREATE INDEX IF NOT EXISTS idx_market_data_snapshots_bot_instance_id ON market_data_snapshots(bot_instance_id);
          CREATE INDEX IF NOT EXISTS idx_market_data_snapshots_symbol ON market_data_snapshots(symbol);
          CREATE INDEX IF NOT EXISTS idx_market_data_snapshots_timestamp ON market_data_snapshots(timestamp);
          CREATE INDEX IF NOT EXISTS idx_performance_metrics_bot_instance_id ON performance_metrics(bot_instance_id);
          CREATE INDEX IF NOT EXISTS idx_performance_metrics_period ON performance_metrics(period_start, period_end);
        `,
        down: `
          DROP INDEX IF EXISTS idx_performance_metrics_period;
          DROP INDEX IF EXISTS idx_performance_metrics_bot_instance_id;
          DROP INDEX IF EXISTS idx_market_data_snapshots_timestamp;
          DROP INDEX IF EXISTS idx_market_data_snapshots_symbol;
          DROP INDEX IF EXISTS idx_market_data_snapshots_bot_instance_id;
          DROP INDEX IF EXISTS idx_ai_predictions_created_at;
          DROP INDEX IF EXISTS idx_ai_predictions_symbol;
          DROP INDEX IF EXISTS idx_ai_predictions_bot_instance_id;
          DROP INDEX IF EXISTS idx_risk_metrics_timestamp;
          DROP INDEX IF EXISTS idx_risk_metrics_bot_instance_id;
          DROP INDEX IF EXISTS idx_portfolio_allocations_timestamp;
          DROP INDEX IF EXISTS idx_portfolio_allocations_bot_instance_id;
          DROP INDEX IF EXISTS idx_trade_history_executed_at;
          DROP INDEX IF EXISTS idx_trade_history_symbol;
          DROP INDEX IF EXISTS idx_trade_history_bot_instance_id;
          DROP INDEX IF EXISTS idx_trading_positions_status;
          DROP INDEX IF EXISTS idx_trading_positions_symbol;
          DROP INDEX IF EXISTS idx_trading_positions_bot_instance_id;
          DROP INDEX IF EXISTS idx_bot_state_snapshots_timestamp;
          DROP INDEX IF EXISTS idx_bot_state_snapshots_bot_instance_id;
        `,
      },
      {
        version: "003",
        name: "create_triggers",
        up: `
          -- Function for updated_at trigger
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ language 'plpgsql';

          -- Triggers for updated_at
          CREATE TRIGGER update_bot_instances_updated_at BEFORE UPDATE ON bot_instances
              FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

          CREATE TRIGGER update_trading_positions_updated_at BEFORE UPDATE ON trading_positions
              FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `,
        down: `
          DROP TRIGGER IF EXISTS update_trading_positions_updated_at ON trading_positions;
          DROP TRIGGER IF EXISTS update_bot_instances_updated_at ON bot_instances;
          DROP FUNCTION IF EXISTS update_updated_at_column();
        `,
      },
    ];
  }
}
