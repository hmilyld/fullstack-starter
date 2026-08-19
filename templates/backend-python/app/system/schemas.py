from pydantic import BaseModel, EmailStr


class SystemConfigUpdate(BaseModel):
    siteName: str | None = None
    siteDescription: str | None = None
    keywords: str | None = None
    maintenanceEnabled: bool | None = None
    maintenanceMessage: str | None = None
    openRegistration: bool | None = None
    manualReview: bool | None = None
    defaultRoleId: str | None = None
    welcomeMessage: str | None = None
    # 邮件配置
    smtpEnabled: bool | None = None
    smtpHost: str | None = None
    smtpPort: int | None = None
    smtpUsername: str | None = None
    smtpPassword: str | None = None
    smtpFromName: str | None = None
    smtpFromEmail: str | None = None
    smtpUseSsl: bool | None = None


class SystemConfigOut(BaseModel):
    siteName: str
    siteDescription: str
    keywords: str
    maintenanceEnabled: bool
    maintenanceMessage: str
    openRegistration: bool
    manualReview: bool
    defaultRoleId: str
    welcomeMessage: str
    # 邮件配置（密码脱敏）
    smtpEnabled: bool
    smtpHost: str
    smtpPort: int
    smtpUsername: str
    smtpPassword: str
    smtpFromName: str
    smtpFromEmail: str
    smtpUseSsl: bool

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_config(cls, config) -> "SystemConfigOut":
        return cls(
            siteName=config.site_name,
            siteDescription=config.site_description,
            keywords=config.keywords,
            maintenanceEnabled=config.maintenance_enabled,
            maintenanceMessage=config.maintenance_message,
            openRegistration=config.open_registration,
            manualReview=config.manual_review,
            defaultRoleId=config.default_role_id,
            welcomeMessage=config.welcome_message,
            smtpEnabled=config.smtp_enabled,
            smtpHost=config.smtp_host,
            smtpPort=config.smtp_port,
            smtpUsername=config.smtp_username,
            smtpPassword="****",
            smtpFromName=config.smtp_from_name,
            smtpFromEmail=config.smtp_from_email,
            smtpUseSsl=config.smtp_use_ssl,
        )


class TestEmailRequest(BaseModel):
    email: EmailStr