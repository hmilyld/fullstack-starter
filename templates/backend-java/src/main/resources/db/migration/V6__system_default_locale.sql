-- Flyway V6: 站点默认语言
--
-- 只决定未手动切换语言的用户首次进入时使用的语言；用户切换后以用户选择为准。
-- 该语句不幂等，config/FlywayConfig.java 会采纳「列已存在但 V6 未记账」的数据库
-- （例如 Python/Alembic 建出的库），避免重复加列。

ALTER TABLE system_config ADD COLUMN default_locale VARCHAR(20) DEFAULT 'zh-CN';
