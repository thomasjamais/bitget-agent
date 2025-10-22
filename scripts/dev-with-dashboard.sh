#!/bin/bash

# Development script to run bot and dashboard simultaneously

echo "🚀 Starting Bitget Trading Bot with Dashboard"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js version 18 or higher"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${BLUE}Node.js version: $(node --version)${NC}"
echo -e "${BLUE}npm version: $(npm --version)${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing bot dependencies...${NC}"
    npm install
fi

if [ ! -d "web/node_modules" ]; then
    echo -e "${YELLOW}Installing dashboard dependencies...${NC}"
    cd web
    npm install
    cd ..
fi

echo ""
echo -e "${GREEN}Starting services...${NC}"
echo -e "${BLUE}Bot API & WebSocket Server: http://localhost:8080${NC}"
echo -e "${BLUE}Web Dashboard: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

# Start both bot and dashboard
npm run dev:full
