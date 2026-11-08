from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_model import service
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
)
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission
from app.core.pagination import Pagination, pagination_params
from app.core.schemas import ApiResponse, PaginatedData
from app.user.models import User

router = APIRouter(prefix="/ai-models", tags=["AI模型配置"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
PaginationDep = Annotated[Pagination, Depends(pagination_params)]


# ============================================================
# 预设路由（固定路径必须在参数路径之前）
# ============================================================


@router.get("/presets")
async def get_ai_model_presets(
    current_user: Annotated[User, Depends(require_permission("ai_models"))],
    db: DbSession,
    search: str = "",
    group: str = "",
) -> ApiResponse[list[AiModelPresetOut]]:
    return ApiResponse(data=await service.list_presets(db, search, group))


@router.get("/presets/groups")
async def get_ai_model_preset_groups(
    current_user: Annotated[User, Depends(require_permission("ai_models"))],
    db: DbSession,
) -> ApiResponse[list[str]]:
    return ApiResponse(data=await service.list_preset_groups(db))


@router.get("/presets/active")
async def get_active_ai_model_presets(
    current_user: Annotated[User, Depends(get_current_user)],
    db: DbSession,
) -> ApiResponse[list[AiModelPresetOut]]:
    return ApiResponse(data=await service.list_presets(db, is_active=True))


@router.post("/presets")
async def create_ai_model_preset(
    data: AiModelPresetCreate,
    current_user: Annotated[
        User, Depends(require_permission("ai_models.create", "ai_models.presets.create"))
    ],
    db: DbSession,
) -> ApiResponse[AiModelPresetOut]:
    return ApiResponse(data=await service.create_preset(db, data))


@router.get("/presets/{preset_id}")
async def get_ai_model_preset(
    preset_id: int,
    current_user: Annotated[User, Depends(require_permission("ai_models"))],
    db: DbSession,
) -> ApiResponse[AiModelPresetOut]:
    preset = await service.get_preset(db, preset_id)
    return ApiResponse(data=AiModelPresetOut.from_orm_model(preset))


@router.put("/presets/{preset_id}")
async def update_ai_model_preset(
    preset_id: int,
    data: AiModelPresetUpdate,
    current_user: Annotated[
        User, Depends(require_permission("ai_models.edit", "ai_models.presets.edit"))
    ],
    db: DbSession,
) -> ApiResponse[AiModelPresetOut]:
    return ApiResponse(data=await service.update_preset(db, preset_id, data))


@router.delete("/presets/{preset_id}")
async def delete_ai_model_preset(
    preset_id: int,
    current_user: Annotated[
        User, Depends(require_permission("ai_models.delete", "ai_models.presets.delete"))
    ],
    db: DbSession,
) -> ApiResponse[None]:
    await service.delete_preset(db, preset_id)
    return ApiResponse()


# ============================================================
# 模型路由
# ============================================================


@router.get("")
async def get_ai_models(
    current_user: Annotated[User, Depends(require_permission("ai_models"))],
    db: DbSession,
    pagination: PaginationDep,
    search: str = "",
) -> ApiResponse[PaginatedData[AiModelOut]]:
    items, total = await service.list_models(db, search, pagination)
    return ApiResponse(
        data=PaginatedData[AiModelOut](
            list=items, total=total, page=pagination.page, pageSize=pagination.page_size
        )
    )


@router.get("/default")
async def get_default_model(
    current_user: Annotated[User, Depends(get_current_user)],
    db: DbSession,
) -> ApiResponse[AiModelPublicOut]:
    model = await service.get_default_model(db)
    return ApiResponse(data=service.public_out(model))


@router.get("/by-alias/{alias}")
async def get_model_by_alias(
    alias: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: DbSession,
) -> ApiResponse[AiModelPublicOut]:
    model = await service.get_model_by_alias(db, alias)
    return ApiResponse(data=service.public_out(model))


@router.post("")
async def create_ai_model(
    data: AiModelCreate,
    current_user: Annotated[User, Depends(require_permission("ai_models.create"))],
    db: DbSession,
) -> ApiResponse[AiModelOut]:
    return ApiResponse(data=await service.create_model(db, data))


@router.post("/test")
async def test_ai_model(
    data: AiModelTestRequest,
    current_user: Annotated[User, Depends(require_permission("ai_models"))],
    db: DbSession,
) -> ApiResponse[AiModelTestResult]:
    return ApiResponse(data=await service.test_model(db, data))


@router.get("/{model_id}")
async def get_ai_model(
    model_id: int,
    current_user: Annotated[User, Depends(require_permission("ai_models"))],
    db: DbSession,
) -> ApiResponse[AiModelOut]:
    model = await service.get_model(db, model_id)
    return ApiResponse(data=AiModelOut.from_orm_model(model))


@router.put("/{model_id}")
async def update_ai_model(
    model_id: int,
    data: AiModelUpdate,
    current_user: Annotated[User, Depends(require_permission("ai_models.edit"))],
    db: DbSession,
) -> ApiResponse[AiModelOut]:
    return ApiResponse(data=await service.update_model(db, model_id, data))


@router.delete("/{model_id}")
async def delete_ai_model(
    model_id: int,
    current_user: Annotated[User, Depends(require_permission("ai_models.delete"))],
    db: DbSession,
) -> ApiResponse[None]:
    await service.delete_model(db, model_id)
    return ApiResponse()
