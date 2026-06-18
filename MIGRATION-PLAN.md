# FastAPI → Spring Boot + Sa-Token + JPA 迁移计划

## 一、项目概述

将当前 Python FastAPI 后端迁移至 Java Spring Boot + Sa-Token + JPA，实现相同的 API 契约，确保前端无需任何修改即可无缝切换。

### 技术栈

| 组件 | 当前 | 目标 |
|------|------|------|
| 语言 | Python 3.12 | Java 21 |
| 框架 | FastAPI | Spring Boot 3.2 |
| 权限 | 自定义 JWT + Depends | Sa-Token + JWT |
| ORM | SQLAlchemy (async) | JPA (Hibernate) |
| 数据库 | SQLite (aiosqlite) | SQLite (JDBC) |
| 密码加密 | bcrypt | BCryptPasswordEncoder |
| HTTP Client | httpx | WebFlux WebClient |

### 目录结构

```
backend-java/
├── pom.xml
├── src/main/java/com/toolbox/
│   ├── ToolboxApplication.java
│   ├── config/
│   │   ├── SaTokenConfig.java
│   │   ├── CorsConfig.java
│   │   └── JacksonConfig.java
│   ├── common/
│   │   ├── ApiResponse.java
│   │   └── PageResult.java
│   ├── security/
│   │   ├── StpInterfaceImpl.java
│   │   └── RateLimiter.java
│   ├── entity/
│   │   ├── User.java
│   │   ├── Role.java
│   │   ├── Permission.java
│   │   ├── RolePermission.java
│   │   ├── SystemConfig.java
│   │   ├── AiModel.java
│   │   └── AiModelPreset.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── RoleRepository.java
│   │   ├── PermissionRepository.java
│   │   ├── RolePermissionRepository.java
│   │   ├── SystemConfigRepository.java
│   │   ├── AiModelRepository.java
│   │   └── AiModelPresetRepository.java
│   ├── dto/
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   ├── LoginResponse.java
│   │   ├── UserCreateRequest.java
│   │   ├── UserUpdateRequest.java
│   │   ├── RoleCreateRequest.java
│   │   ├── RoleUpdateRequest.java
│   │   ├── PermissionCreateRequest.java
│   │   ├── PermissionUpdateRequest.java
│   │   ├── SystemConfigUpdateRequest.java
│   │   ├── AiModelCreateRequest.java
│   │   ├── AiModelUpdateRequest.java
│   │   ├── AiModelPresetCreateRequest.java
│   │   ├── AiModelPresetUpdateRequest.java
│   │   └── BatchRoleUpdateRequest.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── UserService.java
│   │   ├── RoleService.java
│   │   ├── PermissionService.java
│   │   ├── DashboardService.java
│   │   ├── SystemConfigService.java
│   │   ├── AiModelService.java
│   │   └── AiModelPresetService.java
│   └── controller/
│       ├── AuthController.java
│       ├── UserController.java
│       ├── RoleController.java
│       ├── PermissionController.java
│       ├── DashboardController.java
│       ├── SystemConfigController.java
│       ├── AiModelController.java
│       ├── AiModelPresetController.java
│       └── PublicController.java
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
│       └── V1__init.sql
├── src/test/java/com/toolbox/
│   └── ToolboxApplicationTests.java
├── Dockerfile
├── docker-entrypoint.sh
└── nginx.conf
```

## 二、API 契约 (前端无需修改)

### 统一响应格式

```json
{ "code": 0, "message": "success", "data": {} }
// code === 0 表示成功
// code === -1 表示失败
```

### 认证方式

- Header: `Authorization: Bearer <token>`
- 401 响应触发前端跳转登录页

### 端点清单

#### Auth (认证)

| 方法 | 路径 | 认证 | 权限 | 说明 |
|------|------|------|------|------|
| POST | /api/auth/login | 否 | - | 登录，返回 token + user |
| POST | /api/auth/register | 否 | - | 注册 |
| POST | /api/auth/logout | 是 | - | 登出 |

#### Users (用户管理)

| 方法 | 路径 | 认证 | 权限 | 说明 |
|------|------|------|------|------|
| GET | /api/users | 是 | users | 分页查询 |
| GET | /api/users/{id} | 是 | users | 查询单个 |
| POST | /api/users | 是 | users.create | 新增 |
| PUT | /api/users/{id} | 是 | users.edit | 编辑 |
| DELETE | /api/users/{id} | 是 | users.delete | 删除 |
| PUT | /api/users/{id}/reset-password | 是 | users.edit | 重置密码 |
| POST | /api/users/batch-role | 是 | users.edit | 批量角色变更 |
| PUT | /api/users/me | 是 | - | 更新个人信息 |
| PUT | /api/users/me/password | 是 | - | 修改密码 |

#### Roles (角色管理)

| 方法 | 路径 | 认证 | 权限 | 说明 |
|------|------|------|------|------|
| GET | /api/roles | 是 | roles | 分页查询 |
| POST | /api/roles | 是 | roles.create | 新增 |
| PUT | /api/roles/{id} | 是 | roles.edit | 编辑 |
| DELETE | /api/roles/{id} | 是 | roles.delete | 删除 (预设不可删) |

#### Permissions (权限管理)

| 方法 | 路径 | 认证 | 权限 | 说明 |
|------|------|------|------|------|
| GET | /api/permissions | 是 | permissions | 查询 (支持 type/parent 过滤) |
| POST | /api/permissions | 是 | permissions.create | 新增 |
| PUT | /api/permissions/{code} | 是 | permissions.edit | 编辑 |
| DELETE | /api/permissions/{code} | 是 | permissions.delete | 删除 (菜单级联删除子权限) |

#### Dashboard (仪表盘)

| 方法 | 路径 | 认证 | 权限 | 说明 |
|------|------|------|------|------|
| GET | /api/dashboard/stats | 是 | dashboard | 统计数据 |
| GET | /api/dashboard/activity | 是 | dashboard | 活动列表 |

#### System (系统设置)

| 方法 | 路径 | 认证 | 权限 | 说明 |
|------|------|------|------|------|
| GET | /api/system/config | 是 | settings | 获取配置 |
| PUT | /api/system/config | 是 | settings.edit | 更新配置 |
| POST | /api/system/test-email | 是 | settings.edit | 测试邮件 |

#### AI Models (AI模型)

| 方法 | 路径 | 认证 | 权限 | 说明 |
|------|------|------|------|------|
| GET | /api/ai-models | 是 | ai_models | 分页查询 |
| GET | /api/ai-models/default | 否 | - | 获取默认模型 (无 apiKey) |
| GET | /api/ai-models/by-alias/{alias} | 否 | - | 按别名查询 (无 apiKey) |
| GET | /api/ai-models/{id} | 是 | ai_models | 查询单个 |
| POST | /api/ai-models | 是 | ai_models.create | 新增 |
| PUT | /api/ai-models/{id} | 是 | ai_models.edit | 编辑 |
| DELETE | /api/ai-models/{id} | 是 | ai_models.delete | 删除 |
| POST | /api/ai-models/test | 是 | ai_models | 测试连接 |

#### AI Model Presets (AI模型预设)

| 方法 | 路径 | 认证 | 权限 | 说明 |
|------|------|------|------|------|
| GET | /api/ai-models/presets | 是 | ai_models | 查询 (支持 search/group 过滤) |
| GET | /api/ai-models/presets/groups | 是 | ai_models | 获取分组列表 |
| GET | /api/ai-models/presets/active | 否 | - | 获取启用的预设 |
| GET | /api/ai-models/presets/{id} | 是 | ai_models | 查询单个 |
| POST | /api/ai-models/presets | 是 | ai_models.create | 新增 |
| PUT | /api/ai-models/presets/{id} | 是 | ai_models.edit | 编辑 |
| DELETE | /api/ai-models/presets/{id} | 是 | ai_models.delete | 删除 |

#### Public (公开接口)

| 方法 | 路径 | 认证 | 权限 | 说明 |
|------|------|------|------|------|
| GET | /api/public/config | 否 | - | 获取公开系统配置 |

## 三、执行步骤

### Phase 1: 项目基础 (T2)

- [ ] 创建 backend-java 目录
- [ ] 编写 pom.xml
- [ ] 编写 application.yml
- [ ] 编写 ToolboxApplication.java
- [ ] 编写全局配置 (JacksonConfig, CorsConfig)
- [ ] 编写统一响应类 (ApiResponse, PageResult)
- [ ] 编写全局异常处理

### Phase 2: 实体层 (T3)

- [ ] User.java
- [ ] Role.java
- [ ] Permission.java
- [ ] RolePermission.java
- [ ] SystemConfig.java
- [ ] AiModel.java
- [ ] AiModelPreset.java

### Phase 3: Repository 层 (T4)

- [ ] UserRepository.java
- [ ] RoleRepository.java
- [ ] PermissionRepository.java
- [ ] RolePermissionRepository.java
- [ ] SystemConfigRepository.java
- [ ] AiModelRepository.java
- [ ] AiModelPresetRepository.java

### Phase 4: Sa-Token + 安全 (T5)

- [ ] SaTokenConfig.java
- [ ] StpInterfaceImpl.java
- [ ] RateLimiter.java
- [ ] GlobalExceptionHandler.java

### Phase 5: DTO 层 (T6)

- [ ] 认证相关 DTO
- [ ] 用户相关 DTO
- [ ] 角色相关 DTO
- [ ] 权限相关 DTO
- [ ] 系统配置相关 DTO
- [ ] AI模型相关 DTO

### Phase 6: Service 层 (T7)

- [ ] AuthService.java
- [ ] UserService.java
- [ ] RoleService.java
- [ ] PermissionService.java
- [ ] DashboardService.java
- [ ] SystemConfigService.java
- [ ] AiModelService.java
- [ ] AiModelPresetService.java

### Phase 7: Controller 层 (T8)

- [ ] AuthController.java
- [ ] UserController.java
- [ ] RoleController.java
- [ ] PermissionController.java
- [ ] DashboardController.java
- [ ] SystemConfigController.java
- [ ] AiModelController.java
- [ ] AiModelPresetController.java
- [ ] PublicController.java

### Phase 8: 种子数据 + 初始化 (T9)

- [ ] V1__init.sql (Flyway 迁移脚本)
- [ ] ApplicationRunner 初始化逻辑

### Phase 9: 部署配置 (T10)

- [ ] Dockerfile
- [ ] docker-entrypoint.sh
- [ ] nginx.conf
- [ ] dev.sh 更新

### Phase 10: 验证 (T11)

- [ ] 编译通过
- [ ] 启动测试
- [ ] API 契约对比验证
- [ ] 前端联调测试

## 四、关键设计决策

### 4.1 Sa-Token 权限模型

当前权限模型是两级权限 (menu + operation)，Sa-Token 通过 `StpInterface` 适配：

```java
@Component
public class StpInterfaceImpl implements StpInterface {
    @Override
    public List<String> getPermissionList(Object loginId, String loginType) {
        // 查询用户角色 → 查询角色权限
        // admin 角色返回所有权限码
    }
    
    @Override
    public List<String> getRoleList(Object loginId, String loginType) {
        // 返回用户角色 ID 列表
    }
}
```

控制器使用 `@SaCheckPermission("users.create")` 注解。

### 4.2 不需要认证的端点

以下端点在 SaTokenConfig 中排除拦截：

- `/api/auth/login`
- `/api/auth/register`
- `/api/public/**`
- `/api/ai-models/presets/active`
- `/api/ai-models/default`
- `/api/ai-models/by-alias/**`

### 4.3 admin 角色全权限

在 `StpInterfaceImpl.getPermissionList()` 中判断：如果用户角色是 `admin`，直接查询所有权限码返回，无需逐个检查。

### 4.4 角色预设保护

删除角色前检查 `isPreset` 字段，返回错误 `"预设角色不可删除"`。

### 4.5 字段命名映射

- 前端请求/响应: camelCase (`roleId`, `pageSize`)
- 数据库: snake_case (`role_id`, `page_size`) (JPA 自动映射)
- Jackson 全局配置 `SNAKE_CASE` 不适合本项目，因为 API 需要 camelCase

### 4.6 密码加密

使用 Spring Security 的 `BCryptPasswordEncoder`，与当前 bcrypt 库兼容。

### 4.7 速率限制

内存实现 `ConcurrentHashMap` + 时间窗口，与当前 FastAPI 实现一致。

## 五、风险与注意事项

| 风险 | 缓解措施 |
|------|---------|
| SQLite 并发写入 | JPA 事务管理，单写多读 |
| Sa-Token Token 格式 | 配置为 UUID 风格，与前端兼容 |
| 邮件测试阻塞 | 使用 @Async 异步发送 |
| 种子数据密码哈希 | 使用 BCrypt 生成固定哈希值 |
| CORS 配置 | 与当前一致：localhost:5173 |
| API 路径大小写 | Spring Boot 默认不区分大小写 |
