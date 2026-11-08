-- Flyway V4: 与 Python 侧对齐的 schema 增量
--
-- Python 侧 migrations/versions/0002 给 users 增加了 token_version，
-- 用于在无状态令牌下实现「登出即失效」。Java 侧使用 Sa-Token 的服务端会话，
-- 由 StpUtil.logout(userId) 吊销，不需要该列；这里只补齐两栈共享结构上的差异，
-- 保证同一份导出包在两端都能识别。

-- 索引补齐：Python 侧在 users/ai_models 等表上建有同名索引
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_code ON role_permissions (permission_code);

-- 保证 app_state 单行存在（Python 侧由 get_app_state 惰性创建）
INSERT OR IGNORE INTO app_state (id, session_epoch, menu_layout_version)
VALUES (1, lower(hex(randomblob(32))), 1);
