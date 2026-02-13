# ============================================================================
# Stage 1: Build Anime Autobattler (React + Vite)
# ============================================================================
FROM node:18-alpine AS builder

WORKDIR /build

# Copy the Anime Autobattler source
COPY AnimeAutobattlerAntigravity/ ./

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@8 --activate
ENV CI=true
RUN pnpm install --no-frozen-lockfile

# Build packages first, then the web app
RUN pnpm --filter @anime-autobattler/sim build && \
    pnpm --filter @anime-autobattler/content build && \
    pnpm --filter @anime-autobattler/web build

# ============================================================================
# Stage 2: Serve everything with nginx
# ============================================================================
FROM nginx:alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy launcher page
COPY index.html /usr/share/nginx/html/
COPY launcher.css /usr/share/nginx/html/

# Copy static games
COPY BlockyBlaster/ /usr/share/nginx/html/BlockyBlaster/
COPY StickFighterArena/ /usr/share/nginx/html/StickFighterArena/
COPY StickmanArena/ /usr/share/nginx/html/StickmanArena/

# Copy built Anime Autobattler from builder stage
COPY --from=builder /build/apps/web/dist/ /usr/share/nginx/html/AnimeAutobattler/

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
