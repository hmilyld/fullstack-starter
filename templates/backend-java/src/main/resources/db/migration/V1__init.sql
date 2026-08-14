-- Flyway V1: 建表 + 种子数据
-- 所有表必须在此创建，Flyway 在 JPA ddl-auto 之前执行

CREATE TABLE IF NOT EXISTS permissions (
    code VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    parent VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    is_preset BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id VARCHAR(50) NOT NULL,
    permission_code VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id VARCHAR(50) NOT NULL,
    avatar VARCHAR(255) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    site_name VARCHAR(100) DEFAULT '管理系统',
    site_description TEXT DEFAULT '',
    keywords VARCHAR(255) DEFAULT '',
    maintenance_enabled BOOLEAN DEFAULT 0,
    maintenance_message TEXT DEFAULT '',
    open_registration BOOLEAN DEFAULT 1,
    manual_review BOOLEAN DEFAULT 0,
    default_role_id VARCHAR(50) DEFAULT 'user',
    welcome_message TEXT DEFAULT '',
    smtp_enabled BOOLEAN DEFAULT 0,
    smtp_host VARCHAR(255) DEFAULT '',
    smtp_port INTEGER DEFAULT 587,
    smtp_username VARCHAR(255) DEFAULT '',
    smtp_password VARCHAR(255) DEFAULT '',
    smtp_from_name VARCHAR(100) DEFAULT '管理系统',
    smtp_from_email VARCHAR(100) DEFAULT '',
    smtp_use_ssl BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ai_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alias VARCHAR(100) NOT NULL UNIQUE,
    model_name VARCHAR(100) NOT NULL,
    api_url VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_model_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    "group" VARCHAR(100) NOT NULL,
    alias VARCHAR(100) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    api_url VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    ip VARCHAR(50) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    detail TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs (status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

-- ============================================================
-- 种子数据
-- ============================================================

-- 权限
INSERT OR IGNORE INTO permissions (code, name, type, parent) VALUES
('dashboard', '仪表盘', 'menu', NULL),
('users', '用户管理', 'menu', NULL),
('roles', '角色管理', 'menu', NULL),
('permissions', '权限管理', 'menu', NULL),
('settings', '系统设置', 'menu', NULL),
('ai_models', 'AI模型配置', 'menu', NULL),
('audit_logs', '审计日志', 'menu', NULL),
('users.create', '新增用户', 'operation', 'users'),
('users.edit', '编辑用户', 'operation', 'users'),
('users.delete', '删除用户', 'operation', 'users'),
('users.assign_role', '角色维护', 'operation', 'users'),
('roles.create', '新增角色', 'operation', 'roles'),
('roles.edit', '编辑角色', 'operation', 'roles'),
('roles.delete', '删除角色', 'operation', 'roles'),
('permissions.create', '新增权限', 'operation', 'permissions'),
('permissions.edit', '编辑权限', 'operation', 'permissions'),
('permissions.delete', '删除权限', 'operation', 'permissions'),
('settings.edit', '编辑系统设置', 'operation', 'settings'),
('ai_models.create', '新增AI模型', 'operation', 'ai_models'),
('ai_models.edit', '编辑AI模型', 'operation', 'ai_models'),
('ai_models.delete', '删除AI模型', 'operation', 'ai_models'),
('ai_models.presets.create', '新增预设模型', 'operation', 'ai_models'),
('ai_models.presets.edit', '编辑预设模型', 'operation', 'ai_models'),
('ai_models.presets.delete', '删除预设模型', 'operation', 'ai_models');

-- 角色
INSERT OR IGNORE INTO roles (id, name, description, is_preset) VALUES
('admin', '管理员', '拥有系统所有权限', 1),
('user', '普通用户', '拥有基本的查看权限', 1),
('pending_review', '待审核', '注册后等待管理员审核', 1);

-- 角色权限 (admin 拥有全部)
INSERT OR IGNORE INTO role_permissions (role_id, permission_code) SELECT 'admin', code FROM permissions;
-- user 角色权限
INSERT OR IGNORE INTO role_permissions (role_id, permission_code) VALUES
('user', 'dashboard'),
('user', 'users'),
('user', 'settings');

-- 用户 (密码: 123456, BCrypt 哈希)
INSERT OR IGNORE INTO users (username, name, email, password_hash, role_id, avatar) VALUES
('admin', '管理员', 'admin@example.com', '$2b$12$f/LHqUrsUGxsnz2.PbPRAefklWVXr55q6NsP5RBYbs5f8JoVZ4W6S', 'admin', ''),
('zhangsan', '张三', 'zhangsan@example.com', '$2b$12$f/LHqUrsUGxsnz2.PbPRAefklWVXr55q6NsP5RBYbs5f8JoVZ4W6S', 'user', ''),
('lisi', '李四', 'lisi@example.com', '$2b$12$f/LHqUrsUGxsnz2.PbPRAefklWVXr55q6NsP5RBYbs5f8JoVZ4W6S', 'user', ''),
('wangwu', '王五', 'wangwu@example.com', '$2b$12$f/LHqUrsUGxsnz2.PbPRAefklWVXr55q6NsP5RBYbs5f8JoVZ4W6S', 'user', ''),
('zhaoliu', '赵六', 'zhaoliu@example.com', '$2b$12$f/LHqUrsUGxsnz2.PbPRAefklWVXr55q6NsP5RBYbs5f8JoVZ4W6S', 'user', '');

-- 系统配置
INSERT OR IGNORE INTO system_config (id, site_name) VALUES (1, '管理系统');

-- AI 模型预设
INSERT OR IGNORE INTO ai_model_presets (id, "group", alias, model_name, api_url, description, is_active, sort_order) VALUES
(1, 'DeepSeek', 'deepseek-v4-flash', 'deepseek-v4-flash', 'https://api.deepseek.com/v1/chat/completions', 'DeepSeek-V4-Flash 通用对话模型，性价比高', 1, 1),
(2, 'DeepSeek', 'deepseek-v4-pro', 'deepseek-v4-pro', 'https://api.deepseek.com/v1/chat/completions', 'DeepSeek-V4-Pro 最强推理模型', 1, 2),
(3, '小米 MiMo', 'mimo-v2.5', 'mimo-v2.5', 'https://api.xiaomi.com/v1/chat/completions', '小米 MiMo-V2.5 全模态模型，支持 1M 超长上下文', 1, 1);
