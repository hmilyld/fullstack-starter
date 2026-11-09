"""数据管理：导出与导入的用例编排。

导出/恢复的底层实现留在 ``service`` 模块，这里只负责：
上传落盘、任务状态机、权限与错误映射。
"""

import asyncio
from dataclasses import dataclass
from pathlib import Path

from fastapi import UploadFile

from app.core.config import get_settings
from app.core.exceptions import AppError, ServiceUnavailableError
from app.data_management import service
from app.data_management.schemas import ImportJobHandle, ImportStatusOut
from app.data_management.state import ImportJob, data_operation_state

CHUNK_SIZE = 1024 * 1024


@dataclass(frozen=True)
class ExportResult:
    path: str
    password: str
    filename: str


def create_export() -> ExportResult:
    archive_path, password = service.create_export_archive()
    return ExportResult(
        path=archive_path,
        password=password,
        filename=Path(archive_path).name,
    )


async def _save_upload(file: UploadFile, target: Path) -> None:
    settings = get_settings()
    size = 0
    with target.open("wb") as handle:
        while chunk := await file.read(CHUNK_SIZE):
            size += len(chunk)
            if size > settings.max_import_size_bytes:
                raise AppError("导入文件超过允许大小")
            handle.write(chunk)
    await file.close()


async def _restore(job: ImportJob, upload_path: Path, password: str) -> None:
    job.status = "running"
    job.message = "正在校验并恢复数据"
    job.progress = 10
    try:
        await asyncio.to_thread(service.restore_archive, str(upload_path), password)
        data_operation_state.finish_job(job, status="success", message="导入完成，请重新登录")
    except Exception as exc:
        data_operation_state.finish_job(job, status="failed", message=str(exc))
    finally:
        await asyncio.to_thread(upload_path.unlink, missing_ok=True)


async def start_import(file: UploadFile, password: str, owner_id: int) -> ImportJobHandle:
    settings = get_settings()
    temp_dir = Path(settings.data_tmp_dir)
    # 必须用关键字参数：Path.mkdir 的第二个位置参数是 mode，不是 exist_ok，
    # 写成 mkdir(True, True) 会把 mode 设成 1 且 exist_ok 仍为 False，
    # 于是第二次导入直接抛 FileExistsError。
    await asyncio.to_thread(temp_dir.mkdir, parents=True, exist_ok=True)

    job = data_operation_state.begin_job(owner_id)
    if job is None:
        raise ServiceUnavailableError("数据操作正在进行，请稍后重试")

    upload_path = temp_dir / f"upload-{job.id}.zip"
    try:
        await _save_upload(file, upload_path)
    except Exception as exc:
        await asyncio.to_thread(upload_path.unlink, missing_ok=True)
        data_operation_state.finish_job(job, status="failed", message=str(exc))
        raise AppError(str(exc)) from exc

    data_operation_state.add_task(asyncio.create_task(_restore(job, upload_path, password)))
    return ImportJobHandle(jobId=job.id, jobToken=job.token, status=job.status)


def get_import_status(job_id: str, token: str) -> ImportStatusOut:
    job = data_operation_state.get_job(job_id, token)
    if job is None:
        raise AppError("导入任务不存在")
    return ImportStatusOut(
        id=job.id, status=job.status, message=job.message, progress=job.progress
    )
