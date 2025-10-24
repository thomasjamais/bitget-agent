# Local Development with State Persistence

This guide shows you how to run the Bitget Trading Bot locally with PostgreSQL database for state persistence.

## Prerequisites

1. **PostgreSQL** - Installed and running on your machine
2. **Node.js 18+** - For running the application
3. **Bitget API Keys** - For trading operations

## Quick Start

### 1. Automated Setup (Recommended)

Run the setup script to automatically configure everything:

```bash
./setup-local-db.sh
```

This script will:
- Check PostgreSQL status
- Create database and user
- Generate `.env` file
- Run database migrations
- Test the connection

### 2. Manual Setup

If you prefer to set up manually:

#### Step 1: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE trading_bot;

# Create user (optional)
CREATE USER tradingbot WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE trading_bot TO tradingbot;

# Exit
\q
```

#### Step 2: Configure Environment

Copy the example environment file:

```bash
cp env.local.example .env
```

Edit `.env` with your database credentials:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trading_bot
DB_USERNAME=postgres
DB_PASSWORD=your-postgres-password

# Bitget API Keys (REQUIRED)
BITGET_API_KEY=your-bitget-api-key
BITGET_SECRET=your-bitget-secret
BITGET_PASSPHRASE=your-bitget-passphrase
```

#### Step 3: Run Migrations

```bash
npm run db:migrate:local
```

#### Step 4: Start the Bot

```bash
# Production mode
npm run start:local

# Development mode
npm run dev:local

# With dashboard
npm run dev:full:local
```

## Available Scripts

### Bot Scripts

- `npm run start:local` - Start persistent bot (production mode)
- `npm run dev:local` - Start persistent bot (development mode)
- `npm run dev:full:local` - Start bot + dashboard (development mode)

### Database Scripts

- `npm run db:migrate:local` - Run database migrations
- `npm run db:rollback` - Rollback last migration

### Original Scripts (without persistence)

- `npm run start` - Start original bot (no persistence)
- `npm run dev` - Start original bot (development mode)
- `npm run dev:full` - Start bot + dashboard (development mode)

## Database Schema

The bot creates the following tables in your PostgreSQL database:

- **bot_instances** - Bot instance information
- **bot_state_snapshots** - Bot state history
- **trading_positions** - Current and historical positions
- **trade_history** - Complete trade audit trail
- **portfolio_allocations** - Portfolio allocation history
- **risk_metrics** - Risk management metrics
- **ai_predictions** - AI engine predictions
- **market_data_snapshots** - Market data history
- **performance_metrics** - Performance analytics

## Features

### State Persistence

- **Bot State Recovery** - Bot resumes from last known state
- **Position Tracking** - All positions are saved and restored
- **Trade History** - Complete audit trail of all trades
- **Portfolio State** - Portfolio allocations are preserved
- **Risk Metrics** - Risk management state is maintained

### Development Benefits

- **No Data Loss** - Bot can restart without losing state
- **Historical Analysis** - Access to all trading data
- **Debugging** - Complete audit trail for troubleshooting
- **Testing** - Safe to test with real data

## Database Management

### View Data

```bash
# Connect to database
psql -h localhost -p 5432 -U postgres -d trading_bot

# View tables
\dt

# View recent trades
SELECT * FROM trade_history ORDER BY executed_at DESC LIMIT 10;

# View current positions
SELECT * FROM trading_positions WHERE status = 'open';

# View bot state
SELECT * FROM bot_state_snapshots ORDER BY timestamp DESC LIMIT 1;
```

### Backup Database

```bash
# Create backup
pg_dump -h localhost -p 5432 -U postgres -d trading_bot > backup.sql

# Restore backup
psql -h localhost -p 5432 -U postgres -d trading_bot < backup.sql
```

### Reset Database

```bash
# Drop and recreate database
dropdb -h localhost -p 5432 -U postgres trading_bot
createdb -h localhost -p 5432 -U postgres trading_bot
npm run db:migrate:local
```

## Monitoring

### Logs

The bot logs all database operations:

```
✅ Bot state saved to database
✅ Trading position saved: BTCUSDT
✅ Trade saved to history: BTCUSDT sell
✅ Portfolio allocation saved: ETHUSDT
```

### Health Checks

- **Database Connection** - Automatic health checks
- **Migration Status** - Ensures schema is up to date
- **State Persistence** - Verifies data is being saved

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL is running
   pg_isready
   
   # Check credentials in .env
   cat .env | grep DB_
   ```

2. **Migration Errors**
   ```bash
   # Check database exists
   psql -h localhost -p 5432 -U postgres -l | grep trading_bot
   
   # Run migrations manually
   npm run db:migrate:local
   ```

3. **Bot Won't Start**
   ```bash
   # Check environment variables
   node -e "console.log(process.env.DB_HOST)"
   
   # Check database connection
   psql -h localhost -p 5432 -U postgres -d trading_bot -c "SELECT 1"
   ```

### Debug Commands

```bash
# Test database connection
npm run db:migrate:local

# View bot logs
npm run dev:local 2>&1 | grep -E "(✅|❌|⚠️)"

# Check database tables
psql -h localhost -p 5432 -U postgres -d trading_bot -c "\dt"
```

## Performance

### Database Optimization

- **Connection Pooling** - Efficient database connections
- **Indexes** - Optimized queries for performance
- **Batch Operations** - Reduced database round trips

### Monitoring

- **Query Performance** - Logged query execution times
- **Connection Stats** - Pool utilization metrics
- **Error Tracking** - Comprehensive error logging

## Security

### Local Development

- **No SSL** - Local connections don't require SSL
- **Local Access** - Database only accessible locally
- **Environment Variables** - Sensitive data in `.env` file

### Best Practices

- **Backup Regularly** - Create database backups
- **Secure Credentials** - Don't commit `.env` file
- **Monitor Logs** - Watch for database errors

## Next Steps

After successful local setup:

1. **Configure API Keys** - Add your Bitget credentials
2. **Test Trading** - Start with small amounts
3. **Monitor Performance** - Use the dashboard
4. **Deploy to AWS** - When ready for production

## Support

For issues:

1. Check the logs for error messages
2. Verify database connection
3. Ensure all environment variables are set
4. Check PostgreSQL is running

The local development setup provides a complete state persistence solution for your trading bot while keeping everything on your local machine!
