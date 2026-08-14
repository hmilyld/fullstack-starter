import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

export type FrontendType = 'react' | 'vue';
export type BackendType = 'python' | 'java';

export async function generateProject(
  projectName: string,
  frontend: FrontendType,
  backend: BackendType
): Promise<void> {
  const projectPath = path.join(process.cwd(), projectName);

  if (await fs.pathExists(projectPath)) {
    throw new Error(`目录 ${projectName} 已存在`);
  }

  await fs.mkdir(projectPath, { recursive: true });

  await copyTemplate('base', projectPath);
  await copyTemplate(`frontend-${frontend}`, path.join(projectPath, 'frontend'));

  // 允许 esbuild 等依赖执行构建脚本

  await copyTemplate(`backend-${backend}`, path.join(projectPath, 'backend'));

  await Promise.all([
    generateDevSh(projectPath, frontend, backend),
    generateBuildSh(projectPath, frontend, backend),
    generateDockerfile(projectPath, frontend, backend),
    generateDockerCompose(projectPath, projectName, frontend, backend),
    generateDockerignore(projectPath),
    generateNginxConf(projectPath, frontend),
    generateReadme(projectPath, projectName, frontend, backend),
  ]);

  await initGit(projectPath);
}

async function copyTemplate(templateName: string, destination: string): Promise<void> {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  if (!await fs.pathExists(templatePath)) {
    throw new Error(`模板 ${templateName} 不存在`);
  }
  await fs.copy(templatePath, destination);
}

// ── dev.sh ────────────────────────────────────────────────

function generateDevSh(projectPath: string, frontend: FrontendType, backend: BackendType): Promise<void> {
  const backendStart = backend === 'python'
    ? 'cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8088'
    : 'cd backend && mvn spring-boot:run';

  const content = `#!/bin/bash
# 开发环境启动脚本

set -e
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

print_info()  { echo -e "\${GREEN}[INFO]\${NC} \$1"; }
print_warn()  { echo -e "\${YELLOW}[WARN]\${NC} \$1"; }
print_error() { echo -e "\${RED}[ERROR]\${NC} \$1"; }

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  print_info "正在停止服务..."
  [ -n "$BACKEND_PID" ]  && kill $BACKEND_PID 2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
  print_info "服务已停止"
}

trap cleanup EXIT INT TERM

start_backend() {
  print_info "启动后端服务..."
  ${backendStart} &
  BACKEND_PID=$!
  print_info "后端服务已启动 (PID: $BACKEND_PID)"
}

start_frontend() {
  print_info "启动前端服务..."
  cd frontend && npm run dev &
  FRONTEND_PID=$!
  print_info "前端服务已启动 (PID: $FRONTEND_PID)"
}

install_deps() {
  print_info "安装前端依赖..."
  cd frontend && npm install && cd ..
${backend === 'python' ? `  print_info "安装后端依赖..."
  cd backend && uv sync && cd ..` : `  print_info "后端依赖通过 Maven 自动管理"`}
}

main() {
  install_deps
  print_info "启动开发环境..."
  start_backend
  start_frontend
  print_info ""
  print_info "服务已全部启动"
  print_info "  后端 API:  http://localhost:8088"
    print_info "  前端页面:  http://localhost:5173"
  print_info "  API 文档:  http://localhost:8088/docs"
  print_info ""
  wait
}

case "\${1:-start}" in
  start)   main ;;
  stop)    cleanup ;;
  restart) cleanup; main ;;
  install) install_deps ;;
  *)       main ;;
esac
`;
  return fs.writeFile(path.join(projectPath, 'dev.sh'), content, { mode: 0o755 });
}

// ── build.sh ──────────────────────────────────────────────

function generateBuildSh(projectPath: string, frontend: FrontendType, backend: BackendType): Promise<void> {
  const backendCheck = backend === 'python'
    ? 'cd backend && uv run ruff check .'
    : 'cd backend && mvn spotless:check';

  const content = `#!/bin/bash
# 构建脚本

set -e
RED='\\033[0;31m'
GREEN='\\033[0;32m'
NC='\\033[0m'

print_info()  { echo -e "\${GREEN}[INFO]\${NC} \$1"; }

main() {
  print_info "开始构建项目..."
  print_info ""
  print_info "→ 构建前端..."
  cd frontend && npm run build
  print_info "  前端构建完成 ✓"
  print_info ""
  print_info "→ 检查后端代码..."
  ${backendCheck}
  print_info "  后端检查通过 ✓"
  print_info ""
  print_info "项目构建完成 🎉"
}

main
`;
  return fs.writeFile(path.join(projectPath, 'build.sh'), content, { mode: 0o755 });
}

// ── Dockerfile（单镜像：Nginx + 后端）────────────────────

function generateDockerfile(projectPath: string, frontend: FrontendType, backend: BackendType): Promise<void> {
  
  let dockerfile: string;

  if (backend === 'python') {
    dockerfile = `# ============================================
# 单镜像构建：前端 + 后端 + Nginx
# ============================================

# ── 阶段 1: 构建前端 ──
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ── 阶段 2: 运行环境 ──
FROM python:3.12-slim

# 安装 Nginx
RUN apt-get update && \\
    apt-get install -y --no-install-recommends nginx && \\
    rm -rf /var/lib/apt/lists/*

# 复制前端构建产物到 Nginx
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 安装后端依赖
WORKDIR /app
COPY backend/pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip && \\
    pip install --no-cache-dir uv
COPY backend/ .
RUN cd /app && uv pip install --system -e .

# 环境变量
ENV DATABASE_URL=sqlite+aiosqlite:////app/data/app.db
ENV PYTHONUNBUFFERED=1

VOLUME ["/app/data"]

EXPOSE 5173

# 启动脚本：同时运行 Nginx 和后端
COPY --chmod=755 <<'STARTUP' /app/startup.sh
#!/bin/bash
set -e

# 确保数据目录存在
mkdir -p /app/data

# 启动后端（后台）
cd /app && python -m uvicorn app.main:app --host 0.0.0.0 --port 8088 &
# 启动 Nginx（前台）
nginx -g "daemon off;"
STARTUP

CMD ["/app/startup.sh"]

# 健康检查（python:3.12-slim 无 wget，使用 urllib）
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \\
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5173/api/public/config', timeout=5)" || exit 1
`;
  } else {
    dockerfile = `# ============================================
# 单镜像构建：前端 + 后端 + Nginx
# ============================================

# ── 阶段 1: 构建前端 ──
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ── 阶段 2: 构建后端 ──
FROM maven:3.9-eclipse-temurin-21 AS backend-builder
WORKDIR /app
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B
COPY backend/src ./src
RUN mvn package -DskipTests -B

# ── 阶段 3: 运行环境 ──
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 安装 Nginx
RUN apk add --no-cache nginx

# 复制前端构建产物到 Nginx
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制后端 JAR
COPY --from=backend-builder /app/target/*.jar /app/app.jar

VOLUME ["/app/data"]

EXPOSE 5173

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
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \\
  CMD wget -qO- http://127.0.0.1:5173/api/public/config || exit 1
`;
  }

  return fs.writeFile(path.join(projectPath, 'Dockerfile'), dockerfile);
}

// ── docker-compose.yml ────────────────────────────────────

function generateDockerCompose(projectPath: string, projectName: string, frontend: FrontendType, backend: BackendType): Promise<void> {
  
  const content = `services:
  app:
    build: .
    ports:
      - "5173:5173"
    environment:
      - JWT_SECRET_KEY=\${JWT_SECRET_KEY:?请通过环境变量 JWT_SECRET_KEY 设置一个强随机密钥}
    volumes:
      - app-data:/app/data
    restart: unless-stopped

volumes:
  app-data:
`;
  return fs.writeFile(path.join(projectPath, 'docker-compose.yml'), content);
}

// ── .dockerignore ─────────────────────────────────────────

function generateDockerignore(projectPath: string): Promise<void> {
  const content = `node_modules
.venv
venv
dist
target
.git
.gitignore
*.db
*.db-journal
.env
.env.*
data
__pycache__
*.pyc
`;
  return fs.writeFile(path.join(projectPath, '.dockerignore'), content);
}

// ── nginx.conf ────────────────────────────────────────────

function generateNginxConf(projectPath: string, frontend: FrontendType): Promise<void> {
  const content = `server {
    listen 5173;
    server_name localhost;

    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理（同一容器内）
    location /api/ {
        proxy_pass http://127.0.0.1:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Swagger 文档
    location /docs {
        proxy_pass http://127.0.0.1:8088;
    }
    location /openapi.json {
        proxy_pass http://127.0.0.1:8088;
    }
    location /redoc {
        proxy_pass http://127.0.0.1:8088;
    }
}
`;
  return fs.writeFile(path.join(projectPath, 'nginx.conf'), content);
}

// ── README.md ─────────────────────────────────────────────

function generateReadme(
  projectPath: string,
  projectName: string,
  frontend: FrontendType,
  backend: BackendType
): Promise<void> {
  const frontendName = frontend === 'react' ? 'React' : 'Vue';
  const backendName = backend === 'python' ? 'Python (FastAPI)' : 'Java (Spring Boot)';
  const backendStart = backend === 'python'
    ? 'cd backend && uv run uvicorn app.main:app --reload'
    : 'cd backend && mvn spring-boot:run';

  const content = `# ${projectName}

一个使用 ${frontendName} 和 ${backendName} 构建的后台管理系统。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | ${frontendName} + Vite + TypeScript + Tailwind CSS${frontend === 'vue' ? ' + DaisyUI' : ''} |
| 后端 | ${backendName} |
| 数据库 | ${backend === 'python' ? 'SQLite (aiosqlite)' : 'SQLite (文件)'} |
| 认证 | JWT |
| 部署 | Docker（单镜像：Nginx + 后端） |

## 功能模块

- ✅ 用户登录 / JWT 认证
- ✅ 仪表盘统计
- ✅ 用户管理（增删改查 + 分页 + 搜索）
- ✅ 角色管理（增删改查 + 分页 + 搜索）

## 快速开始

### 开发环境

\`\`\`bash
cd frontend && npm install && cd ..
./dev.sh start
\`\`\`

- 前端: http://localhost:5173
- 后端: http://localhost:8088

### Docker 部署（单镜像）

\`\`\`bash
# 构建镜像
docker build -t ${projectName} .

# 运行（必须设置强随机 JWT_SECRET_KEY，例如: openssl rand -base64 48）
docker run -d -p 5173:5173 -e JWT_SECRET_KEY=\$(openssl rand -base64 48) ${projectName}

# 或使用 docker compose（未设置 JWT_SECRET_KEY 时会直接报错提示）
JWT_SECRET_KEY=\$(openssl rand -base64 48) docker compose up -d
\`\`\`

访问 http://localhost:5173

### 默认账号

> 注意: 默认密码 \`123456\` 仅用于开发调试，生产部署后请立即修改密码。

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 管理员 |
| zhangsan | 123456 | 普通用户 |
| lisi | 123456 | 普通用户 |
| wangwu | 123456 | 普通用户 |
| zhaoliu | 123456 | 普通用户 |

### 数据持久化

Docker 部署时 SQLite 数据存放在命名卷 \`app-data\` 中，挂载到容器的 \`/app/data\` 目录。
\`docker compose down\` 后数据仍会保留，重新 \`docker compose up -d\` 后数据不丢失。
如需清理数据，可执行 \`docker compose down -v\` 删除数据卷。

## 项目结构

\`\`\`
${projectName}/
├── frontend/              # 前端 (${frontendName})
├── backend/               # 后端 (${backend === 'python' ? 'FastAPI' : 'Spring Boot'})
├── dev.sh                 # 开发脚本
├── build.sh               # 构建脚本
├── Dockerfile             # Docker 镜像（前端 + 后端 + Nginx）
├── docker-compose.yml     # Docker 编排
├── nginx.conf             # Nginx 配置
└── README.md
\`\`\`

## API 接口

所有接口返回格式：\`{ code: 0, message: "success", data: ... }\`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/login | 登录 | 否 |
| GET | /api/auth/me | 获取当前用户 | 是 |
| GET | /api/users | 用户列表 | 是 |
| POST | /api/users | 创建用户 | 是(admin) |
| PUT | /api/users/:id | 更新用户 | 是(admin) |
| DELETE | /api/users/:id | 删除用户 | 是(admin) |
| GET | /api/roles | 角色列表 | 是 |
| POST | /api/roles | 创建角色 | 是(admin) |
| PUT | /api/roles/:id | 更新角色 | 是(admin) |
| DELETE | /api/roles/:id | 删除角色 | 是(admin) |
| GET | /api/dashboard/stats | 仪表盘统计 | 是 |

## 开发命令

\`\`\`bash
./dev.sh start        # 启动开发服务
./dev.sh stop         # 停止服务
./dev.sh restart      # 重启服务
./build.sh            # 构建项目
\`\`\`
`;
  return fs.writeFile(path.join(projectPath, 'README.md'), content);
}

async function initGit(projectPath: string): Promise<void> {
  try {
    const { execSync } = await import('child_process');
    execSync('git init', { cwd: projectPath, stdio: 'ignore' });
    execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
    execSync('git commit -m "初始提交"', { cwd: projectPath, stdio: 'ignore' });
  } catch {
    // Git 初始化失败不影响项目生成
  }
}
