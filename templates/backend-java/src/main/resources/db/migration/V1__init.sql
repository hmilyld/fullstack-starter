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
('zhangsan', '张三', 'zhangsan@example.com', '$2b$12$f/LHqUrsUGxsnz2.PbPRAefklWVXr55q6NsP5RBYbs5f8JoVZ4W6S', 'admin', ''),
('lisi', '李四', 'lisi@example.com', '$2b$12$f/LHqUrsUGxsnz2.PbPRAefklWVXr55q6NsP5RBYbs5f8JoVZ4W6S', 'user', ''),
('wangwu', '王五', 'wangwu@example.com', '$2b$12$f/LHqUrsUGxsnz2.PbPRAefklWVXr55q6NsP5RBYbs5f8JoVZ4W6S', 'user', ''),
('zhaoliu', '赵六', 'zhaoliu@example.com', '$2b$12$f/LHqUrsUGxsnz2.PbPRAefklWVXr55q6NsP5RBYbs5f8JoVZ4W6S', 'user', '');

-- 系统配置
INSERT OR IGNORE INTO system_config (id, site_name) VALUES (1, '管理系统');

-- AI 模型预设
INSERT OR IGNORE INTO ai_model_presets (id, "group", alias, model_name, api_url, description, is_active, sort_order) VALUES
(1, 'DeepSeek', 'deepseek-chat', 'deepseek-chat', 'https://api.deepseek.com/v1/chat/completions', 'DeepSeek 通用对话模型，性价比高', 1, 1),
(2, 'DeepSeek', 'deepseek-coder', 'deepseek-coder', 'https://api.deepseek.com/v1/chat/completions', 'DeepSeek 代码专用模型', 1, 2),
(3, 'DeepSeek', 'deepseek-reasoner', 'deepseek-reasoner', 'https://api.deepseek.com/v1/chat/completions', 'DeepSeek 推理模型 (R1)', 1, 3),
(4, '小米 MiMo', 'mimo', 'MiMo-7B-RL', 'https://api.xiaomi.com/v1/chat/completions', '小米 MiMo 7B 推理模型', 1, 1),
(5, 'OpenAI', 'gpt-4o', 'gpt-4o', 'https://api.openai.com/v1/chat/completions', 'OpenAI GPT-4o 多模态模型', 1, 1),
(6, 'OpenAI', 'gpt-4o-mini', 'gpt-4o-mini', 'https://api.openai.com/v1/chat/completions', 'OpenAI GPT-4o 轻量版，更快更便宜', 1, 2),
(7, 'OpenAI', 'gpt-4-turbo', 'gpt-4-turbo', 'https://api.openai.com/v1/chat/completions', 'OpenAI GPT-4 Turbo', 1, 3),
(8, 'OpenAI', 'gpt-3.5-turbo', 'gpt-3.5-turbo', 'https://api.openai.com/v1/chat/completions', 'OpenAI GPT-3.5 Turbo，经济实惠', 1, 4),
(9, 'Claude', 'claude-3-5-sonnet', 'claude-3-5-sonnet-20241022', 'https://api.anthropic.com/v1/messages', 'Claude 3.5 Sonnet，性能与成本的最佳平衡', 1, 1),
(10, 'Claude', 'claude-3-opus', 'claude-3-opus-20240229', 'https://api.anthropic.com/v1/messages', 'Claude 3 Opus，最强推理能力', 1, 2),
(11, 'Claude', 'claude-3-haiku', 'claude-3-haiku-20240307', 'https://api.anthropic.com/v1/messages', 'Claude 3 Haiku，最快响应速度', 1, 3),
(12, '通义千问', 'qwen-turbo', 'qwen-turbo', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', '通义千问 Turbo，快速响应', 1, 1),
(13, '通义千问', 'qwen-plus', 'qwen-plus', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', '通义千问 Plus，均衡性能', 1, 2),
(14, '通义千问', 'qwen-max', 'qwen-max', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', '通义千问 Max，最强能力', 1, 3),
(15, '智谱 GLM', 'glm-4', 'glm-4', 'https://open.bigmodel.cn/api/paas/v4/chat/completions', '智谱 GLM-4，综合能力强', 1, 1),
(16, '智谱 GLM', 'glm-4-flash', 'glm-4-flash', 'https://open.bigmodel.cn/api/paas/v4/chat/completions', '智谱 GLM-4 Flash，免费快速', 1, 2),
(17, 'Moonshot', 'moonshot-v1-8k', 'moonshot-v1-8k', 'https://api.moonshot.cn/v1/chat/completions', 'Moonshot V1 8K，支持长上下文', 1, 1),
(18, 'Moonshot', 'moonshot-v1-32k', 'moonshot-v1-32k', 'https://api.moonshot.cn/v1/chat/completions', 'Moonshot V1 32K，超长上下文', 1, 2),
(19, '文心一言', 'ernie-4.0', 'ernie-4.0-8k', 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions', '百度文心一言 4.0', 1, 1),
(20, '文心一言', 'ernie-speed', 'ernie-speed-128k', 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions', '百度文心一言 Speed，快速经济', 1, 2);
