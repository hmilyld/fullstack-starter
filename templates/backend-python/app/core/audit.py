from typing import Any

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.audit.models import AuditLog
from app.core.config import get_settings
from app.core.database import async_session
from app.core.security import decode_access_token

WRITE_METHODS = ("POST", "PUT", "DELETE", "PATCH")


def get_client_ip(req: Request) -> str:
    """获取客户端真实 IP。

    优先读取 nginx 写入的 X-Real-IP(由 $remote_addr 覆盖写入，不可伪造)，
    其次取 X-Forwarded-For 的第一跳，最后回退到连接方地址。
    """
    real_ip = req.headers.get("X-Real-IP")
    if real_ip and real_ip.lower() != "unknown":
        return real_ip
    forwarded = req.headers.get("X-Forwarded-For")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first and first.lower() != "unknown":
            return first
    return req.client.host if req.client else "unknown"


def _resolve_user_id(request: Request) -> int | None:
    """从请求中解析用户 ID，不校验用户是否存在，失败返回 None"""
    auth = request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        return None
    try:
        payload = decode_access_token(auth[7:])
        user_id = payload.get("sub")
        return int(user_id) if user_id is not None else None
    except Exception:
        return None


async def record_audit(
    *,
    action: str,
    ip: str,
    status: str = "success",
    user_id: int | None = None,
    username: str = "",
    detail: str = "",
) -> None:
    """显式记录一条审计日志，异常时静默失败，不影响业务"""
    try:
        async with async_session() as session:
            session.add(
                AuditLog(
                    user_id=user_id,
                    username=username,
                    action=action,
                    ip=ip,
                    status=status,
                    detail=detail,
                )
            )
            await session.commit()
    except Exception:
        pass


def _is_excluded(path: str) -> bool:
    settings = get_settings()
    for prefix in settings.audit_exclude_paths:
        if path == prefix or path.startswith(prefix.rstrip("/") + "/"):
            return True
    return False


class AuditMiddleware(BaseHTTPMiddleware):
    """审计日志中间件：拦截写请求与 403 响应。

    认证接口（/api/auth/*）由业务显式记录，这里按配置排除。
    """

    async def dispatch(self, request: Request, call_next: Any):
        response = await call_next(request)
        is_write = request.method in WRITE_METHODS
        is_denied = response.status_code == 403
        if not is_write and not is_denied:
            return response

        path = request.url.path
        if not path.startswith("/api/") or _is_excluded(path):
            return response

        status = "permission_denied" if is_denied else "success"
        await record_audit(
            action=f"{request.method} {path}",
            ip=get_client_ip(request),
            status=status,
            user_id=_resolve_user_id(request),
        )
        return response
