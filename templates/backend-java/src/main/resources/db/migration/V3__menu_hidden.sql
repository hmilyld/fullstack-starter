-- Flyway V3: 菜单显示/隐藏

ALTER TABLE menu_items ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT 0;

-- 权限总览是工具页，默认不在侧边栏显示；管理员可在菜单与权限页打开。
UPDATE menu_items SET hidden = 1 WHERE permission_code = 'permissions';
