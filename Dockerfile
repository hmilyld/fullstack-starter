# ============================================================
# Stage 1: Build frontend
# ============================================================
FROM node:24-alpine AS frontend-builder

ARG FRONTEND=react

RUN corepack enable && corepack prepare pnpm@latest --activate \
    && npm config set registry https://registry.npmmirror.com

WORKDIR /build

# Copy both frontend directories
COPY frontend/ ./react/
COPY frontend-vue/ ./vue/

# Select and build the chosen frontend
ENV CI=true
RUN cp -r ${FRONTEND}/* . && rm -rf react vue \
    && pnpm install --frozen-lockfile \
    && pnpm build


# ============================================================
# Stage 2: Runtime — Python + Nginx
# ============================================================
FROM python:3.12-slim

ENV UV_INDEX_URL=https://mirrors.aliyun.com/pypi/simple/

# Install nginx + uv
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends nginx \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir uv -i https://mirrors.aliyun.com/pypi/simple/

# Remove default nginx site
RUN rm -f /etc/nginx/sites-enabled/default

# Copy backend source and install dependencies
WORKDIR /app
COPY backend/ ./
RUN uv sync --no-dev

# Copy frontend dist
COPY --from=frontend-builder /build/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
