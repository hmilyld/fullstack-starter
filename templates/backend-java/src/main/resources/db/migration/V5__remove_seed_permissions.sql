-- Flyway V5: 移除 V1 里的权限种子，权限改由启动同步统一补齐
--
-- 背景：
--   V1 只种了 24 条权限，缺少 menus.* 与 data_management.*，
--   缺失部分一直靠 PermissionSyncRunner 在启动时补齐。
--   这使 V1 成为一份不完整、且无法再修改（迁移不可回改）的「假权威列表」。
--
-- 现在的约定：
--   权限与内置菜单的唯一来源是代码里的目录 ——
--   Java config/PermissionCatalog.java、Python app/catalogs/permissions.py。
--   首次启动时由 PermissionSyncRunner 按目录写入全部权限并授权给 admin。
--
-- 本迁移的净效果：
--   清空权限表与其授权，再写回默认角色（user）的固定授权；
--   admin 的全部授权由随后的启动同步按目录补齐。
--   已有数据库最终状态不变，新数据库不再经过「先种 24 条、再补 8 条」。
--
-- 迁移是历史快照，因此这里的权限码字面量是允许的；
-- 「新增权限只改目录、不改 SQL」的约定从 V5 之后开始生效。

DELETE FROM role_permissions;

DELETE FROM permissions;

-- user 角色的固定查看权限；admin 由启动同步补全
INSERT OR IGNORE INTO role_permissions (role_id, permission_code) VALUES
('user', 'dashboard'),
('user', 'users'),
('user', 'settings');
