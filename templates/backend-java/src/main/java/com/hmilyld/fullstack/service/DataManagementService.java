package com.hmilyld.fullstack.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import javax.sql.DataSource;
import net.lingala.zip4j.ZipFile;
import net.lingala.zip4j.model.FileHeader;
import net.lingala.zip4j.model.ZipParameters;
import net.lingala.zip4j.model.enums.AesKeyStrength;
import net.lingala.zip4j.model.enums.CompressionMethod;
import net.lingala.zip4j.model.enums.EncryptionMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class DataManagementService {

public static final int FORMAT_VERSION = 1;
public static final int SCHEMA_VERSION = 2;
public static final String APP_VERSION = "1.0.0";
public static final String BACKEND_TYPE = "java";

private static final List<String> TABLES =
	List.of(
		"menu_groups",
		"permissions",
		"menu_items",
		"roles",
		"role_permissions",
		"users",
		"system_config",
		"ai_models",
		"ai_model_presets",
		"audit_logs");
private static final Set<String> ENTRY_NAMES;
private static final Set<String> CHECKSUM_NAMES;

static {
	Set<String> entries = new HashSet<>();
	entries.add("manifest.json");
	entries.add("schema.sql");
	entries.add("checksums.sha256");
	for (String table : TABLES) entries.add("data/" + table + ".jsonl");
	ENTRY_NAMES = Set.copyOf(entries);
	Set<String> checksumEntries = new HashSet<>(entries);
	checksumEntries.remove("checksums.sha256");
	checksumEntries.remove("manifest.json");
	CHECKSUM_NAMES = Set.copyOf(checksumEntries);
}

@Autowired private DataSource dataSource;
@Autowired private ObjectMapper objectMapper;
@Autowired private AppStateService appStateService;

@Value("${app.data.tmp-dir:./data/tmp}")
private String tempDir;

@Value("${app.data.max-import-size-bytes:1073741824}")
private long maxImportSizeBytes;

private final SecureRandom secureRandom = new SecureRandom();
private ObjectMapper dataObjectMapper;

@PostConstruct
public void initDataMapper() {
	dataObjectMapper = objectMapper.copy();
	dataObjectMapper.setSerializationInclusion(JsonInclude.Include.ALWAYS);
}

public record ExportResult(Path path, String password) {}

public ExportResult createExport() throws Exception {
	Path dir = prepareTempDir();
	String stamp = Instant.now().toString().replace(":", "").replace("-", "");
	Path workDir = dir.resolve("export-" + UUID.randomUUID());
	Files.createDirectories(workDir);
	Path archivePath = dir.resolve("fullstack-export-" + stamp + ".zip");
	String password = randomPassword();

	Path snapshotPath = dir.resolve("snapshot-" + UUID.randomUUID() + ".db");
	Map<String, String> checksums = new LinkedHashMap<>();
	Map<String, Object> manifestTables = new LinkedHashMap<>();
	Path schemaFile = workDir.resolve("schema.sql");
	try (Connection connection = openSnapshot(snapshotPath)) {
	String schemaSql = readSchema(connection);
	Files.writeString(schemaFile, schemaSql + System.lineSeparator(), StandardCharsets.UTF_8);
	checksums.put("schema.sql", sha256(schemaFile));

	for (String table : TABLES) {
		Path tableFile = workDir.resolve(table + ".jsonl");
		Map<String, Object> tableInfo = writeTable(connection, table, tableFile);
		manifestTables.put(table, tableInfo);
		checksums.put("data/" + table + ".jsonl", sha256(tableFile));
	}
	} finally {
	Files.deleteIfExists(snapshotPath);
	}

	Map<String, Object> manifest = new LinkedHashMap<>();
	manifest.put("formatVersion", FORMAT_VERSION);
	manifest.put("schemaVersion", SCHEMA_VERSION);
	manifest.put("appVersion", APP_VERSION);
	manifest.put("backendType", BACKEND_TYPE);
	manifest.put("exportedAt", Instant.now().toString());
	manifest.put("tables", manifestTables);
	manifest.put("checksums", checksums);
	Path manifestFile = workDir.resolve("manifest.json");
	objectMapper.writerWithDefaultPrettyPrinter().writeValue(manifestFile.toFile(), manifest);

	StringBuilder checksumText = new StringBuilder();
	checksumText.append(checksums.get("schema.sql")).append("  schema.sql\n");
	for (String table : TABLES) {
	String entry = "data/" + table + ".jsonl";
	checksumText.append(checksums.get(entry)).append("  ").append(entry).append('\n');
	}
	checksumText.append(sha256(manifestFile)).append("  manifest.json\n");
	Path checksumFile = workDir.resolve("checksums.sha256");
	Files.writeString(checksumFile, checksumText, StandardCharsets.UTF_8);

	ZipParameters parameters = encryptedParameters();
	parameters.setFileNameInZip("schema.sql");
	try (ZipFile zipFile = new ZipFile(archivePath.toFile(), password.toCharArray())) {
	zipFile.addFile(schemaFile.toFile(), parameters);
	for (String table : TABLES) {
		parameters.setFileNameInZip("data/" + table + ".jsonl");
		zipFile.addFile(workDir.resolve(table + ".jsonl").toFile(), parameters);
	}
	parameters.setFileNameInZip("manifest.json");
	zipFile.addFile(manifestFile.toFile(), parameters);
	parameters.setFileNameInZip("checksums.sha256");
	zipFile.addFile(checksumFile.toFile(), parameters);
	}

	deleteRecursively(workDir);
	return new ExportResult(archivePath, password);
}

public void restore(Path archivePath, String password) throws Exception {
	try (ZipFile zipFile = new ZipFile(archivePath.toFile(), password.toCharArray())) {
	validateEntries(zipFile);
	Map<String, Object> manifest = readManifest(zipFile);
	verifyChecksums(zipFile, manifest);
	restoreDatabase(zipFile, manifest);
	} catch (net.lingala.zip4j.exception.ZipException exception) {
	throw new IllegalArgumentException("压缩包密码错误或文件损坏");
	}
}

private void restoreDatabase(ZipFile zipFile, Map<String, Object> manifest) throws Exception {
	try (Connection connection = dataSource.getConnection()) {
	connection.setAutoCommit(false);
	try {
		Map<String, List<String>> columns = validateColumns(connection, manifest);
		for (int index = TABLES.size() - 1; index >= 0; index--) {
		String table = TABLES.get(index);
		try (Statement statement = connection.createStatement()) {
			statement.executeUpdate("DELETE FROM \"" + table + "\"");
			try {
			statement.executeUpdate("DELETE FROM sqlite_sequence WHERE name = '" + table + "'");
			} catch (Exception ignored) {
			// Tables without AUTOINCREMENT do not exist in sqlite_sequence.
			}
		}
		}

		for (String table : TABLES) {
		restoreTable(connection, zipFile, manifest, table, columns.get(table));
		}

		try (Statement statement = connection.createStatement();
			ResultSet result =
				statement.executeQuery(
					"SELECT users.id FROM users "
						+ "JOIN roles ON roles.id = users.role_id "
						+ "WHERE users.role_id = 'admin' AND roles.id = 'admin' "
						+ "AND users.password_hash LIKE '$2%' LIMIT 1")) {
		if (!result.next()) throw new IllegalArgumentException("导入包中缺少有效管理员账号");
		}

		try (PreparedStatement statement =
			connection.prepareStatement(
				"UPDATE app_state SET session_epoch = ?, menu_layout_version = 1 WHERE id = 1")) {
		statement.setString(1, appStateService.newEpoch());
		if (statement.executeUpdate() != 1) throw new IllegalStateException("更新应用状态失败");
		}
		connection.commit();
	} catch (Exception exception) {
		connection.rollback();
		throw exception;
	}
	}
}

private Map<String, Object> writeTable(Connection connection, String table, Path output)
	throws Exception {
	Map<String, Object> info = new LinkedHashMap<>();
	long count = 0;
	List<String> columns = new ArrayList<>();
	try (Statement statement = connection.createStatement();
		ResultSet result = statement.executeQuery("SELECT * FROM \"" + table + "\"")) {
	ResultSetMetaData metadata = result.getMetaData();
	for (int index = 1; index <= metadata.getColumnCount(); index++) {
		columns.add(metadata.getColumnName(index));
	}
	try (BufferedWriter writer = Files.newBufferedWriter(output, StandardCharsets.UTF_8)) {
		while (result.next()) {
		Map<String, Object> row = new LinkedHashMap<>();
		for (String column : columns) row.put(column, result.getObject(column));
		writer.write(dataObjectMapper.writeValueAsString(row));
		writer.newLine();
		count++;
		}
	}
	}
	info.put("entry", "data/" + table + ".jsonl");
	info.put("rows", count);
	info.put("columns", columns);
	return info;
}

@SuppressWarnings("unchecked")
private Map<String, Object> readManifest(ZipFile zipFile) throws Exception {
	FileHeader header = zipFile.getFileHeader("manifest.json");
	try (InputStream input = zipFile.getInputStream(header)) {
	return objectMapper.readValue(input, new TypeReference<Map<String, Object>>() {});
	}
}

@SuppressWarnings("unchecked")
private void validateManifest(Map<String, Object> manifest) {
	if (!Integer.valueOf(FORMAT_VERSION).equals(manifest.get("formatVersion"))) {
	throw new IllegalArgumentException("导出格式版本不兼容");
	}
	if (!Integer.valueOf(SCHEMA_VERSION).equals(manifest.get("schemaVersion"))) {
	throw new IllegalArgumentException("数据库结构版本不兼容");
	}
	if (!APP_VERSION.equals(manifest.get("appVersion"))) {
	throw new IllegalArgumentException("应用版本不兼容");
	}
	if (!BACKEND_TYPE.equals(manifest.get("backendType"))) {
	throw new IllegalArgumentException("导出文件来自其他后端实现");
	}
	Object tables = manifest.get("tables");
	if (!(tables instanceof Map<?, ?> tableMap)
		|| !new HashSet<>(tableMap.keySet()).equals(new HashSet<>(TABLES))) {
	throw new IllegalArgumentException("数据表清单不完整");
	}
}

@SuppressWarnings("unchecked")
private void verifyChecksums(ZipFile zipFile, Map<String, Object> manifest) throws Exception {
	validateManifest(manifest);
	Map<String, String> declared =
		objectMapper.convertValue(manifest.get("checksums"), new TypeReference<>() {});
	if (!declared.keySet().equals(CHECKSUM_NAMES)) {
	throw new IllegalArgumentException("校验和文件不完整");
	}
	for (String name : ENTRY_NAMES) {
	if ("checksums.sha256".equals(name) || "manifest.json".equals(name)) continue;
	String actual =
		sha256Limited(zipFile.getInputStream(zipFile.getFileHeader(name)), maxImportSizeBytes);
	if (!actual.equals(declared.get(name))) {
		throw new IllegalArgumentException("文件校验失败: " + name);
	}
	}
	String manifestChecksum = readChecksumFile(zipFile).get("manifest.json");
	String actualManifestChecksum =
		sha256(zipFile.getInputStream(zipFile.getFileHeader("manifest.json")));
	if (!actualManifestChecksum.equals(manifestChecksum)) {
	throw new IllegalArgumentException("文件校验失败: manifest.json");
	}
}

private Map<String, String> readChecksumFile(ZipFile zipFile) throws Exception {
	Map<String, String> checksums = new LinkedHashMap<>();
	try (BufferedReader reader =
		new BufferedReader(
			new InputStreamReader(
				zipFile.getInputStream(zipFile.getFileHeader("checksums.sha256")),
				StandardCharsets.UTF_8))) {
	String line;
	while ((line = reader.readLine()) != null) {
		if (line.isBlank()) continue;
		String[] parts = line.split("  ", 2);
		if (parts.length == 2) checksums.put(parts[1], parts[0]);
	}
	}
	return checksums;
}

private Map<String, List<String>> validateColumns(
	Connection connection, Map<String, Object> manifest) throws Exception {
	Map<String, List<String>> result = new LinkedHashMap<>();
	@SuppressWarnings("unchecked")
	Map<String, Object> tables = (Map<String, Object>) manifest.get("tables");
	for (String table : TABLES) {
	List<String> current = tableColumns(connection, table);
	@SuppressWarnings("unchecked")
	Map<String, Object> tableInfo = (Map<String, Object>) tables.get(table);
	@SuppressWarnings("unchecked")
	List<String> exported = (List<String>) tableInfo.get("columns");
	if (!current.equals(exported)) throw new IllegalArgumentException("数据表结构不一致: " + table);
	for (String column : current) {
	if (!column.matches("[A-Za-z_][A-Za-z0-9_]*")) {
		throw new IllegalArgumentException("数据表列名非法: " + table);
	}
	}
	result.put(table, current);
	}
	return result;
}

private void restoreTable(
	Connection connection,
	ZipFile zipFile,
	Map<String, Object> manifest,
	String table,
	List<String> columns)
	throws Exception {
	@SuppressWarnings("unchecked")
	Map<String, Object> tables = (Map<String, Object>) manifest.get("tables");
	@SuppressWarnings("unchecked")
	Map<String, Object> tableInfo = (Map<String, Object>) tables.get(table);
	String entry = (String) tableInfo.get("entry");
	long expectedRows = ((Number) tableInfo.get("rows")).longValue();

	String insertSql =
		"INSERT INTO \""
			+ table
			+ "\" ("
			+ columns.stream()
				.map(column -> "\"" + column + "\"")
				.reduce((a, b) -> a + "," + b)
				.orElse("")
			+ ") VALUES ("
			+ columns.stream().map(column -> "?").reduce((a, b) -> a + "," + b).orElse("")
			+ ")";

	long count = 0;
	try (BufferedReader reader =
			new BufferedReader(
				new InputStreamReader(
					zipFile.getInputStream(zipFile.getFileHeader(entry)), StandardCharsets.UTF_8));
		PreparedStatement statement = connection.prepareStatement(insertSql)) {
	String line;
	int batch = 0;
	while ((line = reader.readLine()) != null) {
		if (line.isBlank()) continue;
		Map<String, Object> row =
			objectMapper.readValue(line, new TypeReference<Map<String, Object>>() {});
		if (!row.keySet().equals(new HashSet<>(columns))) {
		throw new IllegalArgumentException("数据字段不一致: " + table);
		}
		for (int index = 0; index < columns.size(); index++) {
		statement.setObject(index + 1, row.get(columns.get(index)));
		}
		statement.addBatch();
		count++;
		batch++;
		if (batch >= 1000) {
		statement.executeBatch();
		batch = 0;
		}
	}
	if (batch > 0) statement.executeBatch();
	}
	if (count != expectedRows) throw new IllegalArgumentException("数据行数不一致: " + table);
}

private String readSchema(Connection connection) throws Exception {
	String placeholders = String.join(",", java.util.Collections.nCopies(TABLES.size(), "?"));
	String sql =
		"SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name IN ("
			+ placeholders
			+ ") ORDER BY name";
	StringBuilder result = new StringBuilder();
	try (PreparedStatement statement = connection.prepareStatement(sql)) {
	for (int index = 0; index < TABLES.size(); index++)
		statement.setString(index + 1, TABLES.get(index));
	try (ResultSet rows = statement.executeQuery()) {
		while (rows.next()) {
		result
			.append("-- ")
			.append(rows.getString("name"))
			.append('\n')
			.append(rows.getString("sql"))
			.append(";\n\n");
		}
	}
	}
	return result.toString();
}

private List<String> tableColumns(Connection connection, String table) throws Exception {
	List<String> result = new ArrayList<>();
	try (Statement statement = connection.createStatement();
		ResultSet rows = statement.executeQuery("PRAGMA table_info(\"" + table + "\")")) {
	while (rows.next()) result.add(rows.getString("name"));
	}
	return result;
}

private void validateEntries(ZipFile zipFile) throws Exception {
	List<FileHeader> headers = zipFile.getFileHeaders();
	Set<String> names = new HashSet<>();
	long totalUncompressed = 0;
	for (FileHeader header : headers) {
	if (header.isDirectory()) continue;
	if (!names.add(header.getFileName())) throw new IllegalArgumentException("压缩包包含重复文件");
	totalUncompressed += header.getUncompressedSize();
	}
	if (!names.equals(ENTRY_NAMES)) {
	throw new IllegalArgumentException("压缩包结构不完整或包含未知文件");
	}
	if (totalUncompressed > maxImportSizeBytes * 10) {
	throw new IllegalArgumentException("压缩包解压后超过允许大小");
	}
}

private ZipParameters encryptedParameters() {
	ZipParameters parameters = new ZipParameters();
	parameters.setCompressionMethod(CompressionMethod.DEFLATE);
	parameters.setEncryptFiles(true);
	parameters.setEncryptionMethod(EncryptionMethod.AES);
	parameters.setAesKeyStrength(AesKeyStrength.KEY_STRENGTH_256);
	return parameters;
}

// Read from a consistent snapshot so concurrent writes are not blocked during export.
private Connection openSnapshot(Path snapshot) throws Exception {
	Files.deleteIfExists(snapshot);
	String target = snapshot.toAbsolutePath().toString().replace("'", "''");
	try (Connection source = dataSource.getConnection();
		Statement statement = source.createStatement()) {
	statement.execute("VACUUM INTO '" + target + "'");
	}
	return DriverManager.getConnection("jdbc:sqlite:" + snapshot.toAbsolutePath());
}

private Path prepareTempDir() throws IOException {
	Path path = Path.of(tempDir);
	Files.createDirectories(path);
	return path;
}

public Path writeUpload(InputStream input, long size) throws IOException {
	if (size > maxImportSizeBytes) throw new IllegalArgumentException("导入文件超过允许大小");
	Path path = prepareTempDir().resolve("upload-" + UUID.randomUUID() + ".zip");
	Files.copy(input, path);
	if (Files.size(path) > maxImportSizeBytes) {
	Files.deleteIfExists(path);
	throw new IllegalArgumentException("导入文件超过允许大小");
	}
	return path;
}

public void clearStaleFiles() {
	Path directory = Path.of(tempDir);
	if (!Files.isDirectory(directory)) return;
	try (var stream = Files.list(directory)) {
	stream
		.filter(
			path ->
				path.getFileName().toString().startsWith("upload-")
					|| path.getFileName().toString().startsWith("export-")
					|| path.getFileName().toString().startsWith("fullstack-export-"))
		.forEach(
			path -> {
				try {
				deleteRecursively(path);
				} catch (IOException ignored) {
				// Stale files can be removed manually.
				}
			});
	} catch (IOException ignored) {
	// Startup should not fail because temp cleanup failed.
	}
}

private String randomPassword() {
	String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
	StringBuilder password = new StringBuilder();
	for (int index = 0; index < 24; index++) {
	password.append(alphabet.charAt(secureRandom.nextInt(alphabet.length())));
	}
	return password.toString();
}

private String sha256(Path path) throws Exception {
	try (InputStream input = Files.newInputStream(path)) {
	return sha256(input);
	}
}

private String sha256(InputStream input) throws Exception {
	MessageDigest digest = MessageDigest.getInstance("SHA-256");
	try (input) {
	byte[] buffer = new byte[1024 * 1024];
	int read;
	while ((read = input.read(buffer)) != -1) digest.update(buffer, 0, read);
	}
	return java.util.HexFormat.of().formatHex(digest.digest());
}

private String sha256Limited(InputStream input, long limit) throws Exception {
	MessageDigest digest = MessageDigest.getInstance("SHA-256");
	long total = 0;
	try (input) {
	byte[] buffer = new byte[1024 * 1024];
	int read;
	while ((read = input.read(buffer)) != -1) {
		total += read;
		if (total > limit) throw new IllegalArgumentException("压缩包解压后超过允许大小");
		digest.update(buffer, 0, read);
	}
	}
	return java.util.HexFormat.of().formatHex(digest.digest());
}

public void deleteRecursively(Path path) throws IOException {
	if (path == null || !Files.exists(path)) return;
	if (Files.isDirectory(path)) {
	try (var stream = Files.list(path)) {
		for (Path child : stream.toList()) deleteRecursively(child);
	}
	}
	Files.deleteIfExists(path);
}
}
