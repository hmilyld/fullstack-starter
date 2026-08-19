from pydantic import BaseModel


class RoleCreate(BaseModel):
    name: str
    description: str = ""
    permissions: list[str] = []


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permissions: list[str] | None = None


class RoleOut(BaseModel):
    id: str
    name: str
    description: str
    permissions: list[str]
    isPreset: bool

    model_config = {"from_attributes": True}