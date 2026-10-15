import re
from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.schemas import ApiResponse
from app.data_management.state import data_operation_state

IMPORT_STATUS_PATH = re.compile(r"^/api/data/import/[^/]+$")


class DataOperationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Any):
        if (
            data_operation_state.frozen
            and request.method != "OPTIONS"
            and not IMPORT_STATUS_PATH.fullmatch(request.url.path)
        ):
            return JSONResponse(
                status_code=503,
                content=ApiResponse(
                    code=-1,
                    message="系统正在导入数据，请稍后重试",
                ).model_dump(),
            )
        return await call_next(request)
