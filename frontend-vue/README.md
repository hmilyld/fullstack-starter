# Vue 前端

基于 Vue 3 + DaisyUI 5 的后台管理系统前端，功能与 React 前端完全一致。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5+ | Composition API + `<script setup>` |
| TypeScript | 5.7+ | 严格模式 |
| Vite | 6.4+ | 构建工具 |
| Tailwind CSS | 4.3+ | 原子化 CSS |
| DaisyUI | 5.5+ | CSS 组件库 |
| Vue Router | 4.6+ | 路由管理 |
| Pinia | 3.0+ | 状态管理 |
| Lucide Vue | 0.500+ | 图标库 |

## 快速开始

```bash
pnpm install    # 安装依赖
pnpm dev        # 启动开发服务器 (http://localhost:5174)
pnpm build      # 类型检查 + 生产构建
pnpm lint       # ESLint
```

## 项目结构

```
src/
├── main.ts                 # 入口文件
├── App.vue                 # 根组件
├── assets/
│   └── main.css            # Tailwind + DaisyUI 配置
├── router/
│   └── index.ts            # 路由配置
├── stores/
│   ├── auth.ts             # 认证状态 (Pinia)
│   ├── theme.ts            # 主题切换
│   └── site-config.ts      # 站点配置
├── composables/
│   ├── use-mobile.ts       # 移动端检测
│   └── use-toast.ts        # Toast 提示
├── lib/
│   ├── api-client.ts       # HTTP 客户端
│   ├── api.ts              # API 函数
│   └── permissions.ts      # 权限数据
├── components/
│   ├── AppSidebar.vue      # 侧边栏导航
│   ├── AppHeader.vue       # 顶栏（面包屑 + 主题切换）
│   ├── ThemeToggle.vue     # 主题切换组件
│   ├── ToastContainer.vue  # Toast 容器
│   └── shared/
│       ├── LoadingButton.vue
│       ├── ConfirmDeleteDialog.vue
│       ├── Pagination.vue
│       ├── PageSkeleton.vue
│       └── TableStates.vue
├── layouts/
│   └── AdminLayout.vue     # 主布局
└── pages/
    ├── auth/
    │   ├── Login.vue
    │   └── Register.vue
    ├── dashboard/
    │   └── Index.vue
    ├── settings/
    │   ├── UserManage.vue
    │   ├── RoleManage.vue
    │   ├── PermissionManage.vue
    │   ├── Profile.vue
    │   ├── System.vue
    │   └── AiModel.vue
    └── NotFound.vue
```

## 功能特性

- **响应式设计**: PC 端侧边栏可收缩，移动端抽屉式导航
- **主题切换**: 支持浅色/深色/跟随系统
- **权限控制**: 基于角色的菜单和操作权限
- **Toast 提示**: 顶部居中显示，支持成功/错误/信息/警告
- **表单验证**: 实时验证反馈
- **分页组件**: 支持页码跳转

## 开发规范

- 使用 `<script setup>` 语法
- 组件命名: PascalCase
- 使用 Pinia 进行状态管理
- API 调用统一使用 `api-client.ts`
- 所有 UI 文本使用中文
- 图标使用 `lucide-vue-next`

## 与 React 前端的差异

| 特性 | React 前端 | Vue 前端 |
|------|-----------|----------|
| UI 库 | shadcn/ui | DaisyUI |
| 状态管理 | Context API | Pinia |
| 图标 | lucide-react | lucide-vue-next |
| 构建工具 | Vite 8 | Vite 6 |
| 端口 | 5173 | 5174 |
