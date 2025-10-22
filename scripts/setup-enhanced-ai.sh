#!/bin/bash

# 🌍 Enhanced AI Setup Script
# Aide à configurer l'intelligence géopolitique pour le bot de trading

echo "🚀 Enhanced AI Engine Setup"
echo "========================================="
echo

# Check if .env exists
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "📄 .env file already exists"
fi

echo

# Check for required API keys
echo "🔑 Checking API Configuration..."

OPENAI_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d '=' -f2)
PERPLEXITY_KEY=$(grep "^PERPLEXITY_API_KEY=" .env | cut -d '=' -f2)

if [ -z "$OPENAI_KEY" ] || [ "$OPENAI_KEY" = "your_openai_api_key_here" ]; then
    echo "❌ OpenAI API Key not configured"
    echo "   Please get your key from: https://platform.openai.com/api-keys"
    echo "   Then edit .env file: OPENAI_API_KEY=your_actual_key"
    MISSING_KEYS=true
else
    echo "✅ OpenAI API Key configured"
fi

if [ -z "$PERPLEXITY_KEY" ] || [ "$PERPLEXITY_KEY" = "your_perplexity_api_key_here" ]; then
    echo "❌ Perplexity API Key not configured"  
    echo "   Please get your key from: https://www.perplexity.ai/settings/api"
    echo "   Then edit .env file: PERPLEXITY_API_KEY=your_actual_key"
    MISSING_KEYS=true
else
    echo "✅ Perplexity API Key configured"
fi

echo

# Configure Enhanced AI Mode
echo "🧠 Configuring Enhanced AI Mode..."

if grep -q "^ENHANCED_AI_MODE=" .env; then
    sed -i 's/^ENHANCED_AI_MODE=.*/ENHANCED_AI_MODE=true/' .env
else
    echo "ENHANCED_AI_MODE=true" >> .env
fi

echo "✅ Enhanced AI Mode enabled"

# Configure default weights
echo "⚖️ Setting default signal weights..."

if ! grep -q "^TECHNICAL_WEIGHT=" .env; then
    echo "TECHNICAL_WEIGHT=0.7" >> .env
fi

if ! grep -q "^NEWS_WEIGHT=" .env; then
    echo "NEWS_WEIGHT=0.3" >> .env
fi

if ! grep -q "^NEWS_CONFIDENCE_THRESHOLD=" .env; then
    echo "NEWS_CONFIDENCE_THRESHOLD=0.3" >> .env
fi

if ! grep -q "^NEWS_UPDATE_INTERVAL=" .env; then
    echo "NEWS_UPDATE_INTERVAL=15" >> .env
fi

if ! grep -q "^RISK_ADJUSTMENT_ENABLED=" .env; then
    echo "RISK_ADJUSTMENT_ENABLED=true" >> .env
fi

echo "✅ Default weights configured"

echo

# Install dependencies
echo "📦 Installing dependencies..."
npm install > /dev/null 2>&1
echo "✅ Dependencies installed"

echo

# Test configuration if keys are present
if [ -z "$MISSING_KEYS" ]; then
    echo "🧪 Testing Enhanced AI configuration..."
    echo "   (This may take a moment for API connections...)"
    
    if npm run test:enhanced-ai > test_output.log 2>&1; then
        echo "✅ Enhanced AI test passed!"
        echo "   Your geopolitical intelligence system is ready!"
    else
        echo "⚠️ Enhanced AI test had issues"
        echo "   Check test_output.log for details"
    fi
else
    echo "⏭️ Skipping test - configure API keys first"
fi

echo

# Usage instructions
echo "🎯 Next Steps:"
echo
if [ ! -z "$MISSING_KEYS" ]; then
    echo "1. Configure missing API keys in .env file"
    echo "2. Run: npm run test:enhanced-ai"
    echo "3. If test passes, run: npm run dev"
else
    echo "1. Run your bot: npm run dev"
    echo "2. Watch for geopolitical intelligence in reports"
    echo "3. Monitor enhanced trading signals"
fi

echo
echo "📚 Documentation: docs/enhanced-ai-guide.md"
echo "🔧 Configuration: .env file"
echo "🧪 Test command: npm run test:enhanced-ai"

echo
echo "🌍 Enhanced AI Engine setup complete!"