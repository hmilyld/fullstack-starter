from pydantic import BaseModel


class DashboardStats(BaseModel):
    totalUsers: int
    activeNow: int
    revenue: str
    growth: str


class ActivityItem(BaseModel):
    user: str
    action: str
    time: str
