-- Flyway V2: menu presentation and runtime state

CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY,
    session_epoch VARCHAR(64) NOT NULL,
    menu_layout_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS menu_groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_system BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
    permission_code VARCHAR(100) PRIMARY KEY,
    group_id VARCHAR(50) NOT NULL,
    route VARCHAR(255) NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'circle',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_system BOOLEAN NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_menu_items_group_id ON menu_items (group_id);

INSERT OR IGNORE INTO app_state (id, session_epoch, menu_layout_version)
VALUES (1, lower(hex(randomblob(32))), 1);
