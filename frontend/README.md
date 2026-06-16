# Frontend — React + TypeScript + Vite + shadcn/ui

基于 React 19 + TypeScript + Vite + shadcn/ui v4 + Tailwind CSS 4 的后台管理系统前端。

## 技术栈

- **React 19** + **TypeScript 6** — UI 框架
- **Vite 8** — 构建工具
- **Tailwind CSS 4** — 样式框架
- **shadcn/ui v4** — UI 组件库
- **React Router 7** — 路由
- **Lucide React** — 图标库
- **Sonner** — Toast 通知

## 快速开始

```bash
pnpm install    # 安装依赖
pnpm dev        # 启动开发服务器 http://localhost:5173
```

## 开发命令

```bash
pnpm dev        # 启动开发服务器
pnpm build      # 类型检查 + 生产构建
pnpm lint       # ESLint 检查
pnpm format     # Prettier 格式化
pnpm typecheck  # 快速类型检查（不输出文件）
```

## 项目结构

```
frontend/src/
├── main.tsx                    # 应用入口
├── App.tsx                     # 路由提供者
├── router.tsx                  # 路由配置
├── index.css                   # 全局样式
├── components/
│   ├── admin-layout.tsx        # 管理后台布局（侧边栏 + 内容区）
│   ├── app-sidebar.tsx         # 侧边栏导航
│   ├── header.tsx              # 顶部导航栏（面包屑）
│   ├── nav-main.tsx            # 主导航菜单
│   ├── nav-user.tsx            # 用户菜单（个人设置/退出）
│   ├── protected-route.tsx     # 路由守卫
│   ├── settings-loader.tsx     # 系统配置加载器
│   ├── login-form.tsx          # 登录表单
│   ├── register-form.tsx       # 注册表单
│   ├── shared/                 # 共享组件
│   │   ├── loading-button.tsx  # 加载按钮
│   │   ├── confirm-delete-dialog.tsx  # 删除确认弹窗
│   │   ├── pagination.tsx      # 分页
│   │   └── table-states.tsx    # 表格加载/空状态
│   └── ui/                     # shadcn/ui 组件（自动生成，勿手动修改）
├── pages/
│   ├── auth/
│   │   ├── login.tsx           # 登录页
│   │   └── register.tsx        # 注册页
│   ├── dashboard/
│   │   └── index.tsx           # 仪表盘
│   ├── settings/
│   │   ├── user.tsx            # 用户管理
│   │   ├── role.tsx            # 角色管理
│   │   ├── permission.tsx      # 权限管理
│   │   ├── system.tsx          # 系统设置（站点/注册/邮件配置）
│   │   ├── ai-model.tsx        # AI 模型配置（模型+预设模型管理）
│   │   └── profile.tsx         # 个人设置
│   └── not-found.tsx           # 404 页面
├── lib/
│   ├── api.ts                  # API 函数封装
│   ├── api-client.ts           # HTTP 客户端（自动 Token、请求去重）
│   ├── auth-context.tsx        # 认证上下文（登录状态/权限检查）
│   ├── system-config-context.tsx # 系统配置上下文（站点名称/描述动态更新）
│   ├── permissions.ts          # 权限定义（菜单权限 + 操作权限）
│   ├── mock-db.ts              # Mock 数据（localStorage 模拟后端）
│   └── utils.ts                # 工具函数
├── types/
│   └── api.ts                  # TypeScript 类型定义
├── hooks/                      # 自定义 Hooks
└── docs/                       # 项目文档
```

## 页面功能

| 页面 | 路由 | 功能 |
|------|------|------|
| 登录 | `/login` | 账号密码登录，支持维护模式提示 |
| 注册 | `/register` | 新用户注册，支持管理员审核 |
| 仪表盘 | `/dashboard` | 统计概览、最近活动 |
| 用户管理 | `/settings/user` | 增删改查、角色维护、批量修改角色、重置密码 |
| 角色管理 | `/settings/role` | 增删改查、权限分配（树形选择） |
| 权限管理 | `/settings/permission` | 菜单权限 + 操作权限两级管理 |
| 系统设置 | `/settings/system` | 站点信息、维护模式、注册策略、邮件 SMTP 配置（含快捷预设） |
| AI模型配置 | `/settings/ai-model` | AI 模型增删改查、模型测试、预设模型管理（按分组/搜索） |
| 个人设置 | `/settings/profile` | 个人信息编辑、密码修改 |

## 侧边栏结构

```
导航
  └── 仪表盘

管理
  ├── 用户管理
  ├── 角色管理
  ├── 权限管理
  ├── 系统设置
  └── AI模型配置
```

侧边栏根据用户权限自动过滤菜单项。

## 关键设计

### API 客户端 (`api-client.ts`)
- 自动附加 Bearer Token
- GET 请求去重（相同 path+method 的并发请求自动取消前一个）
- 401 响应自动跳转登录页

### 权限系统 (`permissions.ts` + `auth-context.tsx`)
- 菜单权限（`menu`）：控制页面访问和侧边栏显示
- 操作权限（`operation`）：控制按钮和操作
- `hasPermission(code)` 函数检查权限，admin 角色自动拥有所有权限

### 系统配置 (`system-config-context.tsx`)
- 页面加载时获取公开配置
- 动态更新 `document.title` 和 meta description
- 侧边栏站点名称实时同步

### 表单模式
- 使用原生 HTML `<form>` + `onSubmit`
- 不使用表单库
- 遵循 `FieldGroup` + `Field` 布局规范

## 添加 shadcn 组件

```bash
npx shadcn@latest add <组件名>
```

组件会自动安装到 `src/components/ui/` 目录。

## 代码规范

- **无分号**，双引号，2 空格缩进（Prettier 强制）
- **import 别名**：`@/` → `src/`
- **图标**：仅使用 Lucide React
- **暗色模式**：使用语义化 token（`bg-primary`、`text-muted-foreground`），禁止 `dark:` 前缀
- **响应式**：使用 `gap-*` 而非 `space-y-*`，等宽等高使用 `size-*`
- **UI 语言**：所有文本使用中文
