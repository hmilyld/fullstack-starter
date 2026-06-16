# Backend — FastAPI 管理系统 API

基于 FastAPI + SQLAlchemy + SQLite 的异步后端，提供用户、角色、权限、系统配置及 AI 模型管理的完整 API。

## 技术栈

- **Python** 3.12+
- **FastAPI** — 异步 Web 框架
- **SQLAlchemy** (async) + **aiosqlite** — 异步 ORM，SQLite 数据库
- **PyJWT** + **bcrypt** — JWT 认证 + 密码哈希
- **pydantic-settings** — 环境变量配置
- **httpx** — 异步 HTTP 客户端（AI 模型测试）
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

首次启动会自动创建数据库表、填充种子数据和预设 AI 模型。

## 环境变量

在 `.env` 文件中配置：

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
│   ├── main.py              # FastAPI 应用入口，路由挂载，lifespan
│   ├── config.py            # 配置管理（pydantic-settings）
│   ├── database.py          # 数据库引擎与会话
│   ├── deps.py              # 认证与权限依赖注入
│   ├── core/
│   │   ├── models.py        # SQLAlchemy 数据模型
│   │   ├── schemas.py       # Pydantic 请求/响应模型
│   │   ├── security.py      # JWT 与密码工具
│   │   ├── seed.py          # 种子数据（权限、角色、用户）
│   │   ├── crud/            # 数据库操作
│   │   │   ├── users.py
│   │   │   ├── roles.py
│   │   │   └── permissions.py
│   │   └── routes/          # API 路由
│   │       ├── auth.py      # 认证（登录/注册/登出，含速率限制）
│   │       ├── users.py     # 用户管理
│   │       ├── roles.py     # 角色管理
│   │       ├── permissions.py # 权限管理
│   │       └── dashboard.py # 仪表盘
│   └── modules/
│       ├── system/          # 系统配置模块
│       │   ├── router.py
│       │   ├── crud.py
│       │   └── models.py
│       ├── ai_model/        # AI 模型配置模块
│       │   ├── router.py
│       │   ├── crud.py
│       │   ├── schemas.py
│       │   └── models.py
│       └── public/          # 公开接口模块
│           └── router.py
├── pyproject.toml           # 项目配置与依赖
├── uv.lock                  # 锁定依赖版本
├── .env.example             # 环境变量示例
└── app.db                   # SQLite 数据库文件（自动创建）
```

## 数据库模型

### 核心模型

**User** (`users`) — 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键，自增 |
| username | String(50) | 用户名，唯一 |
| name | String(100) | 姓名 |
| email | String(100) | 邮箱，唯一 |
| password_hash | String(255) | 密码哈希 |
| role_id | String(50) | 角色 ID（外键） |
| avatar | String(255) | 头像 URL |

**Role** (`roles`) — 角色表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String(50) | 主键 |
| name | String(100) | 角色名称 |
| description | Text | 描述 |
| is_preset | Boolean | 是否预设角色（不可删除） |

**Permission** (`permissions`) — 权限表
| 字段 | 类型 | 说明 |
|------|------|------|
| code | String(100) | 主键，权限编码 |
| name | String(100) | 权限名称 |
| type | String(20) | menu（菜单）或 operation（操作） |
| parent | String(100) | 所属菜单编码 |

**SystemConfig** (`system_config`) — 系统配置（单例，id=1）
| 字段 | 说明 |
|------|------|
| site_name / site_description / keywords | 站点信息 |
| maintenance_enabled / maintenance_message | 维护模式 |
| open_registration / manual_review / default_role_id | 注册策略 |
| smtp_enabled / smtp_host / smtp_port / smtp_username / smtp_password | 邮件 SMTP 配置 |
| smtp_from_name / smtp_from_email / smtp_use_ssl | 邮件发送配置 |

### AI 模型模块

**AiModel** (`ai_models`) — AI 模型配置
| 字段 | 说明 |
|------|------|
| alias | 别名（唯一，其他模块通过别名调用） |
| model_name | 模型名称（如 gpt-4o） |
| api_url | API 地址 |
| api_key | API Key（仅认证接口返回） |
| is_default | 是否默认模型 |

**AiModelPreset** (`ai_model_presets`) — 预设模型
| 字段 | 说明 |
|------|------|
| group | 分组（如 DeepSeek、OpenAI） |
| alias | 别名 |
| model_name | 模型名称 |
| api_url | API 地址 |
| is_active | 是否启用 |

## API 端点

所有端点前缀 `/api`，响应格式：`{ code: 0, message: "success", data }`

### 认证 `/api/auth`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/login` | 登录（IP 速率限制：60秒5次） | 否 |
| POST | `/register` | 注册 | 否 |
| POST | `/logout` | 登出 | 否 |

### 用户 `/api/users`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/users` | 用户列表（分页+搜索） | `users` |
| POST | `/users` | 新增用户 | `users.create` |
| POST | `/users/batch-role` | 批量修改角色（含管理员保护） | `users.edit` / `users.assign_role` |
| PUT | `/users/me` | 更新个人信息 | 登录即可 |
| PUT | `/users/me/password` | 修改密码 | 登录即可 |
| GET | `/users/{user_id}` | 用户详情 | `users` |
| PUT | `/users/{user_id}` | 编辑用户 | `users.edit` / `users.assign_role` |
| DELETE | `/users/{user_id}` | 删除用户 | `users.delete` |
| PUT | `/users/{user_id}/reset-password` | 重置密码 | `users.edit` |

### 角色 `/api/roles`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/roles` | 角色列表 | `roles` |
| POST | `/roles` | 新增角色 | `roles.create` |
| PUT | `/roles/{role_id}` | 编辑角色 | `roles.edit` |
| DELETE | `/roles/{role_id}` | 删除角色（预设角色不可删） | `roles.delete` |

### 权限 `/api/permissions`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/permissions` | 权限列表 | `permissions` |
| POST | `/permissions` | 新增权限 | `permissions.create` |
| PUT | `/permissions/{code}` | 编辑权限 | `permissions.edit` |
| DELETE | `/permissions/{code}` | 删除权限 | `permissions.delete` |

### 系统设置 `/api/system`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/system/config` | 获取完整配置（含 SMTP） | `settings` |
| PUT | `/system/config` | 更新配置 | `settings.edit` |

### AI 模型配置 `/api/ai-models`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/ai-models` | AI模型列表（分页+搜索） | `ai_models` |
| POST | `/ai-models` | 新增AI模型 | `ai_models.create` |
| POST | `/ai-models/test` | 测试模型连接（含 SSRF 防护） | `ai_models` |
| GET | `/ai-models/{id}` | AI模型详情 | `ai_models` |
| PUT | `/ai-models/{id}` | 编辑AI模型 | `ai_models.edit` |
| DELETE | `/ai-models/{id}` | 删除AI模型 | `ai_models.delete` |
| GET | `/ai-models/presets` | 预设模型列表 | `ai_models` |
| GET | `/ai-models/presets/groups` | 预设模型分组 | `ai_models` |
| GET | `/ai-models/presets/active` | 启用的预设模型 | 否 |
| POST | `/ai-models/presets` | 新增预设模型 | `ai_models.create` |
| PUT | `/ai-models/presets/{id}` | 编辑预设模型 | `ai_models.edit` |
| DELETE | `/ai-models/presets/{id}` | 删除预设模型 | `ai_models.delete` |
| GET | `/ai-models/default` | 获取默认模型（不返回 Key） | 否 |
| GET | `/ai-models/by-alias/{alias}` | 通过别名获取模型（不返回 Key） | 否 |

### 公开接口 `/api/public`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/public/config` | 站点公开配置（登录/注册页用） | 否 |

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

- **菜单权限** (`type: "menu"`)：控制页面访问（dashboard、users、roles、permissions、settings、ai_models）
- **操作权限** (`type: "operation"`)：控制 CRUD 操作（users.create、users.edit、users.delete、users.assign_role 等）

`admin` 角色自动获得所有权限，无需显式分配。

## 安全特性

- **JWT 认证**：Bearer Token 机制，支持可配置过期时间
- **登录速率限制**：基于 IP 地址，60秒内最多5次尝试
- **SSRF 防护**：AI 模型测试接口验证 URL，阻止内网和元数据端点访问
- **API Key 脱敏**：公开接口不返回 API Key
- **SMTP 密码脱敏**：配置接口返回脱敏后的密码
- **CORS 配置**：限制允许的方法和请求头
- **管理员保护**：非管理员不可修改管理员角色

## 开发

```bash
uv run ruff check .         # 代码检查
uv run ruff format .        # 格式化
```

Ruff 配置：`target-version = "py312"`，`line-length = 120`，规则 `E,F,I,N,W,UP`。
