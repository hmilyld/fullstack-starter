"""数据管理的输出 schema。"""

from typing import Literal

from pydantic import BaseModel

ImportStatus = Literal["queued", "running", "success", "failed"]


class ImportJobHandle(BaseModel):
    jobId: str
    jobToken: str
    status: ImportStatus


class ImportStatusOut(BaseModel):
    id: str
    status: ImportStatus
    message: str
    progress: int
