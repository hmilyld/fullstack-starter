"""领域异常与统一错误映射。

契约要求：业务失败使用 HTTP 200 + `code: -1`，`data` 为 `null`；
只有未认证（401）、无权限（403）、参数校验（422）、导入冻结（503）
才使用非 200 状态码。业务代码一律**抛异常**，不得"先写库再返回 code -1"。
"""

from fastapi import status


class AppError(Exception):
    """业务失败：映射为 HTTP 200 + `code: -1`。"""

    status_code = status.HTTP_200_OK

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class NotFoundError(AppError):
    """资源不存在。仍返回 HTTP 200，与既有契约一致。"""


class ConflictError(AppError):
    """唯一约束冲突，如用户名、邮箱、别名重复。"""


class InvalidOperationError(AppError):
    """当前状态不允许该操作，如删除预设角色。"""


class AuthError(Exception):
    """未认证：映射为 HTTP 401。"""

    status_code = status.HTTP_401_UNAUTHORIZED

    def __init__(self, message: str = "未登录或登录已过期") -> None:
        super().__init__(message)
        self.message = message


class ForbiddenError(Exception):
    """无权限：映射为 HTTP 403。"""

    status_code = status.HTTP_403_FORBIDDEN

    def __init__(self, message: str = "权限不足") -> None:
        super().__init__(message)
        self.message = message


class ServiceUnavailableError(Exception):
    """系统暂时不可用（数据导入期间）：映射为 HTTP 503。"""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    def __init__(self, message: str = "系统正在导入数据，请稍后重试") -> None:
        super().__init__(message)
        self.message = message
