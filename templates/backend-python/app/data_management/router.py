import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Header, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.core.deps import require_permission
from app.core.schemas import ApiResponse
from app.data_management import service, tasks
from app.data_management.schemas import ImportJobHandle, ImportStatusOut
from app.user.models import User

router = APIRouter(prefix="/data", tags=["数据管理"])


@router.post(
    "/export",
    response_class=FileResponse,
    responses={
        200: {
            "description": "加密 ZIP 导出包；解压密码在 X-Export-Password 响应头",
            "content": {"application/zip": {"schema": {"type": "string", "format": "binary"}}},
        }
    },
)
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
) -> ApiResponse[ImportJobHandle]:
    data = await tasks.start_import(file, password, int(current_user.id))
    return ApiResponse(data=data, message="导入任务已创建")


@router.get("/import/{job_id}")
async def import_status(
    job_id: str,
    x_import_job_token: Annotated[str, Header()],
) -> ApiResponse[ImportStatusOut]:
    return ApiResponse(data=tasks.get_import_status(job_id, x_import_job_token))
