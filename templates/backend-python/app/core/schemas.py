"""统一响应信封。

泛型化后每个端点都能声明精确的响应类型，
FastAPI 会据此生成真实的 OpenAPI 响应 schema，而不是空的 `{}`。
"""

from pydantic import BaseModel


class ApiResponse[T](BaseModel):
    code: int = 0
    message: str = "success"
    data: T | None = None


class PaginatedData[T](BaseModel):
    list: list[T]
    total: int
    page: int
    pageSize: int
