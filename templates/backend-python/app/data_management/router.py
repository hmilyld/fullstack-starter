import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Header, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.core.deps import require_permission
from app.core.schemas import ApiResponse
from app.data_management import service, tasks
from app.user.models import User

router = APIRouter(prefix="/data", tags=["数据管理"])


@router.post("/export")
async def export_data(
    current_user: Annotated[User, Depends(require_permission("data_management.export"))],
) -> FileResponse:
    result = await asyncio.to_thread(tasks.create_export)
    return FileResponse(
        result.path,
        media_type="application/zip",
        filename=result.filename,
        headers={
            "X-Export-Password": result.password,
            "Cache-Control": "no-store",
        },
        background=BackgroundTask(service.remove_file, result.path),
    )


@router.post("/import", status_code=202)
async def import_data(
    current_user: Annotated[User, Depends(require_permission("data_management.import"))],
    file: Annotated[UploadFile, File()],
    password: Annotated[str, Form()],
) -> ApiResponse:
    data = await tasks.start_import(file, password, int(current_user.id))
    return ApiResponse(data=data, message="导入任务已创建")


@router.get("/import/{job_id}")
async def import_status(
    job_id: str,
    x_import_job_token: Annotated[str, Header()],
) -> ApiResponse:
    return ApiResponse(data=tasks.get_import_status(job_id, x_import_job_token))
