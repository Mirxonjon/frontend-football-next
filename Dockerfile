# syntax=docker/dockerfile:1.7

# ─── 1. deps ────────────────────────────────────────────────────────────
# Install node_modules in a clean layer so the cache survives source edits.
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* npm-shrinkwrap.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f npm-shrinkwrap.json ]; then npm ci; \
  else npm install --no-audit --no-fund; \
  fi

# ─── 2. build ───────────────────────────────────────────────────────────
# Build args allow baking NEXT_PUBLIC_* values into the client bundle at
# build time. They MUST be present here because Next inlines them into JS.
FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_APP_ORIGIN
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_CORS_ORIGINS
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_YT_API_KEY

ENV NEXT_PUBLIC_APP_ORIGIN=$NEXT_PUBLIC_APP_ORIGIN \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_CORS_ORIGINS=$NEXT_PUBLIC_CORS_ORIGINS \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_YT_API_KEY=$NEXT_PUBLIC_YT_API_KEY \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Make sure public/ exists so the runner stage can COPY it unconditionally.
RUN mkdir -p public && npm run build

# ─── 3. runner ──────────────────────────────────────────────────────────
# Minimal production image — just node + the standalone output.
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Public assets and the prerendered .next/static folder must sit next to
# server.js, otherwise Next can't serve them.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# PORT is read by Next's standalone server.js at runtime — DO NOT hard-code.
# Provide a sensible default if the env var is missing.
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server.js"]
