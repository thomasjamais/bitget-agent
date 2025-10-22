# Bitget Trading Bot - Copilot Instructions

This is a TypeScript-based automated trading bot for Bitget exchange with comprehensive configuration management.

## Project Structure
- `src/` - Core bot modules (signals, trading, risk management)
- `config/` - Configuration files and schemas
- `types/` - TypeScript type definitions
- `examples/` - Example configurations and usage

## Key Features
- Configurable investment instructions via JSON/YAML files
- Risk management with position sizing and throttling
- Real-time market data via WebSocket
- AI signal generation engine
- Bitget futures trading integration
- Comprehensive logging and monitoring

## Development Guidelines
- Use strict TypeScript configuration
- Validate all configuration inputs
- Follow async/await patterns
- Implement proper error handling
- Use structured logging (pino)
- Include comprehensive JSDoc comments