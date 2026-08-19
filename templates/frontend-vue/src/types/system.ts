export type SystemConfig = {
  siteName: string
  siteDescription: string
  keywords: string
  maintenanceEnabled: boolean
  maintenanceMessage: string
  openRegistration: boolean
  manualReview: boolean
  defaultRoleId: string
  welcomeMessage: string
  // 邮件配置
  smtpEnabled: boolean
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpFromName: string
  smtpFromEmail: string
  smtpUseSsl: boolean
}

export type PublicConfig = {
  siteName: string
  siteDescription: string
  maintenanceEnabled: boolean
  maintenanceMessage: string
  openRegistration: boolean
  manualReview: boolean
}
