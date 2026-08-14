from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai_model.models import AiModel, AiModelPreset


async def get_ai_models(
    db: AsyncSession,
    search: str = "",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[AiModel], int]:
    query = select(AiModel)
    if search:
        query = query.where(
            or_(
                AiModel.alias.ilike(f"%{search}%"),
                AiModel.model_name.ilike(f"%{search}%"),
            )
        )

    # 计数
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    # 分页
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return items, total


async def get_ai_model_by_id(db: AsyncSession, model_id: int) -> AiModel | None:
    result = await db.execute(select(AiModel).where(AiModel.id == model_id))
    return result.scalar_one_or_none()


async def get_ai_model_by_alias(db: AsyncSession, alias: str) -> AiModel | None:
    result = await db.execute(select(AiModel).where(AiModel.alias == alias))
    return result.scalar_one_or_none()


async def create_ai_model(db: AsyncSession, **kwargs) -> AiModel:
    # 如果设置为默认，先取消其他默认
    if kwargs.get("is_default"):
        await unset_default_models(db)
    model = AiModel(**kwargs)
    db.add(model)
    await db.flush()
    return model


async def update_ai_model(db: AsyncSession, model: AiModel, **kwargs) -> AiModel:
    # 如果设置为默认，先取消其他默认
    if kwargs.get("is_default"):
        await unset_default_models(db)
    for key, value in kwargs.items():
        if value is not None:
            setattr(model, key, value)
    await db.flush()
    return model


async def delete_ai_model(db: AsyncSession, model: AiModel) -> None:
    await db.delete(model)
    await db.flush()


async def unset_default_models(db: AsyncSession) -> None:
    """取消所有默认模型"""
    result = await db.execute(select(AiModel).where(AiModel.is_default))
    for model in result.scalars().all():
        model.is_default = False
    await db.flush()


async def get_default_model(db: AsyncSession) -> AiModel | None:
    """获取默认模型"""
    result = await db.execute(select(AiModel).where(AiModel.is_default))
    return result.scalar_one_or_none()


# ============================================================
# AI Model Preset CRUD
# ============================================================


async def get_ai_model_presets(
    db: AsyncSession,
    search: str = "",
    group: str = "",
    is_active: bool | None = None,
) -> list[AiModelPreset]:
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
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_ai_model_preset_by_id(db: AsyncSession, preset_id: int) -> AiModelPreset | None:
    result = await db.execute(select(AiModelPreset).where(AiModelPreset.id == preset_id))
    return result.scalar_one_or_none()


async def get_ai_model_preset_by_alias(db: AsyncSession, alias: str) -> AiModelPreset | None:
    result = await db.execute(select(AiModelPreset).where(AiModelPreset.alias == alias))
    return result.scalar_one_or_none()


async def create_ai_model_preset(db: AsyncSession, **kwargs) -> AiModelPreset:
    preset = AiModelPreset(**kwargs)
    db.add(preset)
    await db.flush()
    return preset


async def update_ai_model_preset(db: AsyncSession, preset: AiModelPreset, **kwargs) -> AiModelPreset:
    for key, value in kwargs.items():
        if value is not None:
            setattr(preset, key, value)
    await db.flush()
    return preset


async def delete_ai_model_preset(db: AsyncSession, preset: AiModelPreset) -> None:
    await db.delete(preset)
    await db.flush()


async def get_ai_model_preset_groups(db: AsyncSession) -> list[str]:
    """获取所有预设模型分组"""
    result = await db.execute(
        select(AiModelPreset.group).distinct().order_by(AiModelPreset.group)
    )
    return [row[0] for row in result.all()]


async def init_default_presets(db: AsyncSession) -> None:
    """初始化默认预设模型（如果表为空）"""
    from app.modules.ai_model.models import AiModelPreset

    result = await db.execute(select(AiModelPreset).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    default_presets = [
        # DeepSeek
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
        # 小米 MiMo
        {
            "group": "小米 MiMo",
            "alias": "mimo-v2.5",
            "model_name": "mimo-v2.5",
            "api_url": "https://api.xiaomi.com/v1/chat/completions",
            "description": "小米 MiMo-V2.5 全模态模型，支持 1M 超长上下文",
            "sort_order": 1,
        },
    ]

    for preset_data in default_presets:
        preset = AiModelPreset(**preset_data)
        db.add(preset)
    await db.flush()
