# syntax=docker/dockerfile:1

###############################################################################
# Stage 1 - build the Vue app
###############################################################################
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Some corporate networks block registry.npmjs.org outright (the TLS handshake
# is rejected), so the registry must be overridable at build time.
ARG NPM_REGISTRY=
RUN if [ -n "$NPM_REGISTRY" ]; then \
      npm config set registry "$NPM_REGISTRY" ; \
    fi

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Empty base URL => every request stays same-origin ("/api/..."), which nginx
# then reverse-proxies to the backend container. This avoids baking a host name
# into the bundle and removes the need for CORS entirely.
ENV VITE_API_URL=""

RUN npm run build

###############################################################################
# Stage 2 - serve with nginx
###############################################################################
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
