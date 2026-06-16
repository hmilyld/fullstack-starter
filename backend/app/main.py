from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.core.seed import seed_data
from app.database import async_session, init_db
from app.modules.ai_model.crud import init_default_presets
from app.modules.ai_model.router import router as ai_model_router
from app.modules.public.router import router as public_router
from app.modules.system.router import router as system_router

from .core.routes.auth import router as auth_router
from .core.routes.dashboard import router as dashboard_router
from .core.routes.permissions import router as permissions_router
from .core.routes.roles import router as roles_router
from .core.routes.users import router as users_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await init_db()
    async with async_session() as session:
        try:
            await seed_data(session)
            await init_default_presets(session)
            await session.commit()
        except IntegrityError:
            await session.rollback()
    yield


app = FastAPI(
    title="管理系统 API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(roles_router, prefix="/api")
app.include_router(permissions_router, prefix="/api")
app.include_router(system_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(ai_model_router, prefix="/api")
app.include_router(public_router, prefix="/api")
