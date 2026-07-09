# create-fullstack-app

全栈应用脚手架工具 —— 一条命令生成包含完整后台管理功能的系统。

## 功能

- 🎨 **前端可选**：React (Vite + TypeScript + Tailwind CSS + shadcn 风格组件) 或 Vue 3 (Vite + TypeScript + Tailwind CSS + DaisyUI)
- ⚙️ **后端可选**：Python (FastAPI) 或 Java (Spring Boot)
- 🔐 **内置认证**：JWT 登录、注册、登出、维护模式与人工审核
- 🧩 **完整模块**：用户、角色、权限、系统设置、AI 模型与预设、仪表盘
- 🐳 **Docker 就绪**：单镜像部署，Nginx 反代
- 📊 **开箱即用**：仪表盘统计、用户/角色/权限 CRUD、分页搜索、个人设置

## 生成的项目功能

| 模块 | 功能 |
|------|------|
| 登录认证 | JWT token、注册、登出、登录速率限制、401 自动登出 |
| 仪表盘 | 统计卡片 + 近期活动 |
| 用户管理 | 列表 + 分页 + 搜索 + 新增/编辑 + 删除 + 重置密码 + 批量改角色 |
| 角色管理 | 列表 + 新增/编辑 + 删除（预设角色不可删除） |
| 权限管理 | 菜单权限 + 操作权限，列表/新增/编辑/删除 |
| 系统设置 | 站点配置读写、邮件测试、维护模式、开放注册、人工审核 |
| AI 模型 | 列表/默认/按别名查询/新增/编辑/删除/连接测试 |
| AI 模型预设 | 分组、激活预设、列表/新增/编辑/删除 |
| 个人中心 | 修改资料、修改密码 |

默认账号：`admin / 123456`、`zhangsan / 123456`（管理员）、`lisi / wangwu / zhaoliu / 123456`（普通用户）。注册新账号时根据系统设置进入「待审核」或「普通用户」角色。

## 本项目结构

```
fullstack-starter/
├── package.json                # npm 包配置
├── tsconfig.json               # TypeScript 编译配置
├── README.md                   # 本文件
├── src/
│   ├── index.ts                # CLI 入口（交互式选择前端/后端/项目名）
│   └── generator.ts            # 项目生成器（复制模板 + 动态生成配置文件）
└── templates/
    ├── base/                   # 基础模板（.gitignore）
    ├── frontend-react/         # React 前端完整模板
    ├── frontend-vue/           # Vue 前端完整模板
    ├── backend-python/         # Python FastAPI 后端完整模板
    └── backend-java/           # Java Spring Boot 后端完整模板
```

## 快速使用

### 安装 & 构建

```bash
npm install
npm run build
```

### 运行

```bash
# 开发模式（跳过编译，直接运行 TypeScript）
npm run dev

# 或者编译后运行
node dist/index.js
```

### 交互式选择

```
? 请选择前端框架: (Use arrow keys)
  ❯ React
    Vue

? 请选择后端框架: (Use arrow keys)
  ❯ Python (FastAPI)
    Java (Spring Boot)

? 请输入项目名称: my-project
```

生成的项目会出现在当前目录下。

## 生成的项目结构

```
my-project/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── api/             # API 调用层（axios + 请求拦截器）
│   ├── pages/             # 页面（Login、Register、Dashboard、User、Role、Permission、System、AiModel、Profile）
│   │   ├── router/           # 路由（受保护路由）
│   │   └── stores/或contexts/ # 认证状态
│   ├── vite.config.ts        # 开发代理 /api → localhost:8088
│   └── package.json
├── backend/                 # 后端项目
│   ├── app/                 # Python FastAPI（auth/users/roles/permissions/system/dashboard/ai_model/public 等路由）
│   └── src/main/java/...     # Java Spring Boot（controller/service/repository/entity/security/dto）
├── dev.sh                   # 开发脚本（start/stop/restart/install）
├── build.sh                 # 构建脚本
├── Dockerfile               # 单镜像：前端构建 + 后端 + Nginx
├── docker-compose.yml       # Docker 编排
├── nginx.conf               # Nginx 配置（反代 /api → 后端）
└── README.md
```

## 端口配置

| 环境 | 前端 | 后端 |
|------|------|------|
| 开发 | 5173 | 8088 |
| Docker | 5173 | 8088 |

## 开发指南

### 修改模板

直接编辑 `templates/` 下的文件，就像修改普通项目一样。模板文件即用户最终拿到的文件。

```bash
# 示例：给 React 前端加一个日志页面
touch templates/frontend-react/src/pages/log/LogList.tsx
# 然后在 router.tsx 添加路由、app-sidebar.tsx 添加菜单、api/ 添加 API 调用
```

### 新增模板

```bash
# 1. 创建模板目录
mkdir -p templates/frontend-svelte

# 2. 在里面搭建完整项目

# 3. 修改 src/generator.ts
#    - 更新 FrontendType / BackendType 类型
#    - 更新 index.ts 的 choices 数组
#    - 更新 generator.ts 中的 Dockerfile 生成逻辑
```

### 测试

```bash
npm run dev
# 选择前端/后端/项目名，生成后验证：
cd <生成的项目>/frontend && npm install && npm run build
cd <生成的项目>/backend && 启动后端
```

## 技术栈

| 组件 | React 模板 | Vue 模板 |
|------|-----------|---------|
| 框架 | React 18 | Vue 3 (Composition API) |
| 构建 | Vite | Vite |
| 语言 | TypeScript | TypeScript |
| 样式 | Tailwind CSS + shadcn 风格组件 | Tailwind CSS + DaisyUI |
| HTTP | axios | axios |
| 路由 | react-router-dom v6 | vue-router v4 |
| 图标 | lucide-react | lucide-vue-next |

| 组件 | Python 模板 | Java 模板 |
|------|------------|----------|
| 框架 | FastAPI | Spring Boot 3.4 |
| ORM | SQLAlchemy 2.0 (async) | Spring Data JPA |
| 数据库 | SQLite (aiosqlite) | H2 (内存) |
| 认证 | PyJWT + bcrypt | Spring Security + JWT |
| 密钥 | 环境变量 `JWT_SECRET_KEY` | 环境变量 `JWT_SECRET_KEY` |

## API 接口

所有接口返回：`{ code: 0, message: "success", data: ... }`（错误返回 `code: -1`）。

### 认证

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/login | 登录 | 否 |
| POST | /api/auth/register | 注册 | 否 |
| POST | /api/auth/logout | 登出 | 否 |

### 用户

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/users | 用户列表（分页+搜索） | 是(admin) |
| POST | /api/users | 创建用户 | 是(admin) |
| PUT | /api/users/:id | 更新用户 | 是(admin) |
| DELETE | /api/users/:id | 删除用户 | 是(admin) |
| PUT | /api/users/:id/reset-password | 重置密码 | 是(admin) |
| POST | /api/users/batch-role | 批量设置角色 | 是(admin) |
| PUT | /api/users/me | 修改个人资料 | 是 |
| PUT | /api/users/me/password | 修改密码 | 是 |

### 角色与权限

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/roles | 角色列表 | 是(admin) |
| POST | /api/roles | 创建角色 | 是(admin) |
| PUT | /api/roles/:id | 更新角色 | 是(admin) |
| DELETE | /api/roles/:id | 删除角色 | 是(admin) |
| GET | /api/permissions | 权限列表 | 是(admin) |
| POST | /api/permissions | 创建权限 | 是(admin) |
| PUT | /api/permissions/:code | 更新权限 | 是(admin) |
| DELETE | /api/permissions/:code | 删除权限 | 是(admin) |

### 仪表盘

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/dashboard/stats | 统计卡片 | 是 |
| GET | /api/dashboard/activity | 近期活动 | 是 |

### 系统设置

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/system/config | 读取配置 | 是(admin) |
| PUT | /api/system/config | 更新配置 | 是(admin) |
| POST | /api/system/test-email | 测试邮件 | 是(admin) |
| GET | /api/public/config | 公开配置（登录页用） | 否 |

### AI 模型

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/ai-models | 模型列表 | 是 |
| POST | /api/ai-models | 创建模型 | 是(admin) |
| GET | /api/ai-models/default | 默认模型 | 是 |
| GET | /api/ai-models/by-alias/:alias | 按别名查询 | 是 |
| GET | /api/ai-models/:id | 模型详情 | 是 |
| PUT | /api/ai-models/:id | 更新模型 | 是(admin) |
| DELETE | /api/ai-models/:id | 删除模型 | 是(admin) |
| POST | /api/ai-models/test | 连接测试 | 是(admin) |
| GET | /api/ai-models/presets | 预设列表 | 是 |
| GET | /api/ai-models/presets/groups | 预设分组 | 是 |
| GET | /api/ai-models/presets/active | 当前激活预设 | 是 |
| GET | /api/ai-models/presets/:id | 预设详情 | 是 |
| POST | /api/ai-models/presets | 创建预设 | 是(admin) |
| PUT | /api/ai-models/presets/:id | 更新预设 | 是(admin) |
| DELETE | /api/ai-models/presets/:id | 删除预设 | 是(admin) |

## 许可证

MIT
