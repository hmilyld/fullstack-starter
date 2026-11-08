# 后端 API 契约

本文件是 `templates/backend-python` 与 `templates/backend-java` 必须共同遵守的接口契约。

**唯一事实来源是前端**：`templates/frontend-react/src/types/` 与 `templates/frontend-vue/src/types/` 字节一致，
它们定义了客户端期望的字段名与类型。本文件把这份期望翻译成后端约束，
`templates/backend-python/tests/test_contract.py` 把它固化成可执行断言。

任何一端要改契约，必须同时改：前端 `types/`、两个后端实现、本文件、以及两侧的契约测试。

## 1. 响应信封

除文件下载外，所有接口返回：

```json
{ "code": 0, "message": "success", "data": ... }
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `code` | number | `0` 成功，`-1` 业务失败 |
| `message` | string | 成功时固定为 `"success"`；失败时为中文提示 |
| `data` | any | 成功时的载荷；**失败时必须是 `null`，且该键必须存在** |

规则：

- `data` 键**永远存在**。Java 侧 `spring.jackson.default-property-inclusion: non_null` 会让
  `data` 在序列化时消失，必须对 `ApiResponse` 关闭该行为。
- 业务失败使用 HTTP `200` + `code: -1`。真实 HTTP 错误码只用于三类情况：
  未认证 `401`、无权限 `403`、参数校验失败 `422`、导入冻结 `503`。
- 失败响应同样遵守信封，且 `data` 为 `null`。
- 未处理异常统一映射为 `500` + `code: -1` + `message: "服务器内部错误"`，不泄露堆栈。

## 2. 分页

列表接口返回：

```json
{ "list": [], "total": 0, "page": 1, "pageSize": 10 }
```

- `page` 最小为 `1`，`pageSize` 取值 `1..100`，越界时**钳制而非报错**。
- 计数为过滤后的总数，与 `list` 使用同一组过滤条件。

## 3. 命名

- JSON 字段一律 **camelCase**（`roleId`、`isPreset`、`sortOrder`）。
- 路径参数与查询参数一律 **camelCase**（`pageSize`、`startTime`、`permissionCode`）。
- 数据库列一律 **snake_case**。两者之间的映射只在 schema/DTO 层发生。
- 实体主键在 JSON 中一律为 **字符串**（`"1"`、`"admin"`、`"d471e147"`）。

## 4. 端点清单

共 55 个操作、39 条路径。下表为权威列表；`test_contract.py` 会断言集合完全相等。

### 认证 `/api/auth`

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| POST | `/api/auth/login` | 匿名 | 返回 `{token, user}` |
| POST | `/api/auth/register` | 匿名 | 待审核时 `data` 为 `null` |
| POST | `/api/auth/logout` | 登录 | 使当前令牌立即失效 |

### 用户 `/api/users`

| 方法 | 路径 | 权限 |
|---|---|---|
| GET | `/api/users` | `users` |
| POST | `/api/users` | `users.create` |
| POST | `/api/users/batch-role` | `users.edit` 或 `users.assign_role` |
| PUT | `/api/users/me` | 登录 |
| PUT | `/api/users/me/password` | 登录 |
| GET | `/api/users/{id}` | `users` |
| PUT | `/api/users/{id}` | `users.edit` 或 `users.assign_role` |
| DELETE | `/api/users/{id}` | `users.delete` |
| PUT | `/api/users/{id}/reset-password` | `users.edit` |

### 角色 `/api/roles`

| 方法 | 路径 | 权限 |
|---|---|---|
| GET | `/api/roles` | `roles` |
| POST | `/api/roles` | `roles.create` |
| PUT | `/api/roles/{id}` | `roles.edit` |
| DELETE | `/api/roles/{id}` | `roles.delete` |

### 权限 `/api/permissions`

| 方法 | 路径 | 权限 |
|---|---|---|
| GET | `/api/permissions` | `permissions` |
| POST | `/api/permissions` | `permissions.create` |
| POST | `/api/permissions/sync` | `permissions.create` |
| PUT | `/api/permissions/{code}` | `permissions.edit` |
| DELETE | `/api/permissions/{code}` | `permissions.delete` |

`menu` 类型权限的增删改一律拒绝（`code: -1`），菜单权限只能通过 `/api/menus` 维护。

### 菜单 `/api/menus`

| 方法 | 路径 | 权限 |
|---|---|---|
| GET | `/api/menus/navigation` | 登录 |
| GET | `/api/menus` | `menus` 或 `permissions` |
| POST | `/api/menus/groups` | `menus.create` |
| PUT | `/api/menus/groups/{id}` | `menus.edit` |
| DELETE | `/api/menus/groups/{id}` | `menus.delete` |
| POST | `/api/menus/items` | `menus.create` |
| PUT | `/api/menus/items/{permissionCode}` | `menus.edit` |
| DELETE | `/api/menus/items/{permissionCode}` | `menus.delete` |
| PUT | `/api/menus/layout` | `menus.reorder` |

### 系统 `/api/system`、公开 `/api/public`

| 方法 | 路径 | 权限 |
|---|---|---|
| GET | `/api/system/config` | `settings` |
| PUT | `/api/system/config` | `settings.edit` |
| POST | `/api/system/test-email` | `settings.edit` |
| GET | `/api/public/config` | 匿名 |

### 仪表盘 `/api/dashboard`

| 方法 | 路径 | 权限 |
|---|---|---|
| GET | `/api/dashboard/stats` | `dashboard` |
| GET | `/api/dashboard/activity` | `dashboard` |

### AI 模型 `/api/ai-models`

| 方法 | 路径 | 权限 |
|---|---|---|
| GET | `/api/ai-models` | `ai_models` |
| POST | `/api/ai-models` | `ai_models.create` |
| GET | `/api/ai-models/default` | `ai_models` |
| GET | `/api/ai-models/by-alias/{alias}` | `ai_models` |
| GET | `/api/ai-models/{id}` | `ai_models` |
| PUT | `/api/ai-models/{id}` | `ai_models.edit` |
| DELETE | `/api/ai-models/{id}` | `ai_models.delete` |
| POST | `/api/ai-models/test` | `ai_models` |
| GET | `/api/ai-models/presets` | `ai_models` |
| GET | `/api/ai-models/presets/groups` | `ai_models` |
| GET | `/api/ai-models/presets/active` | 登录 |
| GET | `/api/ai-models/presets/{id}` | `ai_models` |
| POST | `/api/ai-models/presets` | `ai_models.create` 或 `ai_models.presets.create` |
| PUT | `/api/ai-models/presets/{id}` | `ai_models.edit` 或 `ai_models.presets.edit` |
| DELETE | `/api/ai-models/presets/{id}` | `ai_models.delete` 或 `ai_models.presets.delete` |

### 审计 `/api/audit-logs`

| 方法 | 路径 | 权限 |
|---|---|---|
| GET | `/api/audit-logs` | `audit_logs` |

过滤参数：`userId`、`status`、`action`、`startTime`、`endTime`、`page`、`pageSize`。

### 数据管理 `/api/data`

| 方法 | 路径 | 权限 |
|---|---|---|
| POST | `/api/data/export` | `data_management.export` |
| POST | `/api/data/import` | `data_management.import` |
| GET | `/api/data/import/{jobId}` | 一次性任务令牌（`X-Import-Job-Token` 头） |

`/api/data/export` 直接返回 ZIP 文件（不是信封），并在 `X-Export-Password` 头给出解压密码。
`/api/data/import` 返回 `202`。

## 5. 资源形状

以下为成功响应的 `data` 形状，字段集合必须**完全一致**（不多不少）。

```jsonc
// AuthUser
{ "id": "1", "name": "管理员", "email": "a@b.com", "avatar": "", "role": "admin", "permissions": ["dashboard"] }

// LoginResponse
{ "token": "...", "user": { /* AuthUser */ } }

// User
{ "id": "1", "username": "admin", "name": "管理员", "email": "a@b.com", "roleId": "admin", "avatar": "" }

// Role
{ "id": "admin", "name": "管理员", "description": "", "permissions": [], "isPreset": true }

// Permission
{ "code": "users", "name": "用户管理", "type": "menu", "parent": null }

// MenuConfig
{ "version": 1, "groups": [ /* MenuGroup */ ] }

// MenuGroup
{ "id": "management", "name": "管理", "sortOrder": 2, "isSystem": true, "items": [ /* MenuItem */ ] }

// MenuItem
{ "permissionCode": "users", "name": "用户管理", "groupId": "management", "route": "/settings/user",
  "icon": "users", "sortOrder": 1, "isSystem": true, "hidden": false,
  "operations": [ { "code": "users.create", "name": "新增用户" } ] }

// NavigationGroup（不含 isSystem / operations / hidden）
{ "id": "management", "name": "管理", "sortOrder": 2, "items": [ /* NavigationItem */ ] }

// NavigationItem
{ "permissionCode": "users", "name": "用户管理", "route": "/settings/user", "icon": "users", "sortOrder": 1 }

// SystemConfig（smtpPassword 恒为 "****"）
{ "siteName": "管理系统", "siteDescription": "", "keywords": "", "maintenanceEnabled": false,
  "maintenanceMessage": "", "openRegistration": true, "manualReview": false, "defaultRoleId": "user",
  "welcomeMessage": "", "smtpEnabled": false, "smtpHost": "", "smtpPort": 587, "smtpUsername": "",
  "smtpPassword": "****", "smtpFromName": "管理系统", "smtpFromEmail": "", "smtpUseSsl": true }

// PublicConfig（SystemConfig 的子集）
{ "siteName": "管理系统", "siteDescription": "", "maintenanceEnabled": false,
  "maintenanceMessage": "", "openRegistration": true, "manualReview": false }

// DashboardStats
{ "totalUsers": 5, "activeNow": 42, "revenue": "¥12,345", "growth": "+12%" }

// ActivityItem
{ "user": "张三", "action": "创建了新项目", "time": "2 分钟前" }

// AiModel（apiKey 脱敏）
{ "id": "1", "alias": "tm1", "modelName": "m", "apiUrl": "https://x/v1",
  "apiKey": "sk****45", "description": "", "isDefault": false }

// AiModelTestResult
{ "success": true, "message": "连接成功", "responseTime": 123.4, "model": "m" }

// AiModelPreset
{ "id": "1", "group": "DeepSeek", "alias": "deepseek-v4-flash", "modelName": "deepseek-v4-flash",
  "apiUrl": "https://api.deepseek.com/v1/chat/completions", "description": "", "isActive": true, "sortOrder": 1 }

// AuditLog
{ "id": "4", "userId": "1", "username": "admin", "action": "login", "ip": "127.0.0.1",
  "status": "success", "detail": "", "createdAt": "2026-11-08T10:38:28" }

// PermissionSyncResult
{ "added": [], "updated": [], "granted": [] }

// MenuLayoutResult
{ "version": 2 }

// ImportJobHandle
{ "jobId": "...", "jobToken": "...", "status": "queued" }

// ImportStatus
{ "id": "...", "status": "running", "message": "正在校验并恢复数据", "progress": 10 }
```

## 6. 语义约束

### 认证

- 令牌通过 `Authorization: Bearer <token>` 传递。
- 未认证返回 `401` + `code: -1`；令牌无效、过期、用户不存在同样返回 `401`。
- **登出必须立即使当前令牌失效**。不得出现"登出后旧令牌仍可用"。
- 修改密码后，该用户的其他会话必须失效。

### 授权

- 只按权限码判定，不按角色名判定。
- 无权限返回 `403` + `code: -1`。
- 唯一允许的角色名判断：`admin` 角色视为拥有全部权限（在权限解析层实现一次，不散落在业务代码里）。
- 用户管理中的"非管理员不能操作管理员账号"规则必须有独立的权限码或集中登记的例外，不得在业务代码里散落 `role_id == "admin"`。

### 事务

- 写操作要么全部成功，要么全部回滚。
- 返回 `code: -1` 的请求**不得留下任何已提交的写入**。
- 失败必须通过异常表达，由统一异常处理器映射为信封，禁止"先写库再 `return ApiResponse(code=-1)`"。

### 审计

- 所有写方法（`POST`/`PUT`/`DELETE`/`PATCH`）以及所有 `403` 响应都记一条审计日志。
- `/api/auth` 前缀由业务显式记录，不重复。
- 审计失败不影响业务响应。

### 数据管理

- 导出包包含 `manifest.json`、`schema.sql`、`checksums.sha256` 与各业务表的 JSONL。
- 导出包只支持同后端、同版本恢复；`manifest.backendType` 必须等于 `python` 或 `java`。
- 导出不包含运行时表 `app_state`。
- 导入期间除导入状态查询外的所有请求返回 `503`。
- 导入成功后轮换会话世代，使所有既有登录失效。

### SSRF

- AI 模型的 `apiUrl` 必须拒绝：非 `http`/`https` 协议、内网地址、回环地址、链路本地地址、云元数据端点。
- **域名必须先解析再判定**，不得因为"看起来是域名"就放行。
