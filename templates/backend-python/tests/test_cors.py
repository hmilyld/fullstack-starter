"""跨域配置：三个开发前端端口以及 127.0.0.1 等价来源都应被允许。"""

from httpx import AsyncClient

ORIGINS = [
    *(f"http://localhost:{port}" for port in (5173, 5174, 5175)),
    *(f"http://127.0.0.1:{port}" for port in (5173, 5174, 5175)),
]


async def test_every_frontend_origin_is_allowed(client: AsyncClient) -> None:
    for origin in ORIGINS:
        response = await client.get("/api/public/config", headers={"Origin": origin})
        assert response.status_code == 200, origin
        assert response.headers.get("access-control-allow-origin") == origin


async def test_preflight_allows_configured_origin(client: AsyncClient) -> None:
    response = await client.options(
        "/api/auth/login",
        headers={
            "Origin": "http://localhost:5174",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5174"
    assert response.headers.get("access-control-allow-credentials") == "true"


async def test_unknown_origin_gets_no_cors_headers(client: AsyncClient) -> None:
    response = await client.get(
        "/api/public/config", headers={"Origin": "http://evil.example"}
    )
    assert "access-control-allow-origin" not in response.headers
