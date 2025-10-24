# Multi-stage Docker build for Trading Bot
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY web/package*.json ./web/

# Install dependencies
RUN npm ci --only=production
RUN cd web && npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build
RUN cd web && npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 tradingbot

# Copy built application
COPY --from=builder --chown=tradingbot:nodejs /app/dist ./dist
COPY --from=builder --chown=tradingbot:nodejs /app/web/.next/standalone ./web
COPY --from=builder --chown=tradingbot:nodejs /app/web/.next/static ./web/.next/static
COPY --from=builder --chown=tradingbot:nodejs /app/web/public ./web/public

# Copy configuration files
COPY --chown=tradingbot:nodejs config/ ./config/
COPY --chown=tradingbot:nodejs start-bot.sh ./
COPY --chown=tradingbot:nodejs start-dashboard.sh ./

# Install runtime dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose ports
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER tradingbot

# Start the application
CMD ["node", "dist/simple-bot.js"]
