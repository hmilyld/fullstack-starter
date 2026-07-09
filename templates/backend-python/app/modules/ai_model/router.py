import time

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import User
from app.core.schemas import ApiResponse, PaginatedData
from app.database import get_db
from app.deps import require_permission
from app.modules.ai_model import crud
from app.modules.ai_model.schemas import (
    AiModelCreate,
    AiModelOut,
    AiModelPresetCreate,
    AiModelPresetOut,
    AiModelPresetUpdate,
    AiModelPublicOut,
    AiModelTestRequest,
    AiModelTestResult,
    AiModelUpdate,
)

router = APIRouter(prefix="/ai-models", tags=["AI模型配置"])


# ============================================================
# AI Model Preset Routes (固定路径必须在参数路径之前)
# ============================================================


@router.get("/presets")
async def get_ai_model_presets(
    search: str = "",
    group: str = "",
    current_user: User = Depends(require_permission("ai_models")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    items = await crud.get_ai_model_presets(db, search, group)
    return ApiResponse(
        data=[AiModelPresetOut.from_orm_model(item).model_dump() for item in items]
    )


@router.get("/presets/groups")
async def get_ai_model_preset_groups(
    current_user: User = Depends(require_permission("ai_models")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    groups = await crud.get_ai_model_preset_groups(db)
    return ApiResponse(data=groups)


@router.get("/presets/active")
async def get_active_ai_model_presets(
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    """获取所有启用的预设模型（无需认证，供新增模型时选择）"""
    items = await crud.get_ai_model_presets(db, is_active=True)
    return ApiResponse(
        data=[AiModelPresetOut.from_orm_model(item).model_dump() for item in items]
    )


@router.post("/presets")
async def create_ai_model_preset(
    data: AiModelPresetCreate,
    current_user: User = Depends(require_permission("ai_models.create", "ai_models.presets.create")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    existing = await crud.get_ai_model_preset_by_alias(db, data.alias)
    if existing:
        return ApiResponse(code=-1, message="预设模型别名已存在")
    preset = await crud.create_ai_model_preset(
        db,
        group=data.group,
        alias=data.alias,
        model_name=data.modelName,
        api_url=data.apiUrl,
        description=data.description,
        is_active=data.isActive,
        sort_order=data.sortOrder,
    )
    return ApiResponse(data=AiModelPresetOut.from_orm_model(preset).model_dump())


@router.get("/presets/{preset_id}")
async def get_ai_model_preset(
    preset_id: int,
    current_user: User = Depends(require_permission("ai_models")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    preset = await crud.get_ai_model_preset_by_id(db, preset_id)
    if not preset:
        return ApiResponse(code=-1, message="预设模型不存在")
    return ApiResponse(data=AiModelPresetOut.from_orm_model(preset).model_dump())


@router.put("/presets/{preset_id}")
async def update_ai_model_preset(
    preset_id: int,
    data: AiModelPresetUpdate,
    current_user: User = Depends(require_permission("ai_models.edit", "ai_models.presets.edit")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    preset = await crud.get_ai_model_preset_by_id(db, preset_id)
    if not preset:
        return ApiResponse(code=-1, message="预设模型不存在")
    if data.alias:
        existing = await crud.get_ai_model_preset_by_alias(db, data.alias)
        if existing and existing.id != preset_id:
            return ApiResponse(code=-1, message="预设模型别名已存在")
    update_kwargs = {}
    if data.group is not None:
        update_kwargs["group"] = data.group
    if data.alias is not None:
        update_kwargs["alias"] = data.alias
    if data.modelName is not None:
        update_kwargs["model_name"] = data.modelName
    if data.apiUrl is not None:
        update_kwargs["api_url"] = data.apiUrl
    if data.description is not None:
        update_kwargs["description"] = data.description
    if data.isActive is not None:
        update_kwargs["is_active"] = data.isActive
    if data.sortOrder is not None:
        update_kwargs["sort_order"] = data.sortOrder
    preset = await crud.update_ai_model_preset(db, preset, **update_kwargs)
    return ApiResponse(data=AiModelPresetOut.from_orm_model(preset).model_dump())


@router.delete("/presets/{preset_id}")
async def delete_ai_model_preset(
    preset_id: int,
    current_user: User = Depends(require_permission("ai_models.delete", "ai_models.presets.delete")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    preset = await crud.get_ai_model_preset_by_id(db, preset_id)
    if not preset:
        return ApiResponse(code=-1, message="预设模型不存在")
    await crud.delete_ai_model_preset(db, preset)
    return ApiResponse()


# ============================================================
# AI Model Routes
# ============================================================


@router.get("")
async def get_ai_models(
    search: str = "",
    page: int = 1,
    pageSize: int = 10,
    current_user: User = Depends(require_permission("ai_models")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    items, total = await crud.get_ai_models(db, search, page, pageSize)
    return ApiResponse(
        data=PaginatedData(
            list=[AiModelOut.from_orm_model(item).model_dump() for item in items],
            total=total,
            page=page,
            pageSize=pageSize,
        ).model_dump()
    )


@router.get("/default")
async def get_default_model(
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    """获取默认模型（无需认证，供其他模块调用，不返回 API Key）"""
    model = await crud.get_default_model(db)
    if not model:
        return ApiResponse(code=-1, message="未配置默认模型")
    return ApiResponse(data=AiModelPublicOut.from_orm_model(model).model_dump())


@router.get("/by-alias/{alias}")
async def get_model_by_alias(
    alias: str,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    """通过别名获取模型（无需认证，供其他模块调用，不返回 API Key）"""
    model = await crud.get_ai_model_by_alias(db, alias)
    if not model:
        return ApiResponse(code=-1, message="模型不存在")
    return ApiResponse(data=AiModelPublicOut.from_orm_model(model).model_dump())


@router.post("")
async def create_ai_model(
    data: AiModelCreate,
    current_user: User = Depends(require_permission("ai_models.create")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    existing = await crud.get_ai_model_by_alias(db, data.alias)
    if existing:
        return ApiResponse(code=-1, message="别名已存在")
    model = await crud.create_ai_model(
        db,
        alias=data.alias,
        model_name=data.modelName,
        api_url=data.apiUrl,
        api_key=data.apiKey,
        description=data.description,
        is_default=data.isDefault,
    )
    return ApiResponse(data=AiModelOut.from_orm_model(model).model_dump())


@router.post("/test")
async def test_ai_model(
    data: AiModelTestRequest,
    current_user: User = Depends(require_permission("ai_models")),
) -> ApiResponse:
    """测试AI模型配置是否可以联通"""
    start_time = time.time()

    test_payload = {
        "model": data.modelName,
        "messages": [
            {"role": "user", "content": "Hi, please reply with one word: OK"}
        ],
        "max_tokens": 10,
        "temperature": 0,
    }

    headers = {
        "Authorization": f"Bearer {data.apiKey}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                data.apiUrl,
                json=test_payload,
                headers=headers,
            )
            response_time = round((time.time() - start_time) * 1000, 2)

            if response.status_code == 200:
                result = response.json()
                model_name = result.get("model", data.modelName)
                return ApiResponse(
                    data=AiModelTestResult(
                        success=True,
                        message=f"连接成功，响应时间: {response_time}ms",
                        responseTime=response_time,
                        model=model_name,
                    ).model_dump()
                )
            elif response.status_code == 401:
                return ApiResponse(
                    data=AiModelTestResult(
                        success=False,
                        message="API Key 无效或已过期",
                        responseTime=response_time,
                    ).model_dump()
                )
            elif response.status_code == 404:
                return ApiResponse(
                    data=AiModelTestResult(
                        success=False,
                        message="API 地址错误或模型不存在",
                        responseTime=response_time,
                    ).model_dump()
                )
            else:
                error_msg = response.text[:200] if response.text else "未知错误"
                return ApiResponse(
                    data=AiModelTestResult(
                        success=False,
                        message=f"请求失败 (HTTP {response.status_code}): {error_msg}",
                        responseTime=response_time,
                    ).model_dump()
                )

    except httpx.TimeoutException:
        response_time = round((time.time() - start_time) * 1000, 2)
        return ApiResponse(
            data=AiModelTestResult(
                success=False,
                message=f"连接超时 ({response_time}ms)，请检查API地址是否正确",
                responseTime=response_time,
            ).model_dump()
        )
    except httpx.ConnectError:
        response_time = round((time.time() - start_time) * 1000, 2)
        return ApiResponse(
            data=AiModelTestResult(
                success=False,
                message="无法连接到服务器，请检查API地址",
                responseTime=response_time,
            ).model_dump()
        )
    except Exception as e:
        response_time = round((time.time() - start_time) * 1000, 2)
        return ApiResponse(
            data=AiModelTestResult(
                success=False,
                message=f"测试失败: {str(e)}",
                responseTime=response_time,
            ).model_dump()
        )


@router.get("/{model_id}")
async def get_ai_model(
    model_id: int,
    current_user: User = Depends(require_permission("ai_models")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    model = await crud.get_ai_model_by_id(db, model_id)
    if not model:
        return ApiResponse(code=-1, message="模型不存在")
    return ApiResponse(data=AiModelOut.from_orm_model(model).model_dump())


@router.put("/{model_id}")
async def update_ai_model(
    model_id: int,
    data: AiModelUpdate,
    current_user: User = Depends(require_permission("ai_models.edit")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    model = await crud.get_ai_model_by_id(db, model_id)
    if not model:
        return ApiResponse(code=-1, message="模型不存在")
    if data.alias:
        existing = await crud.get_ai_model_by_alias(db, data.alias)
        if existing and existing.id != model_id:
            return ApiResponse(code=-1, message="别名已存在")
    update_kwargs = {}
    if data.alias is not None:
        update_kwargs["alias"] = data.alias
    if data.modelName is not None:
        update_kwargs["model_name"] = data.modelName
    if data.apiUrl is not None:
        update_kwargs["api_url"] = data.apiUrl
    if data.apiKey is not None:
        update_kwargs["api_key"] = data.apiKey
    if data.description is not None:
        update_kwargs["description"] = data.description
    if data.isDefault is not None:
        update_kwargs["is_default"] = data.isDefault
    model = await crud.update_ai_model(db, model, **update_kwargs)
    return ApiResponse(data=AiModelOut.from_orm_model(model).model_dump())


@router.delete("/{model_id}")
async def delete_ai_model(
    model_id: int,
    current_user: User = Depends(require_permission("ai_models.delete")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    model = await crud.get_ai_model_by_id(db, model_id)
    if not model:
        return ApiResponse(code=-1, message="模型不存在")
    await crud.delete_ai_model(db, model)
    return ApiResponse()
