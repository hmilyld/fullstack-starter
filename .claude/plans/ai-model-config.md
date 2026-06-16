# AI 模型配置功能设计

## 需求分析

用户需要一个业务功能来配置系统使用的 AI 模型，支持：
1. 自定义多个模型配置
2. 每个模型配置包含：别名、模型地址、模型名称、API Key
3. 其他模块可以通过调用别名来使用该模型 API

## 数据库设计

### 新增表：`ai_models`

```sql
CREATE TABLE ai_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alias VARCHAR(100) NOT NULL UNIQUE,      -- 别名（用于其他模块调用）
    model_name VARCHAR(100) NOT NULL,        -- 模型名称（如 gpt-4, claude-3）
    api_url VARCHAR(255) NOT NULL,           -- 模型地址（API endpoint）
    api_key VARCHAR(255) NOT NULL,           -- API Key
    description TEXT DEFAULT '',             -- 描述
    is_default BOOLEAN DEFAULT FALSE,       -- 是否为默认模型
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明：**
- `alias`：唯一别名，用于其他模块调用，如 `gpt4`, `claude3`
- `model_name`：实际模型名称，如 `gpt-4`, `claude-3-opus`
- `api_url`：API 端点地址，如 `https://api.openai.com/v1/chat/completions`
- `api_key`：API 密钥
- `is_default`：标记默认模型，其他模块调用时可选择默认模型

## 后端实现

### 1. ORM 模型 (`backend/app/modules/ai_model/models.py`)

```python
from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class AiModel(Base):
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alias = Column(String(100), unique=True, nullable=False, index=True)
    model_name = Column(String(100), nullable=False)
    api_url = Column(String(255), nullable=False)
    api_key = Column(String(255), nullable=False)
    description = Column(Text, default="")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

### 2. Pydantic Schemas (`backend/app/modules/ai_model/schemas.py`)

```python
from pydantic import BaseModel

class AiModelCreate(BaseModel):
    alias: str
    modelName: str
    apiUrl: str
    apiKey: str
    description: str = ""
    isDefault: bool = False

class AiModelUpdate(BaseModel):
    alias: str | None = None
    modelName: str | None = None
    apiUrl: str | None = None
    apiKey: str | None = None
    description: str | None = None
    isDefault: bool | None = None

class AiModelOut(BaseModel):
    id: str
    alias: str
    modelName: str
    apiUrl: str
    apiKey: str
    description: str
    isDefault: bool

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, model) -> "AiModelOut":
        return cls(
            id=str(model.id),
            alias=model.alias,
            modelName=model.model_name,
            apiUrl=model.api_url,
            apiKey=model.api_key,
            description=model.description or "",
            isDefault=model.is_default,
        )
```

### 3. CRUD 操作 (`backend/app/modules/ai_model/crud.py`)

```python
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.ai_model.models import AiModel

async def get_ai_models(db: AsyncSession, search: str = "", page: int = 1, page_size: int = 10) -> tuple[list, int]:
    query = select(AiModel)
    if search:
        query = query.where(AiModel.alias.ilike(f"%{search}%") | AiModel.model_name.ilike(f"%{search}%"))
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
    result = await db.execute(select(AiModel).where(AiModel.is_default == True))
    for model in result.scalars().all():
        model.is_default = False
    await db.flush()

async def get_default_model(db: AsyncSession) -> AiModel | None:
    """获取默认模型"""
    result = await db.execute(select(AiModel).where(AiModel.is_default == True))
    return result.scalar_one_or_none()
```

### 4. 路由 (`backend/app/modules/ai_model/router.py`)

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import User
from app.core.schemas import ApiResponse, PaginatedData
from app.database import get_db
from app.deps import require_permission
from app.modules.ai_model import crud
from app.modules.ai_model.schemas import AiModelCreate, AiModelUpdate, AiModelOut

router = APIRouter(prefix="/ai-models", tags=["AI模型配置"])

@router.get("")
async def get_ai_models(
    search: str = "",
    page: int = 1,
    pageSize: int = 10,
    current_user: User = Depends(require_permission("ai_models")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    items, total = await crud.get_ai_models(db, search, page, pageSize)
    return ApiResponse(data=PaginatedData(
        list=[AiModelOut.from_orm_model(item).model_dump() for item in items],
        total=total,
        page=page,
        pageSize=pageSize,
    ))

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

@router.post("")
async def create_ai_model(
    data: AiModelCreate,
    current_user: User = Depends(require_permission("ai_models.create")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    # 检查别名是否已存在
    existing = await crud.get_ai_model_by_alias(db, data.alias)
    if existing:
        return ApiResponse(code=-1, message="别名已存在")
    model = await crud.create_ai_model(db, **data.model_dump())
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
    # 检查别名是否已存在（排除自身）
    if data.alias:
        existing = await crud.get_ai_model_by_alias(db, data.alias)
        if existing and existing.id != model_id:
            return ApiResponse(code=-1, message="别名已存在")
    update_data = data.model_dump(exclude_unset=True)
    model = await crud.update_ai_model(db, model, **update_data)
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

# 公开接口：获取默认模型（用于其他模块调用）
@router.get("/default")
async def get_default_model(
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    model = await crud.get_default_model(db)
    if not model:
        return ApiResponse(code=-1, message="未配置默认模型")
    return ApiResponse(data=AiModelOut.from_orm_model(model).model_dump())

# 公开接口：通过别名获取模型（用于其他模块调用）
@router.get("/by-alias/{alias}")
async def get_model_by_alias(
    alias: str,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    model = await crud.get_ai_model_by_alias(db, alias)
    if not model:
        return ApiResponse(code=-1, message="模型不存在")
    return ApiResponse(data=AiModelOut.from_orm_model(model).model_dump())
```

### 5. 注册路由 (`backend/app/main.py`)

```python
from app.modules.ai_model.router import router as ai_model_router

# 在路由注册部分添加
app.include_router(ai_model_router, prefix="/api")
```

### 6. 权限种子 (`backend/app/core/seed.py`)

```python
# 在 menu_permissions 列表中添加
{"code": "ai_models", "name": "AI模型配置", "type": "menu"},

# 在 operation_permissions 列表中添加
{"code": "ai_models.create", "name": "新增AI模型", "type": "operation", "parent": "ai_models"},
{"code": "ai_models.edit", "name": "编辑AI模型", "type": "operation", "parent": "ai_models"},
{"code": "ai_models.delete", "name": "删除AI模型", "type": "operation", "parent": "ai_models"},
```

## 前端实现

### 1. 类型定义 (`frontend/src/types/api.ts`)

```typescript
export type AiModel = {
  id: string
  alias: string
  modelName: string
  apiUrl: string
  apiKey: string
  description: string
  isDefault: boolean
}
```

### 2. API 函数 (`frontend/src/lib/api.ts`)

```typescript
// AI模型配置 API
export async function getAiModels(params?: {
  search?: string
  page?: number
  pageSize?: number
}) {
  return apiClient.get<PaginatedData<AiModel>>("/ai-models", params)
}

export async function getAiModel(id: string) {
  return apiClient.get<AiModel>(`/ai-models/${id}`)
}

export async function createAiModel(data: Omit<AiModel, "id">) {
  return apiClient.post<AiModel>("/ai-models", data)
}

export async function updateAiModel(id: string, data: Partial<Omit<AiModel, "id">>) {
  return apiClient.put<AiModel>(`/ai-models/${id}`, data)
}

export async function deleteAiModel(id: string) {
  return apiClient.delete(`/ai-models/${id}`)
}

export async function getDefaultAiModel() {
  return apiClient.get<AiModel>("/ai-models/default")
}

export async function getAiModelByAlias(alias: string) {
  return apiClient.get<AiModel>(`/ai-models/by-alias/${alias}`)
}
```

### 3. 权限定义 (`frontend/src/lib/permissions.ts`)

```typescript
// 在 SEED_MENU_PERMISSIONS 中添加
{ code: "ai_models", name: "AI模型配置", type: "menu" },

// 在 SEED_OPERATION_PERMISSIONS 中添加
{ code: "ai_models.create", name: "新增AI模型", type: "operation", parent: "ai_models" },
{ code: "ai_models.edit", name: "编辑AI模型", type: "operation", parent: "ai_models" },
{ code: "ai_models.delete", name: "删除AI模型", type: "operation", parent: "ai_models" },
```

### 4. 页面组件 (`frontend/src/pages/settings/ai-model.tsx`)

参考 `user.tsx` 的模式，创建 AI 模型配置页面：

- 表格展示所有模型配置
- 搜索栏支持按别名/模型名称搜索
- 新增/编辑对话框包含：别名、模型名称、API 地址、API Key、描述、是否默认
- 操作列：编辑、删除按钮
- API Key 字段使用密码输入框，可切换显示/隐藏
- 默认模型用 Badge 标记

### 5. 路由配置 (`frontend/src/router.tsx`)

```typescript
import { AiModelPage } from "@/pages/settings/ai-model"

// 在 children 数组中添加
{ path: "settings/ai-model", element: <AiModelPage /> },
```

### 6. 侧边栏配置 (`frontend/src/components/app-sidebar.tsx`)

```typescript
import { BotIcon } from "lucide-react"

// 在"管理"分组的 items 数组中添加
{ title: "AI模型配置", url: "/settings/ai-model", icon: <BotIcon />, permission: "ai_models" },
```

## 其他模块调用方式

其他模块可以通过以下方式使用已配置的 AI 模型：

```python
# 方式1：通过别名获取模型配置
model = await crud.get_ai_model_by_alias(db, "gpt4")
# 使用 model.api_url, model.api_key, model.model_name 调用 API

# 方式2：获取默认模型
model = await crud.get_default_model(db)
# 使用 model 配置调用 API
```

## 实现步骤

1. **后端**
   - [ ] 创建 `backend/app/modules/ai_model/` 目录
   - [ ] 实现 `models.py` (ORM 模型)
   - [ ] 实现 `schemas.py` (Pydantic 模型)
   - [ ] 实现 `crud.py` (CRUD 操作)
   - [ ] 实现 `router.py` (API 路由)
   - [ ] 在 `main.py` 注册路由
   - [ ] 在 `seed.py` 添加权限种子

2. **前端**
   - [ ] 在 `types/api.ts` 添加 `AiModel` 类型
   - [ ] 在 `lib/api.ts` 添加 API 函数
   - [ ] 在 `lib/permissions.ts` 添加权限定义
   - [ ] 创建 `pages/settings/ai-model.tsx` 页面
   - [ ] 在 `router.tsx` 添加路由
   - [ ] 在 `app-sidebar.tsx` 添加侧边栏菜单

## 验证方式

1. 启动后端服务：`cd backend && uv run uvicorn app.main:app --reload`
2. 启动前端服务：`cd frontend && pnpm dev`
3. 登录管理员账号
4. 访问侧边栏 → 管理 → AI模型配置
5. 测试功能：
   - 新增模型配置
   - 编辑模型配置
   - 删除模型配置
   - 设置默认模型
   - 搜索模型

## 注意事项

1. API Key 字段在列表中应部分隐藏（如显示前4位和后4位）
2. 删除模型前应确认是否有其他模块正在使用
3. 默认模型只能有一个，设置新的默认时自动取消旧的默认
4. 别名应限制格式（字母、数字、下划线、连字符）
