"""AI 模型与预设的业务逻辑。

包含连接测试（对外 HTTP 调用）与默认预设的初始化。所有 ``apiUrl``
在进入这里之前已由 schema 完成 SSRF 校验。
"""

import time

import httpx
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_model.models import AiModel, AiModelPreset
from app.ai_model.schemas import (
    AiModelCreate,
    AiModelOut,
    AiModelPresetCreate,
    AiModelPresetOut,
    AiModelPresetUpdate,
    AiModelPublicOut,
    AiModelTestRequest,
    AiModelTestResult,
    AiModelUpdate,
    assert_not_private_host,
)
from app.core.exceptions import ConflictError, NotFoundError

TEST_TIMEOUT_SECONDS = 30.0


# ============================================================
# AI Model
# ============================================================


async def list_models(
    db: AsyncSession, search: str, page: int, page_size: int
) -> tuple[list[AiModelOut], int]:
    query = select(AiModel)
    if search:
        query = query.where(
            or_(
                AiModel.alias.ilike(f"%{search}%"),
                AiModel.model_name.ilike(f"%{search}%"),
            )
        )
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.order_by(AiModel.id).offset((page - 1) * page_size).limit(page_size)
    items = list((await db.execute(query)).scalars().all())
    return [AiModelOut.from_orm_model(item) for item in items], total


async def get_model(db: AsyncSession, model_id: int) -> AiModel:
    model = (
        await db.execute(select(AiModel).where(AiModel.id == model_id))
    ).scalar_one_or_none()
    if model is None:
        raise NotFoundError("模型不存在")
    return model


async def get_model_by_alias(db: AsyncSession, alias: str) -> AiModel:
    model = (
        await db.execute(select(AiModel).where(AiModel.alias == alias))
    ).scalar_one_or_none()
    if model is None:
        raise NotFoundError("模型不存在")
    return model


async def get_default_model(db: AsyncSession) -> AiModel:
    model = (await db.execute(select(AiModel).where(AiModel.is_default))).scalar_one_or_none()
    if model is None:
        raise NotFoundError("未配置默认模型")
    return model


async def _unset_defaults(db: AsyncSession) -> None:
    for model in (await db.execute(select(AiModel).where(AiModel.is_default))).scalars().all():
        model.is_default = False
    await db.flush()


async def create_model(db: AsyncSession, data: AiModelCreate) -> AiModelOut:
    if await db.execute(select(AiModel).where(AiModel.alias == data.alias)):
        existing = (
            await db.execute(select(AiModel).where(AiModel.alias == data.alias))
        ).scalar_one_or_none()
        if existing is not None:
            raise ConflictError("别名已存在")

    if data.isDefault:
        await _unset_defaults(db)

    model = AiModel(
        alias=data.alias,
        model_name=data.modelName,
        api_url=data.apiUrl,
        api_key=data.apiKey,
        description=data.description,
        is_default=data.isDefault,
    )
    db.add(model)
    await db.flush()
    return AiModelOut.from_orm_model(model)


async def update_model(db: AsyncSession, model_id: int, data: AiModelUpdate) -> AiModelOut:
    model = await get_model(db, model_id)

    if data.alias and data.alias != model.alias:
        duplicate = (
            await db.execute(select(AiModel).where(AiModel.alias == data.alias))
        ).scalar_one_or_none()
        if duplicate is not None:
            raise ConflictError("别名已存在")

    if data.isDefault:
        await _unset_defaults(db)

    if data.alias is not None:
        model.alias = data.alias
    if data.modelName is not None:
        model.model_name = data.modelName
    if data.apiUrl is not None:
        model.api_url = data.apiUrl
    # 脱敏掩码（如 "****"）不允许写回，避免覆盖真实 API Key
    if data.apiKey is not None and data.apiKey.strip() and "*" not in data.apiKey:
        model.api_key = data.apiKey
    if data.description is not None:
        model.description = data.description
    if data.isDefault is not None:
        model.is_default = data.isDefault

    await db.flush()
    return AiModelOut.from_orm_model(model)


async def delete_model(db: AsyncSession, model_id: int) -> None:
    model = await get_model(db, model_id)
    await db.delete(model)
    await db.flush()


async def test_model(db: AsyncSession, data: AiModelTestRequest) -> AiModelTestResult:
    """测试模型连通性。已保存模型使用库中的真实密钥，未保存的用请求体。"""
    start = time.time()

    if data.modelId is not None:
        model = await get_model(db, data.modelId)
        api_url, api_key, model_name = model.api_url, model.api_key, model.model_name
    else:
        if not data.apiUrl or not data.apiKey or not data.modelName:
            raise NotFoundError("API地址、API Key 和模型名称不能为空")
        api_url, api_key, model_name = data.apiUrl, data.apiKey, data.modelName

    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": "Hi, please reply with one word: OK"}],
        "max_tokens": 10,
        "temperature": 0,
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    def result(success: bool, message: str, model: str | None = None) -> AiModelTestResult:
        elapsed = round((time.time() - start) * 1000, 2)
        return AiModelTestResult(
            success=success, message=message, responseTime=elapsed, model=model
        )

    try:
        assert_not_private_host(api_url)
        async with httpx.AsyncClient(timeout=TEST_TIMEOUT_SECONDS) as client:
            response = await client.post(api_url, json=payload, headers=headers)

        if response.status_code == 200:
            returned = response.json().get("model", model_name)
            elapsed = round((time.time() - start) * 1000, 2)
            return AiModelTestResult(
                success=True,
                message=f"连接成功，响应时间: {elapsed}ms",
                responseTime=elapsed,
                model=returned,
            )
        if response.status_code == 401:
            return result(False, "API Key 无效或已过期")
        if response.status_code == 404:
            return result(False, "API 地址错误或模型不存在")
        detail = response.text[:200] if response.text else "未知错误"
        return result(False, f"请求失败 (HTTP {response.status_code}): {detail}")
    except httpx.TimeoutException:
        return result(False, "连接超时，请检查API地址是否正确")
    except httpx.ConnectError:
        return result(False, "无法连接到服务器，请检查API地址")
    except Exception as exc:
        return result(False, f"测试失败: {exc}")


def public_out(model: AiModel) -> AiModelPublicOut:
    """不含 API Key 的输出，用于按别名/默认模型查询。"""
    return AiModelPublicOut.from_orm_model(model)


# ============================================================
# AI Model Preset
# ============================================================


async def list_presets(
    db: AsyncSession, search: str = "", group: str = "", is_active: bool | None = None
) -> list[AiModelPresetOut]:
    query = select(AiModelPreset)
    if search:
        query = query.where(
            or_(
                AiModelPreset.alias.ilike(f"%{search}%"),
                AiModelPreset.model_name.ilike(f"%{search}%"),
            )
        )
    if group:
        query = query.where(AiModelPreset.group == group)
    if is_active is not None:
        query = query.where(AiModelPreset.is_active == is_active)
    query = query.order_by(AiModelPreset.sort_order, AiModelPreset.id)
    items = (await db.execute(query)).scalars().all()
    return [AiModelPresetOut.from_orm_model(item) for item in items]


async def list_preset_groups(db: AsyncSession) -> list[str]:
    rows = await db.execute(select(AiModelPreset.group).distinct().order_by(AiModelPreset.group))
    return [row[0] for row in rows.all()]


async def get_preset(db: AsyncSession, preset_id: int) -> AiModelPreset:
    preset = (
        await db.execute(select(AiModelPreset).where(AiModelPreset.id == preset_id))
    ).scalar_one_or_none()
    if preset is None:
        raise NotFoundError("预设模型不存在")
    return preset


async def create_preset(db: AsyncSession, data: AiModelPresetCreate) -> AiModelPresetOut:
    duplicate = (
        await db.execute(select(AiModelPreset).where(AiModelPreset.alias == data.alias))
    ).scalar_one_or_none()
    if duplicate is not None:
        raise ConflictError("预设模型别名已存在")

    preset = AiModelPreset(
        group=data.group,
        alias=data.alias,
        model_name=data.modelName,
        api_url=data.apiUrl,
        description=data.description,
        is_active=data.isActive,
        sort_order=data.sortOrder,
    )
    db.add(preset)
    await db.flush()
    return AiModelPresetOut.from_orm_model(preset)


async def update_preset(
    db: AsyncSession, preset_id: int, data: AiModelPresetUpdate
) -> AiModelPresetOut:
    preset = await get_preset(db, preset_id)

    if data.alias and data.alias != preset.alias:
        duplicate = (
            await db.execute(select(AiModelPreset).where(AiModelPreset.alias == data.alias))
        ).scalar_one_or_none()
        if duplicate is not None:
            raise ConflictError("预设模型别名已存在")

    if data.group is not None:
        preset.group = data.group
    if data.alias is not None:
        preset.alias = data.alias
    if data.modelName is not None:
        preset.model_name = data.modelName
    if data.apiUrl is not None:
        preset.api_url = data.apiUrl
    if data.description is not None:
        preset.description = data.description
    if data.isActive is not None:
        preset.is_active = data.isActive
    if data.sortOrder is not None:
        preset.sort_order = data.sortOrder

    await db.flush()
    return AiModelPresetOut.from_orm_model(preset)


async def delete_preset(db: AsyncSession, preset_id: int) -> None:
    preset = await get_preset(db, preset_id)
    await db.delete(preset)
    await db.flush()


DEFAULT_PRESETS = [
    {
        "group": "DeepSeek",
        "alias": "deepseek-v4-flash",
        "model_name": "deepseek-v4-flash",
        "api_url": "https://api.deepseek.com/v1/chat/completions",
        "description": "DeepSeek-V4-Flash 通用对话模型，性价比高",
        "sort_order": 1,
    },
    {
        "group": "DeepSeek",
        "alias": "deepseek-v4-pro",
        "model_name": "deepseek-v4-pro",
        "api_url": "https://api.deepseek.com/v1/chat/completions",
        "description": "DeepSeek-V4-Pro 最强推理模型",
        "sort_order": 2,
    },
    {
        "group": "小米 MiMo",
        "alias": "mimo-v2.5",
        "model_name": "mimo-v2.5",
        "api_url": "https://api.xiaomi.com/v1/chat/completions",
        "description": "小米 MiMo-V2.5 全模态模型，支持 1M 超长上下文",
        "sort_order": 1,
    },
]


async def init_default_presets(db: AsyncSession) -> None:
    """预设表为空时写入默认预设。"""
    if (await db.execute(select(AiModelPreset).limit(1))).scalar_one_or_none() is not None:
        return
    for preset in DEFAULT_PRESETS:
        db.add(AiModelPreset(**preset))
    await db.flush()
