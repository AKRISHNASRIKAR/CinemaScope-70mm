# Multi-stage Dockerfile for the CinemaScope backend tooling.
# This image is used in CI/CD for type-checking and running Drizzle migrations.
# The application itself is deployed to Supabase (Edge Functions + PostgreSQL).

FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ── Dependency stage ──────────────────────────────────────────────
FROM base AS deps
RUN npm ci --omit=dev

FROM base AS dev-deps
RUN npm ci

# ── Type-check stage ──────────────────────────────────────────────
FROM dev-deps AS typecheck
COPY tsconfig.json ./
COPY src ./src
RUN npm run typecheck

# ── Migration stage ───────────────────────────────────────────────
# Usage: docker build --target migrate --build-arg DATABASE_URL=<url> .
FROM dev-deps AS migrate
COPY drizzle.config.ts ./
COPY src/db ./src/db
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN npm run db:push
