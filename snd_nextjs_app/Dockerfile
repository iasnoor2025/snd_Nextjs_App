# Multi-stage build for Next.js application
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables (NON-SENSITIVE only)
# Note: Secrets should NEVER be passed as ARG or ENV in Dockerfile
# All secrets must be set as runtime environment variables in Coolify
ARG NEXT_TELEMETRY_DISABLED=1
ARG NODE_OPTIONS=--max-old-space-size=8192

ENV NEXT_TELEMETRY_DISABLED=$NEXT_TELEMETRY_DISABLED
ENV NODE_OPTIONS=$NODE_OPTIONS

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# SECURITY NOTE: All secrets must be set as runtime environment variables in Coolify:
# - NEXTAUTH_SECRET
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - GMAIL_APP_PASSWORD
# - GAS_SHARED_SECRET
# - CRON_SECRET
# - GOOGLE_CLIENT_SECRET
# - N8N_API_KEY
# - DATABASE_URL
# - And any other sensitive credentials
# 
# These should NOT be passed as ARG or ENV in this Dockerfile.
# They will be available via process.env at runtime when set in Coolify.

CMD ["node", "server.js"]

