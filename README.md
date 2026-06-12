# 前后端基础框架管理系统

基于 React + FastAPI 的全栈后台管理系统，提供用户、角色、权限及系统配置的完整功能。

## 技术栈

| 层级 | 技术                                                             |
| ---- | ---------------------------------------------------------------- |
| 前端 | React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4 + shadcn/ui v4 |
| 后端 | Python 3.12 + FastAPI + SQLAlchemy 2.0 (async) + SQLite          |
| 认证 | JWT (PyJWT) + bcrypt                                             |
| 部署 | Docker + Nginx + Uvicorn                                         |

## 项目结构

```
fullstack-starter/
├── frontend/          # React 前端
├── backend/           # FastAPI 后端
├── Dockerfile         # 多阶段构建（Node → Python → 运行时）
├── nginx.conf         # Nginx 配置
├── docker-compose.yml # 部署配置
├── build.sh           # 构建脚本
└── publish.sh         # 发布脚本
```

## 快速开始

### 本地开发

**前端**

```bash
cd frontend
pnpm install
pnpm dev          # 启动开发服务器 http://localhost:5173
```

**后端**

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload  # 启动 API 服务 http://localhost:8000
```

首次启动会自动创建数据库并填充种子数据。

### Docker 部署

```bash
# 构建镜像
./build.sh

# 启动服务
JWT_SECRET_KEY=your-secret-key docker compose up -d

# 访问 http://localhost
```

详见 [Docker 部署](#docker-部署) 章节。

## 功能模块

| 模块     | 路由                   | 说明                                 |
| -------- | ---------------------- | ------------------------------------ |
| 仪表盘   | `/dashboard`           | 统计概览、最近活动                   |
| 用户管理 | `/settings/user`       | 用户增删改查、批量修改角色、重置密码 |
| 角色管理 | `/settings/role`       | 角色增删改查、权限分配               |
| 权限管理 | `/settings/permission` | 菜单权限 + 操作权限两级控制          |
| 个人设置 | `/settings/profile`    | 个人信息、修改密码                   |
| 系统设置 | `/settings/system`     | 系统配置管理                         |

## 权限系统

两级权限控制：

- **菜单权限** (`type: "menu"`)：控制页面访问（dashboard、users、roles、permissions、settings）
- **操作权限** (`type: "operation"`)：控制 CRUD 操作（users.create、users.edit、users.delete 等）

`admin` 角色自动获得所有权限，无需显式分配。

## 种子数据

首次启动自动创建：

**默认用户**（密码均为 `123456`）：

| 用户名   | 角色     | 邮箱                 |
| -------- | -------- | -------------------- |
| admin    | 管理员   | admin@example.com    |
| zhangsan | 管理员   | zhangsan@example.com |
| lisi     | 普通用户 | lisi@example.com     |
| wangwu   | 普通用户 | wangwu@example.com   |
| zhaoliu  | 普通用户 | zhaoliu@example.com  |

**预设角色**：admin（管理员）、user（普通用户）、pending_review（待审核），均不可删除。

## API 概览

所有端点前缀 `/api`，响应格式：`{ code: 0, message: "success", data }`

| 模块   | 端点                          | 说明                  |
| ------ | ----------------------------- | --------------------- |
| 认证   | `POST /api/auth/login`        | 登录                  |
|        | `POST /api/auth/register`     | 注册                  |
| 用户   | `GET /api/users`              | 用户列表（分页+搜索） |
|        | `POST /api/users`             | 新增用户              |
|        | `PUT /api/users/{id}`         | 编辑用户              |
|        | `DELETE /api/users/{id}`      | 删除用户              |
| 角色   | `GET /api/roles`              | 角色列表              |
|        | `POST /api/roles`             | 新增角色              |
|        | `PUT /api/roles/{id}`         | 编辑角色              |
|        | `DELETE /api/roles/{id}`      | 删除角色              |
| 权限   | `GET /api/permissions`        | 权限列表              |
|        | `POST /api/permissions`       | 新增权限              |
| 系统   | `GET /api/system/config`      | 获取配置              |
|        | `PUT /api/system/config`      | 更新配置              |
| 仪表盘 | `GET /api/dashboard/stats`    | 统计数据              |
|        | `GET /api/dashboard/activity` | 最近活动              |

完整 API 文档启动后访问 http://localhost:8000/docs

## Docker 部署

### 构建镜像

```bash
# 默认镜像名 fullstack-admin:latest
./build.sh

# 自定义镜像名和版本
./build.sh your-username/admin-system v1.0.0
```

### 启动服务

```bash
# 必须设置 JWT_SECRET_KEY
JWT_SECRET_KEY=your-secret-key docker compose up -d

# 自定义端口
PORT=8080 JWT_SECRET_KEY=your-secret-key docker compose up -d
```

### 发布到 Docker Hub

```bash
# 推送 latest
./publish.sh

# 推送 latest + 版本 tag
./publish.sh v1.0.0
```

### 环境变量

| 变量                              | 默认值                 | 必须 | 说明                   |
| --------------------------------- | ---------------------- | ---- | ---------------------- |
| `JWT_SECRET_KEY`                  | -                      | ✅   | JWT 签名密钥           |
| `JWT_ALGORITHM`                   | HS256                  | 否   | JWT 算法               |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | 1440                   | 否   | Token 过期时间（分钟） |
| `CORS_ORIGINS`                    | `["http://localhost"]` | 否   | 允许的跨域来源         |
| `PORT`                            | 80                     | 否   | 对外暴露端口           |
| `DOCKER_IMAGE`                    | fullstack-admin        | 否   | 镜像名称               |
| `TAG`                             | latest                 | 否   | 镜像标签               |

## 开发命令速查

### 前端（`frontend/` 目录）

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 类型检查 + 生产构建
pnpm lint         # ESLint
pnpm format       # Prettier 格式化
```

### 后端（`backend/` 目录）

```bash
uv sync                                        # 安装依赖
uv run uvicorn app.main:app --reload           # 启动开发服务器
uv run ruff check .                            # 代码检查
uv run ruff format .                           # 格式化
```
