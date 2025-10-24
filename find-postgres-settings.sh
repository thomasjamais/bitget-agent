#!/bin/bash

# Find PostgreSQL connection settings
# This script helps you discover the correct PostgreSQL connection parameters

echo "🔍 Finding PostgreSQL connection settings"
echo "========================================="

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running"
    echo "Start it with: sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Check PostgreSQL version
echo ""
echo "📊 PostgreSQL Information:"
sudo -u postgres psql -c "SELECT version();" 2>/dev/null || echo "Cannot connect as postgres user"

# Check available databases
echo ""
echo "📁 Available databases:"
sudo -u postgres psql -c "\l" 2>/dev/null || echo "Cannot list databases"

# Check users
echo ""
echo "👥 Available users:"
sudo -u postgres psql -c "SELECT usename FROM pg_user;" 2>/dev/null || echo "Cannot list users"

# Test different connection methods
echo ""
echo "🧪 Testing connection methods:"

# Method 1: Current user
echo "Method 1: Current user ($(whoami))"
if psql -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ SUCCESS: You can connect as user '$(whoami)' with no password"
    echo "   Update .env: DB_USERNAME=$(whoami), DB_PASSWORD="
else
    echo "❌ Failed: Cannot connect as current user"
fi

# Method 2: Postgres user
echo ""
echo "Method 2: Postgres user"
if sudo -u postgres psql -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ SUCCESS: You can connect as user 'postgres' with no password"
    echo "   Update .env: DB_USERNAME=postgres, DB_PASSWORD="
else
    echo "❌ Failed: Cannot connect as postgres user"
fi

# Method 3: Try with common passwords
echo ""
echo "Method 3: Testing common passwords..."
for password in "" "postgres" "password" "admin" "123456"; do
    if PGPASSWORD="$password" psql -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ SUCCESS: Password '$password' works"
        echo "   Update .env: DB_USERNAME=postgres, DB_PASSWORD=$password"
        break
    fi
done

echo ""
echo "📝 Recommended .env settings:"
echo "DB_HOST=localhost"
echo "DB_PORT=5432"
echo "DB_NAME=trading_bot"
echo "DB_USERNAME=<use the working username above>"
echo "DB_PASSWORD=<use the working password above>"
