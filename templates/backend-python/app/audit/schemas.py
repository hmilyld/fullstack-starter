from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: str
    userId: str
    username: str
    action: str
    ip: str
    status: str
    detail: str
    createdAt: str
