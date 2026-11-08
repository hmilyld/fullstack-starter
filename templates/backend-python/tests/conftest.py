"""Pytest fixtures for the backend contract suite.

The application reads settings at import time (``get_settings`` is cached), so
environment variables must be set before ``app.main`` is imported. This module
does that at collection time, before any test module imports the app.
"""

import os
import tempfile
from collections.abc import AsyncIterator
from pathlib import Path

import pytest

# --- must run before importing app.main -------------------------------------
_TMP_DIR = Path(tempfile.mkdtemp(prefix="backend-contract-"))
os.environ.setdefault("JWT_SECRET_KEY", "contract-test-secret-key-with-32-plus-characters")
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TMP_DIR / 'contract.db'}"
os.environ["DATA_TMP_DIR"] = str(_TMP_DIR / "tmp")
# ---------------------------------------------------------------------------

from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.auth import service as auth_service  # noqa: E402
from app.main import app  # noqa: E402

ADMIN_ACCOUNT = "admin"
ADMIN_PASSWORD = "123456"

# 契约测试会在一个进程里多次登录，登录速率限制（每分钟 5 次）会干扰断言。
# 这里只放宽测试进程内的上限，不影响生产行为。
auth_service.RATE_LIMIT_MAX = 10_000


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """HTTP client with the application lifespan active (tables + seed data)."""
    async with app.router.lifespan_context(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as http:
            yield http


@pytest.fixture
async def admin_headers(client: AsyncClient) -> dict[str, str]:
    return await login(client, ADMIN_ACCOUNT, ADMIN_PASSWORD)


async def login(client: AsyncClient, account: str, password: str) -> dict[str, str]:
    response = await client.post(
        "/api/auth/login", json={"account": account, "password": password}
    )
    payload = response.json()
    assert payload["code"] == 0, payload
    return {"Authorization": f"Bearer {payload['data']['token']}"}
