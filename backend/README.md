# Backend — FastAPI 管理系统 API

基于 FastAPI + SQLAlchemy + SQLite 的异步后端，提供用户、角色、权限及系统配置的完整 CRUD API。

## 技术栈

- **Python** 3.12+
- **FastAPI** — 异步 Web 框架
- **SQLAlchemy** (async) + **aiosqlite** — 异步 ORM，SQLite 数据库
- **PyJWT** + **bcrypt** — JWT 认证 + 密码哈希
- **pydantic-settings** — 环境变量配置
- **uv** — 包管理器
- **ruff** — 代码检查与格式化

## 快速开始

```bash
# 1. 安装依赖
uv sync

# 2. 配置环境变量（可选，有默认值）
cp .env.example .env

# 3. 启动开发服务器
uv run uvicorn app.main:app --reload
```

服务启动后访问：
- API 文档：http://localhost:8000/docs
- ReDoc：http://localhost:8000/redoc

首次启动会自动创建数据库表并填充种子数据。

## 环境变量

在 `.env` 文件中配置（参考 `.env.example`）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./app.db` | 数据库连接字符串 |
| `JWT_SECRET_KEY` | `your-secret-key-change-in-production` | JWT 签名密钥 |
| `JWT_ALGORITHM` | `HS256` | JWT 算法 |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token 过期时间（分钟） |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | 允许的跨域来源 |

## 项目结构

```
backend/
├── app/
│   ├── main.py              # FastAPI 应用入口，路由挂载
│   ├── config.py            # 配置管理（pydantic-settings）
│   ├── database.py          # 数据库引擎与会话
│   ├── deps.py              # 认证与权限依赖注入
│   ├── core/
│   │   ├── models.py        # SQLAlchemy 数据模型
│   │   ├── schemas.py       # Pydantic 请求/响应模型
│   │   ├── security.py      # JWT 与密码工具
│   │   ├── seed.py          # 种子数据
│   │   ├── crud/            # 数据库操作
│   │   │   ├── users.py
│   │   │   ├── roles.py
│   │   │   └── permissions.py
│   │   └── routes/          # API 路由
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── roles.py
│   │       └── permissions.py
│   └── modules/
│       └── system/          # 系统配置模块
│           ├── router.py
│           ├── crud.py
│           ├── schemas.py
│           └── models.py
├── pyproject.toml           # 项目配置与依赖
├── uv.lock                  # 锁定依赖版本
├── .env.example             # 环境变量示例
└── app.db                   # SQLite 数据库文件（自动创建）
```

## API 端点

所有端点前缀 `/api`，响应格式：`{ code: 0, message: "success", data }`

### 认证 `/api/auth`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/login` | 登录 | 否 |
| POST | `/register` | 注册 | 否 |
| POST | `/logout` | 登出 | 否 |

### 用户 `/api/users`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/users` | 用户列表（分页+搜索） | `users` |
| GET | `/users/{id}` | 用户详情 | `users` |
| POST | `/users` | 新增用户 | `users.create` |
| PUT | `/users/{id}` | 编辑用户 | `users.edit` |
| DELETE | `/users/{id}` | 删除用户 | `users.delete` |
| PUT | `/users/{id}/reset-password` | 重置密码 | `users.edit` |
| POST | `/users/batch-role` | 批量修改角色 | `users.edit` |
| PUT | `/users/me` | 更新个人信息 | 登录即可 |
| PUT | `/users/me/password` | 修改密码 | 登录即可 |

### 角色 `/api/roles`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/roles` | 角色列表 | `roles` |
| POST | `/roles` | 新增角色 | `roles.create` |
| PUT | `/roles/{id}` | 编辑角色 | `roles.edit` |
| DELETE | `/roles/{id}` | 删除角色（预设角色不可删） | `roles.delete` |

### 权限 `/api/permissions`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/permissions` | 权限列表 | `permissions` |
| POST | `/permissions` | 新增权限 | `permissions.create` |
| PUT | `/permissions/{code}` | 编辑权限 | `permissions.edit` |
| DELETE | `/permissions/{code}` | 删除权限 | `permissions.delete` |

### 系统设置 `/api/system`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/system/public-config` | 公开配置（登录页用） | 否 |
| GET | `/system/config` | 完整配置 | `settings` |
| PUT | `/system/config` | 更新配置 | `settings.edit` |

### 仪表盘 `/api/dashboard`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/dashboard/stats` | 统计数据 | `dashboard` |
| GET | `/dashboard/activity` | 最近活动 | `dashboard` |

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

**预设角色**：

| ID | 名称 | 说明 | 可删除 |
|----|------|------|--------|
| admin | 管理员 | 拥有所有权限 | 否 |
| user | 普通用户 | 基本查看权限 | 否 |
| pending_review | 待审核 | 注册后等待审核 | 否 |

## 权限系统

两级权限控制：

- **菜单权限** (`type: "menu"`)：控制页面访问（dashboard, users, roles, permissions, settings）
- **操作权限** (`type: "operation"`)：控制 CRUD 操作（users.create, users.edit, users.delete 等）

`admin` 角色自动获得所有权限，无需显式分配。

## 开发

```bash
uv run ruff check .         # 代码检查
uv run ruff format .        # 格式化
```

Ruff 配置：`target-version = "py312"`，`line-length = 120`，规则 `E,F,I,N,W,UP`。
