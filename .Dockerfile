# ─────────────────────────────────────────────────────────────
# UE Portal — Dockerfile
# Multi-stage: Node builds, Nginx serves.
# Optional — only needed if you want Docker-based deployment.
# The default deployment (GitHub Actions + Nginx) doesn't need this.
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# Build args (passed from docker build --build-arg or compose env)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────
FROM nginx:alpine AS production

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx/ue-portal.conf /etc/nginx/conf.d/default.conf

# Fix nginx config for Docker (uses /usr/share/nginx/html, not /var/www)
RUN sed -i 's|/var/www/ue-portal|/usr/share/nginx/html|g' /etc/nginx/conf.d/default.conf && \
    sed -i 's|server_name.*|server_name _;|g' /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
