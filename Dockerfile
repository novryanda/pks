# syntax=docker/dockerfile:1.6

# ── Base image ──
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ── Stage 1: Install dependencies ──
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --include=dev
RUN npx prisma generate

# ── Stage 2: Build Next.js ──
FROM base AS builder
ENV SKIP_ENV_VALIDATION=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: Production runner ──
FROM base AS runner
RUN apk add --no-cache openssl tini
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV CHECKPOINT_DISABLE=1

# Control flags
ENV RUN_DB_MIGRATION=auto
ENV SKIP_DB_MIGRATION=false

RUN mkdir -p /app && chown -R node:node /app

# Copy build artifacts
COPY --chown=node:node package.json package-lock.json* ./
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static

# Install Prisma CLI globally (pinned to project version)
RUN npm install --global --save-exact "prisma@$(node --print 'require("./node_modules/@prisma/client/package.json").version')"

# Uploads directory (persistent volume mount point)
RUN mkdir -p /app/public/uploads && chown -R node:node /app/public/uploads

USER node
EXPOSE 3000

CMD sh -c '\
    MIGRATION_ENABLED="${RUN_DB_MIGRATION}" && \
    if [ -z "$MIGRATION_ENABLED" ] || [ "$MIGRATION_ENABLED" = "auto" ]; then \
    if [ "$SKIP_DB_MIGRATION" = "true" ]; then \
    MIGRATION_ENABLED="false"; \
    else \
    MIGRATION_ENABLED="true"; \
    fi; \
    fi && \
    \
    echo "============================================" && \
    echo "🚀 Starting htgroupapp Container" && \
    echo "============================================" && \
    echo "📝 NODE_ENV: ${NODE_ENV}" && \
    echo "📝 PORT: ${PORT}" && \
    echo "📝 Run Migration: ${MIGRATION_ENABLED}" && \
    echo "📝 Legacy Skip Migration: ${SKIP_DB_MIGRATION}" && \
    echo "" && \
    \
    if [ -z "$DATABASE_URL" ]; then \
    echo "❌ ERROR: DATABASE_URL is not set." && \
    exit 1; \
    fi && \
    echo "✅ DATABASE_URL is configured" && \
    echo "" && \
    \
    case "$MIGRATION_ENABLED" in \
    true|TRUE|True|1|yes|YES|on|ON) \
    echo "📦 Running prisma migrate deploy..." && \
    npx prisma migrate deploy && \
    echo "✅ Migrations applied successfully!" && \
    echo "" ;; \
    false|FALSE|False|0|no|NO|off|OFF) \
    echo "⏭️  Skipping migration (RUN_DB_MIGRATION=${MIGRATION_ENABLED})" && \
    echo "" ;; \
    *) \
    echo "❌ ERROR: RUN_DB_MIGRATION must be true or false." && \
    exit 1 ;; \
    esac && \
    \
    echo "============================================" && \
    echo "🚀 Starting Next.js server on port ${PORT}..." && \
    echo "============================================" && \
    exec node server.js \
    '
