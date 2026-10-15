import hashlib
import json
import secrets
import shutil
import sqlite3
import string
from collections.abc import Iterator
from datetime import UTC, datetime
from pathlib import Path

import pyzipper

from app.core.config import get_settings
from app.core.database import engine

FORMAT_VERSION = 1
SCHEMA_VERSION = 2
APP_VERSION = "1.0.0"
BACKEND_TYPE = "python"

DATABASE_TABLES = [
    "menu_groups",
    "permissions",
    "menu_items",
    "roles",
    "role_permissions",
    "users",
    "system_config",
    "ai_models",
    "ai_model_presets",
    "audit_logs",
]
DATA_ENTRIES = [f"data/{table}.jsonl" for table in DATABASE_TABLES]
REQUIRED_ENTRIES = {
    "manifest.json",
    "schema.sql",
    "checksums.sha256",
    *DATA_ENTRIES,
}
PASSWORD_ALPHABET = string.ascii_letters + string.digits + "!@#$%^&*"


def generate_password(length: int = 24) -> str:
    return "".join(secrets.choice(PASSWORD_ALPHABET) for _ in range(length))


def _database_path() -> str:
    database = engine.url.database
    if not database:
        raise RuntimeError("无法确定 SQLite 数据库路径")
    return database


def _json_line(row: sqlite3.Row, columns: list[str]) -> bytes:
    data = {column: row[column] for column in columns}
    return (json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")


def _write_entry(
    archive: pyzipper.AESZipFile,
    name: str,
    chunks: Iterator[bytes],
) -> tuple[str, int]:
    digest = hashlib.sha256()
    size = 0
    with archive.open(name, "w") as target:
        for chunk in chunks:
            target.write(chunk)
            digest.update(chunk)
            size += len(chunk)
    return digest.hexdigest(), size


def create_export_archive() -> tuple[str, str]:
    settings = get_settings()
    temp_dir = Path(settings.data_tmp_dir)
    temp_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    snapshot_path = temp_dir / f"snapshot-{stamp}-{secrets.token_hex(4)}.db"
    archive_path = temp_dir / f"fullstack-export-{stamp}-{secrets.token_hex(4)}.zip"
    password = generate_password()

    source = sqlite3.connect(_database_path())
    target = sqlite3.connect(snapshot_path)
    try:
        source.backup(target)
    finally:
        target.close()
        source.close()

    checksums: dict[str, str] = {}
    sizes: dict[str, int] = {}
    row_counts: dict[str, int] = {}
    try:
        snapshot = sqlite3.connect(snapshot_path)
        snapshot.row_factory = sqlite3.Row
        try:
            schema_rows = snapshot.execute(
                "SELECT name, sql FROM sqlite_master "
                "WHERE type = 'table' AND name IN ({}) ORDER BY name".format(
                    ",".join("?" for _ in DATABASE_TABLES)
                ),
                DATABASE_TABLES,
            ).fetchall()
            schema_sql = "\n\n".join(
                f"-- {row['name']}\n{row['sql']};" for row in schema_rows if row["sql"]
            )

            with pyzipper.AESZipFile(
                archive_path,
                "w",
                compression=pyzipper.ZIP_DEFLATED,
                encryption=pyzipper.WZ_AES,
            ) as archive:
                archive.setpassword(password.encode("utf-8"))

                checksums["schema.sql"], sizes["schema.sql"] = _write_entry(
                    archive,
                    "schema.sql",
                    iter([(schema_sql + "\n").encode("utf-8")]),
                )

                for table in DATABASE_TABLES:
                    cursor = snapshot.execute(f'SELECT * FROM "{table}"')
                    columns = [column[0] for column in cursor.description]
                    row_count = 0

                    def rows() -> Iterator[bytes]:
                        nonlocal row_count
                        for row in cursor:
                            row_count += 1
                            yield _json_line(row, columns)

                    entry = f"data/{table}.jsonl"
                    checksums[entry], sizes[entry] = _write_entry(archive, entry, rows())
                    row_counts[table] = row_count

                manifest = {
                    "formatVersion": FORMAT_VERSION,
                    "schemaVersion": SCHEMA_VERSION,
                    "appVersion": APP_VERSION,
                    "backendType": BACKEND_TYPE,
                    "exportedAt": datetime.now(UTC).isoformat(),
                    "tables": {
                        table: {
                            "entry": f"data/{table}.jsonl",
                            "rows": row_counts[table],
                            "columns": [
                                item[1]
                                for item in snapshot.execute(
                                    f'PRAGMA table_info("{table}")'
                                ).fetchall()
                            ],
                        }
                        for table in DATABASE_TABLES
                    },
                    "checksums": checksums,
                }
                manifest_bytes = (
                    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
                ).encode("utf-8")
                checksums["manifest.json"], sizes["manifest.json"] = _write_entry(
                    archive, "manifest.json", iter([manifest_bytes])
                )

                checksum_text = "".join(
                    f"{checksums[name]}  {name}\n"
                    for name in ["schema.sql", *DATA_ENTRIES, "manifest.json"]
                ).encode("utf-8")
                _write_entry(archive, "checksums.sha256", iter([checksum_text]))
        finally:
            snapshot.close()
    except Exception:
        archive_path.unlink(missing_ok=True)
        raise
    finally:
        snapshot_path.unlink(missing_ok=True)

    return str(archive_path), password


def _archive_checksums(archive: pyzipper.AESZipFile) -> dict[str, str]:
    result: dict[str, str] = {}
    with archive.open("checksums.sha256") as stream:
        for raw_line in stream:
            line = raw_line.decode("utf-8").strip()
            if not line:
                continue
            digest, name = line.split("  ", 1)
            result[name] = digest
    return result


def _verify_archive(
    archive: pyzipper.AESZipFile,
) -> tuple[dict, dict[str, tuple[str, int]]]:
    names = archive.namelist()
    if len(names) != len(set(names)):
        raise ValueError("压缩包包含重复文件")
    if set(names) != REQUIRED_ENTRIES:
        raise ValueError("压缩包结构不完整或包含未知文件")
    if any(name.startswith("/") or ".." in Path(name).parts for name in names):
        raise ValueError("压缩包包含非法路径")
    total_uncompressed = sum(item.file_size for item in archive.infolist())
    if total_uncompressed > get_settings().max_import_size_bytes * 10:
        raise ValueError("压缩包解压后超过允许大小")

    with archive.open("manifest.json") as stream:
        manifest = json.load(stream)
    if manifest.get("formatVersion") != FORMAT_VERSION:
        raise ValueError("导出格式版本不兼容")
    if manifest.get("schemaVersion") != SCHEMA_VERSION:
        raise ValueError("数据库结构版本不兼容")
    if manifest.get("appVersion") != APP_VERSION:
        raise ValueError("应用版本不兼容")
    if manifest.get("backendType") != BACKEND_TYPE:
        raise ValueError("导出文件来自其他后端实现")

    declared = _archive_checksums(archive)
    expected_entries = {"schema.sql", *DATA_ENTRIES, "manifest.json"}
    if set(declared) != expected_entries:
        raise ValueError("校验和文件不完整")

    actual: dict[str, tuple[str, int]] = {}
    total_read = 0
    read_limit = get_settings().max_import_size_bytes * 10
    for name in ["schema.sql", *DATA_ENTRIES, "manifest.json"]:
        digest = hashlib.sha256()
        size = 0
        with archive.open(name) as stream:
            while chunk := stream.read(1024 * 1024):
                total_read += len(chunk)
                if total_read > read_limit:
                    raise ValueError("压缩包解压后超过允许大小")
                digest.update(chunk)
                size += len(chunk)
        value = digest.hexdigest()
        if declared.get(name) != value:
            raise ValueError(f"文件校验失败: {name}")
        actual[name] = (value, size)

    tables = manifest.get("tables")
    if not isinstance(tables, dict) or set(tables) != set(DATABASE_TABLES):
        raise ValueError("数据表清单不完整")
    return manifest, actual


def _validate_columns(connection: sqlite3.Connection, manifest: dict) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for table in DATABASE_TABLES:
        current = [
            row[1] for row in connection.execute(f'PRAGMA table_info("{table}")').fetchall()
        ]
        exported = manifest["tables"][table].get("columns", [])
        if current != exported:
            raise ValueError(f"数据表结构不一致: {table}")
        if any(not column.replace("_", "").isalnum() for column in current):
            raise ValueError(f"数据表列名非法: {table}")
        result[table] = current
    return result


def restore_archive(archive_path: str, password: str) -> None:
    database_path = _database_path()
    archive = pyzipper.AESZipFile(archive_path)
    archive.setpassword(password.encode("utf-8"))
    try:
        manifest, _ = _verify_archive(archive)
    except RuntimeError as exc:
        archive.close()
        raise ValueError("压缩包密码错误") from exc
    except (KeyError, json.JSONDecodeError) as exc:
        archive.close()
        raise ValueError("压缩包内容无效") from exc
    except Exception:
        archive.close()
        raise

    connection = sqlite3.connect(database_path, timeout=60)
    try:
        connection.execute("PRAGMA foreign_keys = OFF")
        connection.execute("BEGIN IMMEDIATE")
        columns = _validate_columns(connection, manifest)

        for table in reversed(DATABASE_TABLES):
            connection.execute(f'DELETE FROM "{table}"')
            try:
                connection.execute("DELETE FROM sqlite_sequence WHERE name = ?", (table,))
            except sqlite3.OperationalError:
                # SQLite creates sqlite_sequence only when AUTOINCREMENT is used.
                pass

        for table in DATABASE_TABLES:
            entry = manifest["tables"][table]["entry"]
            expected_rows = int(manifest["tables"][table]["rows"])
            insert_sql = (
                f'INSERT INTO "{table}" ('
                + ",".join(f'"{column}"' for column in columns[table])
                + ") VALUES ("
                + ",".join("?" for _ in columns[table])
                + ")"
            )
            rows: list[tuple] = []
            row_count = 0
            with archive.open(entry) as stream:
                for raw_line in stream:
                    if not raw_line.strip():
                        continue
                    record = json.loads(raw_line)
                    if set(record) != set(columns[table]):
                        raise ValueError(f"数据字段不一致: {table}")
                    rows.append(tuple(record[column] for column in columns[table]))
                    row_count += 1
                    if len(rows) >= 1000:
                        connection.executemany(insert_sql, rows)
                        rows.clear()
            if rows:
                connection.executemany(insert_sql, rows)
            if row_count != expected_rows:
                raise ValueError(f"数据行数不一致: {table}")

        admin = connection.execute(
            """
            SELECT users.id
            FROM users
            JOIN roles ON roles.id = users.role_id
            WHERE users.role_id = 'admin'
              AND roles.id = 'admin'
              AND users.password_hash LIKE '$2%'
            LIMIT 1
            """
        ).fetchone()
        if admin is None:
            raise ValueError("导入包中缺少有效管理员账号")

        epoch = secrets.token_urlsafe(32)
        updated = connection.execute(
            "UPDATE app_state SET session_epoch = ?, menu_layout_version = 1 WHERE id = 1",
            (epoch,),
        ).rowcount
        if updated != 1:
            raise RuntimeError("更新应用状态失败")
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
        archive.close()


def remove_file(path: str) -> None:
    Path(path).unlink(missing_ok=True)


def clear_stale_temp_files() -> None:
    temp_dir = Path(get_settings().data_tmp_dir)
    if not temp_dir.exists():
        return
    for item in temp_dir.iterdir():
        if item.is_file() and item.name.startswith(("snapshot-", "upload-", "fullstack-export-")):
            item.unlink(missing_ok=True)
        elif item.is_dir() and item.name.startswith("import-"):
            shutil.rmtree(item, ignore_errors=True)


__all__ = [
    "clear_stale_temp_files",
    "create_export_archive",
    "remove_file",
    "restore_archive",
]
