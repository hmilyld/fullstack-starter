import * as React from "react"
import { LoadingButton } from "@/components/shared/loading-button"
import { PageFormSkeleton } from "@/components/shared/table-states"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSystemConfig, updateSystemConfig, getRoles, testEmail } from "@/lib/api"
import type { SystemConfig } from "@/types/api"
import { appToast } from "@/lib/toast"

// 常用邮箱 SMTP 预设配置
const SMTP_PRESETS = [
  {
    name: "QQ 邮箱",
    host: "smtp.qq.com",
    port: 465,
    ssl: true,
    fromName: "QQ邮箱",
    tip: "需要开启 SMTP 服务并获取授权码",
  },
  {
    name: "163 邮箱",
    host: "smtp.163.com",
    port: 465,
    ssl: true,
    fromName: "163邮箱",
    tip: "需要开启 SMTP 服务并设置授权码",
  },
  {
    name: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    ssl: true,
    fromName: "Gmail",
    tip: "需要开启两步验证并生成应用专用密码",
  },
  {
    name: "Outlook",
    host: "smtp.office365.com",
    port: 587,
    ssl: true,
    fromName: "Outlook",
    tip: "使用 Outlook 或 Hotmail 账号",
  },
  {
    name: "企业微信邮箱",
    host: "smtp.exmail.qq.com",
    port: 465,
    ssl: true,
    fromName: "企业微信邮箱",
    tip: "使用企业微信邮箱账号",
  },
  {
    name: "阿里企业邮箱",
    host: "smtp.mxhichina.com",
    port: 465,
    ssl: true,
    fromName: "阿里企业邮箱",
    tip: "使用阿里企业邮箱账号",
  },
  {
    name: "Foxmail",
    host: "smtp.qq.com",
    port: 465,
    ssl: true,
    fromName: "Foxmail",
    tip: "Foxmail 使用 QQ 邮箱 SMTP 服务器",
  },
]

export function SystemPage() {
  const [config, setConfig] = React.useState<SystemConfig | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [siteSaving, setSiteSaving] = React.useState(false)
  const [maintainSaving, setMaintainSaving] = React.useState(false)
  const [registerSaving, setRegisterSaving] = React.useState(false)
  const [defaultSaving, setDefaultSaving] = React.useState(false)
  const [roles, setRoles] = React.useState<{ id: string; name: string }[]>([])
  const [smtpSaving, setSmtpSaving] = React.useState(false)
  const [testEmailAddr, setTestEmailAddr] = React.useState("")
  const [testEmailSaving, setTestEmailSaving] = React.useState(false)
  const [smtpPreset, setSmtpPreset] = React.useState("")

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const res = await getSystemConfig()
      if (cancelled) return
      if (res.code === 0) {
        setConfig(res.data)
      } else if (res.message !== "请求已取消") {
        appToast.error("数据加载失败")
      }
      setLoading(false)
    }
    load()
    getRoles({ pageSize: 100 }).then((res) => {
      if (!cancelled && res.code === 0) setRoles(res.data.list)
    })
    return () => { cancelled = true }
  }, [])

  if (loading) return <PageFormSkeleton />
  if (!config) return null

  function updateField<K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) {
    setConfig((prev) => {
      if (!prev) return prev
      return { ...prev, [key]: value }
    })
  }

  async function handleSaveSite() {
    if (!config) return
    setSiteSaving(true)
    const res = await updateSystemConfig({
      siteName: config.siteName,
      siteDescription: config.siteDescription,
      keywords: config.keywords,
    })
    setSiteSaving(false)
    if (res.code === 0) {
      appToast.success("保存成功")
      const fresh = await getSystemConfig()
      if (fresh.code === 0) setConfig(fresh.data)
    } else {
      appToast.error(res.message)
    }
  }

  async function handleSaveMaintenance() {
    if (!config) return
    setMaintainSaving(true)
    const res = await updateSystemConfig({
      maintenanceEnabled: config.maintenanceEnabled,
      maintenanceMessage: config.maintenanceMessage,
    })
    setMaintainSaving(false)
    if (res.code === 0) {
      appToast.success("保存成功")
      const fresh = await getSystemConfig()
      if (fresh.code === 0) setConfig(fresh.data)
    } else {
      appToast.error(res.message)
    }
  }

  async function handleSaveRegistration() {
    if (!config) return
    setRegisterSaving(true)
    const res = await updateSystemConfig({
      openRegistration: config.openRegistration,
      manualReview: config.manualReview,
    })
    setRegisterSaving(false)
    if (res.code === 0) {
      appToast.success("保存成功")
      const fresh = await getSystemConfig()
      if (fresh.code === 0) setConfig(fresh.data)
    } else {
      appToast.error(res.message)
    }
  }

  async function handleSaveDefault() {
    if (!config) return
    setDefaultSaving(true)
    const res = await updateSystemConfig({
      defaultRoleId: config.defaultRoleId,
      welcomeMessage: config.welcomeMessage,
    })
    setDefaultSaving(false)
    if (res.code === 0) {
      appToast.success("保存成功")
      const fresh = await getSystemConfig()
      if (fresh.code === 0) setConfig(fresh.data)
    } else {
      appToast.error(res.message)
    }
  }

  async function handleSaveSmtp() {
    if (!config) return
    setSmtpSaving(true)
    const res = await updateSystemConfig({
      smtpEnabled: config.smtpEnabled,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUsername: config.smtpUsername,
      smtpPassword: config.smtpPassword,
      smtpFromName: config.smtpFromName,
      smtpFromEmail: config.smtpFromEmail,
      smtpUseSsl: config.smtpUseSsl,
    })
    setSmtpSaving(false)
    if (res.code === 0) {
      appToast.success("保存成功")
      const fresh = await getSystemConfig()
      if (fresh.code === 0) setConfig(fresh.data)
    } else {
      appToast.error(res.message)
    }
  }

  async function handleTestEmail() {
    if (!config || !testEmailAddr) return
    setTestEmailSaving(true)
    const res = await testEmail(testEmailAddr)
    setTestEmailSaving(false)
    if (res.code === 0) {
      appToast.success("测试邮件发送成功")
    } else {
      appToast.error(res.message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground">管理站点全局配置和注册策略。</p>
      </div>

      <Tabs defaultValue="site" className="w-full">
        <TabsList>
          <TabsTrigger value="site">站点设置</TabsTrigger>
          <TabsTrigger value="register">注册设置</TabsTrigger>
          <TabsTrigger value="smtp">邮件配置</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>配置站点名称、描述等基本信息。</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="site-name">站点名称</FieldLabel>
                  <Input id="site-name" value={config.siteName} onChange={(e) => updateField("siteName", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="site-desc">站点描述</FieldLabel>
                  <Input id="site-desc" value={config.siteDescription} onChange={(e) => updateField("siteDescription", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="site-keywords">关键词</FieldLabel>
                  <Input id="site-keywords" value={config.keywords} onChange={(e) => updateField("keywords", e.target.value)} />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <LoadingButton onClick={handleSaveSite} loading={siteSaving}>
                保存基本信息
              </LoadingButton>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>维护模式</CardTitle>
              <CardDescription>开启后普通用户将无法访问系统。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel>开启维护模式</FieldLabel>
                  <FieldDescription>仅管理员可登录，其他用户看到维护提示。</FieldDescription>
                </div>
                <Switch checked={config.maintenanceEnabled} onCheckedChange={(v) => updateField("maintenanceEnabled", v)} />
              </Field>
              <Separator />
              <Field>
                <FieldLabel htmlFor="maintain-msg">维护提示信息</FieldLabel>
                <Input id="maintain-msg" value={config.maintenanceMessage} onChange={(e) => updateField("maintenanceMessage", e.target.value)} />
              </Field>
            </CardContent>
            <CardFooter>
              <LoadingButton onClick={handleSaveMaintenance} loading={maintainSaving}>
                保存维护设置
              </LoadingButton>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="register" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>注册策略</CardTitle>
              <CardDescription>控制用户注册方式和验证流程。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel>开放注册</FieldLabel>
                  <FieldDescription>允许新用户自行注册账号。</FieldDescription>
                </div>
                <Switch checked={config.openRegistration} onCheckedChange={(v) => updateField("openRegistration", v)} />
              </Field>
              <Separator />

              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel>人工审核</FieldLabel>
                  <FieldDescription>新注册用户需要管理员审核后才能使用系统。</FieldDescription>
                </div>
                <Switch checked={config.manualReview} onCheckedChange={(v) => updateField("manualReview", v)} />
              </Field>
            </CardContent>
            <CardFooter>
              <LoadingButton onClick={handleSaveRegistration} loading={registerSaving}>
                保存注册策略
              </LoadingButton>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>默认配置</CardTitle>
              <CardDescription>新注册用户的默认角色和状态。</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>默认角色</FieldLabel>
                  <Select value={config.defaultRoleId} onValueChange={(v) => updateField("defaultRoleId", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="请选择默认角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>新注册用户自动分配的角色。</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="welcome-msg">欢迎消息</FieldLabel>
                  <Input id="welcome-msg" value={config.welcomeMessage} onChange={(e) => updateField("welcomeMessage", e.target.value)} />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <LoadingButton onClick={handleSaveDefault} loading={defaultSaving}>
                保存默认配置
              </LoadingButton>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="smtp" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>SMTP 邮件配置</CardTitle>
              <CardDescription>配置邮件服务器，用于发送系统通知邮件。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel>启用邮件</FieldLabel>
                  <FieldDescription>开启后系统将通过 SMTP 发送邮件。</FieldDescription>
                </div>
                <Switch checked={config.smtpEnabled} onCheckedChange={(v) => updateField("smtpEnabled", v)} />
              </Field>
              <Separator />

              {/* 快捷配置 */}
              <Field>
                <FieldLabel>快捷配置</FieldLabel>
                <Select
                  value={smtpPreset}
                  onValueChange={(value) => {
                    setSmtpPreset(value)
                    const preset = SMTP_PRESETS.find((p) => p.name === value)
                    if (preset) {
                      updateField("smtpHost", preset.host)
                      updateField("smtpPort", preset.port)
                      updateField("smtpUseSsl", preset.ssl)
                      updateField("smtpFromName", preset.fromName)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择常用邮箱快速配置..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SMTP_PRESETS.map((preset) => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.name} - {preset.host}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>选择后将自动填充服务器、端口和 SSL 配置。</FieldDescription>
              </Field>

              <Separator />

              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="smtp-host">SMTP 服务器 *</FieldLabel>
                    <Input
                      id="smtp-host"
                      placeholder="例如: smtp.qq.com"
                      value={config.smtpHost}
                      onChange={(e) => updateField("smtpHost", e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="smtp-port">端口 *</FieldLabel>
                    <Input
                      id="smtp-port"
                      type="number"
                      placeholder="例如: 587"
                      value={config.smtpPort}
                      onChange={(e) => updateField("smtpPort", parseInt(e.target.value) || 587)}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="smtp-username">用户名 *</FieldLabel>
                    <Input
                      id="smtp-username"
                      placeholder="例如: your@email.com"
                      value={config.smtpUsername}
                      onChange={(e) => updateField("smtpUsername", e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="smtp-password">密码 *</FieldLabel>
                    <Input
                      id="smtp-password"
                      type="password"
                      placeholder="请输入 SMTP 密码或授权码"
                      value={config.smtpPassword}
                      onChange={(e) => updateField("smtpPassword", e.target.value)}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="smtp-from-name">发件人名称</FieldLabel>
                    <Input
                      id="smtp-from-name"
                      placeholder="例如: 管理系统"
                      value={config.smtpFromName}
                      onChange={(e) => updateField("smtpFromName", e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="smtp-from-email">发件人邮箱 *</FieldLabel>
                    <Input
                      id="smtp-from-email"
                      type="email"
                      placeholder="例如: noreply@example.com"
                      value={config.smtpFromEmail}
                      onChange={(e) => updateField("smtpFromEmail", e.target.value)}
                    />
                  </Field>
                </div>
                <Field orientation="horizontal">
                  <div className="flex flex-1 flex-col gap-1">
                    <FieldLabel>使用 SSL</FieldLabel>
                    <FieldDescription>大多数邮件服务器需要开启 SSL。</FieldDescription>
                  </div>
                  <Switch checked={config.smtpUseSsl} onCheckedChange={(v) => updateField("smtpUseSsl", v)} />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <LoadingButton onClick={handleSaveSmtp} loading={smtpSaving}>
                保存邮件配置
              </LoadingButton>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>测试邮件</CardTitle>
              <CardDescription>发送测试邮件以验证邮件配置是否正确。</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="test-email">收件人邮箱</FieldLabel>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="请输入测试收件人邮箱"
                    value={testEmailAddr}
                    onChange={(e) => setTestEmailAddr(e.target.value)}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <div className="flex flex-col gap-2">
                <LoadingButton
                  onClick={handleTestEmail}
                  loading={testEmailSaving}
                  disabled={!testEmailAddr || !config.smtpEnabled}
                >
                  发送测试邮件
                </LoadingButton>
                {!config.smtpEnabled && (
                  <span className="text-xs text-muted-foreground">
                    请先开启"启用邮件"开关并配置SMTP服务器
                  </span>
                )}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
