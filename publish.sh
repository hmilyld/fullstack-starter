#!/bin/bash
set -e

# ============================================================
# Docker Hub 发布脚本
# 用法:
#   ./publish.sh              # 推送 latest
#   ./publish.sh v1.0.0       # 推送 latest + v1.0.0
# ============================================================

# 默认镜像名（修改为你的 Docker Hub 用户名/镜像名）
DOCKER_IMAGE="${DOCKER_IMAGE:-fullstack-admin}"
TAG="${TAG:-latest}"

# 支持命令行参数
VERSION="$1"

echo "============================================"
echo "  发布镜像到 Docker Hub"
echo "  镜像: ${DOCKER_IMAGE}"
echo "============================================"

# 登录 Docker Hub
echo ""
echo ">>> 登录 Docker Hub..."
docker login

# 推送 latest
echo ""
echo ">>> 推送 ${DOCKER_IMAGE}:${TAG}..."
docker push "${DOCKER_IMAGE}:${TAG}"

# 如果指定了版本号，额外推送版本 tag
if [ -n "$VERSION" ]; then
  echo ""
  echo ">>> 打版本 tag: ${VERSION}"
  docker tag "${DOCKER_IMAGE}:${TAG}" "${DOCKER_IMAGE}:${VERSION}"

  echo ">>> 推送 ${DOCKER_IMAGE}:${VERSION}..."
  docker push "${DOCKER_IMAGE}:${VERSION}"
fi

echo ""
echo "✅ 发布完成!"
echo "   镜像: https://hub.docker.com/r/${DOCKER_IMAGE}"
