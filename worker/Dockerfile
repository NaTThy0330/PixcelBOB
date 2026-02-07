FROM node:18-alpine AS base

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache dumb-init

COPY worker/package*.json ./worker/
RUN cd worker && npm ci --omit=dev

COPY worker ./worker
COPY shared ./shared

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app/worker
USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "scripts/healthcheck.js"]

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/index.js"]
