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


def test_every_endpoint_declares_response_schema(client) -> None:
    """每个端点都必须有真实的结构化响应 schema。

    这是「契约机器可读」的实际含义：如果某个端点没有声明返回类型，
    OpenAPI 里它的响应要么是空的，要么退化成 `additionalProperties: true`
    的自由对象，客户端无法据此生成类型。
    """
    spec = client._transport.app.openapi()  # type: ignore[attr-defined]
    problems: list[str] = []

    for path, operations in spec["paths"].items():
        for method, operation in operations.items():
            if method not in HTTP_METHODS:
                continue
            responses = operation.get("responses", {})
            code = "202" if "202" in responses else "200"
            content = responses.get(code, {}).get("content", {})
            if not content:
                problems.append(f"{method.upper()} {path}: 无响应内容")
                continue
            schema = next(iter(content.values())).get("schema", {})
            if schema.get("additionalProperties") is True:
                problems.append(f"{method.upper()} {path}: 退化为自由 dict")

    assert not problems, f"响应 schema 不合格: {problems}"


def test_success_schemas_reference_api_response(client) -> None:
    """除文件下载外，成功响应都必须指向 ApiResponse[...] 泛型。"""
    spec = client._transport.app.openapi()  # type: ignore[attr-defined]
    non_envelope: list[str] = []
    for path, operations in spec["paths"].items():
        if path == "/api/data/export":
            continue  # 文件下载，不是信封
        for method, operation in operations.items():
            if method not in HTTP_METHODS:
                continue
            responses = operation.get("responses", {})
            code = "202" if "202" in responses else "200"
            content = responses.get(code, {}).get("content", {})
            schema = content.get("application/json", {}).get("schema", {})
            ref = schema.get("$ref", "")
            if "ApiResponse" not in ref:
                non_envelope.append(f"{method.upper()} {path} -> {ref or schema}")
    assert not non_envelope, f"未使用 ApiResponse 信封: {non_envelope}"


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


async def test_create_user_with_non_default_role(client, admin_headers) -> None:
    """创建非默认角色用户需要 users.assign_role；admin 具备该权限，应成功。

    这条用例覆盖 service 层对权限集合的判定路径——此前只测了空 body 的 422，
    导致 `actor.permissions` 这类属性名错误没有暴露。
    """
    username = _unique("newrole")
    response = await client.post(
        "/api/users",
        headers=admin_headers,
        json={
            "username": username,
            "name": "新角色用户",
            "email": f"{username}@example.com",
            "roleId": "pending_review",
            "password": "123456",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == 0, payload
    assert payload["data"]["roleId"] == "pending_review"


async def test_update_user_role(client, admin_headers) -> None:
    """变更用户角色走 users.assign_role 判定，admin 应能成功。"""
    username = _unique("rolex")
    created = await client.post(
        "/api/users",
        headers=admin_headers,
        json={
            "username": username,
            "name": "待改角色",
            "email": f"{username}@example.com",
            "roleId": "user",
            "password": "123456",
        },
    )
    user_id = created.json()["data"]["id"]

    response = await client.put(
        f"/api/users/{user_id}", headers=admin_headers, json={"roleId": "pending_review"}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == 0, payload
    assert payload["data"]["roleId"] == "pending_review"


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


async def test_role_create_returns_its_permissions(client, admin_headers) -> None:
    """创建角色后返回的 permissions 必须是刚写入的那一组。

    角色写接口此前只做 GET 形状断言，``role.permissions`` 在异步会话里懒加载
    抛 ``MissingGreenlet``、以及返回更新前旧权限的问题因此都没被发现。
    """
    response = await client.post(
        "/api/roles",
        headers=admin_headers,
        json={"name": _unique("角色"), "permissions": ["dashboard", "users"]},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == 0, payload
    assert payload["data"]["permissions"] == ["dashboard", "users"]


async def test_role_update_returns_new_permissions(client, admin_headers) -> None:
    """更新权限后必须返回新权限，且真的落库。"""
    created = await client.post(
        "/api/roles",
        headers=admin_headers,
        json={"name": _unique("角色"), "permissions": ["dashboard", "users"]},
    )
    role_id = created.json()["data"]["id"]

    updated = await client.put(
        f"/api/roles/{role_id}", headers=admin_headers, json={"permissions": ["settings"]}
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["permissions"] == ["settings"], updated.json()

    listing = await client.get("/api/roles?pageSize=100", headers=admin_headers)
    role = next(r for r in listing.json()["data"]["list"] if r["id"] == role_id)
    assert role["permissions"] == ["settings"], "更新后的权限没有持久化"


async def test_role_update_without_permissions_keeps_them(client, admin_headers) -> None:
    """只改名字时不得清空已有权限（permissions 缺省表示不改）。"""
    created = await client.post(
        "/api/roles",
        headers=admin_headers,
        json={"name": _unique("角色"), "permissions": ["dashboard"]},
    )
    role_id = created.json()["data"]["id"]

    renamed = await client.put(
        f"/api/roles/{role_id}", headers=admin_headers, json={"name": "改名后的角色"}
    )
    assert renamed.status_code == 200
    assert renamed.json()["data"]["permissions"] == ["dashboard"], renamed.json()


async def test_role_delete_removes_grants(client, admin_headers) -> None:
    """删除角色后，其授权记录必须一并消失，不能留下孤儿行。"""
    from sqlalchemy import func, select

    from app.core.database import async_session
    from app.role.models import RolePermission

    created = await client.post(
        "/api/roles",
        headers=admin_headers,
        json={"name": _unique("角色"), "permissions": ["dashboard", "users"]},
    )
    role_id = created.json()["data"]["id"]

    deleted = await client.delete(f"/api/roles/{role_id}", headers=admin_headers)
    assert deleted.status_code == 200
    assert deleted.json()["code"] == 0, deleted.json()

    listing = await client.get("/api/roles?pageSize=100", headers=admin_headers)
    assert all(r["id"] != role_id for r in listing.json()["data"]["list"])

    async with async_session() as session:
        orphans = (
            await session.execute(
                select(func.count())
                .select_from(RolePermission)
                .where(RolePermission.role_id == role_id)
            )
        ).scalar()
    assert orphans == 0, "删除角色后仍残留 role_permissions 行"


async def test_role_delete_hands_users_to_default_role(client, admin_headers) -> None:
    """删除角色前必须把其下用户转交到默认角色。

    否则 users.role_id 会指向一个已删除的角色，用户既登不进去也改不了角色。
    """
    created = await client.post(
        "/api/roles",
        headers=admin_headers,
        json={"name": _unique("角色"), "permissions": ["dashboard"]},
    )
    role_id = created.json()["data"]["id"]

    users = (await client.get("/api/users?pageSize=100", headers=admin_headers)).json()["data"][
        "list"
    ]
    # 不能动自己（admin 无法修改自己的角色），挑一个普通用户
    victim = next(u for u in users if u["username"] == "zhangsan")
    moved = await client.put(
        f"/api/users/{victim['id']}", headers=admin_headers, json={"roleId": role_id}
    )
    assert moved.json()["code"] == 0, moved.json()
    assert moved.json()["data"]["roleId"] == role_id

    deleted = await client.delete(f"/api/roles/{role_id}", headers=admin_headers)
    assert deleted.json()["code"] == 0, deleted.json()

    after = (await client.get("/api/users?pageSize=100", headers=admin_headers)).json()["data"][
        "list"
    ]
    handed_over = next(u for u in after if u["id"] == victim["id"])
    assert handed_over["roleId"] == "user", "删除角色后用户应转交到默认角色"


async def test_permission_shape(client, admin_headers) -> None:
    response = await client.get("/api/permissions", headers=admin_headers)
    data = response.json()["data"]
    assert isinstance(data, list) and data
    assert set(data[0]) == {"code", "name", "type", "parent"}


async def test_permissions_match_catalog(client, admin_headers) -> None:
    """数据库里的权限必须与目录完全一致。

    权限的唯一来源是 ``app/catalogs/permissions.py``；启动同步据此补齐。
    这条断言保证「目录改了但没生效」或「数据库残留了已删除的权限」都会暴露。
    """
    from app.catalogs.permissions import ALL_PERMISSIONS

    response = await client.get("/api/permissions", headers=admin_headers)
    actual = {(item["code"], item["name"], item["type"]) for item in response.json()["data"]}
    expected = {(item["code"], item["name"], item["type"]) for item in ALL_PERMISSIONS}
    assert actual == expected, (
        f"数据库多出: {sorted(actual - expected)}\n"
        f"数据库缺失: {sorted(expected - actual)}"
    )


async def test_admin_holds_every_catalog_permission(client, admin_headers) -> None:
    """admin 角色必须拥有目录里的全部权限。"""
    from app.catalogs.permissions import ALL_PERMISSIONS

    response = await client.get("/api/roles?pageSize=100", headers=admin_headers)
    roles = {role["id"]: role for role in response.json()["data"]["list"]}
    assert set(roles["admin"]["permissions"]) == {item["code"] for item in ALL_PERMISSIONS}


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


async def test_import_twice_in_a_row(client, admin_headers) -> None:
    """连续导入两次都必须成功。

    ``start_import`` 曾写成 ``temp_dir.mkdir(True, True)``：``Path.mkdir`` 的
    第二个位置参数是 ``mode`` 而不是 ``exist_ok``，于是 ``mode`` 变成 1、
    ``exist_ok`` 仍为 False，第二次导入直接抛 ``FileExistsError`` 变成 500。
    只有同一进程内导入过第二次才会暴露，所以这里必须跑两轮。
    """
    import asyncio
    import io
    import zipfile

    export = await client.post("/api/data/export", headers=admin_headers)
    assert export.status_code == 200
    password = export.headers["X-Export-Password"]
    archive = export.content

    # 先确认导出的 ZIP 结构是契约要求的那几项
    names = zipfile.ZipFile(io.BytesIO(archive)).namelist()
    for required in ("manifest.json", "schema.sql", "checksums.sha256"):
        assert required in names, f"导出包缺少 {required}"

    for attempt in (1, 2):
        created = await client.post(
            "/api/data/import",
            headers=admin_headers,
            data={"password": password},
            files={"file": ("backup.zip", archive, "application/zip")},
        )
        assert created.status_code == 202, f"第 {attempt} 次导入未被接受: {created.text}"
        payload = created.json()
        assert payload["code"] == 0, payload
        job = payload["data"]

        status = None
        for _ in range(60):
            polled = await client.get(
                f"/api/data/import/{job['jobId']}",
                headers={"X-Import-Job-Token": job["jobToken"]},
            )
            status = polled.json()["data"]["status"]
            if status in ("success", "failed"):
                break
            await asyncio.sleep(0.1)
        assert status == "success", f"第 {attempt} 次导入失败: {status}"

        # 导入成功后所有既有令牌失效，重新登录再继续第二轮
        stale = await client.get("/api/users", headers=admin_headers)
        assert stale.status_code == 401
        relogin = await client.post(
            "/api/auth/login", json={"account": "admin", "password": "123456"}
        )
        assert relogin.json()["code"] == 0
        admin_headers["Authorization"] = f"Bearer {relogin.json()['data']['token']}"
