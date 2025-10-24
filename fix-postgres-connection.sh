#!/bin/bash

# Fix PostgreSQL connection for local development
# This script helps you set up PostgreSQL for the trading bot

echo "🔧 Fixing PostgreSQL connection for Trading Bot"
echo "=============================================="

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Starting it..."
    sudo systemctl start postgresql
    sleep 2
fi

echo "✅ PostgreSQL is running"

# Check current user
echo "Current user: $(whoami)"

# Try different connection methods
echo ""
echo "🔍 Testing different connection methods..."

# Method 1: Try connecting as current user
echo "Method 1: Connecting as current user..."
if psql -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Success! You can connect as current user"
    echo "Update your .env file:"
    echo "DB_USERNAME=$(whoami)"
    echo "DB_PASSWORD="
    exit 0
fi

# Method 2: Try connecting as postgres with no password
echo "Method 2: Connecting as postgres with no password..."
if sudo -u postgres psql -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Success! You can connect as postgres user"
    echo "Update your .env file:"
    echo "DB_USERNAME=postgres"
    echo "DB_PASSWORD="
    exit 0
fi

# Method 3: Create a new user
echo "Method 3: Creating a new database user..."
sudo -u postgres createuser --interactive --pwprompt tradingbot 2>/dev/null || echo "User might already exist"

# Create database
echo "Creating database..."
sudo -u postgres createdb trading_bot 2>/dev/null || echo "Database might already exist"

echo ""
echo "📋 Next steps:"
echo "1. Update your .env file with the correct credentials"
echo "2. Test connection: npx tsx test-db-connection.js"
echo "3. Run migrations: npm run db:migrate:local"
