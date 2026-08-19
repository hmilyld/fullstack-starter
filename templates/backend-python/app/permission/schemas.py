from pydantic import BaseModel


class PermissionCreate(BaseModel):
    code: str
    name: str
    type: str  # "menu" or "operation"
    parent: str | None = None


class PermissionUpdate(BaseModel):
    name: str | None = None
    parent: str | None = None


class PermissionOut(BaseModel):
    code: str
    name: str
    type: str
    parent: str | None = None

    model_config = {"from_attributes": True}