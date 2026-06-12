# 前端后台管理框架 API 接口文档

> 基于 Mock 数据层设计，所有接口签名与真实 REST API 保持一致。
> 后续接入真实后端时，只需替换 `src/lib/api.ts` 中的实现。

---

## 统一响应格式

```ts
type ApiResponse<T> = {
  code: number      // 0=成功, 非0=错误
  message: string
  data: T
}

type PaginatedData<T> = {
  list: T[]
  total: number
  page: number
  pageSize: number
}
```

---

## 1. 认证模块

### POST `/api/auth/login` — 登录

**请求体：**
```json
{
  "account": "admin",
  "password": "123456"
}
```

**响应 data：**
```json
{
  "token": "mock_token_1718000000000",
  "user": {
    "id": "1",
    "name": "管理员",
    "email": "admin@example.com",
    "avatar": "",
    "role": "admin"
  }
}
```

**错误示例：**
```json
{ "code": -1, "message": "用户不存在", "data": null }
```

---

### POST `/api/auth/register` — 注册

**请求体：**
```json
{
  "username": "newuser",
  "email": "new@example.com",
  "password": "123456"
}
```

**响应 data：** 同登录响应格式

**错误示例：**
```json
{ "code": -1, "message": "用户名已存在", "data": null }
{ "code": -1, "message": "邮箱已被注册", "data": null }
```

---

### POST `/api/auth/logout` — 退出登录

**请求体：** 无

**响应 data：** `{}`

---

## 2. 仪表盘

### GET `/api/dashboard/stats` — 统计数据

**响应 data：**
```json
{
  "totalUsers": 5,
  "activeNow": 42,
  "revenue": "¥45,231",
  "growth": "+23%"
}
```

---

### GET `/api/dashboard/activity` — 最近动态

**响应 data：**
```json
[
  { "user": "张三", "action": "创建了新项目", "time": "2 分钟前" },
  { "user": "李四", "action": "更新了账户设置", "time": "15 分钟前" }
]
```

---

## 3. 用户管理

### GET `/api/users` — 用户列表

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| search | string | 否 | 搜索关键词（匹配用户名/姓名/邮箱） |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10 |

**响应 data：**
```json
{
  "list": [
    {
      "id": "1",
      "username": "admin",
      "name": "管理员",
      "email": "admin@example.com",
      "roleId": "admin",
      "avatar": ""
    }
  ],
  "total": 5,
  "page": 1,
  "pageSize": 10
}
```

---

### POST `/api/users` — 新增用户

**请求体：**
```json
{
  "username": "newuser",
  "name": "新用户",
  "email": "new@example.com",
  "roleId": "user"
}
```

**响应 data：** 完整 User 对象（含生成的 id）

---

### PUT `/api/users/:id` — 编辑用户

**路径参数：** `id` — 用户 ID

**请求体：** 部分字段
```json
{
  "name": "修改后的名字",
  "email": "updated@example.com"
}
```

**响应 data：** 更新后的完整 User 对象

**错误示例：**
```json
{ "code": -1, "message": "用户不存在", "data": null }
```

---

### DELETE `/api/users/:id` — 删除用户

**路径参数：** `id` — 用户 ID

**响应 data：** `{}`

---

### PUT `/api/users/me` — 更新个人信息

**请求体：**
```json
{
  "name": "新名字",
  "email": "new@example.com"
}
```

**响应 data：** 更新后的 User 对象

---

### PUT `/api/users/me/password` — 修改密码

**请求体：**
```json
{
  "currentPassword": "old123",
  "newPassword": "new456"
}
```

**响应 data：** `{}`

**错误示例：**
```json
{ "code": -1, "message": "请输入当前密码", "data": null }
{ "code": -1, "message": "请输入新密码", "data": null }
```

---

## 4. 角色管理

### GET `/api/roles` — 角色列表

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| search | string | 否 | 搜索关键词（匹配角色名/描述） |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10 |

**响应 data：**
```json
{
  "list": [
    {
      "id": "admin",
      "name": "管理员",
      "description": "拥有系统所有权限",
      "permissions": ["dashboard", "users", "roles", "permissions", "settings"],
      "isPreset": true
    }
  ],
  "total": 2,
  "page": 1,
  "pageSize": 10
}
```

---

### POST `/api/roles` — 新增角色

**请求体：**
```json
{
  "name": "编辑者",
  "description": "可编辑内容",
  "permissions": ["dashboard", "users"]
}
```

**响应 data：** 完整 Role 对象（含生成的 id，isPreset=false）

---

### PUT `/api/roles/:id` — 编辑角色

**路径参数：** `id` — 角色 ID

**请求体：** 部分字段
```json
{
  "name": "新角色名",
  "permissions": ["dashboard", "users", "roles"]
}
```

**响应 data：** 更新后的完整 Role 对象

---

### DELETE `/api/roles/:id` — 删除角色

**路径参数：** `id` — 角色 ID

**响应 data：** `{}`

**错误示例：**
```json
{ "code": -1, "message": "预设角色不可删除", "data": null }
```

---

## 5. 权限管理

### GET `/api/permissions` — 权限列表

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | "menu" \| "operation" | 否 | 筛选权限类型 |
| parent | string | 否 | 筛选操作权限的父菜单编码 |

**响应 data：** `Permission[]`
```json
[
  { "code": "dashboard", "name": "仪表盘", "type": "menu" },
  { "code": "users.create", "name": "新增用户", "type": "operation", "parent": "users" }
]
```

---

### POST `/api/permissions` — 新增权限

**请求体：**
```json
{
  "code": "reports",
  "name": "报表管理",
  "type": "menu"
}
```

或操作权限：
```json
{
  "code": "reports.export",
  "name": "导出报表",
  "type": "operation",
  "parent": "reports"
}
```

**响应 data：** 完整 Permission 对象

**错误示例：**
```json
{ "code": -1, "message": "权限编码已存在", "data": null }
```

---

### PUT `/api/permissions/:code` — 编辑权限

**路径参数：** `code` — 权限编码

**请求体：**
```json
{
  "name": "新名称",
  "parent": "new_parent"
}
```

**响应 data：** 更新后的 Permission 对象

**错误示例：**
```json
{ "code": -1, "message": "权限不存在", "data": null }
```

---

### DELETE `/api/permissions/:code` — 删除权限

**路径参数：** `code` — 权限编码

**说明：** 删除菜单权限时，级联删除其下所有操作权限

**响应 data：** `{}`

---

## 6. 系统设置

### GET `/api/system/config` — 获取配置

**响应 data：**
```json
{
  "siteName": "管理系统",
  "siteDescription": "一个基于 React 的后台管理框架",
  "keywords": "管理后台, React, shadcn",
  "maintenanceEnabled": false,
  "maintenanceMessage": "系统正在进行升级维护...",
  "openRegistration": true,
  "emailVerification": true,
  "manualReview": false,
  "defaultRoleId": "user",
  "welcomeMessage": "欢迎加入！请先完善个人信息。"
}
```

---

### PUT `/api/system/config` — 更新配置

**请求体：** 任意部分字段
```json
{
  "siteName": "新站点名",
  "maintenanceEnabled": true
}
```

**响应 data：** 更新后的完整 SystemConfig 对象

---

## 实体类型定义

### User
```ts
{
  id: string           // 唯一标识
  username: string     // 用户名（登录账号）
  name: string         // 显示名称
  email: string        // 邮箱
  roleId: string       // 关联角色 ID
  avatar: string       // 头像 URL
}
```

### Role
```ts
{
  id: string           // 唯一标识
  name: string         // 角色名称
  description: string  // 角色描述
  permissions: string[] // 关联权限编码列表
  isPreset: boolean    // 是否为预设角色（不可删除）
}
```

### Permission
```ts
{
  code: string         // 权限编码（唯一标识）
  name: string         // 权限名称
  type: "menu" | "operation"  // 类型
  parent?: string      // 所属菜单编码（仅操作权限）
}
```

### SystemConfig
```ts
{
  siteName: string
  siteDescription: string
  keywords: string
  maintenanceEnabled: boolean
  maintenanceMessage: string
  openRegistration: boolean
  emailVerification: boolean
  manualReview: boolean
  defaultRoleId: string
  welcomeMessage: string
}
```

### DashboardStats
```ts
{
  totalUsers: number
  activeNow: number
  revenue: string
  growth: string
}
```

### LoginResponse
```ts
{
  token: string
  user: {
    id: string
    name: string
    email: string
    avatar: string
    role: string
  }
}
```

---

## 数据存储

Mock 数据使用 `localStorage` 持久化，Key 映射：

| Key | 对应数据 |
|-----|---------|
| `mock_users` | 用户列表 |
| `mock_roles` | 角色列表 |
| `mock_menu_permissions` | 菜单权限列表 |
| `mock_operation_permissions` | 操作权限列表 |
| `mock_system_config` | 系统配置 |

首次加载时自动注入种子数据（`src/lib/mock-db.ts` 中的 `initSeedData()`）。
