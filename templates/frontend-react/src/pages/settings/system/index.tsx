import * as React from "react"
import { MailIcon, SaveIcon } from "lucide-react"
import { useSearchParams } from "react-router"

import { LoadingButton } from "@/components/shared/loading-button"
import { PageHeader } from "@/components/shared/page-header"
import { PageFormSkeleton } from "@/components/shared/table-states"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRoles } from "@/api/role"
import { getSystemConfig, testEmail, updateSystemConfig } from "@/api/system"
import { appToast } from "@/lib/toast"
import type { SystemConfig } from "@/types/system"

type SaveKey = "site" | "maintenance" | "registration" | "default" | "smtp"

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

function SaveFooter({
  dirty,
  loading,
  onSave,
  children,
}: {
  dirty: boolean
  loading: boolean
  onSave: () => void
  children: React.ReactNode
}) {
  return (
    <CardFooter className="flex flex-wrap items-center gap-3">
      <LoadingButton
        loading={loading}
        disabled={!dirty}
        onClick={onSave}
        className="w-full md:w-auto"
      >
        <SaveIcon data-icon="inline-start" />
        {children}
      </LoadingButton>
      <span className="text-xs text-muted-foreground">
        {dirty ? "有未保存的修改" : "已保存"}
      </span>
    </CardFooter>
  )
}

export function SystemPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("tab")
  const activeTab =
    tabParam === "register" || tabParam === "smtp" ? tabParam : "site"

  function setActiveTab(value: string) {
    setSearchParams(value === "site" ? {} : { tab: value }, { replace: true })
  }

  const [config, setConfig] = React.useState<SystemConfig | null>(null)
  const [savedConfig, setSavedConfig] = React.useState<SystemConfig | null>(
    null
  )
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState<SaveKey | null>(null)
  const [roles, setRoles] = React.useState<{ id: string; name: string }[]>([])

  const [smtpPassword, setSmtpPassword] = React.useState("")
  const [smtpPort, setSmtpPort] = React.useState("")
  const [smtpPreset, setSmtpPreset] = React.useState("")
  const [testEmailAddr, setTestEmailAddr] = React.useState("")
  const [testEmailSending, setTestEmailSending] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const res = await getSystemConfig()
      if (cancelled) return
      if (res.code === 0) {
        setConfig(res.data)
        setSavedConfig(res.data)
        setSmtpPort(String(res.data.smtpPort ?? ""))
      } else if (res.message !== "请求已取消") {
        appToast.error(res.message || "数据加载失败")
      }
      setLoading(false)
    }
    void load()
    getRoles({ pageSize: 100 }).then((res) => {
      if (!cancelled && res.code === 0) setRoles(res.data.list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-(--page-gap)">
        <PageHeader
          title="系统设置"
          description="管理站点全局配置、注册策略与邮件服务。"
        />
        <PageFormSkeleton />
      </div>
    )
  }

  if (!config) return null

  function updateField<K extends keyof SystemConfig>(
    key: K,
    value: SystemConfig[K]
  ) {
    setConfig((previous) =>
      previous ? { ...previous, [key]: value } : previous
    )
  }

  function isDirty(keys: (keyof SystemConfig)[]) {
    if (!savedConfig) return false
    return keys.some((key) => config?.[key] !== savedConfig[key])
  }

  const siteDirty = isDirty(["siteName", "siteDescription", "keywords"])
  const maintenanceDirty = isDirty(["maintenanceEnabled", "maintenanceMessage"])
  const registrationDirty = isDirty(["openRegistration", "manualReview"])
  const defaultDirty = isDirty(["defaultRoleId", "welcomeMessage"])
  const smtpDirty =
    isDirty([
      "smtpEnabled",
      "smtpHost",
      "smtpUsername",
      "smtpFromName",
      "smtpFromEmail",
      "smtpUseSsl",
    ]) ||
    smtpPort !== String(savedConfig?.smtpPort ?? "") ||
    smtpPassword.trim() !== ""

  async function savePatch(
    key: SaveKey,
    patch: Partial<SystemConfig>,
    successMessage = "保存成功"
  ) {
    setSaving(key)
    const res = await updateSystemConfig(patch)
    setSaving(null)
    if (res.code !== 0) {
      appToast.error(res.message || "保存失败")
      return false
    }

    const nextSaved = { ...savedConfig!, ...patch, smtpPassword: "" }
    setSavedConfig(nextSaved)
    setConfig((current) =>
      current ? { ...current, ...patch, smtpPassword: "" } : current
    )
    appToast.success(successMessage)
    return true
  }

  async function handleSaveSite() {
    if (!config!.siteName.trim()) {
      appToast.error("请输入站点名称")
      return
    }
    await savePatch("site", {
      siteName: config!.siteName,
      siteDescription: config!.siteDescription,
      keywords: config!.keywords,
    })
  }

  async function handleSaveMaintenance() {
    await savePatch("maintenance", {
      maintenanceEnabled: config!.maintenanceEnabled,
      maintenanceMessage: config!.maintenanceMessage,
    })
  }

  async function handleSaveRegistration() {
    await savePatch("registration", {
      openRegistration: config!.openRegistration,
      manualReview: config!.manualReview,
    })
  }

  async function handleSaveDefault() {
    await savePatch("default", {
      defaultRoleId: config!.defaultRoleId,
      welcomeMessage: config!.welcomeMessage,
    })
  }

  async function handleSaveSmtp() {
    if (
      !config!.smtpHost.trim() ||
      !config!.smtpUsername.trim() ||
      !config!.smtpFromEmail.trim()
    ) {
      appToast.error("请填写 SMTP 服务器、用户名和发件人邮箱")
      return
    }
    const port = Number(smtpPort)
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      appToast.error("请输入 1-65535 之间的端口号")
      return
    }
    const patch: Partial<SystemConfig> = {
      smtpEnabled: config!.smtpEnabled,
      smtpHost: config!.smtpHost,
      smtpPort: port,
      smtpUsername: config!.smtpUsername,
      smtpFromName: config!.smtpFromName,
      smtpFromEmail: config!.smtpFromEmail,
      smtpUseSsl: config!.smtpUseSsl,
    }
    if (smtpPassword.trim()) patch.smtpPassword = smtpPassword

    const ok = await savePatch("smtp", patch)
    if (ok) {
      setSmtpPassword("")
      setSmtpPort(String(port))
    }
  }

  async function handleTestEmail() {
    if (!testEmailAddr) return
    setTestEmailSending(true)
    const res = await testEmail(testEmailAddr)
    setTestEmailSending(false)
    if (res.code === 0) appToast.success("测试邮件发送成功")
    else appToast.error(res.message || "测试邮件发送失败")
  }

  function applySmtpPreset(name: string) {
    setSmtpPreset(name)
    const preset = SMTP_PRESETS.find((item) => item.name === name)
    if (!preset) return
    setConfig((current) =>
      current
        ? {
            ...current,
            smtpHost: preset.host,
            smtpPort: preset.port,
            smtpUseSsl: preset.ssl,
            smtpFromName: preset.fromName,
          }
        : current
    )
    setSmtpPort(String(preset.port))
  }

  const activePreset = SMTP_PRESETS.find((preset) => preset.name === smtpPreset)

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title="系统设置"
        description="管理站点全局配置、注册策略与邮件服务。"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="site">站点设置</TabsTrigger>
          <TabsTrigger value="register">注册设置</TabsTrigger>
          <TabsTrigger value="smtp">邮件配置</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="flex flex-col gap-(--page-gap)">
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>配置站点名称、描述等基本信息。</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="site-name">站点名称</FieldLabel>
                  <Input
                    id="site-name"
                    value={config.siteName}
                    onChange={(event) =>
                      updateField("siteName", event.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="site-desc">站点描述</FieldLabel>
                  <Input
                    id="site-desc"
                    value={config.siteDescription}
                    onChange={(event) =>
                      updateField("siteDescription", event.target.value)
                    }
                  />
                  <FieldDescription>
                    显示在浏览器标签和搜索结果中。
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="site-keywords">关键词</FieldLabel>
                  <Input
                    id="site-keywords"
                    value={config.keywords}
                    onChange={(event) =>
                      updateField("keywords", event.target.value)
                    }
                  />
                  <FieldDescription>
                    多个关键词用英文逗号分隔。
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <SaveFooter
              dirty={siteDirty}
              loading={saving === "site"}
              onSave={handleSaveSite}
            >
              保存基本信息
            </SaveFooter>
          </Card>

          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>维护模式</CardTitle>
              <CardDescription>
                开启后除管理员以外的用户将无法登录。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel htmlFor="maintenance-enabled">
                    开启维护模式
                  </FieldLabel>
                  <FieldDescription>
                    其他用户会看到维护提示，管理员仍可登录。
                  </FieldDescription>
                </div>
                <Switch
                  id="maintenance-enabled"
                  aria-label="开启维护模式"
                  checked={config.maintenanceEnabled}
                  onCheckedChange={(checked) =>
                    updateField("maintenanceEnabled", checked)
                  }
                />
              </Field>
              <Separator />
              <Field>
                <FieldLabel htmlFor="maintenance-message">
                  维护提示信息
                </FieldLabel>
                <Input
                  id="maintenance-message"
                  value={config.maintenanceMessage}
                  onChange={(event) =>
                    updateField("maintenanceMessage", event.target.value)
                  }
                />
              </Field>
            </CardContent>
            <SaveFooter
              dirty={maintenanceDirty}
              loading={saving === "maintenance"}
              onSave={handleSaveMaintenance}
            >
              保存维护设置
            </SaveFooter>
          </Card>
        </TabsContent>

        <TabsContent
          value="register"
          className="flex flex-col gap-(--page-gap)"
        >
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>注册策略</CardTitle>
              <CardDescription>控制用户注册方式和验证流程。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel htmlFor="open-registration">开放注册</FieldLabel>
                  <FieldDescription>允许新用户自行注册账号。</FieldDescription>
                </div>
                <Switch
                  id="open-registration"
                  aria-label="开放注册"
                  checked={config.openRegistration}
                  onCheckedChange={(checked) =>
                    updateField("openRegistration", checked)
                  }
                />
              </Field>
              <Separator />
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel htmlFor="manual-review">人工审核</FieldLabel>
                  <FieldDescription>
                    新注册用户需要管理员审核后才能使用系统。
                  </FieldDescription>
                </div>
                <Switch
                  id="manual-review"
                  aria-label="人工审核"
                  checked={config.manualReview}
                  onCheckedChange={(checked) =>
                    updateField("manualReview", checked)
                  }
                  disabled={!config.openRegistration}
                />
              </Field>
            </CardContent>
            <SaveFooter
              dirty={registrationDirty}
              loading={saving === "registration"}
              onSave={handleSaveRegistration}
            >
              保存注册策略
            </SaveFooter>
          </Card>

          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>默认配置</CardTitle>
              <CardDescription>
                新注册用户的默认角色和欢迎信息。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>默认角色</FieldLabel>
                  <Select
                    value={config.defaultRoleId}
                    onValueChange={(value) =>
                      updateField("defaultRoleId", value)
                    }
                  >
                    <SelectTrigger className="w-full" aria-label="默认角色">
                      <SelectValue placeholder="请选择默认角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    新注册用户自动分配的角色。
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="welcome-message">欢迎消息</FieldLabel>
                  <Input
                    id="welcome-message"
                    value={config.welcomeMessage}
                    onChange={(event) =>
                      updateField("welcomeMessage", event.target.value)
                    }
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <SaveFooter
              dirty={defaultDirty}
              loading={saving === "default"}
              onSave={handleSaveDefault}
            >
              保存默认配置
            </SaveFooter>
          </Card>
        </TabsContent>

        <TabsContent value="smtp" className="flex flex-col gap-(--page-gap)">
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>SMTP 邮件配置</CardTitle>
              <CardDescription>
                配置邮件服务器，用于发送系统通知邮件。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel htmlFor="smtp-enabled">启用邮件</FieldLabel>
                  <FieldDescription>
                    开启后系统将通过 SMTP 发送邮件。
                  </FieldDescription>
                </div>
                <Switch
                  id="smtp-enabled"
                  aria-label="启用邮件"
                  checked={config.smtpEnabled}
                  onCheckedChange={(checked) =>
                    updateField("smtpEnabled", checked)
                  }
                />
              </Field>
              <Separator />

              <Field>
                <FieldLabel>快捷配置</FieldLabel>
                <Select value={smtpPreset} onValueChange={applySmtpPreset}>
                  <SelectTrigger className="w-full" aria-label="快捷配置">
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
                <FieldDescription>
                  {activePreset
                    ? activePreset.tip
                    : "选择后会自动填充服务器、端口和 SSL 配置。"}
                </FieldDescription>
              </Field>

              <Separator />

              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="smtp-host">SMTP 服务器</FieldLabel>
                    <Input
                      id="smtp-host"
                      placeholder="例如：smtp.qq.com"
                      value={config.smtpHost}
                      onChange={(event) =>
                        updateField("smtpHost", event.target.value)
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="smtp-port">端口</FieldLabel>
                    <Input
                      id="smtp-port"
                      type="number"
                      min={1}
                      max={65535}
                      placeholder="例如：587"
                      value={smtpPort}
                      onChange={(event) => setSmtpPort(event.target.value)}
                      required
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="smtp-username">用户名</FieldLabel>
                    <Input
                      id="smtp-username"
                      placeholder="例如：your@email.com"
                      value={config.smtpUsername}
                      onChange={(event) =>
                        updateField("smtpUsername", event.target.value)
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="smtp-password">
                      密码 / 授权码
                    </FieldLabel>
                    <Input
                      id="smtp-password"
                      type="password"
                      placeholder="留空保持不变"
                      value={smtpPassword}
                      onChange={(event) => setSmtpPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="smtp-from-name">发件人名称</FieldLabel>
                    <Input
                      id="smtp-from-name"
                      placeholder="例如：管理系统"
                      value={config.smtpFromName}
                      onChange={(event) =>
                        updateField("smtpFromName", event.target.value)
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="smtp-from-email">
                      发件人邮箱
                    </FieldLabel>
                    <Input
                      id="smtp-from-email"
                      type="email"
                      placeholder="例如：noreply@example.com"
                      value={config.smtpFromEmail}
                      onChange={(event) =>
                        updateField("smtpFromEmail", event.target.value)
                      }
                      required
                    />
                  </Field>
                </div>
                <Field orientation="horizontal">
                  <div className="flex flex-1 flex-col gap-1">
                    <FieldLabel htmlFor="smtp-ssl">使用 SSL</FieldLabel>
                    <FieldDescription>
                      大多数邮件服务器需要开启 SSL。
                    </FieldDescription>
                  </div>
                  <Switch
                    id="smtp-ssl"
                    aria-label="使用 SSL"
                    checked={config.smtpUseSsl}
                    onCheckedChange={(checked) =>
                      updateField("smtpUseSsl", checked)
                    }
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <SaveFooter
              dirty={smtpDirty}
              loading={saving === "smtp"}
              onSave={handleSaveSmtp}
            >
              保存邮件配置
            </SaveFooter>
          </Card>

          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>测试邮件</CardTitle>
              <CardDescription>
                发送测试邮件以验证邮件配置是否正确。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                id="test-email-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleTestEmail()
                }}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="test-email">收件人邮箱</FieldLabel>
                    <Input
                      id="test-email"
                      type="email"
                      placeholder="请输入测试收件人邮箱"
                      value={testEmailAddr}
                      onChange={(event) => setTestEmailAddr(event.target.value)}
                      required
                    />
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2">
              <LoadingButton
                type="submit"
                form="test-email-form"
                loading={testEmailSending}
                disabled={!config.smtpEnabled || !testEmailAddr}
                className="w-full md:w-auto"
              >
                <MailIcon data-icon="inline-start" />
                发送测试邮件
              </LoadingButton>
              {!config.smtpEnabled && (
                <span className="text-xs text-muted-foreground">
                  请先开启“启用邮件”并保存 SMTP 配置。
                </span>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
