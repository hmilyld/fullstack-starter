#!/bin/bash

# 开发环境管理脚本
# 用法:
#   ./dev.sh start              - 启动服务 (默认 Python 后端 + React 前端)
#   ./dev.sh start --java       - 启动 Java 后端
#   ./dev.sh start --python     - 启动 Python 后端
#   ./dev.sh start --vue        - 启动 Vue 前端 (替代 React 前端)
#   ./dev.sh stop               - 停止服务
#   ./dev.sh restart            - 重启服务
#   ./dev.sh restart --java     - 重启并切换到 Java 后端
#   ./dev.sh status             - 查看状态
#   ./dev.sh logs               - 查看日志

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON_BACKEND_DIR="$ROOT_DIR/backend"
JAVA_BACKEND_DIR="$ROOT_DIR/backend-java"
FRONTEND_DIR="$ROOT_DIR/frontend"
VUE_FRONTEND_DIR="$ROOT_DIR/frontend-vue"
LOG_DIR="$ROOT_DIR/logs"
BACKEND_PID_FILE="$ROOT_DIR/.backend.pid"
FRONTEND_PID_FILE="$ROOT_DIR/.frontend.pid"
FRONTEND_TYPE_FILE="$ROOT_DIR/.frontend-type"
BACKEND_TYPE_FILE="$ROOT_DIR/.backend-type"

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

# 获取当前后端类型
get_backend_type() {
    if [ -f "$BACKEND_TYPE_FILE" ]; then
        cat "$BACKEND_TYPE_FILE"
    else
        echo "python"
    fi
}

# 设置后端类型
set_backend_type() {
    echo "$1" > "$BACKEND_TYPE_FILE"
}

# 获取当前前端类型
get_frontend_type() {
    if [ -f "$FRONTEND_TYPE_FILE" ]; then
        cat "$FRONTEND_TYPE_FILE"
    else
        echo "react"
    fi
}

# 设置前端类型
set_frontend_type() {
    echo "$1" > "$FRONTEND_TYPE_FILE"
}

# 启动 Python 后端
start_python_backend() {
    echo -e "${YELLOW}启动 Python 后端...${NC}"

    if [ ! -d "$PYTHON_BACKEND_DIR" ]; then
        echo -e "${RED}错误: Python 后端目录不存在${NC}"
        exit 1
    fi

    # 生成 JWT 密钥
    JWT_SECRET=$(generate_secret)
    echo -e "${GREEN}已生成 JWT 密钥: ${JWT_SECRET:0:8}...${NC}"

    # 检查后端 .env 文件
    ENV_FILE="$PYTHON_BACKEND_DIR/.env"
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}创建后端 .env 文件...${NC}"
        cat > "$ENV_FILE" << EOF
# 开发环境配置
DATABASE_URL=sqlite+aiosqlite:///./app.db
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=["http://localhost:5173","http://localhost:5174"]
EOF
        echo -e "${GREEN}.env 文件已创建${NC}"
    else
        sed -i '/^JWT_EXPIRE_MINUTES/d' "$ENV_FILE"
        if grep -q "JWT_SECRET_KEY" "$ENV_FILE"; then
            sed -i "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=$JWT_SECRET/" "$ENV_FILE"
        else
            echo "JWT_SECRET_KEY=$JWT_SECRET" >> "$ENV_FILE"
        fi
        # 确保 CORS 包含 Vue 前端端口
        if ! grep -q "5174" "$ENV_FILE"; then
            sed -i 's/CORS_ORIGINS=\["http:\/\/localhost:5173"\]/CORS_ORIGINS=["http:\/\/localhost:5173","http:\/\/localhost:5174"]/' "$ENV_FILE"
        fi
        echo -e "${GREEN}JWT 密钥已更新${NC}"
    fi

    # 安装后端依赖
    echo -e "\n${YELLOW}检查 Python 后端依赖...${NC}"
    cd "$PYTHON_BACKEND_DIR"
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}安装 Python 后端依赖...${NC}"
        uv sync
    fi

    # 启动后端服务
    echo -e "\n${YELLOW}启动 Python 后端服务...${NC}"
    cd "$PYTHON_BACKEND_DIR"
    nohup uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    set_backend_type "python"
    echo -e "${GREEN}Python 后端服务已启动 (PID: $(cat $BACKEND_PID_FILE))${NC}"
}

# 启动 Java 后端
start_java_backend() {
    echo -e "${YELLOW}启动 Java 后端...${NC}"

    if [ ! -d "$JAVA_BACKEND_DIR" ]; then
        echo -e "${RED}错误: Java 后端目录不存在${NC}"
        exit 1
    fi

    cd "$JAVA_BACKEND_DIR"

    # 检查是否已编译
    if [ ! -f "target/fullstack-backend-1.0.0.jar" ]; then
        echo -e "${YELLOW}编译 Java 后端...${NC}"
        mvn clean package -DskipTests -q
    fi

    # 创建数据目录
    mkdir -p data

    # 启动后端服务
    echo -e "\n${YELLOW}启动 Java 后端服务...${NC}"
    nohup java -jar target/fullstack-backend-1.0.0.jar > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    set_backend_type "java"
    echo -e "${GREEN}Java 后端服务已启动 (PID: $(cat $BACKEND_PID_FILE))${NC}"
}

# 启动 React 前端
start_react_frontend() {
    if is_running "$FRONTEND_PID_FILE"; then
        echo -e "${YELLOW}前端服务已在运行 (PID: $(get_pid $FRONTEND_PID_FILE))${NC}"
        return
    fi

    if [ ! -d "$FRONTEND_DIR" ]; then
        echo -e "${RED}错误: React 前端目录不存在${NC}"
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
    set_frontend_type "react"
    echo -e "${GREEN}前端服务已启动 (PID: $(cat $FRONTEND_PID_FILE))${NC}"
}

# 启动 Vue 前端
start_vue_frontend() {
    if is_running "$FRONTEND_PID_FILE"; then
        echo -e "${YELLOW}前端服务已在运行 (PID: $(get_pid $FRONTEND_PID_FILE))${NC}"
        return
    fi

    if [ ! -d "$VUE_FRONTEND_DIR" ]; then
        echo -e "${RED}错误: Vue 前端目录不存在${NC}"
        exit 1
    fi

    # 安装前端依赖
    echo -e "\n${YELLOW}检查 Vue 前端依赖...${NC}"
    cd "$VUE_FRONTEND_DIR"
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}安装 Vue 前端依赖...${NC}"
        pnpm install
    fi

    # 启动前端服务
    echo -e "\n${YELLOW}启动 Vue 前端服务...${NC}"
    cd "$VUE_FRONTEND_DIR"
    nohup pnpm dev --host 0.0.0.0 > "$LOG_DIR/frontend-vue.log" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
    set_frontend_type "vue"
    echo -e "${GREEN}Vue 前端服务已启动 (PID: $(cat $FRONTEND_PID_FILE))${NC}"
}

# 启动服务
start() {
    local backend_type="${1:-python}"
    local frontend_type="${2:-react}"

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}       启动开发环境${NC}"
    echo -e "${BLUE}========================================${NC}"

    # 检查是否已在运行
    if is_running "$BACKEND_PID_FILE"; then
        local current_type=$(get_backend_type)
        echo -e "${YELLOW}后端服务已在运行 (PID: $(get_pid $BACKEND_PID_FILE), 类型: $current_type)${NC}"
    else
        if [ "$backend_type" = "java" ]; then
            start_java_backend
        else
            start_python_backend
        fi
        sleep 2
    fi

    # 启动前端
    if [ "$frontend_type" = "vue" ]; then
        start_vue_frontend
    else
        start_react_frontend
    fi

    # 显示信息
    local backend_type_display=$(get_backend_type)
    local frontend_type_display=$(get_frontend_type)
    local frontend_port=5173
    if [ "$frontend_type_display" = "vue" ]; then
        frontend_port=5174
    fi

    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}       服务已启动${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}后端类型: ${backend_type_display}${NC}"
    echo -e "${GREEN}前端类型: ${frontend_type_display}${NC}"
    echo -e "${GREEN}后端地址: http://localhost:8000${NC}"
    echo -e "${GREEN}前端地址: http://localhost:${frontend_port}${NC}"
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
    pkill -f "fullstack-backend" 2>/dev/null || true
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
    local backend_type=$(get_backend_type)
    if is_running "$BACKEND_PID_FILE"; then
        echo -e "${GREEN}后端服务: 运行中 (PID: $(get_pid $BACKEND_PID_FILE), 类型: $backend_type)${NC}"
    else
        echo -e "${RED}后端服务: 未运行${NC}"
    fi

    # 前端状态
    local frontend_type=$(get_frontend_type)
    local frontend_port=5173
    if [ "$frontend_type" = "vue" ]; then
        frontend_port=5174
    fi
    if is_running "$FRONTEND_PID_FILE"; then
        echo -e "${GREEN}前端服务: 运行中 (PID: $(get_pid $FRONTEND_PID_FILE), 类型: $frontend_type, 端口: $frontend_port)${NC}"
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

    local frontend_type=$(get_frontend_type)
    local frontend_log="$LOG_DIR/frontend.log"
    if [ "$frontend_type" = "vue" ]; then
        frontend_log="$LOG_DIR/frontend-vue.log"
    fi

    if [ -f "$frontend_log" ]; then
        echo -e "\n${GREEN}=== 前端日志 ($frontend_type, 最后 20 行) ===${NC}"
        tail -20 "$frontend_log"
    else
        echo -e "${YELLOW}前端日志文件不存在${NC}"
    fi

    echo -e "\n${BLUE}========================================${NC}"
}

# 重启服务
restart() {
    local backend_type="${1:-}"
    local frontend_type="${2:-}"

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}       重启开发环境${NC}"
    echo -e "${BLUE}========================================${NC}"

    stop
    echo ""
    start "$backend_type" "$frontend_type"
}

# 显示帮助
usage() {
    echo -e "${BLUE}用法: ./dev.sh [command] [--python|--java] [--vue]${NC}"
    echo ""
    echo -e "${GREEN}命令:${NC}"
    echo -e "  ${GREEN}start${NC}              启动服务 (默认 Python 后端 + React 前端)"
    echo -e "  ${GREEN}start --java${NC}       启动 Java 后端"
    echo -e "  ${GREEN}start --python${NC}     启动 Python 后端"
    echo -e "  ${GREEN}start --vue${NC}        启动 Vue 前端 (替代 React 前端)"
    echo -e "  ${GREEN}stop${NC}               停止服务"
    echo -e "  ${GREEN}restart${NC}            重启服务"
    echo -e "  ${GREEN}restart --java${NC}     重启并切换到 Java 后端"
    echo -e "  ${GREEN}restart --python${NC}   重启并切换到 Python 后端"
    echo -e "  ${GREEN}restart --vue${NC}      重启并切换到 Vue 前端"
    echo -e "  ${GREEN}status${NC}             查看状态"
    echo -e "  ${GREEN}logs${NC}               查看日志"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo -e "  ./dev.sh start              # 启动 Python 后端 + React 前端"
    echo -e "  ./dev.sh start --java       # 启动 Java 后端 + React 前端"
    echo -e "  ./dev.sh start --vue        # 启动 Python 后端 + Vue 前端"
    echo -e "  ./dev.sh start --java --vue # 启动 Java 后端 + Vue 前端"
    echo -e "  ./dev.sh stop               # 停止所有服务"
    echo -e "  ./dev.sh restart --java     # 停止后重启 Java 后端"
    echo -e "  ./dev.sh restart --vue      # 停止后重启 Vue 前端"
}

# 解析参数
parse_args() {
    BACKEND_TYPE="python"
    FRONTEND_TYPE="react"
    COMMAND=""

    for arg in "$@"; do
        case "$arg" in
            --java)
                BACKEND_TYPE="java"
                ;;
            --python)
                BACKEND_TYPE="python"
                ;;
            --vue)
                FRONTEND_TYPE="vue"
                ;;
            start|stop|restart|status|logs)
                COMMAND="$arg"
                ;;
            *)
                echo -e "${RED}未知参数: $arg${NC}"
                usage
                exit 1
                ;;
        esac
    done

    if [ -z "$COMMAND" ]; then
        usage
        exit 1
    fi
}

# 主入口
parse_args "$@"

case "$COMMAND" in
    start)
        start "$BACKEND_TYPE" "$FRONTEND_TYPE"
        ;;
    stop)
        stop
        ;;
    restart)
        restart "$BACKEND_TYPE" "$FRONTEND_TYPE"
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
