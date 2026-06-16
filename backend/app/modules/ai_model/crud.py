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
            "alias": "deepseek-chat",
            "model_name": "deepseek-chat",
            "api_url": "https://api.deepseek.com/v1/chat/completions",
            "description": "DeepSeek 通用对话模型，性价比高",
            "sort_order": 1,
        },
        {
            "group": "DeepSeek",
            "alias": "deepseek-coder",
            "model_name": "deepseek-coder",
            "api_url": "https://api.deepseek.com/v1/chat/completions",
            "description": "DeepSeek 代码专用模型",
            "sort_order": 2,
        },
        {
            "group": "DeepSeek",
            "alias": "deepseek-reasoner",
            "model_name": "deepseek-reasoner",
            "api_url": "https://api.deepseek.com/v1/chat/completions",
            "description": "DeepSeek 推理模型 (R1)",
            "sort_order": 3,
        },
        # 小米 MiMo
        {
            "group": "小米 MiMo",
            "alias": "mimo",
            "model_name": "MiMo-7B-RL",
            "api_url": "https://api.xiaomi.com/v1/chat/completions",
            "description": "小米 MiMo 7B 推理模型",
            "sort_order": 1,
        },
        # OpenAI
        {
            "group": "OpenAI",
            "alias": "gpt-4o",
            "model_name": "gpt-4o",
            "api_url": "https://api.openai.com/v1/chat/completions",
            "description": "OpenAI GPT-4o 多模态模型",
            "sort_order": 1,
        },
        {
            "group": "OpenAI",
            "alias": "gpt-4o-mini",
            "model_name": "gpt-4o-mini",
            "api_url": "https://api.openai.com/v1/chat/completions",
            "description": "OpenAI GPT-4o 轻量版，更快更便宜",
            "sort_order": 2,
        },
        {
            "group": "OpenAI",
            "alias": "gpt-4-turbo",
            "model_name": "gpt-4-turbo",
            "api_url": "https://api.openai.com/v1/chat/completions",
            "description": "OpenAI GPT-4 Turbo",
            "sort_order": 3,
        },
        {
            "group": "OpenAI",
            "alias": "gpt-3.5-turbo",
            "model_name": "gpt-3.5-turbo",
            "api_url": "https://api.openai.com/v1/chat/completions",
            "description": "OpenAI GPT-3.5 Turbo，经济实惠",
            "sort_order": 4,
        },
        # Claude
        {
            "group": "Claude",
            "alias": "claude-3-5-sonnet",
            "model_name": "claude-3-5-sonnet-20241022",
            "api_url": "https://api.anthropic.com/v1/messages",
            "description": "Claude 3.5 Sonnet，性能与成本的最佳平衡",
            "sort_order": 1,
        },
        {
            "group": "Claude",
            "alias": "claude-3-opus",
            "model_name": "claude-3-opus-20240229",
            "api_url": "https://api.anthropic.com/v1/messages",
            "description": "Claude 3 Opus，最强推理能力",
            "sort_order": 2,
        },
        {
            "group": "Claude",
            "alias": "claude-3-haiku",
            "model_name": "claude-3-haiku-20240307",
            "api_url": "https://api.anthropic.com/v1/messages",
            "description": "Claude 3 Haiku，最快响应速度",
            "sort_order": 3,
        },
        # 通义千问
        {
            "group": "通义千问",
            "alias": "qwen-turbo",
            "model_name": "qwen-turbo",
            "api_url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
            "description": "通义千问 Turbo，快速响应",
            "sort_order": 1,
        },
        {
            "group": "通义千问",
            "alias": "qwen-plus",
            "model_name": "qwen-plus",
            "api_url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
            "description": "通义千问 Plus，均衡性能",
            "sort_order": 2,
        },
        {
            "group": "通义千问",
            "alias": "qwen-max",
            "model_name": "qwen-max",
            "api_url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
            "description": "通义千问 Max，最强能力",
            "sort_order": 3,
        },
        # 智谱 GLM
        {
            "group": "智谱 GLM",
            "alias": "glm-4",
            "model_name": "glm-4",
            "api_url": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
            "description": "智谱 GLM-4，综合能力强",
            "sort_order": 1,
        },
        {
            "group": "智谱 GLM",
            "alias": "glm-4-flash",
            "model_name": "glm-4-flash",
            "api_url": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
            "description": "智谱 GLM-4 Flash，免费快速",
            "sort_order": 2,
        },
        # Moonshot
        {
            "group": "Moonshot",
            "alias": "moonshot-v1-8k",
            "model_name": "moonshot-v1-8k",
            "api_url": "https://api.moonshot.cn/v1/chat/completions",
            "description": "Moonshot V1 8K，支持长上下文",
            "sort_order": 1,
        },
        {
            "group": "Moonshot",
            "alias": "moonshot-v1-32k",
            "model_name": "moonshot-v1-32k",
            "api_url": "https://api.moonshot.cn/v1/chat/completions",
            "description": "Moonshot V1 32K，超长上下文",
            "sort_order": 2,
        },
        # 文心一言
        {
            "group": "文心一言",
            "alias": "ernie-4.0",
            "model_name": "ernie-4.0-8k",
            "api_url": "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions",
            "description": "百度文心一言 4.0",
            "sort_order": 1,
        },
        {
            "group": "文心一言",
            "alias": "ernie-speed",
            "model_name": "ernie-speed-128k",
            "api_url": "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions",
            "description": "百度文心一言 Speed，快速经济",
            "sort_order": 2,
        },
    ]

    for preset_data in default_presets:
        preset = AiModelPreset(**preset_data)
        db.add(preset)
    await db.flush()
