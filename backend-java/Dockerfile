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
# Stage 2: Build backend
# ============================================================
FROM maven:3.9-eclipse-temurin-21 AS backend-builder
WORKDIR /build
COPY backend-java/ ./
RUN mvn clean package -DskipTests -q

# ============================================================
# Stage 3: Runtime
# ============================================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=backend-builder /build/target/*.jar app.jar
COPY --from=frontend-builder /build/dist /usr/share/nginx/html
COPY backend-java/nginx.conf /etc/nginx/conf.d/default.conf
COPY backend-java/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && mkdir -p /app/data
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
