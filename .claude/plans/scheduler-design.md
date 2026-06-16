# 定时任务功能设计方案

## 一、需求分析

### 1.1 核心目标
- 支持定时执行系统任务（如数据备份、清理、通知发送等）
- 保证任务执行的安全性和可靠性
- 提供可视化管理界面

### 1.2 功能需求
- 任务的增删改查
- 任务的启停控制
- 任务执行日志记录
- 任务执行状态监控
- 支持一次性任务和周期性任务
- 支持任务依赖和优先级

### 1.3 安全需求
- 任务执行权限控制
- 敏感操作审批机制
- 任务执行审计日志
- 防止恶意任务执行

## 二、技术架构

### 2.1 技术选型

| 组件 | 技术方案 | 说明 |
|------|----------|------|
| 任务调度器 | APScheduler | Python 轻量级调度库，支持 cron、interval、date 三种触发器 |
| 任务队列 | 内存队列 | 简单场景使用，复杂场景可扩展为 Redis/RabbitMQ |
| 任务执行 | 子进程/线程 | 隔离执行环境，防止任务影响主进程 |
| 任务存储 | SQLite/PostgreSQL | 持久化任务配置和执行日志 |

### 2.2 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      前端管理界面                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  任务管理   │  │  执行日志   │  │  状态监控   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端 API 服务                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  任务 CRUD  │  │  权限验证   │  │  日志记录   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    任务调度器 (APScheduler)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Cron 触发  │  │ Interval触发│  │  Date 触发  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      任务执行器                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  系统任务   │  │  自定义任务 │  │  第三方任务 │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 三、数据库设计

### 3.1 任务表 (scheduler_jobs)

```sql
CREATE TABLE scheduler_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id VARCHAR(100) UNIQUE NOT NULL,          -- 任务唯一标识
    name VARCHAR(100) NOT NULL,                   -- 任务名称
    description TEXT DEFAULT '',                   -- 任务描述
    job_type VARCHAR(50) NOT NULL,                -- 任务类型: system/custom/api
    task_function VARCHAR(255) NOT NULL,           -- 任务函数/模块路径
    task_params JSON DEFAULT '{}',                -- 任务参数
    trigger_type VARCHAR(20) NOT NULL,            -- 触发器类型: cron/interval/date
    trigger_config JSON NOT NULL,                 -- 触发器配置
    priority INTEGER DEFAULT 0,                   -- 优先级 (0-9, 0最高)
    max_retries INTEGER DEFAULT 3,                -- 最大重试次数
    timeout INTEGER DEFAULT 300,                  -- 超时时间(秒)
    is_enabled BOOLEAN DEFAULT TRUE,              -- 是否启用
    is_paused BOOLEAN DEFAULT FALSE,              -- 是否暂停
    created_by VARCHAR(50) NOT NULL,              -- 创建者
    last_run_at DATETIME,                         -- 上次执行时间
    next_run_at DATETIME,                         -- 下次执行时间
    run_count INTEGER DEFAULT 0,                  -- 执行次数
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 任务执行日志表 (scheduler_job_logs)

```sql
CREATE TABLE scheduler_job_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id VARCHAR(100) NOT NULL,                 -- 关联任务ID
    run_id VARCHAR(100) UNIQUE NOT NULL,          -- 本次执行ID
    status VARCHAR(20) NOT NULL,                  -- 状态: pending/running/success/failed/timeout
    started_at DATETIME NOT NULL,                 -- 开始时间
    finished_at DATETIME,                         -- 结束时间
    duration REAL,                                -- 执行时长(秒)
    result TEXT,                                  -- 执行结果
    error_message TEXT,                           -- 错误信息
    retry_count INTEGER DEFAULT 0,               -- 已重试次数
    triggered_by VARCHAR(50),                     -- 触发方式: scheduler/manual
    executed_by VARCHAR(50),                      -- 执行者(手动执行时)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 任务依赖表 (scheduler_job_dependencies)

```sql
CREATE TABLE scheduler_job_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id VARCHAR(100) NOT NULL,                 -- 任务ID
    depends_on_job_id VARCHAR(100) NOT NULL,      -- 依赖任务ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 四、API 接口设计

### 4.1 任务管理接口

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/scheduler/jobs | scheduler.view | 获取任务列表 |
| GET | /api/scheduler/jobs/{id} | scheduler.view | 获取任务详情 |
| POST | /api/scheduler/jobs | scheduler.create | 创建任务 |
| PUT | /api/scheduler/jobs/{id} | scheduler.edit | 更新任务 |
| DELETE | /api/scheduler/jobs/{id} | scheduler.delete | 删除任务 |
| POST | /api/scheduler/jobs/{id}/enable | scheduler.manage | 启用任务 |
| POST | /api/scheduler/jobs/{id}/disable | scheduler.manage | 禁用任务 |
| POST | /api/scheduler/jobs/{id}/pause | scheduler.manage | 暂停任务 |
| POST | /api/scheduler/jobs/{id}/resume | scheduler.manage | 恢复任务 |
| POST | /api/scheduler/jobs/{id}/run | scheduler.execute | 手动执行任务 |

### 4.2 执行日志接口

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/scheduler/logs | scheduler.view | 获取执行日志 |
| GET | /api/scheduler/logs/{runId} | scheduler.view | 获取日志详情 |
| DELETE | /api/scheduler/logs | scheduler.delete | 清理历史日志 |

### 4.3 统计接口

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/scheduler/stats | scheduler.view | 获取统计信息 |
| GET | /api/scheduler/tasks | scheduler.view | 获取可用任务类型 |

## 五、安全设计

### 5.1 权限控制

```
scheduler (菜单权限)
├── scheduler.view      -- 查看任务和日志
├── scheduler.create    -- 创建任务
├── scheduler.edit      -- 编辑任务配置
├── scheduler.delete    -- 删除任务
├── scheduler.manage    -- 启停任务
└── scheduler.execute   -- 手动执行任务
```

### 5.2 任务白名单机制

只允许执行预定义的安全任务，防止恶意代码执行：

```python
# 允许的任务类型
ALLOWED_TASK_TYPES = {
    # 系统任务
    "system.backup": "数据备份",
    "system.cleanup": "数据清理",
    "system.sync": "数据同步",
    "system.notify": "发送通知",
    
    # 数据库任务
    "db.vacuum": "数据库压缩",
    "db.backup": "数据库备份",
    "db.migrate": "数据库迁移",
    
    # 缓存任务
    "cache.clear": "清除缓存",
    "cache.refresh": "刷新缓存",
    
    # 报表任务
    "report.daily": "日报生成",
    "report.weekly": "周报生成",
    "report.monthly": "月报生成",
}
```

### 5.3 任务参数验证

```python
class TaskParamValidator:
    """任务参数验证器"""
    
    @staticmethod
    def validate(task_type: str, params: dict) -> bool:
        """验证任务参数"""
        validator = VALIDATORS.get(task_type)
        if not validator:
            raise ValueError(f"未知任务类型: {task_type}")
        return validator(params)

# 各任务类型的参数验证器
VALIDATORS = {
    "system.backup": lambda p: "path" in p and "retention_days" in p,
    "system.cleanup": lambda p: "older_than_days" in p,
    "db.backup": lambda p: "database" in p,
    # ...
}
```

### 5.4 执行超时控制

```python
import signal
from functools import wraps

def timeout(seconds):
    """执行超时装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            def handler(signum, frame):
                raise TimeoutError(f"任务执行超时: {seconds}秒")
            
            signal.signal(signal.SIGALRM, handler)
            signal.alarm(seconds)
            try:
                return func(*args, **kwargs)
            finally:
                signal.alarm(0)
        return wrapper
    return decorator
```

### 5.5 资源限制

```python
import resource

def set_resource_limits():
    """设置资源限制"""
    # 内存限制 (100MB)
    resource.setrlimit(resource.RLIMIT_AS, (100 * 1024 * 1024, -1))
    
    # CPU 时间限制 (60秒)
    resource.setrlimit(resource.RLIMIT_CPU, (60, 60))
    
    # 文件大小限制 (10MB)
    resource.setrlimit(resource.RLIMIT_FSIZE, (10 * 1024 * 1024, 10 * 1024 * 1024))
```

### 5.6 审计日志

所有任务操作都记录审计日志：

```python
class AuditLogger:
    """审计日志记录器"""
    
    @staticmethod
    def log_job_created(job_id: str, user: str, job_config: dict):
        """记录任务创建"""
        pass
    
    @staticmethod
    def log_job_executed(job_id: str, user: str, result: str):
        """记录任务执行"""
        pass
    
    @staticmethod
    def log_job_modified(job_id: str, user: str, changes: dict):
        """记录任务修改"""
        pass
```

## 六、预置任务

### 6.1 系统维护任务

| 任务 | 函数 | 说明 | 默认周期 |
|------|------|------|----------|
| 数据库备份 | `system.backup_db` | 备份 SQLite 数据库 | 每天凌晨 2 点 |
| 数据库压缩 | `system.vacuum_db` | 压缩数据库释放空间 | 每周日凌晨 3 点 |
| 清理日志 | `system.cleanup_logs` | 清理超过 30 天的日志 | 每天凌晨 4 点 |
| 清理临时文件 | `system.cleanup_temp` | 清理临时目录 | 每天凌晨 5 点 |

### 6.2 数据同步任务

| 任务 | 函数 | 说明 | 默认周期 |
|------|------|------|----------|
| 用户数据同步 | `sync.user_data` | 同步用户数据 | 每小时 |
| 缓存刷新 | `sync.refresh_cache` | 刷新系统缓存 | 每 6 小时 |

### 6.3 通知任务

| 任务 | 函数 | 说明 | 默认周期 |
|------|------|------|----------|
| 发送日报 | `notify.daily_report` | 发送系统日报 | 每天上午 9 点 |
| 发送周报 | `notify.weekly_report` | 发送系统周报 | 每周一上午 9 点 |

## 七、前端界面设计

### 7.1 任务管理页面

```
┌─────────────────────────────────────────────────────────────┐
│  定时任务管理                                              │
├─────────────────────────────────────────────────────────────┤
│  [新增任务]  [查看日志]  [统计信息]                         │
├─────────────────────────────────────────────────────────────┤
│  筛选: [全部状态 ▼] [全部类型 ▼]  [搜索任务名称...]        │
├─────────────────────────────────────────────────────────────┤
│  ☐ | 任务名称 | 类型 | 触发器 | 状态 | 下次执行 | 操作    │
│  ☐ | 数据库备份 | 系统 | 每天 02:00 | 运行中 | 明天02:00 | ▶ ⚙ ✏ 🗑 |
│  ☐ | 清理日志 | 系统 | 每天 04:00 | 运行中 | 明天04:00 | ▶ ⚙ ✏ 🗑 |
│  ☐ | 缓存刷新 | 数据 | 每6小时 | 已暂停 | - | ▶ ⚙ ✏ 🗑 |
├─────────────────────────────────────────────────────────────┤
│  共 3 个任务, 2 个运行中, 1 个已暂停                        │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 新增/编辑任务对话框

```
┌─────────────────────────────────────────────────────────────┐
│  新增定时任务                                              │
├─────────────────────────────────────────────────────────────┤
│  基本信息                                                  │
│  ├─ 任务名称: [数据库备份                        ]          │
│  ├─ 任务描述: [每天凌晨备份数据库                ]          │
│  ├─ 任务类型: [系统任务 ▼]                                  │
│  └─ 任务函数: [system.backup_db ▼]                          │
│                                                             │
│  调度配置                                                  │
│  ├─ 触发类型: [Cron ▼]                                      │
│  ├─ 时: [02] 分: [00] 秒: [00]                             │
│  ├─ 日: [*/1] 月: [*] 周: [*]                              │
│  └─ 时区: [Asia/Shanghai ▼]                                 │
│                                                             │
│  执行配置                                                  │
│  ├─ 优先级: [0 ▼]  超时时间: [300] 秒                       │
│  ├─ 最大重试: [3] 次                                        │
│  └─ 参数配置:                                               │
│     ├─ path: [/backup/db]                                   │
│     └─ retention_days: [30]                                 │
│                                                             │
│                                    [取消]  [保存]           │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 执行日志页面

```
┌─────────────────────────────────────────────────────────────┐
│  执行日志                                                  │
├─────────────────────────────────────────────────────────────┤
│  筛选: [全部状态 ▼] [全部任务 ▼]  [时间范围: 最近7天 ▼]    │
├─────────────────────────────────────────────────────────────┤
│  执行ID | 任务名称 | 状态 | 开始时间 | 耗时 | 操作          │
│  xxx-001 | 数据库备份 | 成功 | 2024-01-01 02:00:01 | 5.2s | 👁 |
│  xxx-002 | 清理日志 | 成功 | 2024-01-01 04:00:02 | 2.1s | 👁 |
│  xxx-003 | 缓存刷新 | 失败 | 2024-01-01 06:00:01 | 30.0s | 👁 |
├─────────────────────────────────────────────────────────────┤
│  共 3 条记录, 成功 2 条, 失败 1 条                          │
└─────────────────────────────────────────────────────────────┘
```

## 八、实现步骤

### Phase 1: 基础框架
1. 创建数据库表
2. 实现任务 CRUD API
3. 实现 APScheduler 集成
4. 实现任务执行器

### Phase 2: 安全机制
1. 实现权限控制
2. 实现任务白名单
3. 实现参数验证
4. 实现超时控制

### Phase 3: 前端界面
1. 创建任务管理页面
2. 创建执行日志页面
3. 实现任务配置表单

### Phase 4: 预置任务
1. 实现系统维护任务
2. 实现数据同步任务
3. 实现通知任务

### Phase 5: 增强功能
1. 实现任务依赖
2. 实现任务优先级
3. 实现执行统计
4. 实现告警通知

## 九、安全注意事项

1. **最小权限原则**: 只授予必要的任务执行权限
2. **任务白名单**: 只允许执行预定义的安全任务
3. **参数验证**: 严格验证任务参数，防止注入攻击
4. **资源限制**: 限制任务的内存、CPU、执行时间
5. **审计日志**: 记录所有任务操作，便于追溯
6. **隔离执行**: 任务在独立环境中执行，不影响主进程
7. **超时控制**: 任务执行超时自动终止
8. **重试限制**: 限制最大重试次数，防止无限重试

## 十、扩展性考虑

1. **分布式部署**: 支持多节点部署，任务自动分配
2. **任务队列**: 集成 Redis/RabbitMQ，支持大量任务
3. **Webhook**: 支持任务完成后触发 Webhook
4. **告警集成**: 集成邮件、短信、钉钉等告警渠道
5. **任务市场**: 支持社区共享任务模板
