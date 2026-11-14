<script lang="ts">
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { page } from "$app/state"
  import type { ResolvedPathname } from "$app/types"
  import { Mail, Settings2, UserPlus } from "@lucide/svelte"
  import LoadingButton from "#lib/components/shared/loading-button.svelte"
  import PageFormSkeleton from "#lib/components/shared/page-form-skeleton.svelte"
  import PageHeader from "#lib/components/shared/page-header.svelte"
  import SettingsNav from "#lib/components/shared/settings-nav.svelte"
  import UnsavedChangesGuard from "#lib/components/shared/unsaved-changes-guard.svelte"
  import SystemSaveFooter from "./SystemSaveFooter.svelte"
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "#lib/components/ui/card/index.js"
  import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
  } from "#lib/components/ui/field/index.js"
  import { Input } from "#lib/components/ui/input/index.js"
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "#lib/components/ui/select/index.js"
  import { Separator } from "#lib/components/ui/separator/index.js"
  import { Switch } from "#lib/components/ui/switch/index.js"
  import { Tabs, TabsContent } from "#lib/components/ui/tabs/index.js"
  import { getRoles } from "#lib/api/role.js"
  import {
    getSystemConfig,
    testEmail,
    updateSystemConfig,
  } from "#lib/api/system.js"
  import { useMediaQuery } from "#lib/hooks/use-media-query.svelte.js"
  import { t } from "#lib/i18n.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { siteConfig } from "#lib/stores/site-config.svelte.js"
  import type { SystemConfig } from "#lib/types/system.js"

  type SaveKey = "site" | "maintenance" | "registration" | "default" | "smtp"

  const SMTP_PRESETS = [
    {
      key: "qq",
      name: "QQ 邮箱",
      host: "smtp.qq.com",
      port: 465,
      ssl: true,
      fromName: "QQ邮箱",
      tip: "需要开启 SMTP 服务并获取授权码",
    },
    {
      key: "net163",
      name: "163 邮箱",
      host: "smtp.163.com",
      port: 465,
      ssl: true,
      fromName: "163邮箱",
      tip: "需要开启 SMTP 服务并设置授权码",
    },
    {
      key: "gmail",
      name: "Gmail",
      host: "smtp.gmail.com",
      port: 587,
      ssl: true,
      fromName: "Gmail",
      tip: "需要开启两步验证并生成应用专用密码",
    },
    {
      key: "outlook",
      name: "Outlook",
      host: "smtp.office365.com",
      port: 587,
      ssl: true,
      fromName: "Outlook",
      tip: "使用 Outlook 或 Hotmail 账号",
    },
    {
      key: "wecom",
      name: "企业微信邮箱",
      host: "smtp.exmail.qq.com",
      port: 465,
      ssl: true,
      fromName: "企业微信邮箱",
      tip: "使用企业微信邮箱账号",
    },
    {
      key: "aliyun",
      name: "阿里企业邮箱",
      host: "smtp.mxhichina.com",
      port: 465,
      ssl: true,
      fromName: "阿里企业邮箱",
      tip: "使用阿里企业邮箱账号",
    },
    {
      key: "foxmail",
      name: "Foxmail",
      host: "smtp.qq.com",
      port: 465,
      ssl: true,
      fromName: "Foxmail",
      tip: "Foxmail 使用 QQ 邮箱 SMTP 服务器",
    },
  ]

  const toast = useToast()

  let config = $state<SystemConfig | null>(null)
  let savedConfig = $state<SystemConfig | null>(null)
  let loading = $state(true)
  let saving = $state<SaveKey | null>(null)
  let roles = $state<{ id: string; name: string }[]>([])

  let smtpPassword = $state("")
  let smtpPort = $state("")
  let smtpPreset = $state("")
  let testEmailAddr = $state("")
  let testEmailSending = $state(false)

  const activeTab = $derived(
    page.url.searchParams.get("tab") === "register" ||
      page.url.searchParams.get("tab") === "smtp"
      ? String(page.url.searchParams.get("tab"))
      : "site"
  )

  function setActiveTab(value: string) {
    const search = value === "site" ? "" : `?tab=${value}`
    void goto(
      `${page.url.pathname}${search}${page.url.hash}` as ResolvedPathname,
      {
        replace: true,
        reset: false,
      }
    )
  }

  onMount(async () => {
    const res = await getSystemConfig()
    if (res.code === 0) {
      config = { ...res.data }
      savedConfig = { ...res.data }
      smtpPort = String(res.data.smtpPort ?? "")
    } else if (res.message !== $t("errors.requestCancelled")) {
      toast.error(res.message || $t("systemPage.loadFailed"))
    }
    loading = false

    const rolesRes = await getRoles({ pageSize: 100 })
    if (rolesRes.code === 0) roles = rolesRes.data.list
  })

  function isDirty(keys: (keyof SystemConfig)[]) {
    if (!savedConfig || !config) return false
    const current = config
    const saved = savedConfig
    return keys.some((key) => current[key] !== saved[key])
  }

  const siteDirty = $derived(
    isDirty(["siteName", "siteDescription", "keywords"])
  )
  const maintenanceDirty = $derived(
    isDirty(["maintenanceEnabled", "maintenanceMessage"])
  )
  const registrationDirty = $derived(
    isDirty(["openRegistration", "manualReview"])
  )
  const defaultDirty = $derived(isDirty(["defaultRoleId", "welcomeMessage"]))
  const smtpDirty = $derived(
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
  )

  const pageDirty = $derived(
    siteDirty ||
      maintenanceDirty ||
      registrationDirty ||
      defaultDirty ||
      smtpDirty
  )

  const isWide = useMediaQuery("(min-width: 1024px)")

  const settingsTabs = $derived([
    { value: "site", title: $t("systemPage.tabs.site"), icon: Settings2 },
    {
      value: "register",
      title: $t("systemPage.tabs.register"),
      icon: UserPlus,
    },
    { value: "smtp", title: $t("systemPage.tabs.smtp"), icon: Mail },
  ])

  const activePreset = $derived(
    SMTP_PRESETS.find((preset) => preset.name === smtpPreset)
  )
  const roleItems = $derived(
    roles.map((role) => ({
      value: role.id,
      label: $t(`roles.${role.id}`, { defaultValue: role.name }),
    }))
  )
  const smtpPresetItems = $derived(
    SMTP_PRESETS.map((preset) => ({
      value: preset.name,
      label: `${$t(`systemPage.smtp.presets.${preset.key}.name`, {
        defaultValue: preset.name,
      })} - ${preset.host}`,
    }))
  )

  async function savePatch(
    key: SaveKey,
    patch: Partial<SystemConfig>,
    successMessage = $t("systemPage.saveSuccess")
  ) {
    if (!config || !savedConfig) return false
    saving = key
    const res = await updateSystemConfig(patch)
    saving = null
    if (res.code !== 0) {
      toast.error(res.message || $t("systemPage.saveFailed"))
      return false
    }
    savedConfig = { ...savedConfig, ...patch, smtpPassword: "" }
    config = { ...config, ...patch, smtpPassword: "" }
    toast.success(successMessage)
    return true
  }

  async function handleSaveSite() {
    if (!config?.siteName.trim()) {
      toast.error($t("systemPage.site.nameRequired"))
      return
    }
    const ok = await savePatch("site", {
      siteName: config.siteName,
      siteDescription: config.siteDescription,
      keywords: config.keywords,
    })
    if (ok) await siteConfig.refresh()
  }

  async function handleSaveMaintenance() {
    if (!config) return
    await savePatch("maintenance", {
      maintenanceEnabled: config.maintenanceEnabled,
      maintenanceMessage: config.maintenanceMessage,
    })
  }

  async function handleSaveRegistration() {
    if (!config) return
    await savePatch("registration", {
      openRegistration: config.openRegistration,
      manualReview: config.manualReview,
    })
  }

  async function handleSaveDefault() {
    if (!config) return
    await savePatch("default", {
      defaultRoleId: config.defaultRoleId,
      welcomeMessage: config.welcomeMessage,
    })
  }

  async function handleSaveSmtp() {
    if (!config) return
    if (
      !config.smtpHost.trim() ||
      !config.smtpUsername.trim() ||
      !config.smtpFromEmail.trim()
    ) {
      toast.error($t("systemPage.smtp.required"))
      return
    }
    const port = Number(smtpPort)
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      toast.error($t("systemPage.smtp.invalidPort"))
      return
    }
    const patch: Partial<SystemConfig> = {
      smtpEnabled: config.smtpEnabled,
      smtpHost: config.smtpHost,
      smtpPort: port,
      smtpUsername: config.smtpUsername,
      smtpFromName: config.smtpFromName,
      smtpFromEmail: config.smtpFromEmail,
      smtpUseSsl: config.smtpUseSsl,
    }
    if (smtpPassword.trim()) patch.smtpPassword = smtpPassword

    const ok = await savePatch("smtp", patch)
    if (ok) {
      smtpPassword = ""
      smtpPort = String(port)
    }
  }

  async function handleTestEmail() {
    if (!testEmailAddr) return
    testEmailSending = true
    const res = await testEmail(testEmailAddr)
    testEmailSending = false
    if (res.code === 0) toast.success($t("systemPage.testEmail.success"))
    else toast.error(res.message || $t("systemPage.testEmail.failed"))
  }

  function applySmtpPreset(name: string) {
    smtpPreset = name
    const preset = SMTP_PRESETS.find((item) => item.name === name)
    if (!preset || !config) return
    config = {
      ...config,
      smtpHost: preset.host,
      smtpPort: preset.port,
      smtpUseSsl: preset.ssl,
      smtpFromName: preset.fromName,
    }
    smtpPort = String(preset.port)
  }
</script>

<svelte:head
  ><title
    >{$t("systemPage.title")} · {siteConfig.config?.siteName?.trim() ||
      $t("pwa.defaultName")}</title
  ></svelte:head
>

<div class="flex flex-col gap-(--page-gap)">
  <UnsavedChangesGuard when={pageDirty} />
  <PageHeader
    title={$t("systemPage.title")}
    description={$t("systemPage.description")}
  />

  <Separator />

  {#if loading}
    <PageFormSkeleton />
  {:else if config}
    <Tabs
      value={activeTab}
      orientation={isWide.matches ? "vertical" : "horizontal"}
      class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-12"
      onValueChange={(value) => setActiveTab(value)}
    >
      <SettingsNav items={settingsTabs} />

      <TabsContent
        value="site"
        class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
      >
        <Card variant="plain" class="max-w-3xl">
          <CardHeader>
            <CardTitle>{$t("systemPage.site.title")}</CardTitle>
            <CardDescription
              >{$t("systemPage.site.description")}</CardDescription
            >
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel for="site-name"
                  >{$t("systemPage.site.name")}</FieldLabel
                >
                <Input
                  id="site-name"
                  bind:value={config.siteName}
                  name="site-name"
                  autocomplete="off"
                />
              </Field>
              <Field>
                <FieldLabel for="site-desc"
                  >{$t("systemPage.site.descriptionLabel")}</FieldLabel
                >
                <Input
                  id="site-desc"
                  bind:value={config.siteDescription}
                  name="site-desc"
                  autocomplete="off"
                />
                <FieldDescription
                  >{$t("systemPage.site.descriptionHint")}</FieldDescription
                >
              </Field>
              <Field>
                <FieldLabel for="site-keywords"
                  >{$t("systemPage.site.keywords")}</FieldLabel
                >
                <Input
                  id="site-keywords"
                  bind:value={config.keywords}
                  name="site-keywords"
                  autocomplete="off"
                  spellcheck={false}
                />
                <FieldDescription
                  >{$t("systemPage.site.keywordsHint")}</FieldDescription
                >
              </Field>
            </FieldGroup>
          </CardContent>
          <SystemSaveFooter
            dirty={siteDirty}
            loading={saving === "site"}
            label={$t("systemPage.site.save")}
            onSave={() => void handleSaveSite()}
          />
        </Card>

        <Card variant="plain" class="max-w-3xl">
          <CardHeader>
            <CardTitle>{$t("systemPage.maintenance.title")}</CardTitle>
            <CardDescription
              >{$t("systemPage.maintenance.description")}</CardDescription
            >
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <Field orientation="horizontal">
              <div class="flex flex-1 flex-col gap-1">
                <FieldLabel for="maintenance-enabled"
                  >{$t("systemPage.maintenance.enabled")}</FieldLabel
                >
                <FieldDescription
                  >{$t("systemPage.maintenance.enabledHint")}</FieldDescription
                >
              </div>
              <Switch
                id="maintenance-enabled"
                bind:checked={config.maintenanceEnabled}
                aria-label={$t("systemPage.maintenance.enabled")}
              />
            </Field>
            <Separator />
            <Field>
              <FieldLabel for="maintenance-message"
                >{$t("systemPage.maintenance.message")}</FieldLabel
              >
              <Input
                id="maintenance-message"
                bind:value={config.maintenanceMessage}
                name="maintenance-message"
                autocomplete="off"
              />
            </Field>
          </CardContent>
          <SystemSaveFooter
            dirty={maintenanceDirty}
            loading={saving === "maintenance"}
            label={$t("systemPage.maintenance.save")}
            onSave={() => void handleSaveMaintenance()}
          />
        </Card>
      </TabsContent>

      <TabsContent
        value="register"
        class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
      >
        <Card variant="plain" class="max-w-3xl">
          <CardHeader>
            <CardTitle>{$t("systemPage.registration.title")}</CardTitle>
            <CardDescription
              >{$t("systemPage.registration.description")}</CardDescription
            >
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <Field orientation="horizontal">
              <div class="flex flex-1 flex-col gap-1">
                <FieldLabel for="open-registration"
                  >{$t("systemPage.registration.open")}</FieldLabel
                >
                <FieldDescription
                  >{$t("systemPage.registration.openHint")}</FieldDescription
                >
              </div>
              <Switch
                id="open-registration"
                bind:checked={config.openRegistration}
                aria-label={$t("systemPage.registration.open")}
              />
            </Field>
            <Separator />
            <Field orientation="horizontal">
              <div class="flex flex-1 flex-col gap-1">
                <FieldLabel for="manual-review"
                  >{$t("systemPage.registration.manual")}</FieldLabel
                >
                <FieldDescription
                  >{$t("systemPage.registration.manualHint")}</FieldDescription
                >
              </div>
              <Switch
                id="manual-review"
                bind:checked={config.manualReview}
                aria-label={$t("systemPage.registration.manual")}
                disabled={!config.openRegistration}
              />
            </Field>
          </CardContent>
          <SystemSaveFooter
            dirty={registrationDirty}
            loading={saving === "registration"}
            label={$t("systemPage.registration.save")}
            onSave={() => void handleSaveRegistration()}
          />
        </Card>

        <Card variant="plain" class="max-w-3xl">
          <CardHeader>
            <CardTitle>{$t("systemPage.defaults.title")}</CardTitle>
            <CardDescription
              >{$t("systemPage.defaults.description")}</CardDescription
            >
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>{$t("systemPage.defaults.role")}</FieldLabel>
                <Select
                  type="single"
                  items={roleItems}
                  bind:value={config.defaultRoleId}
                >
                  <SelectTrigger
                    class="w-full"
                    aria-label={$t("systemPage.defaults.role")}
                  >
                    <SelectValue
                      placeholder={$t("systemPage.defaults.selectRole")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {#each roles as role (role.id)}
                        <SelectItem
                          value={role.id}
                          label={$t(`roles.${role.id}`, {
                            defaultValue: role.name,
                          })}
                          >{$t(`roles.${role.id}`, {
                            defaultValue: role.name,
                          })}</SelectItem
                        >
                      {/each}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription
                  >{$t("systemPage.defaults.roleHint")}</FieldDescription
                >
              </Field>
              <Field>
                <FieldLabel for="welcome-message"
                  >{$t("systemPage.defaults.welcome")}</FieldLabel
                >
                <Input
                  id="welcome-message"
                  bind:value={config.welcomeMessage}
                  name="welcome-message"
                  autocomplete="off"
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <SystemSaveFooter
            dirty={defaultDirty}
            loading={saving === "default"}
            label={$t("systemPage.defaults.save")}
            onSave={() => void handleSaveDefault()}
          />
        </Card>
      </TabsContent>

      <TabsContent
        value="smtp"
        class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
      >
        <Card variant="plain" class="max-w-3xl">
          <CardHeader>
            <CardTitle>{$t("systemPage.smtp.title")}</CardTitle>
            <CardDescription
              >{$t("systemPage.smtp.description")}</CardDescription
            >
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <Field orientation="horizontal">
              <div class="flex flex-1 flex-col gap-1">
                <FieldLabel for="smtp-enabled"
                  >{$t("systemPage.smtp.enabled")}</FieldLabel
                >
                <FieldDescription
                  >{$t("systemPage.smtp.enabledHint")}</FieldDescription
                >
              </div>
              <Switch
                id="smtp-enabled"
                bind:checked={config.smtpEnabled}
                aria-label={$t("systemPage.smtp.enabled")}
              />
            </Field>
            <Separator />

            <Field>
              <FieldLabel>{$t("systemPage.smtp.preset")}</FieldLabel>
              <Select
                type="single"
                items={smtpPresetItems}
                value={smtpPreset}
                onValueChange={(value) => applySmtpPreset(value)}
              >
                <SelectTrigger
                  class="w-full"
                  aria-label={$t("systemPage.smtp.preset")}
                >
                  <SelectValue
                    placeholder={$t("systemPage.smtp.presetPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {#each SMTP_PRESETS as preset (preset.name)}
                      <SelectItem
                        value={preset.name}
                        label={`${$t(
                          `systemPage.smtp.presets.${preset.key}.name`,
                          { defaultValue: preset.name }
                        )} - ${preset.host}`}
                      >
                        {$t(`systemPage.smtp.presets.${preset.key}.name`, {
                          defaultValue: preset.name,
                        })} - {preset.host}
                      </SelectItem>
                    {/each}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                {activePreset
                  ? $t(`systemPage.smtp.presets.${activePreset.key}.tip`, {
                      defaultValue: activePreset.tip,
                    })
                  : $t("systemPage.smtp.presetHint")}
              </FieldDescription>
            </Field>

            <Separator />

            <FieldGroup>
              <div class="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel for="smtp-host"
                    >{$t("systemPage.smtp.host")}</FieldLabel
                  >
                  <Input
                    id="smtp-host"
                    bind:value={config.smtpHost}
                    name="smtp-host"
                    autocomplete="off"
                    spellcheck={false}
                    placeholder={$t("systemPage.smtp.hostPlaceholder")}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel for="smtp-port"
                    >{$t("systemPage.smtp.port")}</FieldLabel
                  >
                  <Input
                    id="smtp-port"
                    bind:value={smtpPort}
                    name="smtp-port"
                    autocomplete="off"
                    type="number"
                    min={1}
                    max={65535}
                    placeholder={$t("systemPage.smtp.portPlaceholder")}
                    required
                  />
                </Field>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel for="smtp-username"
                    >{$t("systemPage.smtp.username")}</FieldLabel
                  >
                  <Input
                    id="smtp-username"
                    bind:value={config.smtpUsername}
                    name="smtp-username"
                    autocomplete="off"
                    spellcheck={false}
                    placeholder={$t("systemPage.smtp.usernamePlaceholder")}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel for="smtp-password"
                    >{$t("systemPage.smtp.password")}</FieldLabel
                  >
                  <Input
                    id="smtp-password"
                    bind:value={smtpPassword}
                    name="smtp-password"
                    type="password"
                    placeholder={$t("systemPage.smtp.passwordPlaceholder")}
                    autocomplete="new-password"
                  />
                </Field>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel for="smtp-from-name"
                    >{$t("systemPage.smtp.fromName")}</FieldLabel
                  >
                  <Input
                    id="smtp-from-name"
                    bind:value={config.smtpFromName}
                    name="smtp-from-name"
                    autocomplete="off"
                    placeholder={$t("systemPage.smtp.fromNamePlaceholder")}
                  />
                </Field>
                <Field>
                  <FieldLabel for="smtp-from-email"
                    >{$t("systemPage.smtp.fromEmail")}</FieldLabel
                  >
                  <Input
                    id="smtp-from-email"
                    bind:value={config.smtpFromEmail}
                    name="smtp-from-email"
                    autocomplete="off"
                    spellcheck={false}
                    type="email"
                    placeholder={$t("systemPage.smtp.fromEmailPlaceholder")}
                    required
                  />
                </Field>
              </div>
              <Field orientation="horizontal">
                <div class="flex flex-1 flex-col gap-1">
                  <FieldLabel for="smtp-ssl"
                    >{$t("systemPage.smtp.ssl")}</FieldLabel
                  >
                  <FieldDescription
                    >{$t("systemPage.smtp.sslHint")}</FieldDescription
                  >
                </div>
                <Switch
                  id="smtp-ssl"
                  bind:checked={config.smtpUseSsl}
                  aria-label={$t("systemPage.smtp.ssl")}
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <SystemSaveFooter
            dirty={smtpDirty}
            loading={saving === "smtp"}
            label={$t("systemPage.smtp.save")}
            onSave={() => void handleSaveSmtp()}
          />
        </Card>

        <Card variant="plain" class="max-w-3xl">
          <CardHeader>
            <CardTitle>{$t("systemPage.testEmail.title")}</CardTitle>
            <CardDescription
              >{$t("systemPage.testEmail.description")}</CardDescription
            >
          </CardHeader>
          <CardContent>
            <form
              id="test-email-form"
              onsubmit={(event) => {
                event.preventDefault()
                void handleTestEmail()
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel for="test-email"
                    >{$t("systemPage.testEmail.recipient")}</FieldLabel
                  >
                  <Input
                    id="test-email"
                    bind:value={testEmailAddr}
                    name="test-email"
                    autocomplete="off"
                    spellcheck={false}
                    type="email"
                    placeholder={$t("systemPage.testEmail.placeholder")}
                    required
                  />
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter class="flex flex-col items-start gap-2">
            <LoadingButton
              type="submit"
              form="test-email-form"
              loading={testEmailSending}
              disabled={!config.smtpEnabled || !testEmailAddr}
              class="w-full md:w-auto"
            >
              <Mail data-icon="inline-start" />
              {$t("systemPage.testEmail.send")}
            </LoadingButton>
            {#if !config.smtpEnabled}
              <span class="text-xs text-muted-foreground">
                {$t("systemPage.testEmail.disabledHint")}
              </span>
            {/if}
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  {/if}
</div>
