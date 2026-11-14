"""Accept-Language 本地化测试。

覆盖认证、授权、参数校验和业务错误的英文响应，并确认没有请求头时
继续返回既有中文文案。
"""

import uuid

from httpx import AsyncClient

from app.core.i18n import resolve_locale, translate

EN = {"Accept-Language": "en"}


def unique_name(prefix: str) -> str:
    return f"{prefix}{uuid.uuid4().hex[:8]}"


def test_resolve_locale_prefers_english() -> None:
    assert resolve_locale(None) == "zh-CN"
    assert resolve_locale("") == "zh-CN"
    assert resolve_locale("zh-CN") == "zh-CN"
    assert resolve_locale("zh-CN,zh;q=0.9,en;q=0.8") == "zh-CN"
    assert resolve_locale("en") == "en"
    assert resolve_locale("en-US,en;q=0.9") == "en"
    assert resolve_locale("fr-FR,en;q=0.7") == "en"
    assert resolve_locale("fr-FR") == "zh-CN"
    assert resolve_locale("en;q=0,zh-CN") == "zh-CN"
    assert resolve_locale("*") == "zh-CN"


def test_translate_dynamic_patterns_and_fallback() -> None:
    assert translate("文件校验失败: manifest.json", "en") == (
        "File checksum verification failed: manifest.json"
    )
    assert translate("数据行数不一致: users", "en") == "Row count mismatch in table: users"
    assert translate("禁止访问内网地址（example.com 解析为 127.0.0.1）", "en") == (
        "Access to private network addresses is forbidden "
        "(example.com resolves to 127.0.0.1)"
    )
    assert translate("自定义维护文案", "en") == "自定义维护文案"
    assert translate("账号或密码错误", "zh-CN") == "账号或密码错误"


async def test_login_error_is_english_with_header(client: AsyncClient) -> None:
    response = await client.post(
        "/api/auth/login",
        json={"account": "admin", "password": "wrong-password"},
        headers=EN,
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == -1
    assert payload["data"] is None
    assert payload["message"] == "Incorrect account or password."


async def test_login_error_defaults_to_chinese(client: AsyncClient) -> None:
    response = await client.post(
        "/api/auth/login",
        json={"account": "admin", "password": "wrong-password"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == -1
    assert payload["message"] == "账号或密码错误"


async def test_validation_error_is_english_with_header(client: AsyncClient) -> None:
    response = await client.post("/api/auth/login", json={}, headers=EN)
    assert response.status_code == 422
    assert response.json()["message"] == "Request validation failed."


async def test_unauthorized_error_is_english_with_header(client: AsyncClient) -> None:
    response = await client.get("/api/users", headers=EN)
    assert response.status_code == 401
    assert response.json()["message"] == "Authentication credentials were not provided."


async def test_forbidden_error_is_english_with_header(client: AsyncClient) -> None:
    username = unique_name("i18n-user-")
    register = await client.post(
        "/api/auth/register",
        json={"username": username, "email": f"{username}@example.com", "password": "123456"},
    )
    assert register.status_code == 200
    body = register.json()
    assert body["code"] == 0, body
    token = body["data"]["token"]

    response = await client.post(
        "/api/users",
        headers={**EN, "Authorization": f"Bearer {token}"},
        json={
            "username": unique_name("i18n-created-"),
            "name": "blocked",
            "email": f"{unique_name('i18n-created-')}@example.com",
            "roleId": "user",
            "password": "123456",
        },
    )
    assert response.status_code == 403
    assert response.json()["message"] == "Permission denied."


async def test_business_error_is_english_with_header(
    client: AsyncClient, admin_headers: dict[str, str]
) -> None:
    response = await client.get("/api/users/999999", headers={**EN, **admin_headers})
    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == -1
    assert payload["message"] == "User not found."

    chinese = await client.get("/api/users/999999", headers=admin_headers)
    assert chinese.json()["message"] == "用户不存在"


async def test_success_message_is_english_with_header(
    client: AsyncClient, admin_headers: dict[str, str]
) -> None:
    response = await client.post("/api/permissions/sync", headers={**EN, **admin_headers})
    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == 0
    assert payload["message"] == "Permissions synchronized."
