package com.hmilyld.fullstack.config;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationVersion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 启动迁移策略：兼容「menu_items.hidden 列已存在、但 Flyway 未记账 V3」的数据库。
 *
 * <p>{@code V3__menu_hidden.sql} 用 {@code ALTER TABLE menu_items ADD COLUMN hidden} 加列，是整条迁移链里唯一
 * 不幂等的语句，因此当该列已经存在而 {@code flyway_schema_history} 里没有 V3 的成功记录时，Flyway 会重放 V3 并抛出 {@code duplicate
 * column name: hidden}，应用直接启动失败。这种状态至少有两种来源：
 *
 * <ul>
 *   <li>数据库由 Python 栈（Alembic）建出，随后改用 Java 栈启动：结构上已含该列，但没有 Flyway 历史表。
 *   <li>历史表里 V3 之前执行失败过，而列已经被加上（例如从外部导入或手工修复过的库）。
 * </ul>
 *
 * <p>处理方式是在 {@code migrate()} 之前把这类数据库对齐到「V3 已应用」，而不是重放迁移：
 *
 * <ul>
 *   <li>历史表已经越过 V3（例如 V4 已应用但 V3 的记录缺失）：只补记 V3，其余照常迁移。
 *   <li>历史表停在 V3 之前：先补记 V3，再按正常路径迁移 V4、V5。
 *   <li>完全没有历史表：用 {@code baseline()} 建立基线，<b>不重放 V1/V2</b>。V1 的 {@code INSERT OR IGNORE}
 *       种子「不报错」不等于「无副作用」，重放会把管理员删掉的种子账号（默认密码）和已删的 AI 预设插回来。
 *   <li>Alembic 建出的库（存在 {@code alembic_version}）权限已按目录种入、结构与当前 schema 同步，因此跳过 {@code
 *       V5__remove_seed_permissions.sql}：该迁移的 {@code DELETE FROM permissions / role_permissions}
 *       会清掉用户自建的权限与自定义角色授权，而它对这类库没有任何净收益。
 * </ul>
 *
 * <p>注意这里<b>不</b>重放 V3 的数据语句（把 {@code permissions} 菜单默认隐藏）：列已经存在说明该结构早已落地， 此刻的数据是用户当前的选择，启动时不应覆盖。
 */
@Configuration
public class FlywayConfig {

  private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

  private static final String MENU_TABLE = "menu_items";
  private static final String HIDDEN_COLUMN = "hidden";

  /** Alembic 的版本表；存在即说明这个库由 Python 栈建出。 */
  private static final String ALEMBIC_TABLE = "alembic_version";

  /** V3 引入 hidden 列，因此该列存在等价于 V1 + V2 + V3 的结构。 */
  private static final String V3_VERSION = "3";

  /** V4 是幂等的索引补齐，采纳路径照常执行它。 */
  private static final String V4_VERSION = "4";

  /** V5 会清空权限与授权，只对 Java 建出的库执行。 */
  private static final String V5_VERSION = "5";

  @Bean
  public FlywayMigrationStrategy migrateWithExistingSchemaSupport() {
    return flyway -> {
      adoptExistingMenuHiddenColumn(flyway);
      flyway.migrate();
    };
  }

  /** 若 hidden 列已存在而 V3 未记账，则把 V3 对齐为已应用，避免重复加列。 */
  private void adoptExistingMenuHiddenColumn(Flyway flyway) {
    String historyTable = flyway.getConfiguration().getTable();
    // 表名会拼进 SQL，先校验以防配置被注入。
    if (!historyTable.matches("[A-Za-z_][A-Za-z0-9_]*")) {
      throw new IllegalStateException("非法的 Flyway 历史表名: " + historyTable);
    }

    MigrationInfo v3 = findMigration(flyway, V3_VERSION);
    if (v3 == null || (v3.getState().isApplied() && !v3.getState().isFailed())) {
      return;
    }

    // 全新数据库还没有 menu_items，V3 正常执行即可。
    if (!columnExists(flyway, MENU_TABLE, HIDDEN_COLUMN)) {
      return;
    }

    boolean hasHistory = tableExists(flyway, historyTable);
    // 失败记录会让 Flyway 拒绝执行任何迁移，必须先清掉。
    if (hasHistory) {
      deleteFailedRow(flyway, historyTable, V3_VERSION);
    }

    // 历史表已经越过 V3（例如 V4 已应用但 V3 的记录缺失）：只需补记 V3。
    if (highestAppliedVersion(flyway).compareTo(MigrationVersion.fromVersion(V3_VERSION)) >= 0) {
      recordApplied(flyway, historyTable, v3);
      log.warn("menu_items.hidden 已存在，跳过 V3__menu_hidden.sql 并记为已应用");
      return;
    }

    // 停在 V3 之前或完全没有历史表：建立基线到 V3，不重放 V1/V2 的种子语句。
    ensureBaselineAtV3(flyway, historyTable, hasHistory, v3);
    // V4 幂等（CREATE INDEX IF NOT EXISTS / INSERT OR IGNORE），照常执行。
    migrateTo(flyway, V4_VERSION);

    if (isAlembicDatabase(flyway)) {
      // V5 的 DELETE 会清掉 Python 库里的自建权限与自定义角色授权，且对该库没有净收益。
      recordApplied(flyway, historyTable, findMigration(flyway, V5_VERSION));
      log.warn("检测到 Alembic 建出的数据库，跳过 V5__remove_seed_permissions.sql 以保留自建权限与自定义角色授权");
    }
    log.warn("menu_items.hidden 已存在，跳过 V3__menu_hidden.sql 并记为已应用");
  }

  /** 把历史表基线到 V3；没有历史表时先建基线，空的旧历史表则丢弃后重建。 */
  private void ensureBaselineAtV3(
      Flyway flyway, String historyTable, boolean hasHistory, MigrationInfo v3) {
    if (hasHistory && !isHistoryTableEmpty(flyway, historyTable)) {
      // 已有 V1/V2 之类的记录：直接补记 V3，不用基线。
      recordApplied(flyway, historyTable, v3);
      return;
    }
    if (hasHistory) {
      // Flyway 不允许在「已存在且为空」的历史表上建立基线，空表直接丢弃。
      dropHistoryTable(flyway, historyTable);
    }
    Flyway.configure()
        .configuration(flyway.getConfiguration())
        .baselineVersion(V3_VERSION)
        .load()
        .baseline();
    log.info("按版本 {} 建立基线，未重放 V1/V2 的种子语句", V3_VERSION);
  }

  private void migrateTo(Flyway flyway, String version) {
    Flyway.configure().configuration(flyway.getConfiguration()).target(version).load().migrate();
  }

  /** Alembic 建出的库：权限已按目录种入，跳过 V5 的清理才能保住自建数据。 */
  private boolean isAlembicDatabase(Flyway flyway) {
    return tableExists(flyway, ALEMBIC_TABLE);
  }

  private MigrationInfo findMigration(Flyway flyway, String version) {
    for (MigrationInfo info : flyway.info().all()) {
      if (info.getVersion() != null && version.equals(info.getVersion().getVersion())) {
        return info;
      }
    }
    return null;
  }

  /** 已应用的最高版本，没有已应用版本时返回 {@link MigrationVersion#EMPTY}。 */
  private MigrationVersion highestAppliedVersion(Flyway flyway) {
    MigrationVersion highest = MigrationVersion.EMPTY;
    for (MigrationInfo info : flyway.info().applied()) {
      MigrationVersion version = info.getVersion();
      if (version != null && version.compareTo(highest) > 0) {
        highest = version;
      }
    }
    return highest;
  }

  private void deleteFailedRow(Flyway flyway, String table, String version) {
    String sql = "DELETE FROM \"" + table + "\" WHERE \"version\" = ? AND \"success\" = 0";
    try (Connection connection = openConnection(flyway);
        PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, version);
      int removed = statement.executeUpdate();
      if (removed > 0) {
        log.info("清理 V{} 的失败迁移记录 {} 条", version, removed);
      }
    } catch (SQLException exception) {
      throw new IllegalStateException("清理 V" + version + " 的失败记录失败", exception);
    }
  }

  private void dropHistoryTable(Flyway flyway, String table) {
    try (Connection connection = openConnection(flyway);
        Statement statement = connection.createStatement()) {
      statement.executeUpdate("DROP TABLE IF EXISTS \"" + table + "\"");
      log.info("丢弃空的 Flyway 历史表 {}，改为建立基线", table);
    } catch (SQLException exception) {
      throw new IllegalStateException("清理空的 Flyway 历史表失败", exception);
    }
  }

  /**
   * 写入一条成功记录；checksum 取自 classpath 上解析出的迁移，与正常执行时一致。
   *
   * <p>{@code WHERE NOT EXISTS} 让重复执行成为空操作，重启时不会插入重复版本。
   */
  private void recordApplied(Flyway flyway, String table, MigrationInfo migration) {
    if (migration == null) {
      return;
    }
    Integer checksum = migration.getChecksum();
    if (checksum == null) {
      throw new IllegalStateException("无法取得 V" + migration.getVersion() + " 的校验和");
    }
    String version = migration.getVersion().getVersion();
    String sql =
        "INSERT INTO \""
            + table
            + "\" (\"installed_rank\",\"version\",\"description\",\"type\",\"script\","
            + "\"checksum\",\"installed_by\",\"execution_time\",\"success\")"
            + " SELECT COALESCE(MAX(\"installed_rank\"),0)+1,?,?,?,?,?,'',0,1 FROM \""
            + table
            + "\" WHERE NOT EXISTS (SELECT 1 FROM \""
            + table
            + "\" WHERE \"version\" = ? AND \"success\" = 1)";
    try (Connection connection = openConnection(flyway);
        PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, version);
      statement.setString(2, migration.getDescription());
      statement.setString(3, migration.getType().name());
      statement.setString(4, migration.getScript());
      statement.setInt(5, checksum);
      statement.setString(6, version);
      statement.executeUpdate();
    } catch (SQLException exception) {
      // 另一个实例同时写入时 installed_rank 可能撞车；此时只要记录已在，就视为完成。
      if (isVersionApplied(flyway, table, version)) {
        return;
      }
      throw new IllegalStateException("补记 V" + version + " 迁移记录失败", exception);
    }
  }

  private boolean isVersionApplied(Flyway flyway, String table, String version) {
    String sql = "SELECT count(*) FROM \"" + table + "\" WHERE \"version\" = ? AND \"success\" = 1";
    try (Connection connection = openConnection(flyway);
        PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, version);
      try (ResultSet result = statement.executeQuery()) {
        return result.next() && result.getInt(1) > 0;
      }
    } catch (SQLException exception) {
      return false;
    }
  }

  private boolean isHistoryTableEmpty(Flyway flyway, String table) {
    try (Connection connection = openConnection(flyway);
        Statement statement = connection.createStatement();
        ResultSet result = statement.executeQuery("SELECT count(*) FROM \"" + table + "\"")) {
      return result.next() && result.getInt(1) == 0;
    } catch (SQLException exception) {
      throw new IllegalStateException("读取 Flyway 历史表失败", exception);
    }
  }

  private boolean tableExists(Flyway flyway, String table) {
    String sql = "SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = ?";
    try (Connection connection = openConnection(flyway);
        PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, table);
      try (ResultSet result = statement.executeQuery()) {
        return result.next() && result.getInt(1) > 0;
      }
    } catch (SQLException exception) {
      throw new IllegalStateException("读取数据库表清单失败", exception);
    }
  }

  private boolean columnExists(Flyway flyway, String table, String column) {
    try (Connection connection = openConnection(flyway);
        Statement statement = connection.createStatement();
        ResultSet result = statement.executeQuery("PRAGMA table_info(\"" + table + "\")")) {
      while (result.next()) {
        if (column.equalsIgnoreCase(result.getString("name"))) {
          return true;
        }
      }
      return false;
    } catch (SQLException exception) {
      throw new IllegalStateException("读取 " + table + " 表结构失败", exception);
    }
  }

  private Connection openConnection(Flyway flyway) throws SQLException {
    DataSource dataSource = flyway.getConfiguration().getDataSource();
    return dataSource.getConnection();
  }
}
