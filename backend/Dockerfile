# syntax=docker/dockerfile:1

###############################################################################
# Stage 1 - build: install all dependencies (incl. dev) and compile TypeScript
###############################################################################
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Some corporate networks block registry.npmjs.org outright (the TLS handshake
# is rejected), so the registry must be overridable at build time. Compose
# passes NPM_REGISTRY through from .env; leave it unset for the public one.
ARG NPM_REGISTRY=
RUN if [ -n "$NPM_REGISTRY" ]; then \
      npm config set registry "$NPM_REGISTRY" ; \
    fi

# Copy manifests first so `npm ci` is cached until dependencies actually change.
COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src

# Emits to /app/dist
RUN npx tsc

###############################################################################
# Stage 2 - production dependencies only
###############################################################################
FROM node:22-bookworm-slim AS deps

WORKDIR /app

ARG NPM_REGISTRY=
RUN if [ -n "$NPM_REGISTRY" ]; then \
      npm config set registry "$NPM_REGISTRY" ; \
    fi

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

###############################################################################
# Stage 3 - runtime
###############################################################################
FROM node:22-bookworm-slim AS runtime

# `ping` is required by the check engine for monitors of type "ping" (and for
# the Linux fallback path of "smb" monitors). iputils-ping ships setcap'd so it
# works without root; NET_RAW is still granted in docker-compose.yml for hosts
# whose kernel disallows unprivileged ICMP sockets.
RUN apt-get update \
    && apt-get install -y --no-install-recommends iputils-ping ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist
COPY package*.json ./

# The worker writes worker.lock into its working directory.
RUN chown -R node:node /app
USER node

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-3001}/health" || exit 1

CMD ["node", "dist/app.js"]
