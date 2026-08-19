from pydantic import BaseModel


class ApiResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: dict | list | None = None


class PaginatedData(BaseModel):
    list: list
    total: int
    page: int
    pageSize: int