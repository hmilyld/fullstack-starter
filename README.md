# 管理系统

基于 React/Vue + FastAPI/Spring Boot 的全栈后台管理系统，提供用户、角色、权限、系统配置及 AI 模型管理的完整功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 (React) | React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4 + shadcn/ui v4 |
| 前端 (Vue) | Vue 3 + TypeScript + Vite 6 + Tailwind CSS 4 + DaisyUI 5 |
| 后端 (Python) | Python 3.12+ + FastAPI + SQLAlchemy 2.0 (async) + SQLite |
| 后端 (Java) | Java 21 + Spring Boot 3.2 + Sa-Token + JPA + SQLite |
| 认证 | JWT (PyJWT) + bcrypt / Sa-Token |
| 部署 | Docker + Nginx + Uvicorn |

## 快速开始

### 一键启动（推荐）

```bash
./dev.sh start              # 启动 Python 后端 + React 前端
./dev.sh start --vue        # 启动 Python 后端 + Vue 前端
./dev.sh start --java       # 启动 Java 后端 + React 前端
./dev.sh start --java --vue # 启动 Java 后端 + Vue 前端
./dev.sh stop               # 停止服务
./dev.sh restart            # 重启服务
./dev.sh status             # 查看状态
./dev.sh logs               # 查看日志
```

启动后访问：
- React 前端：http://localhost:5173
- Vue 前端：http://localhost:5174
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

### 手动启动

**React 前端**

```bash
cd frontend
pnpm install
pnpm dev          # http://localhost:5173
```

**Vue 前端**

```bash
cd frontend-vue
pnpm install
pnpm dev          # http://localhost:5174
```

**后端 (Python)**

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload  # http://localhost:8000
```

**后端 (Java)**

```bash
cd backend-java
mvn clean package -DskipTests
java -jar target/fullstack-backend-1.0.0.jar  # http://localhost:8000
```

首次启动会自动创建数据库、填充种子数据和预设 AI 模型。

## 项目结构

```
├── frontend/          # React 前端 (端口 5173)
├── frontend-vue/      # Vue 前端 (端口 5174)
├── backend/           # Python FastAPI 后端
├── backend-java/      # Java Spring Boot 后端
├── dev.sh             # 开发环境管理脚本
├── Dockerfile         # 多阶段构建
├── nginx.conf         # Nginx 配置
├── docker-compose.yml # 部署配置
├── build.sh           # 构建脚本
└── publish.sh         # 发布脚本
```

## 功能模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 仪表盘 | `/dashboard` | 统计概览、最近活动 |
| 用户管理 | `/settings/user` | 用户增删改查、角色维护、批量修改角色、重置密码 |
| 角色管理 | `/settings/role` | 角色增删改查、权限分配 |
| 权限管理 | `/settings/permission` | 菜单权限 + 操作权限两级控制 |
| 系统设置 | `/settings/system` | 站点信息、注册策略、邮件 SMTP 配置 |
| AI模型配置 | `/settings/ai-model` | AI 模型管理、预设模型管理、模型测试 |
| 个人设置 | `/settings/profile` | 个人信息、修改密码（通过用户菜单访问） |

## 权限系统

### 菜单权限（6个）

| 权限编码 | 名称 |
|----------|------|
| `dashboard` | 仪表盘 |
| `users` | 用户管理 |
| `roles` | 角色管理 |
| `permissions` | 权限管理 |
| `settings` | 系统设置 |
| `ai_models` | AI模型配置 |

### 操作权限（17个）

| 权限编码 | 名称 | 所属菜单 |
|----------|------|----------|
| `users.create` | 新增用户 | 用户管理 |
| `users.edit` | 编辑用户 | 用户管理 |
| `users.delete` | 删除用户 | 用户管理 |
| `users.assign_role` | 角色维护 | 用户管理 |
| `roles.create` | 新增角色 | 角色管理 |
| `roles.edit` | 编辑角色 | 角色管理 |
| `roles.delete` | 删除角色 | 角色管理 |
| `permissions.create` | 新增权限 | 权限管理 |
| `permissions.edit` | 编辑权限 | 权限管理 |
| `permissions.delete` | 删除权限 | 权限管理 |
| `settings.edit` | 编辑系统设置 | 系统设置 |
| `ai_models.create` | 新增AI模型 | AI模型配置 |
| `ai_models.edit` | 编辑AI模型 | AI模型配置 |
| `ai_models.delete` | 删除AI模型 | AI模型配置 |
| `ai_models.presets.create` | 新增预设模型 | AI模型配置 |
| `ai_models.presets.edit` | 编辑预设模型 | AI模型配置 |
| `ai_models.presets.delete` | 删除预设模型 | AI模型配置 |

`admin` 角色自动获得所有权限，无需显式分配。

## 种子数据

首次启动自动创建：

**默认用户**（密码均为 `123456`）：

| 用户名 | 角色 | 邮箱 |
|--------|------|------|
| admin | 管理员 | admin@example.com |
| zhangsan | 管理员 | zhangsan@example.com |
| lisi | 普通用户 | lisi@example.com |
| wangwu | 普通用户 | wangwu@example.com |
| zhaoliu | 普通用户 | zhaoliu@example.com |

**预设角色**：admin（管理员）、user（普通用户）、pending_review（待审核），均不可删除。

**预设 AI 模型**：DeepSeek、小米 MiMo、OpenAI、Claude、通义千问、智谱 GLM、Moonshot、文心一言。

## API 概览

所有端点前缀 `/api`，响应格式：`{ code: 0, message: "success", data }`

### 认证

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录（有速率限制） | 否 |
| POST | `/api/auth/register` | 注册 | 否 |
| POST | `/api/auth/logout` | 登出 | 否 |

### 用户

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 用户列表（分页+搜索） | `users` |
| POST | `/api/users` | 新增用户 | `users.create` |
| POST | `/api/users/batch-role` | 批量修改角色 | `users.edit` / `users.assign_role` |
| PUT | `/api/users/me` | 更新个人信息 | 登录即可 |
| PUT | `/api/users/me/password` | 修改密码 | 登录即可 |
| GET | `/api/users/{id}` | 用户详情 | `users` |
| PUT | `/api/users/{id}` | 编辑用户 | `users.edit` / `users.assign_role` |
| DELETE | `/api/users/{id}` | 删除用户 | `users.delete` |
| PUT | `/api/users/{id}/reset-password` | 重置密码 | `users.edit` |

### 角色

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/roles` | 角色列表 | `roles` |
| POST | `/api/roles` | 新增角色 | `roles.create` |
| PUT | `/api/roles/{id}` | 编辑角色 | `roles.edit` |
| DELETE | `/api/roles/{id}` | 删除角色（预设角色不可删） | `roles.delete` |

### 权限

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/permissions` | 权限列表 | `permissions` |
| POST | `/api/permissions` | 新增权限 | `permissions.create` |
| PUT | `/api/permissions/{code}` | 编辑权限 | `permissions.edit` |
| DELETE | `/api/permissions/{code}` | 删除权限 | `permissions.delete` |

### 系统设置

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/system/config` | 获取完整配置 | `settings` |
| PUT | `/api/system/config` | 更新配置 | `settings.edit` |

### AI 模型配置

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/ai-models` | AI模型列表（分页+搜索） | `ai_models` |
| POST | `/api/ai-models` | 新增AI模型 | `ai_models.create` |
| POST | `/api/ai-models/test` | 测试模型连接（含 SSRF 防护） | `ai_models` |
| GET | `/api/ai-models/{id}` | AI模型详情 | `ai_models` |
| PUT | `/api/ai-models/{id}` | 编辑AI模型 | `ai_models.edit` |
| DELETE | `/api/ai-models/{id}` | 删除AI模型 | `ai_models.delete` |
| GET | `/api/ai-models/presets` | 预设模型列表 | `ai_models` |
| GET | `/api/ai-models/presets/groups` | 预设模型分组 | `ai_models` |
| GET | `/api/ai-models/presets/active` | 启用的预设模型 | 否 |
| POST | `/api/ai-models/presets` | 新增预设模型 | `ai_models.create` |
| PUT | `/api/ai-models/presets/{id}` | 编辑预设模型 | `ai_models.edit` |
| DELETE | `/api/ai-models/presets/{id}` | 删除预设模型 | `ai_models.delete` |
| GET | `/api/ai-models/default` | 获取默认模型（不返回 Key） | 否 |
| GET | `/api/ai-models/by-alias/{alias}` | 通过别名获取模型 | 否 |

### 公开接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/public/config` | 站点公开配置（登录/注册页用） | 否 |

### 仪表盘

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/dashboard/stats` | 统计数据 | `dashboard` |
| GET | `/api/dashboard/activity` | 最近活动 | `dashboard` |

完整 API 文档启动后访问 http://localhost:8000/docs

## Docker 部署

```bash
# 构建镜像
./build.sh

# 启动服务
JWT_SECRET_KEY=your-secret-key docker compose up -d

# 访问 http://localhost
```

### 环境变量

| 变量 | 默认值 | 必须 | 说明 |
|------|--------|------|------|
| `JWT_SECRET_KEY` | - | ✅ | JWT 签名密钥 |
| `JWT_ALGORITHM` | HS256 | 否 | JWT 算法 |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | 1440 | 否 | Token 过期时间（分钟） |
| `CORS_ORIGINS` | `["http://localhost"]` | 否 | 允许的跨域来源 |
| `PORT` | 80 | 否 | 对外暴露端口 |

## 开发命令速查

### React 前端（`frontend/` 目录）

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 类型检查 + 生产构建
pnpm lint         # ESLint
pnpm format       # Prettier 格式化
```

### Vue 前端（`frontend-vue/` 目录）

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 类型检查 + 生产构建
pnpm lint         # ESLint
```

### Python 后端（`backend/` 目录）

```bash
uv sync                                        # 安装依赖
uv run uvicorn app.main:app --reload           # 启动开发服务器
uv run ruff check .                            # 代码检查
uv run ruff format .                           # 格式化
```

### Java 后端（`backend-java/` 目录）

```bash
mvn clean package -DskipTests              # 构建
mvn spring-boot:run                        # 启动开发服务器
mvn spotless:check                         # 检查代码格式
mvn spotless:apply                         # 自动格式化
```
