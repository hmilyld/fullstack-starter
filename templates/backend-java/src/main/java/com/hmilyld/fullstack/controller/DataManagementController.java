package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import cn.dev33.satoken.stp.StpUtil;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.config.DataImportExecutor;
import com.hmilyld.fullstack.config.DataOperationState;
import com.hmilyld.fullstack.service.DataManagementService;
import jakarta.annotation.PostConstruct;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/data")
public class DataManagementController {

@Autowired private DataManagementService dataManagementService;
@Autowired private DataOperationState operationState;
@Autowired private DataImportExecutor importExecutor;

@PostConstruct
public void cleanupStaleFiles() {
	dataManagementService.clearStaleFiles();
}

@PostMapping("/export")
@SaCheckPermission("data_management.export")
public ResponseEntity<FileSystemResource> exportData() throws Exception {
	DataManagementService.ExportResult result = dataManagementService.createExport();
	java.util.concurrent.CompletableFuture.delayedExecutor(1, java.util.concurrent.TimeUnit.HOURS)
		.execute(
			() -> {
			try {
				Files.deleteIfExists(result.path());
			} catch (Exception ignored) {
				// Stale temporary files are cleaned on the next startup.
			}
			});
	return ResponseEntity.ok()
		.header(
			HttpHeaders.CONTENT_DISPOSITION,
			"attachment; filename=\"" + result.path().getFileName() + "\"")
		.header("X-Export-Password", result.password())
		.header(HttpHeaders.CACHE_CONTROL, "no-store")
		.contentType(MediaType.parseMediaType("application/zip"))
		.body(new FileSystemResource(result.path()));
}

@PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
@ResponseStatus(org.springframework.http.HttpStatus.ACCEPTED)
@SaCheckPermission("data_management.import")
public ApiResponse<?> importData(
	@RequestPart("file") MultipartFile file, @RequestParam("password") String password)
	throws Exception {
	Long ownerId = Long.parseLong(StpUtil.getLoginId().toString());
	DataOperationState.ImportJob job = operationState.beginJob(ownerId);
	if (job == null) {
	return ApiResponse.error("数据操作正在进行，请稍后重试");
	}
	Path upload;
	try {
	upload = dataManagementService.writeUpload(file.getInputStream(), file.getSize());
	} catch (Exception exception) {
	operationState.finishJob(
		job,
		"failed",
		exception.getMessage() == null || exception.getMessage().isBlank()
			? "导入文件写入失败"
			: exception.getMessage());
	throw exception;
	}

	importExecutor.submit(
		() -> {
		job.markRunning();
		try {
			dataManagementService.restore(upload, password);
			operationState.finishJob(job, "success", "导入完成，请重新登录");
		} catch (Exception exception) {
			String message =
				exception.getMessage() == null || exception.getMessage().isBlank()
					? "导入失败"
					: exception.getMessage();
			operationState.finishJob(job, "failed", message);
		} finally {
			try {
			Files.deleteIfExists(upload);
			} catch (Exception ignored) {
			// Stale temporary files are cleaned on the next startup.
			}
		}
		});

	return ApiResponse.success(
		Map.of("jobId", job.id(), "jobToken", job.token(), "status", job.status()));
}

@GetMapping("/import/{jobId}")
public ApiResponse<?> importStatus(
	@PathVariable String jobId, @RequestHeader("X-Import-Job-Token") String jobToken) {
	DataOperationState.ImportJob job = operationState.getJob(jobId, jobToken);
	if (job == null) return ApiResponse.error("导入任务不存在");
	return ApiResponse.success(
		Map.of(
			"id",
			job.id(),
			"status",
			job.status(),
			"message",
			job.message(),
			"progress",
			job.progress()));
}
}
