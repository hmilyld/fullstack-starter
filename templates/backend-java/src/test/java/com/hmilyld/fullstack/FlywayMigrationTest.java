package com.hmilyld.fullstack;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import com.hmilyld.fullstack.config.FlywayConfig;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * 迁移兼容性回归测试。
 *
 * <p>覆盖线上出现过的启动失败：数据库已含 {@code menu_items.hidden}，但 Flyway 历史里没有 V3 的成功记录， {@code
 * V3__menu_hidden.sql} 的 {@code ALTER TABLE ... ADD COLUMN} 重放时报 {@code duplicate column name:
 * hidden}，容器无法启动。
 *
 * <p>同时锁定采纳路径的两条数据不变量：不复活被删除的种子数据，不清空自建权限与自定义角色授权。
 */
class FlywayMigrationTest {

  @Test
  void migratesEmptyDatabaseThroughEveryVersion(@TempDir Path dir) throws Exception {
    Path database = dir.resolve("fresh.db");

    migrate(database);

    try (Connection connection = open(database)) {
      assertThat(columnNames(connection, "menu_items")).containsOnlyOnce("hidden");
      assertThat(successfulVersions(connection)).containsExactly("1", "2", "3", "4", "5", "6");
    }
  }

  @Test
  void migratesSchemaWithoutFlywayHistory(@TempDir Path dir) throws Exception {
    // 已含 hidden 列但没有任何 Flyway 记录的数据库。
    Path database = dir.resolve("no-history.db");
    migrate(database);
    try (Connection connection = open(database)) {
      try (Statement statement = connection.createStatement()) {
        statement.executeUpdate("UPDATE menu_items SET hidden = 0");
        statement.executeUpdate("DROP TABLE flyway_schema_history");
      }
    }

    assertThatCode(() -> migrate(database)).doesNotThrowAnyException();

    try (Connection connection = open(database)) {
      assertThat(columnNames(connection, "menu_items")).containsOnlyOnce("hidden");
      assertThat(successfulVersions(connection)).as("V3 记为已应用，之后的迁移照常执行").contains("3", "4", "5");
    }
  }

  @Test
  void keepsExistingMenuVisibilityWhenAdoptingV3(@TempDir Path dir) throws Exception {
    // 结构已到 V2 并已含 hidden 列，但 V3 没有成功记录：补记 V3 时不能覆盖用户当前的选择。
    Path database = dir.resolve("pending-v3.db");
    migrateToV2(database);
    try (Connection connection = open(database)) {
      try (Statement statement = connection.createStatement()) {
        // 模拟列已存在（例如由 Python 栈建出），但 V3 尚未记账。
        statement.executeUpdate(
            "ALTER TABLE menu_items ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT 0");
        statement.executeUpdate(
            "INSERT INTO menu_items (permission_code, group_id, route, hidden) "
                + "VALUES ('permissions', 'management', '/settings/permission', 0)");
      }
    }

    assertThatCode(() -> migrate(database)).doesNotThrowAnyException();

    try (Connection connection = open(database)) {
      assertThat(columnNames(connection, "menu_items")).containsOnlyOnce("hidden");
      assertThat(successfulVersions(connection)).containsExactly("1", "2", "3", "4", "5", "6");
      assertThat(hiddenValue(connection, "permissions")).as("启动迁移不应改写已有菜单的可见性").isZero();
    }
  }

  @Test
  void recoversFromFailedV3Record(@TempDir Path dir) throws Exception {
    // 历史表里留有 V3 的失败记录，列却已被加上：Flyway 原本会拒绝继续迁移。
    Path database = dir.resolve("failed-v3.db");
    migrateToV2(database);
    try (Connection connection = open(database)) {
      try (Statement statement = connection.createStatement()) {
        statement.executeUpdate(
            "ALTER TABLE menu_items ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT 0");
        statement.executeUpdate(
            "INSERT INTO flyway_schema_history (installed_rank, version, description, type, script,"
                + " checksum, installed_by, execution_time, success) VALUES"
                + " (3, '3', 'menu hidden', 'SQL', 'V3__menu_hidden.sql', 94352941, '', 1, 0)");
      }
    }

    assertThatCode(() -> migrate(database)).doesNotThrowAnyException();

    try (Connection connection = open(database)) {
      assertThat(columnNames(connection, "menu_items")).containsOnlyOnce("hidden");
      assertThat(successfulVersions(connection)).containsExactly("1", "2", "3", "4", "5", "6");
    }
  }

  @Test
  void doesNotResurrectDeletedSeedDataWhenAdopting(@TempDir Path dir) throws Exception {
    // 采纳路径不能重放 V1 的种子语句：那会把管理员删掉的账号（默认密码）和已删的预设插回来。
    Path database = dir.resolve("deleted-seed.db");
    migrate(database);
    try (Connection connection = open(database)) {
      try (Statement statement = connection.createStatement()) {
        statement.executeUpdate("DELETE FROM users WHERE username <> 'admin'");
        statement.executeUpdate("DELETE FROM ai_model_presets");
        statement.executeUpdate("DROP TABLE flyway_schema_history");
      }
    }

    migrate(database);

    try (Connection connection = open(database)) {
      assertThat(usernames(connection)).containsExactly("admin");
      assertThat(count(connection, "ai_model_presets")).isZero();
    }
  }

  @Test
  void keepsCustomPermissionsWhenAdoptingPythonDatabase(@TempDir Path dir) throws Exception {
    // 来自 Alembic 的库：V5 的 DELETE 会清掉自建权限与自定义角色授权，采纳时必须跳过它。
    Path database = dir.resolve("python.db");
    migrate(database);
    try (Connection connection = open(database)) {
      try (Statement statement = connection.createStatement()) {
        statement.executeUpdate("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)");
        statement.executeUpdate("INSERT INTO alembic_version VALUES ('0002')");
        statement.executeUpdate(
            "INSERT INTO roles (id, name, description, is_preset) VALUES ('auditor', '审计员', '自定义', 0)");
        statement.executeUpdate(
            "INSERT INTO permissions (code, name, type, parent) "
                + "VALUES ('auditor.view', '审计查看', 'operation', 'audit_logs')");
        statement.executeUpdate(
            "INSERT INTO role_permissions (role_id, permission_code) "
                + "VALUES ('auditor', 'audit_logs'), ('auditor', 'auditor.view')");
        statement.executeUpdate("DROP TABLE flyway_schema_history");
      }
    }

    migrate(database);

    try (Connection connection = open(database)) {
      assertThat(count(connection, "permissions WHERE code = 'auditor.view'"))
          .as("自建权限不能被 V5 清掉")
          .isEqualTo(1);
      assertThat(count(connection, "role_permissions WHERE role_id = 'auditor'"))
          .as("自定义角色的授权不能被 V5 清掉")
          .isEqualTo(2);
      assertThat(columnNames(connection, "menu_items")).containsOnlyOnce("hidden");
    }
  }

  /** 走与生产一致的迁移策略：先对齐已存在的结构，再执行 Flyway。 */
  private void migrate(Path database) {
    Flyway flyway =
        Flyway.configure()
            .dataSource("jdbc:sqlite:" + database, null, null)
            .locations("classpath:db/migration")
            .baselineOnMigrate(true)
            .baselineVersion("0")
            .load();
    new FlywayConfig().migrateWithExistingSchemaSupport().migrate(flyway);
  }

  /** 只迁移到 V2，得到「V1 + V2 已应用」的数据库。 */
  private void migrateToV2(Path database) {
    Flyway.configure()
        .dataSource("jdbc:sqlite:" + database, null, null)
        .locations("classpath:db/migration")
        .baselineOnMigrate(true)
        .baselineVersion("0")
        .target("2")
        .load()
        .migrate();
  }

  private Connection open(Path database) throws SQLException {
    return DriverManager.getConnection("jdbc:sqlite:" + database);
  }

  private List<String> successfulVersions(Connection connection) throws SQLException {
    List<String> versions = new ArrayList<>();
    try (Statement statement = connection.createStatement();
        ResultSet result =
            statement.executeQuery(
                "SELECT \"version\" FROM \"flyway_schema_history\" "
                    + "WHERE \"success\" = 1 AND \"version\" IS NOT NULL ORDER BY \"installed_rank\"")) {
      while (result.next()) {
        versions.add(result.getString(1));
      }
    }
    return versions;
  }

  private List<String> usernames(Connection connection) throws SQLException {
    List<String> names = new ArrayList<>();
    try (Statement statement = connection.createStatement();
        ResultSet result = statement.executeQuery("SELECT username FROM users ORDER BY username")) {
      while (result.next()) {
        names.add(result.getString(1));
      }
    }
    return names;
  }

  private long count(Connection connection, String fromAndWhere) throws SQLException {
    try (Statement statement = connection.createStatement();
        ResultSet result = statement.executeQuery("SELECT count(*) FROM " + fromAndWhere)) {
      return result.next() ? result.getLong(1) : 0;
    }
  }

  private List<String> columnNames(Connection connection, String table) throws SQLException {
    List<String> columns = new ArrayList<>();
    try (Statement statement = connection.createStatement();
        ResultSet result = statement.executeQuery("PRAGMA table_info(\"" + table + "\")")) {
      while (result.next()) {
        columns.add(result.getString("name"));
      }
    }
    return columns;
  }

  private Integer hiddenValue(Connection connection, String permissionCode) throws SQLException {
    try (PreparedStatement statement =
        connection.prepareStatement(
            "SELECT \"hidden\" FROM \"menu_items\" WHERE \"permission_code\" = ?")) {
      statement.setString(1, permissionCode);
      try (ResultSet result = statement.executeQuery()) {
        return result.next() ? result.getInt(1) : null;
      }
    }
  }
}
