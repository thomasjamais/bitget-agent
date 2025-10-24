#!/bin/bash

# Quick setup script for local development
# This script helps you get started with the local database setup

set -e

echo "🚀 Quick Setup for Local Trading Bot with PostgreSQL"
echo "=================================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Local Development Environment Variables
# Edit these values for your local PostgreSQL setup

# Database Configuration (Local PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trading_bot
DB_USERNAME=postgres
DB_PASSWORD=your-postgres-password
AWS_REGION=us-east-1

# Bot Configuration
NODE_ENV=development
CONFIG_PATH=./config/bot.yaml

# Bitget API Keys (REQUIRED - Fill these in)
BITGET_API_KEY=your-bitget-api-key
BITGET_SECRET=your-bitget-secret
BITGET_PASSPHRASE=your-bitget-passphrase

# AI Configuration (Optional)
OPENAI_API_KEY=your-openai-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key
ENHANCED_AI_MODE=false

# Logging
LOG_LEVEL=info

# Security (for local development)
JWT_SECRET=local-dev-jwt-secret-12345
ENCRYPTION_KEY=local-dev-encryption-key-12345
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your PostgreSQL credentials"
echo "2. Test database connection: node test-db-connection.js"
echo "3. Run migrations: npm run db:migrate:local"
echo "4. Start the bot: npm run start:local"
echo ""
echo "🔧 Quick commands:"
echo "  Test DB:     node test-db-connection.js"
echo "  Migrate:     npm run db:migrate:local"
echo "  Start Bot:   npm run start:local"
echo "  Dev Mode:    npm run dev:local"
echo ""
echo "📖 For detailed instructions, see LOCAL_DEVELOPMENT.md"
