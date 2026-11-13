# ============================================
# Demo 镜像：三套前端（React / Vue / Svelte）+ 一套 Java 后端
#
# 构建上下文由 CI 组装，包含：
#   react/   vue/   svelte/   生成项目的前端目录
#   backend/                  生成项目的 Java 后端目录
#
# 对外端口：
#   5173  React
#   5174  Vue
#   5175  Svelte
# 三套前端同源访问 /api/，由 Nginx 统一反代到容器内 127.0.0.1:8088。
# ============================================

# ── 阶段 1: 构建 React 前端 ──
FROM node:22-alpine AS frontend-react
WORKDIR /app
COPY react/package.json react/package-lock.json* ./
RUN npm ci
COPY react/ .
RUN npm run build

# ── 阶段 2: 构建 Vue 前端 ──
FROM node:22-alpine AS frontend-vue
WORKDIR /app
COPY vue/package.json vue/package-lock.json* ./
RUN npm ci
COPY vue/ .
RUN npm run build

# ── 阶段 3: 构建 Svelte 前端 ──
FROM node:22-alpine AS frontend-svelte
WORKDIR /app
COPY svelte/package.json svelte/package-lock.json* ./
RUN npm ci
COPY svelte/ .
RUN npm run build

# ── 阶段 4: 构建 Java 后端 ──
FROM maven:3.9-eclipse-temurin-21 AS backend-builder
WORKDIR /app
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B
COPY backend/src ./src
RUN mvn package -DskipTests -B

# ── 阶段 5: 运行环境 ──
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 安装 Nginx 与时区数据（东八区）
RUN apk add --no-cache nginx tzdata
ENV TZ=Asia/Shanghai

# 采用 X-Forwarded-* 还原浏览器真实地址，使三个端口下的同源请求不被 CORS 拦截
ENV SERVER_FORWARD_HEADERS_STRATEGY=FRAMEWORK

# 三套前端产物，按端口分目录
COPY --from=frontend-react /app/dist /srv/react
COPY --from=frontend-vue /app/dist /srv/vue
COPY --from=frontend-svelte /app/dist /srv/svelte

# Alpine 的 nginx 站点配置放在 http.d，而不是 Debian 风格的 conf.d
COPY nginx.conf /etc/nginx/http.d/default.conf

# 复制后端 JAR
COPY --from=backend-builder /app/target/*.jar /app/app.jar

VOLUME ["/app/data"]

EXPOSE 5173 5174 5175

# 启动脚本：同时运行 Nginx 和后端
COPY --chmod=755 <<'STARTUP' /app/startup.sh
#!/bin/sh
set -e

# 确保数据目录存在
mkdir -p /app/data

# 启动后端（后台）
java -jar /app/app.jar &
# 启动 Nginx（前台）
nginx -g "daemon off;"
STARTUP

CMD ["/app/startup.sh"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5173/api/public/config || exit 1
