#!/bin/bash
set -e

# ============================================================
# 镜像构建脚本
# 用法: ./build.sh [选项] [镜像名] [标签]
# 选项:
#   --java       使用 Java 后端 (默认 Python)
#   --vue        使用 Vue 前端 (默认 React)
#   --help       显示帮助信息
# ============================================================

# 显示帮助
usage() {
    echo "用法: ./build.sh [选项] [镜像名] [标签]"
    echo ""
    echo "选项:"
    echo "  --java       使用 Java 后端 (默认 Python)"
    echo "  --vue        使用 Vue 前端 (默认 React)"
    echo "  --help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./build.sh                           # Python 后端 + React 前端"
    echo "  ./build.sh --java                    # Java 后端 + React 前端"
    echo "  ./build.sh --vue                     # Python 后端 + Vue 前端"
    echo "  ./build.sh --java --vue              # Java 后端 + Vue 前端"
    echo "  ./build.sh myapp v1.0                # 自定义镜像名和标签"
    echo "  ./build.sh --java myapp v1.0         # Java 后端，自定义镜像名"
    exit 0
}

# 默认值
DOCKER_IMAGE="${DOCKER_IMAGE:-fullstack-admin}"
TAG="${TAG:-latest}"
BACKEND="python"
FRONTEND="react"

# 解析参数
POSITIONAL_ARGS=()
while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            usage
            ;;
        --java)
            BACKEND="java"
            shift
            ;;
        --vue)
            FRONTEND="vue"
            shift
            ;;
        *)
            POSITIONAL_ARGS+=("$1")
            shift
            ;;
    esac
done

# 处理位置参数
if [ ${#POSITIONAL_ARGS[@]} -ge 1 ]; then
    DOCKER_IMAGE="${POSITIONAL_ARGS[0]}"
fi
if [ ${#POSITIONAL_ARGS[@]} -ge 2 ]; then
    TAG="${POSITIONAL_ARGS[1]}"
fi

IMAGE_FULL="${DOCKER_IMAGE}:${TAG}"

echo "============================================"
echo "  构建 Docker 镜像"
echo "  镜像: ${IMAGE_FULL}"
echo "  前端: ${FRONTEND}"
echo "  后端: ${BACKEND}"
echo "============================================"

# 选择 Dockerfile
if [ "$BACKEND" = "java" ]; then
    DOCKERFILE="backend-java/Dockerfile"
else
    DOCKERFILE="Dockerfile"
fi

docker build \
    --build-arg FRONTEND=${FRONTEND} \
    -f ${DOCKERFILE} \
    -t "${IMAGE_FULL}" \
    .

echo ""
echo "✅ 镜像构建完成: ${IMAGE_FULL}"
echo ""
echo "运行: docker compose up -d"
echo "或者: docker run -p 80:80 -e JWT_SECRET_KEY=your-secret ${IMAGE_FULL}"
