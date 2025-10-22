#!/bin/bash

# Bitget Trading Bot Setup Script

echo "🚀 Setting up Bitget Trading Bot..."

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ is required. Please install Node.js first."
  exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
mkdir -p logs

# Copy environment template if .env doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📄 Created .env file from template"
  echo "⚠️  Please edit .env with your Bitget API credentials before running the bot"
else
  echo "📄 .env file already exists"
fi

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Bitget API credentials"
echo "2. Customize config/bot.yaml with your trading strategies" 
echo "3. Run in development mode: npm run dev"
echo "4. Or run production build: npm start"
echo ""
echo "⚠️  IMPORTANT: Always test with testnet first!"
echo "Set BITGET_USE_TESTNET=true in your .env file"
echo ""
echo "📚 Read the README.md for detailed configuration instructions"