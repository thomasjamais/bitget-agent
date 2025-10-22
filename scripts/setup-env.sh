#!/bin/bash

echo "🔧 Setting up environment variables for Bitget Trading Bot"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cat > .env << EOF
# Bitget API Credentials
# Replace with your actual API credentials
BITGET_API_KEY=your_api_key_here
BITGET_API_SECRET=your_api_secret_here
BITGET_API_PASSPHRASE=your_api_passphrase_here

# Bot Configuration
NODE_ENV=development
LOG_LEVEL=info
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your actual Bitget API credentials"
echo "2. Restart the bot to use real API calls instead of simulation"
echo ""
echo "🔑 Required credentials:"
echo "   - BITGET_API_KEY: Your Bitget API key"
echo "   - BITGET_API_SECRET: Your Bitget API secret"
echo "   - BITGET_API_PASSPHRASE: Your Bitget API passphrase"
echo ""
echo "⚠️  Make sure your API key has transfer permissions enabled"
