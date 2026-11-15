import * as React from "react"
import { useTranslation } from "react-i18next"
import { MailIcon, SaveIcon, Settings2Icon, UserPlusIcon } from "lucide-react"
import { useSearchParams } from "react-router"

import { useMediaQuery } from "@/hooks/use-media-query"

import { LoadingButton } from "@/components/shared/loading-button"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsNav } from "@/components/shared/settings-nav"
import { UnsavedChangesGuard } from "@/components/shared/unsaved-changes-guard"
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
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { getRoles } from "@/api/role"
import { getSystemConfig, testEmail, updateSystemConfig } from "@/api/system"
import { useSiteConfig } from "@/lib/site-config"
import { translate } from "@/lib/i18n"
import { appToast } from "@/lib/toast"
import type { SystemConfig } from "@/types/system"

type SaveKey = "site" | "maintenance" | "registration" | "default" | "smtp"

const SETTINGS_TABS = [
  {
    value: "site",
    titleKey: "systemPage.tabs.site",
    icon: Settings2Icon,
  },
  {
    value: "register",
    titleKey: "systemPage.tabs.register",
    icon: UserPlusIcon,
  },
  {
    value: "smtp",
    titleKey: "systemPage.tabs.smtp",
    icon: MailIcon,
  },
] as const

type SmtpPresetId =
  "qq" | "net163" | "gmail" | "outlook" | "wecom" | "aliyun" | "foxmail"

const SMTP_PRESETS: {
  id: SmtpPresetId
  host: string
  port: number
  ssl: boolean
}[] = [
  { id: "qq", host: "smtp.qq.com", port: 465, ssl: true },
  { id: "net163", host: "smtp.163.com", port: 465, ssl: true },
  { id: "gmail", host: "smtp.gmail.com", port: 587, ssl: true },
  { id: "outlook", host: "smtp.office365.com", port: 587, ssl: true },
  { id: "wecom", host: "smtp.exmail.qq.com", port: 465, ssl: true },
  { id: "aliyun", host: "smtp.mxhichina.com", port: 465, ssl: true },
  { id: "foxmail", host: "smtp.qq.com", port: 465, ssl: true },
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
  const { t } = useTranslation()
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
        {dirty ? t("systemPage.unsaved") : t("systemPage.saved")}
      </span>
    </CardFooter>
  )
}

export function SystemPage() {
  const { t } = useTranslation()
  const { refresh: refreshSiteConfig } = useSiteConfig()
  const [searchParams, setSearchParams] = useSearchParams()
  const isWide = useMediaQuery("(min-width: 1024px)")
  const tabParam = searchParams.get("tab")
  const activeTab =
    tabParam === "register" || tabParam === "smtp" ? tabParam : "site"
  const tabs = SETTINGS_TABS.map((tab) => ({
    ...tab,
    title: t(tab.titleKey),
  }))

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
        appToast.error(res.message || translate("systemPage.loadFailed"))
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
          title={t("systemPage.title")}
          description={t("systemPage.description")}
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

  const pageDirty =
    siteDirty ||
    maintenanceDirty ||
    registrationDirty ||
    defaultDirty ||
    smtpDirty

  async function savePatch(
    key: SaveKey,
    patch: Partial<SystemConfig>,
    successMessage = t("systemPage.saveSuccess")
  ) {
    setSaving(key)
    const res = await updateSystemConfig(patch)
    setSaving(null)
    if (res.code !== 0) {
      appToast.error(res.message || t("systemPage.saveFailed"))
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
      appToast.error(t("systemPage.site.nameRequired"))
      return
    }
    const ok = await savePatch("site", {
      siteName: config!.siteName,
      siteDescription: config!.siteDescription,
      keywords: config!.keywords,
    })
    if (ok) await refreshSiteConfig()
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
      appToast.error(t("systemPage.smtp.required"))
      return
    }
    const port = Number(smtpPort)
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      appToast.error(t("systemPage.smtp.invalidPort"))
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
    if (res.code === 0) appToast.success(t("systemPage.testEmail.success"))
    else appToast.error(res.message || t("systemPage.testEmail.failed"))
  }

  function applySmtpPreset(id: string) {
    setSmtpPreset(id)
    const preset = SMTP_PRESETS.find((item) => item.id === id)
    if (!preset) return
    setConfig((current) =>
      current
        ? {
            ...current,
            smtpHost: preset.host,
            smtpPort: preset.port,
            smtpUseSsl: preset.ssl,
            smtpFromName: t(`systemPage.smtp.presets.${preset.id}.name`),
          }
        : current
    )
    setSmtpPort(String(preset.port))
  }

  const activePreset = SMTP_PRESETS.find((preset) => preset.id === smtpPreset)

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <UnsavedChangesGuard when={pageDirty} />
      <PageHeader
        title={t("systemPage.title")}
        description={t("systemPage.description")}
      />

      <Separator />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        orientation={isWide ? "vertical" : "horizontal"}
        className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-12"
      >
        <SettingsNav items={tabs} />

        <TabsContent
          value="site"
          className="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
        >
          <Card variant="plain" className="max-w-3xl">
            <CardHeader>
              <CardTitle>{t("systemPage.site.title")}</CardTitle>
              <CardDescription>
                {t("systemPage.site.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="site-name">
                    {t("systemPage.site.name")}
                  </FieldLabel>
                  <Input
                    name="site-name"
                    autoComplete="off"
                    id="site-name"
                    value={config.siteName}
                    onChange={(event) =>
                      updateField("siteName", event.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="site-desc">
                    {t("systemPage.site.descriptionLabel")}
                  </FieldLabel>
                  <Input
                    name="site-desc"
                    autoComplete="off"
                    id="site-desc"
                    value={config.siteDescription}
                    onChange={(event) =>
                      updateField("siteDescription", event.target.value)
                    }
                  />
                  <FieldDescription>
                    {t("systemPage.site.descriptionHint")}
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="site-keywords">
                    {t("systemPage.site.keywords")}
                  </FieldLabel>
                  <Input
                    name="site-keywords"
                    autoComplete="off"
                    spellCheck={false}
                    id="site-keywords"
                    value={config.keywords}
                    onChange={(event) =>
                      updateField("keywords", event.target.value)
                    }
                  />
                  <FieldDescription>
                    {t("systemPage.site.keywordsHint")}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <SaveFooter
              dirty={siteDirty}
              loading={saving === "site"}
              onSave={handleSaveSite}
            >
              {t("systemPage.site.save")}
            </SaveFooter>
          </Card>

          <Card variant="plain" className="max-w-3xl">
            <CardHeader>
              <CardTitle>{t("systemPage.maintenance.title")}</CardTitle>
              <CardDescription>
                {t("systemPage.maintenance.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel htmlFor="maintenance-enabled">
                    {t("systemPage.maintenance.enabled")}
                  </FieldLabel>
                  <FieldDescription>
                    {t("systemPage.maintenance.enabledHint")}
                  </FieldDescription>
                </div>
                <Switch
                  id="maintenance-enabled"
                  aria-label={t("systemPage.maintenance.enabled")}
                  checked={config.maintenanceEnabled}
                  onCheckedChange={(checked) =>
                    updateField("maintenanceEnabled", checked)
                  }
                />
              </Field>
              <Separator />
              <Field>
                <FieldLabel htmlFor="maintenance-message">
                  {t("systemPage.maintenance.message")}
                </FieldLabel>
                <Input
                  name="maintenance-message"
                  autoComplete="off"
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
              {t("systemPage.maintenance.save")}
            </SaveFooter>
          </Card>
        </TabsContent>

        <TabsContent
          value="register"
          className="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
        >
          <Card variant="plain" className="max-w-3xl">
            <CardHeader>
              <CardTitle>{t("systemPage.registration.title")}</CardTitle>
              <CardDescription>
                {t("systemPage.registration.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel htmlFor="open-registration">
                    {t("systemPage.registration.open")}
                  </FieldLabel>
                  <FieldDescription>
                    {t("systemPage.registration.openHint")}
                  </FieldDescription>
                </div>
                <Switch
                  id="open-registration"
                  aria-label={t("systemPage.registration.open")}
                  checked={config.openRegistration}
                  onCheckedChange={(checked) =>
                    updateField("openRegistration", checked)
                  }
                />
              </Field>
              <Separator />
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel htmlFor="manual-review">
                    {t("systemPage.registration.manual")}
                  </FieldLabel>
                  <FieldDescription>
                    {t("systemPage.registration.manualHint")}
                  </FieldDescription>
                </div>
                <Switch
                  id="manual-review"
                  aria-label={t("systemPage.registration.manual")}
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
              {t("systemPage.registration.save")}
            </SaveFooter>
          </Card>

          <Card variant="plain" className="max-w-3xl">
            <CardHeader>
              <CardTitle>{t("systemPage.defaults.title")}</CardTitle>
              <CardDescription>
                {t("systemPage.defaults.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t("systemPage.defaults.role")}</FieldLabel>
                  <Select
                    value={config.defaultRoleId}
                    onValueChange={(value) =>
                      updateField("defaultRoleId", value)
                    }
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label={t("systemPage.defaults.role")}
                    >
                      <SelectValue
                        placeholder={t("systemPage.defaults.selectRole")}
                      />
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
                    {t("systemPage.defaults.roleHint")}
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="welcome-message">
                    {t("systemPage.defaults.welcome")}
                  </FieldLabel>
                  <Input
                    name="welcome-message"
                    autoComplete="off"
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
              {t("systemPage.defaults.save")}
            </SaveFooter>
          </Card>
        </TabsContent>

        <TabsContent
          value="smtp"
          className="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
        >
          <Card variant="plain" className="max-w-3xl">
            <CardHeader>
              <CardTitle>{t("systemPage.smtp.title")}</CardTitle>
              <CardDescription>
                {t("systemPage.smtp.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel htmlFor="smtp-enabled">
                    {t("systemPage.smtp.enabled")}
                  </FieldLabel>
                  <FieldDescription>
                    {t("systemPage.smtp.enabledHint")}
                  </FieldDescription>
                </div>
                <Switch
                  id="smtp-enabled"
                  aria-label={t("systemPage.smtp.enabled")}
                  checked={config.smtpEnabled}
                  onCheckedChange={(checked) =>
                    updateField("smtpEnabled", checked)
                  }
                />
              </Field>
              <Separator />

              <Field>
                <FieldLabel>{t("systemPage.smtp.preset")}</FieldLabel>
                <Select value={smtpPreset} onValueChange={applySmtpPreset}>
                  <SelectTrigger
                    className="w-full"
                    aria-label={t("systemPage.smtp.preset")}
                  >
                    <SelectValue
                      placeholder={t("systemPage.smtp.presetPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SMTP_PRESETS.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {t(`systemPage.smtp.presets.${preset.id}.name`)} -{" "}
                          {preset.host}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {activePreset
                    ? t(`systemPage.smtp.presets.${activePreset.id}.tip`)
                    : t("systemPage.smtp.presetHint")}
                </FieldDescription>
              </Field>

              <Separator />

              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="smtp-host">
                      {t("systemPage.smtp.host")}
                    </FieldLabel>
                    <Input
                      name="smtp-host"
                      autoComplete="off"
                      spellCheck={false}
                      id="smtp-host"
                      placeholder={t("systemPage.smtp.hostPlaceholder")}
                      value={config.smtpHost}
                      onChange={(event) =>
                        updateField("smtpHost", event.target.value)
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="smtp-port">
                      {t("systemPage.smtp.port")}
                    </FieldLabel>
                    <Input
                      name="smtp-port"
                      autoComplete="off"
                      id="smtp-port"
                      type="number"
                      min={1}
                      max={65535}
                      placeholder={t("systemPage.smtp.portPlaceholder")}
                      value={smtpPort}
                      onChange={(event) => setSmtpPort(event.target.value)}
                      required
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="smtp-username">
                      {t("systemPage.smtp.username")}
                    </FieldLabel>
                    <Input
                      name="smtp-username"
                      autoComplete="off"
                      spellCheck={false}
                      id="smtp-username"
                      placeholder={t("systemPage.smtp.usernamePlaceholder")}
                      value={config.smtpUsername}
                      onChange={(event) =>
                        updateField("smtpUsername", event.target.value)
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="smtp-password">
                      {t("systemPage.smtp.password")}
                    </FieldLabel>
                    <Input
                      name="smtp-password"
                      id="smtp-password"
                      type="password"
                      placeholder={t("systemPage.smtp.passwordPlaceholder")}
                      value={smtpPassword}
                      onChange={(event) => setSmtpPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="smtp-from-name">
                      {t("systemPage.smtp.fromName")}
                    </FieldLabel>
                    <Input
                      name="smtp-from-name"
                      autoComplete="off"
                      id="smtp-from-name"
                      placeholder={t("systemPage.smtp.fromNamePlaceholder")}
                      value={config.smtpFromName}
                      onChange={(event) =>
                        updateField("smtpFromName", event.target.value)
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="smtp-from-email">
                      {t("systemPage.smtp.fromEmail")}
                    </FieldLabel>
                    <Input
                      name="smtp-from-email"
                      autoComplete="off"
                      spellCheck={false}
                      id="smtp-from-email"
                      type="email"
                      placeholder={t("systemPage.smtp.fromEmailPlaceholder")}
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
                    <FieldLabel htmlFor="smtp-ssl">
                      {t("systemPage.smtp.ssl")}
                    </FieldLabel>
                    <FieldDescription>
                      {t("systemPage.smtp.sslHint")}
                    </FieldDescription>
                  </div>
                  <Switch
                    id="smtp-ssl"
                    aria-label={t("systemPage.smtp.ssl")}
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
              {t("systemPage.smtp.save")}
            </SaveFooter>
          </Card>

          <Card variant="plain" className="max-w-3xl">
            <CardHeader>
              <CardTitle>{t("systemPage.testEmail.title")}</CardTitle>
              <CardDescription>
                {t("systemPage.testEmail.description")}
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
                    <FieldLabel htmlFor="test-email">
                      {t("systemPage.testEmail.recipient")}
                    </FieldLabel>
                    <Input
                      name="test-email"
                      autoComplete="off"
                      spellCheck={false}
                      id="test-email"
                      type="email"
                      placeholder={t("systemPage.testEmail.placeholder")}
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
                {t("systemPage.testEmail.send")}
              </LoadingButton>
              {!config.smtpEnabled && (
                <span className="text-xs text-muted-foreground">
                  {t("systemPage.testEmail.disabledHint")}
                </span>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
