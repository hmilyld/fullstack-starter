#!/bin/bash
set -e

# ============================================================
# 镜像构建脚本
# 用法: ./build.sh [镜像名] [标签]
# ============================================================

# 默认镜像名（修改为你的 Docker Hub 用户名/镜像名）
DOCKER_IMAGE="${DOCKER_IMAGE:-fullstack-admin}"
TAG="${TAG:-latest}"

# 支持命令行参数覆盖
if [ -n "$1" ]; then
  DOCKER_IMAGE="$1"
fi
if [ -n "$2" ]; then
  TAG="$2"
fi

IMAGE_FULL="${DOCKER_IMAGE}:${TAG}"

echo "============================================"
echo "  构建 Docker 镜像"
echo "  镜像: ${IMAGE_FULL}"
echo "============================================"

docker build -t "${IMAGE_FULL}" .

echo ""
echo "✅ 镜像构建完成: ${IMAGE_FULL}"
echo ""
echo "运行: docker compose up -d"
echo "或者: docker run -p 80:80 -e JWT_SECRET_KEY=your-secret ${IMAGE_FULL}"
