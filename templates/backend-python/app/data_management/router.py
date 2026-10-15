import asyncio
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Header, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from starlette.background import BackgroundTask

from app.core.config import get_settings
from app.core.deps import require_permission
from app.core.schemas import ApiResponse
from app.data_management import service
from app.data_management.state import data_operation_state

router = APIRouter(prefix="/data", tags=["数据管理"])


@router.post("/export")
async def export_data(
    current_user=Depends(require_permission("data_management.export")),
) -> FileResponse:
    archive_path, password = await asyncio.to_thread(service.create_export_archive)
    filename = Path(archive_path).name
    return FileResponse(
        archive_path,
        media_type="application/zip",
        filename=filename,
        headers={
            "X-Export-Password": password,
            "Cache-Control": "no-store",
        },
        background=BackgroundTask(service.remove_file, archive_path),
    )


@router.post("/import", status_code=202)
async def import_data(
    file: UploadFile = File(...),
    password: str = Form(...),
    current_user=Depends(require_permission("data_management.import")),
) -> ApiResponse:
    settings = get_settings()
    temp_dir = Path(settings.data_tmp_dir)
    temp_dir.mkdir(parents=True, exist_ok=True)
    job = data_operation_state.begin_job(int(current_user.id))
    if job is None:
        return JSONResponse(
            status_code=503,
            content=ApiResponse(code=-1, message="数据操作正在进行，请稍后重试").model_dump(),
        )
    upload_path = temp_dir / f"upload-{job.id}.zip"
    size = 0
    try:
        with upload_path.open("wb") as target:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > settings.max_import_size_bytes:
                    raise ValueError("导入文件超过允许大小")
                target.write(chunk)
        await file.close()
    except Exception as exc:
        upload_path.unlink(missing_ok=True)
        data_operation_state.finish_job(job, status="failed", message=str(exc))
        return ApiResponse(code=-1, message=str(exc))

    async def run() -> None:
        job.status = "running"
        job.message = "正在校验并恢复数据"
        job.progress = 10
        try:
            await asyncio.to_thread(service.restore_archive, str(upload_path), password)
            data_operation_state.finish_job(job, status="success", message="导入完成，请重新登录")
        except Exception as exc:
            data_operation_state.finish_job(job, status="failed", message=str(exc))
        finally:
            upload_path.unlink(missing_ok=True)

    data_operation_state.add_task(asyncio.create_task(run()))
    return ApiResponse(
        data={"jobId": job.id, "jobToken": job.token, "status": job.status},
        message="导入任务已创建",
    )


@router.get("/import/{job_id}")
async def import_status(
    job_id: str,
    x_import_job_token: str = Header(...),
) -> ApiResponse:
    job = data_operation_state.get_job(job_id, x_import_job_token)
    if job is None:
        return ApiResponse(code=-1, message="导入任务不存在")
    return ApiResponse(data=job.public())
