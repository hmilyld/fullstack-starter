from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.system.models import SystemConfig


async def get_config(db: AsyncSession) -> SystemConfig:
    result = await db.execute(select(SystemConfig).where(SystemConfig.id == 1))
    config = result.scalar_one_or_none()
    if config is None:
        config = SystemConfig(id=1)
        db.add(config)
        await db.flush()
    return config


async def update_config(db: AsyncSession, **kwargs) -> SystemConfig:
    config = await get_config(db)
    field_mapping = {
        "siteName": "site_name",
        "siteDescription": "site_description",
        "maintenanceEnabled": "maintenance_enabled",
        "maintenanceMessage": "maintenance_message",
        "openRegistration": "open_registration",
        "manualReview": "manual_review",
        "defaultRoleId": "default_role_id",
        "welcomeMessage": "welcome_message",
    }
    for key, value in kwargs.items():
        if value is not None:
            attr_name = field_mapping.get(key, key)
            setattr(config, attr_name, value)
    await db.flush()
    return config
