#!/bin/bash

# 开发环境管理脚本
# 用法:
#   ./dev.sh start    - 启动服务
#   ./dev.sh stop     - 停止服务
#   ./dev.sh restart  - 重启服务
#   ./dev.sh status   - 查看状态
#   ./dev.sh logs     - 查看日志

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/logs"
BACKEND_PID_FILE="$ROOT_DIR/.backend.pid"
FRONTEND_PID_FILE="$ROOT_DIR/.frontend.pid"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 生成随机密钥
generate_secret() {
    openssl rand -base64 32 | tr -d '/+=' | head -c 32
}

# 检查进程是否运行
is_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# 获取 PID
get_pid() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        cat "$pid_file"
    fi
}

# 启动服务
start() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}       启动开发环境${NC}"
    echo -e "${BLUE}========================================${NC}"

    # 检查是否已在运行
    if is_running "$BACKEND_PID_FILE"; then
        echo -e "${YELLOW}后端服务已在运行 (PID: $(get_pid $BACKEND_PID_FILE))${NC}"
    else
        # 检查目录
        if [ ! -d "$BACKEND_DIR" ]; then
            echo -e "${RED}错误: 后端目录不存在${NC}"
            exit 1
        fi

        # 生成 JWT 密钥
        JWT_SECRET=$(generate_secret)
        echo -e "${GREEN}已生成 JWT 密钥: ${JWT_SECRET:0:8}...${NC}"

        # 检查后端 .env 文件
        ENV_FILE="$BACKEND_DIR/.env"
        if [ ! -f "$ENV_FILE" ]; then
            echo -e "${YELLOW}创建后端 .env 文件...${NC}"
            cat > "$ENV_FILE" << EOF
# 开发环境配置
DATABASE_URL=sqlite+aiosqlite:///./app.db
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=["http://localhost:5173"]
EOF
            echo -e "${GREEN}.env 文件已创建${NC}"
        else
            sed -i '/^JWT_EXPIRE_MINUTES/d' "$ENV_FILE"
            if grep -q "JWT_SECRET_KEY" "$ENV_FILE"; then
                sed -i "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=$JWT_SECRET/" "$ENV_FILE"
            else
                echo "JWT_SECRET_KEY=$JWT_SECRET" >> "$ENV_FILE"
            fi
            echo -e "${GREEN}JWT 密钥已更新${NC}"
        fi

        # 安装后端依赖
        echo -e "\n${YELLOW}检查后端依赖...${NC}"
        cd "$BACKEND_DIR"
        if [ ! -d ".venv" ]; then
            echo -e "${YELLOW}安装后端依赖...${NC}"
            uv sync
        fi

        # 启动后端服务
        echo -e "\n${YELLOW}启动后端服务...${NC}"
        cd "$BACKEND_DIR"
        nohup uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > "$LOG_DIR/backend.log" 2>&1 &
        echo $! > "$BACKEND_PID_FILE"
        echo -e "${GREEN}后端服务已启动 (PID: $(cat $BACKEND_PID_FILE))${NC}"
        sleep 2
    fi

    if is_running "$FRONTEND_PID_FILE"; then
        echo -e "${YELLOW}前端服务已在运行 (PID: $(get_pid $FRONTEND_PID_FILE))${NC}"
    else
        # 检查目录
        if [ ! -d "$FRONTEND_DIR" ]; then
            echo -e "${RED}错误: 前端目录不存在${NC}"
            exit 1
        fi

        # 安装前端依赖
        echo -e "\n${YELLOW}检查前端依赖...${NC}"
        cd "$FRONTEND_DIR"
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}安装前端依赖...${NC}"
            pnpm install
        fi

        # 启动前端服务
        echo -e "\n${YELLOW}启动前端服务...${NC}"
        cd "$FRONTEND_DIR"
        nohup pnpm dev --host 0.0.0.0 > "$LOG_DIR/frontend.log" 2>&1 &
        echo $! > "$FRONTEND_PID_FILE"
        echo -e "${GREEN}前端服务已启动 (PID: $(cat $FRONTEND_PID_FILE))${NC}"
    fi

    # 显示信息
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}       服务已启动${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}后端地址: http://localhost:8000${NC}"
    echo -e "${GREEN}前端地址: http://localhost:5173${NC}"
    echo -e "${GREEN}API 文档: http://localhost:8000/docs${NC}"
    echo -e "${GREEN}日志目录: $LOG_DIR${NC}"
    echo -e "${YELLOW}查看状态: ./dev.sh status${NC}"
    echo -e "${YELLOW}查看日志: ./dev.sh logs${NC}"
    echo -e "${YELLOW}停止服务: ./dev.sh stop${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# 停止服务
stop() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}       停止开发环境${NC}"
    echo -e "${BLUE}========================================${NC}"

    # 停止后端服务
    if is_running "$BACKEND_PID_FILE"; then
        BACKEND_PID=$(get_pid "$BACKEND_PID_FILE")
        echo -e "${YELLOW}正在停止后端服务 (PID: $BACKEND_PID)...${NC}"
        kill "$BACKEND_PID" 2>/dev/null || true
        for i in {1..10}; do
            if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
                break
            fi
            sleep 0.5
        done
        if kill -0 "$BACKEND_PID" 2>/dev/null; then
            kill -9 "$BACKEND_PID" 2>/dev/null || true
        fi
        echo -e "${GREEN}后端服务已停止${NC}"
    else
        echo -e "${YELLOW}后端服务未运行${NC}"
    fi
    rm -f "$BACKEND_PID_FILE"

    # 停止前端服务
    if is_running "$FRONTEND_PID_FILE"; then
        FRONTEND_PID=$(get_pid "$FRONTEND_PID_FILE")
        echo -e "${YELLOW}正在停止前端服务 (PID: $FRONTEND_PID)...${NC}"
        kill "$FRONTEND_PID" 2>/dev/null || true
        for i in {1..10}; do
            if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
                break
            fi
            sleep 0.5
        done
        if kill -0 "$FRONTEND_PID" 2>/dev/null; then
            kill -9 "$FRONTEND_PID" 2>/dev/null || true
        fi
        echo -e "${GREEN}前端服务已停止${NC}"
    else
        echo -e "${YELLOW}前端服务未运行${NC}"
    fi
    rm -f "$FRONTEND_PID_FILE"

    # 清理残留进程
    echo -e "\n${YELLOW}清理残留进程...${NC}"
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
    pkill -f "pnpm dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true

    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${GREEN}所有服务已停止${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# 查看状态
status() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}       服务状态${NC}"
    echo -e "${BLUE}========================================${NC}"

    # 后端状态
    if is_running "$BACKEND_PID_FILE"; then
        echo -e "${GREEN}后端服务: 运行中 (PID: $(get_pid $BACKEND_PID_FILE))${NC}"
    else
        echo -e "${RED}后端服务: 未运行${NC}"
    fi

    # 前端状态
    if is_running "$FRONTEND_PID_FILE"; then
        echo -e "${GREEN}前端服务: 运行中 (PID: $(get_pid $FRONTEND_PID_FILE))${NC}"
    else
        echo -e "${RED}前端服务: 未运行${NC}"
    fi

    echo -e "\n${BLUE}========================================${NC}"
}

# 查看日志
logs() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}       查看日志${NC}"
    echo -e "${BLUE}========================================${NC}"

    if [ -f "$LOG_DIR/backend.log" ]; then
        echo -e "\n${GREEN}=== 后端日志 (最后 20 行) ===${NC}"
        tail -20 "$LOG_DIR/backend.log"
    else
        echo -e "${YELLOW}后端日志文件不存在${NC}"
    fi

    if [ -f "$LOG_DIR/frontend.log" ]; then
        echo -e "\n${GREEN}=== 前端日志 (最后 20 行) ===${NC}"
        tail -20 "$LOG_DIR/frontend.log"
    else
        echo -e "${YELLOW}前端日志文件不存在${NC}"
    fi

    echo -e "\n${BLUE}========================================${NC}"
}

# 重启服务
restart() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}       重启开发环境${NC}"
    echo -e "${BLUE}========================================${NC}"

    stop
    echo ""
    start
}

# 显示帮助
usage() {
    echo -e "${BLUE}用法: ./dev.sh [command]${NC}"
    echo ""
    echo -e "${GREEN}命令:${NC}"
    echo -e "  ${GREEN}start${NC}    启动服务"
    echo -e "  ${GREEN}stop${NC}     停止服务"
    echo -e "  ${GREEN}restart${NC}  重启服务"
    echo -e "  ${GREEN}status${NC}   查看状态"
    echo -e "  ${GREEN}logs${NC}     查看日志"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo -e "  ./dev.sh start    # 启动服务"
    echo -e "  ./dev.sh stop     # 停止服务"
    echo -e "  ./dev.sh restart  # 重启服务"
    echo -e "  ./dev.sh status   # 查看状态"
    echo -e "  ./dev.sh logs     # 查看日志"
}

# 主入口
case "${1:-}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    *)
        usage
        exit 1
        ;;
esac
