FROM node:18-alpine AS base

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache dumb-init wget

# Install dependencies with deterministic lockfile
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy source
COPY backend ./backend
COPY shared ./shared

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app/backend
USER app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-5000}/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]
