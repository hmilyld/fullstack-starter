"""可执行契约测试。

对应 ``docs/contract/api.md``。这套测试是「基准」本身：
Python 端先达标，Java 端重构后必须让同一套断言通过。
"""

import uuid

import pytest

pytestmark = pytest.mark.anyio


# ---------------------------------------------------------------- 契约清单

CONTRACT_ENDPOINTS: set[tuple[str, str]] = {
    ("POST", "/api/auth/login"),
    ("POST", "/api/auth/register"),
    ("POST", "/api/auth/logout"),
    ("GET", "/api/users"),
    ("POST", "/api/users"),
    ("POST", "/api/users/batch-role"),
    ("PUT", "/api/users/me"),
    ("PUT", "/api/users/me/password"),
    ("GET", "/api/users/{}"),
    ("PUT", "/api/users/{}"),
    ("DELETE", "/api/users/{}"),
    ("PUT", "/api/users/{}/reset-password"),
    ("GET", "/api/roles"),
    ("POST", "/api/roles"),
    ("PUT", "/api/roles/{}"),
    ("DELETE", "/api/roles/{}"),
    ("GET", "/api/permissions"),
    ("POST", "/api/permissions"),
    ("POST", "/api/permissions/sync"),
    ("PUT", "/api/permissions/{}"),
    ("DELETE", "/api/permissions/{}"),
    ("GET", "/api/menus/navigation"),
    ("GET", "/api/menus"),
    ("POST", "/api/menus/groups"),
    ("PUT", "/api/menus/groups/{}"),
    ("DELETE", "/api/menus/groups/{}"),
    ("POST", "/api/menus/items"),
    ("PUT", "/api/menus/items/{}"),
    ("DELETE", "/api/menus/items/{}"),
    ("PUT", "/api/menus/layout"),
    ("GET", "/api/system/config"),
    ("PUT", "/api/system/config"),
    ("POST", "/api/system/test-email"),
    ("GET", "/api/public/config"),
    ("GET", "/api/dashboard/stats"),
    ("GET", "/api/dashboard/activity"),
    ("GET", "/api/ai-models"),
    ("POST", "/api/ai-models"),
    ("GET", "/api/ai-models/default"),
    ("GET", "/api/ai-models/by-alias/{}"),
    ("GET", "/api/ai-models/{}"),
    ("PUT", "/api/ai-models/{}"),
    ("DELETE", "/api/ai-models/{}"),
    ("POST", "/api/ai-models/test"),
    ("GET", "/api/ai-models/presets"),
    ("GET", "/api/ai-models/presets/groups"),
    ("GET", "/api/ai-models/presets/active"),
    ("GET", "/api/ai-models/presets/{}"),
    ("POST", "/api/ai-models/presets"),
    ("PUT", "/api/ai-models/presets/{}"),
    ("DELETE", "/api/ai-models/presets/{}"),
    ("GET", "/api/audit-logs"),
    ("POST", "/api/data/export"),
    ("POST", "/api/data/import"),
    ("GET", "/api/data/import/{}"),
}

HTTP_METHODS = {"get", "post", "put", "delete", "patch"}


def _normalize(path: str) -> str:
    """把路径参数名抹平：/{user_id} 与 /{id} 视为同一条路径。"""
    out = []
    in_param = False
    for char in path:
        if char == "{":
            in_param = True
            out.append("{")
        elif char == "}":
            in_param = False
            out.append("}")
        elif not in_param:
            out.append(char)
    return "".join(out)


def _unique(prefix: str) -> str:
    return f"{prefix}{uuid.uuid4().hex[:8]}"


# ---------------------------------------------------------------- 契约完整性


def test_openapi_matches_contract_endpoint_set(client) -> None:
    """代码暴露的端点集合必须与契约完全一致（不多不少）。"""
    spec = client._transport.app.openapi()  # type: ignore[attr-defined]
    actual = {
        (method.upper(), _normalize(path))
        for path, operations in spec["paths"].items()
        for method in operations
        if method in HTTP_METHODS
    }
    assert actual == CONTRACT_ENDPOINTS, (
        f"多出: {sorted(actual - CONTRACT_ENDPOINTS)}\n"
        f"缺失: {sorted(CONTRACT_ENDPOINTS - actual)}"
    )


# ---------------------------------------------------------------- 响应信封


def _assert_envelope(payload: dict) -> None:
    assert set(payload) == {"code", "message", "data"}, f"信封字段不符: {sorted(payload)}"
    assert isinstance(payload["code"], int)
    assert isinstance(payload["message"], str)


async def test_success_envelope(client, admin_headers) -> None:
    response = await client.get("/api/users", headers=admin_headers)
    assert response.status_code == 200
    payload = response.json()
    _assert_envelope(payload)
    assert payload["code"] == 0
    assert payload["message"] == "success"


async def test_business_error_envelope(client, admin_headers) -> None:
    """业务失败使用 HTTP 200 + code -1，且 data 必须为 null。"""
    response = await client.get("/api/users/999999", headers=admin_headers)
    assert response.status_code == 200
    payload = response.json()
    _assert_envelope(payload)
    assert payload["code"] == -1
    assert payload["data"] is None


async def test_unauthenticated_envelope(client) -> None:
    response = await client.get("/api/users")
    assert response.status_code == 401
    payload = response.json()
    _assert_envelope(payload)
    assert payload["code"] == -1
    assert payload["data"] is None


async def test_forbidden_envelope(client) -> None:
    """普通用户没有 roles 权限，必须返回 403 而不是 200。"""
    login = await client.post(
        "/api/auth/login", json={"account": "zhangsan", "password": "123456"}
    )
    headers = {"Authorization": f"Bearer {login.json()['data']['token']}"}
    response = await client.get("/api/roles", headers=headers)
    assert response.status_code == 403
    payload = response.json()
    _assert_envelope(payload)
    assert payload["code"] == -1


async def test_validation_envelope(client, admin_headers) -> None:
    response = await client.post("/api/users", headers=admin_headers, json={})
    assert response.status_code == 422
    payload = response.json()
    _assert_envelope(payload)
    assert payload["code"] == -1


async def test_public_config_needs_no_auth(client) -> None:
    response = await client.get("/api/public/config")
    assert response.status_code == 200
    payload = response.json()
    _assert_envelope(payload)
    assert payload["code"] == 0


# ---------------------------------------------------------------- 资源形状


async def test_login_shape(client) -> None:
    response = await client.post(
        "/api/auth/login", json={"account": "admin", "password": "123456"}
    )
    data = response.json()["data"]
    assert set(data) == {"token", "user"}
    assert isinstance(data["token"], str) and data["token"]
    assert set(data["user"]) == {"id", "name", "email", "avatar", "role", "permissions"}
    assert isinstance(data["user"]["id"], str)
    assert isinstance(data["user"]["permissions"], list)


async def test_user_shape_and_pagination(client, admin_headers) -> None:
    response = await client.get("/api/users?page=1&pageSize=2", headers=admin_headers)
    data = response.json()["data"]
    assert set(data) == {"list", "total", "page", "pageSize"}
    assert data["page"] == 1 and data["pageSize"] == 2
    assert isinstance(data["total"], int)
    assert data["list"], "种子数据应至少有一个用户"
    assert set(data["list"][0]) == {"id", "username", "name", "email", "roleId", "avatar"}
    assert isinstance(data["list"][0]["id"], str)


async def test_pagination_clamps_page_size(client, admin_headers) -> None:
    """pageSize 越界必须钳制而不是报错。"""
    response = await client.get("/api/users?page=0&pageSize=1000", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["page"] >= 1
    assert data["pageSize"] <= 100


async def test_role_shape(client, admin_headers) -> None:
    response = await client.get("/api/roles", headers=admin_headers)
    data = response.json()["data"]
    assert set(data) == {"list", "total", "page", "pageSize"}
    role = data["list"][0]
    assert set(role) == {"id", "name", "description", "permissions", "isPreset"}
    assert isinstance(role["permissions"], list)
    assert isinstance(role["isPreset"], bool)


async def test_permission_shape(client, admin_headers) -> None:
    response = await client.get("/api/permissions", headers=admin_headers)
    data = response.json()["data"]
    assert isinstance(data, list) and data
    assert set(data[0]) == {"code", "name", "type", "parent"}


async def test_menu_config_shape(client, admin_headers) -> None:
    response = await client.get("/api/menus", headers=admin_headers)
    data = response.json()["data"]
    assert set(data) == {"version", "groups"}
    assert isinstance(data["version"], int)
    group = data["groups"][0]
    assert set(group) == {"id", "name", "sortOrder", "isSystem", "items"}
    item = next(i for g in data["groups"] for i in g["items"])
    assert set(item) == {
        "permissionCode",
        "name",
        "groupId",
        "route",
        "icon",
        "sortOrder",
        "isSystem",
        "hidden",
        "operations",
    }
    with_operations = next(
        i for g in data["groups"] for i in g["items"] if i["operations"]
    )
    assert set(with_operations["operations"][0]) == {"code", "name"}


async def test_navigation_shape(client, admin_headers) -> None:
    response = await client.get("/api/menus/navigation", headers=admin_headers)
    data = response.json()["data"]
    assert isinstance(data, list) and data
    assert set(data[0]) == {"id", "name", "sortOrder", "items"}
    item = data[0]["items"][0]
    assert set(item) == {"permissionCode", "name", "route", "icon", "sortOrder"}


async def test_system_config_shape(client, admin_headers) -> None:
    response = await client.get("/api/system/config", headers=admin_headers)
    data = response.json()["data"]
    assert set(data) == {
        "siteName",
        "siteDescription",
        "keywords",
        "maintenanceEnabled",
        "maintenanceMessage",
        "openRegistration",
        "manualReview",
        "defaultRoleId",
        "welcomeMessage",
        "smtpEnabled",
        "smtpHost",
        "smtpPort",
        "smtpUsername",
        "smtpPassword",
        "smtpFromName",
        "smtpFromEmail",
        "smtpUseSsl",
    }
    assert data["smtpPassword"] == "****", "SMTP 密码必须脱敏"


async def test_public_config_shape(client) -> None:
    response = await client.get("/api/public/config")
    data = response.json()["data"]
    assert set(data) == {
        "siteName",
        "siteDescription",
        "maintenanceEnabled",
        "maintenanceMessage",
        "openRegistration",
        "manualReview",
    }


async def test_dashboard_shape(client, admin_headers) -> None:
    stats = (await client.get("/api/dashboard/stats", headers=admin_headers)).json()["data"]
    assert set(stats) == {"totalUsers", "activeNow", "revenue", "growth"}
    activity = (await client.get("/api/dashboard/activity", headers=admin_headers)).json()["data"]
    assert isinstance(activity, list) and activity
    assert set(activity[0]) == {"user", "action", "time"}


async def test_ai_model_shapes(client, admin_headers) -> None:
    listing = (await client.get("/api/ai-models", headers=admin_headers)).json()["data"]
    assert set(listing) == {"list", "total", "page", "pageSize"}

    presets = (await client.get("/api/ai-models/presets", headers=admin_headers)).json()["data"]
    assert isinstance(presets, list) and presets
    assert set(presets[0]) == {
        "id",
        "group",
        "alias",
        "modelName",
        "apiUrl",
        "description",
        "isActive",
        "sortOrder",
    }

    groups = (await client.get("/api/ai-models/presets/groups", headers=admin_headers)).json()["data"]
    assert isinstance(groups, list)
    assert all(isinstance(group, str) for group in groups)


async def test_audit_log_shape(client, admin_headers) -> None:
    response = await client.get("/api/audit-logs?pageSize=1", headers=admin_headers)
    data = response.json()["data"]
    assert set(data) == {"list", "total", "page", "pageSize"}
    if data["list"]:
        log = data["list"][0]
        assert set(log) == {
            "id",
            "userId",
            "username",
            "action",
            "ip",
            "status",
            "detail",
            "createdAt",
        }
        assert isinstance(log["id"], str), "实体主键在 JSON 中必须是字符串"
        assert isinstance(log["userId"], str)


async def test_ai_model_api_key_is_masked(client, admin_headers) -> None:
    alias = _unique("mask")
    created = await client.post(
        "/api/ai-models",
        headers=admin_headers,
        json={
            "alias": alias,
            "modelName": "m",
            "apiUrl": "https://api.example.com/v1",
            "apiKey": "sk-1234567890abcdef",
        },
    )
    data = created.json()["data"]
    assert set(data) == {
        "id",
        "alias",
        "modelName",
        "apiUrl",
        "apiKey",
        "description",
        "isDefault",
    }
    assert "****" in data["apiKey"]
    assert "1234567890" not in data["apiKey"]


# ---------------------------------------------------------------- 语义约束


async def test_logout_invalidates_token(client) -> None:
    """登出必须使当前令牌立即失效。"""
    login = await client.post(
        "/api/auth/login", json={"account": "admin", "password": "123456"}
    )
    headers = {"Authorization": f"Bearer {login.json()['data']['token']}"}

    before = await client.get("/api/users", headers=headers)
    assert before.status_code == 200

    logout = await client.post("/api/auth/logout", headers=headers)
    assert logout.status_code == 200

    after = await client.get("/api/users", headers=headers)
    assert after.status_code == 401, "登出后旧令牌仍然可用"


async def test_permission_change_invalidates_token(client) -> None:
    """修改密码后该用户的其他会话必须失效。"""
    username = _unique("pw")
    password = "123456"
    created = await client.post(
        "/api/auth/register",
        json={"username": username, "email": f"{username}@example.com", "password": password},
    )
    assert created.json()["code"] == 0
    token = created.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    before = await client.get("/api/menus/navigation", headers=headers)
    assert before.status_code == 200

    changed = await client.put(
        "/api/users/me/password",
        headers=headers,
        json={"currentPassword": password, "newPassword": "654321"},
    )
    assert changed.json()["code"] == 0

    after = await client.get("/api/menus/navigation", headers=headers)
    assert after.status_code == 401, "改密后旧令牌仍然可用"


async def test_failed_write_leaves_no_row(client, admin_headers) -> None:
    """返回 code -1 的写请求不得留下已提交的写入。"""
    alias = _unique("dup")
    payload = {
        "alias": alias,
        "modelName": "m",
        "apiUrl": "https://api.example.com/v1",
        "apiKey": "sk-1234567890abcdef",
    }
    first = await client.post("/api/ai-models", headers=admin_headers, json=payload)
    assert first.json()["code"] == 0

    duplicate = await client.post("/api/ai-models", headers=admin_headers, json=payload)
    assert duplicate.json()["code"] == -1

    listing = await client.get(
        "/api/ai-models?search=" + alias, headers=admin_headers
    )
    matches = [m for m in listing.json()["data"]["list"] if m["alias"] == alias]
    assert len(matches) == 1, "重复创建失败后数据库里应只有一条记录"


async def test_menu_permission_mutation_is_rejected(client, admin_headers) -> None:
    response = await client.post(
        "/api/permissions",
        headers=admin_headers,
        json={"code": _unique("menu"), "name": "x", "type": "menu"},
    )
    assert response.json()["code"] == -1


async def test_ssrf_dns_resolution(client, admin_headers) -> None:
    """域名指向内网时也必须被拒绝，不能因为"看起来是域名"就放行。"""
    response = await client.post(
        "/api/ai-models",
        headers=admin_headers,
        json={
            "alias": _unique("ssrf"),
            "modelName": "m",
            "apiUrl": "http://127.0.0.1.nip.io/v1",
            "apiKey": "sk-1234567890abcdef",
        },
    )
    payload = response.json()
    assert payload["code"] == -1, "指向 127.0.0.1 的域名未被拦截"


async def test_export_is_zip_with_password_header(client, admin_headers) -> None:
    response = await client.post("/api/data/export", headers=admin_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert response.headers.get("X-Export-Password")
    assert response.content[:2] == b"PK"
