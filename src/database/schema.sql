-- Trading Bot Database Schema
-- Designed for AWS RDS PostgreSQL

-- Bot instances table
CREATE TABLE bot_instances (
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
CREATE TABLE bot_state_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_time BIGINT NOT NULL,
    equity JSONB NOT NULL, -- {USDT: 1000, BTC: 0.1}
    daily_pnl DECIMAL(20,8) NOT NULL DEFAULT 0,
    consecutive_losses INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    pause_reason TEXT,
    metadata JSONB
);

-- Trading positions
CREATE TABLE trading_positions (
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
CREATE TABLE trade_history (
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
CREATE TABLE portfolio_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    target_allocation DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    current_allocation DECIMAL(5,4) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    value_usdt DECIMAL(20,8) NOT NULL,
    mark_price DECIMAL(20,8) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bot_instance_id, symbol, timestamp)
);

-- Risk metrics
CREATE TABLE risk_metrics (
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

-- AI engine predictions
CREATE TABLE ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    prediction_type VARCHAR(50) NOT NULL, -- 'price_direction', 'volatility', 'trend'
    confidence DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    predicted_value DECIMAL(20,8),
    predicted_direction VARCHAR(10), -- 'up', 'down', 'sideways'
    timeframe VARCHAR(20) NOT NULL,
    model_name VARCHAR(100),
    input_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Market data snapshots
CREATE TABLE market_data_snapshots (
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

-- Bot performance metrics
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_instance_id UUID NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_trades INTEGER NOT NULL DEFAULT 0,
    winning_trades INTEGER NOT NULL DEFAULT 0,
    losing_trades INTEGER NOT NULL DEFAULT 0,
    total_pnl DECIMAL(20,8) NOT NULL DEFAULT 0,
    win_rate DECIMAL(5,4), -- 0.0000 to 1.0000
    sharpe_ratio DECIMAL(10,4),
    max_drawdown DECIMAL(5,4),
    profit_factor DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bot_state_snapshots_bot_instance_id ON bot_state_snapshots(bot_instance_id);
CREATE INDEX idx_bot_state_snapshots_timestamp ON bot_state_snapshots(timestamp);
CREATE INDEX idx_trading_positions_bot_instance_id ON trading_positions(bot_instance_id);
CREATE INDEX idx_trading_positions_symbol ON trading_positions(symbol);
CREATE INDEX idx_trading_positions_status ON trading_positions(status);
CREATE INDEX idx_trade_history_bot_instance_id ON trade_history(bot_instance_id);
CREATE INDEX idx_trade_history_symbol ON trade_history(symbol);
CREATE INDEX idx_trade_history_executed_at ON trade_history(executed_at);
CREATE INDEX idx_portfolio_allocations_bot_instance_id ON portfolio_allocations(bot_instance_id);
CREATE INDEX idx_portfolio_allocations_timestamp ON portfolio_allocations(timestamp);
CREATE INDEX idx_risk_metrics_bot_instance_id ON risk_metrics(bot_instance_id);
CREATE INDEX idx_risk_metrics_timestamp ON risk_metrics(timestamp);
CREATE INDEX idx_ai_predictions_bot_instance_id ON ai_predictions(bot_instance_id);
CREATE INDEX idx_ai_predictions_symbol ON ai_predictions(symbol);
CREATE INDEX idx_ai_predictions_created_at ON ai_predictions(created_at);
CREATE INDEX idx_market_data_snapshots_bot_instance_id ON market_data_snapshots(bot_instance_id);
CREATE INDEX idx_market_data_snapshots_symbol ON market_data_snapshots(symbol);
CREATE INDEX idx_market_data_snapshots_timestamp ON market_data_snapshots(timestamp);
CREATE INDEX idx_performance_metrics_bot_instance_id ON performance_metrics(bot_instance_id);
CREATE INDEX idx_performance_metrics_period ON performance_metrics(period_start, period_end);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bot_instances_updated_at BEFORE UPDATE ON bot_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_positions_updated_at BEFORE UPDATE ON trading_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
