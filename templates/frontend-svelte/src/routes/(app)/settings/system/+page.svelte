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
  import { useToast } from "#lib/hooks/use-toast.js"
  import { siteConfig } from "#lib/stores/site-config.svelte.js"
  import { cn } from "#lib/utils.js"
  import type { SystemConfig } from "#lib/types/system.js"

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

  /** 设置页的扁平分区：去掉卡片边框与底色，仅保留内容间距 */
  const PLAIN_CARD = cn(
    "gap-5 overflow-visible bg-transparent py-0 shadow-none ring-0 [--card-spacing:0px]",
    "[&>[data-slot=card-header]]:border-b [&>[data-slot=card-header]]:pb-4",
    "[&_[data-slot=card-title]]:text-lg"
  )

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
    } else if (res.message !== "请求已取消") {
      toast.error(res.message || "数据加载失败")
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

  const settingsTabs = [
    { value: "site", title: "站点设置", icon: Settings2 },
    { value: "register", title: "注册设置", icon: UserPlus },
    { value: "smtp", title: "邮件配置", icon: Mail },
  ]

  const activePreset = $derived(
    SMTP_PRESETS.find((preset) => preset.name === smtpPreset)
  )
  const roleItems = $derived(
    roles.map((role) => ({ value: role.id, label: role.name }))
  )
  const smtpPresetItems = SMTP_PRESETS.map((preset) => ({
    value: preset.name,
    label: `${preset.name} - ${preset.host}`,
  }))

  async function savePatch(
    key: SaveKey,
    patch: Partial<SystemConfig>,
    successMessage = "保存成功"
  ) {
    if (!config || !savedConfig) return false
    saving = key
    const res = await updateSystemConfig(patch)
    saving = null
    if (res.code !== 0) {
      toast.error(res.message || "保存失败")
      return false
    }
    savedConfig = { ...savedConfig, ...patch, smtpPassword: "" }
    config = { ...config, ...patch, smtpPassword: "" }
    toast.success(successMessage)
    return true
  }

  async function handleSaveSite() {
    if (!config?.siteName.trim()) {
      toast.error("请输入站点名称")
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
      toast.error("请填写 SMTP 服务器、用户名和发件人邮箱")
      return
    }
    const port = Number(smtpPort)
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      toast.error("请输入 1-65535 之间的端口号")
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
    if (res.code === 0) toast.success("测试邮件发送成功")
    else toast.error(res.message || "测试邮件发送失败")
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

<svelte:head><title>系统设置 · 管理系统</title></svelte:head>

<div class="flex flex-col gap-(--page-gap)">
  <UnsavedChangesGuard when={pageDirty} />
  <PageHeader
    title="系统设置"
    description="管理站点全局配置、注册策略与邮件服务。"
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
        <Card class={cn(PLAIN_CARD, "max-w-3xl")}>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>配置站点名称、描述等基本信息。</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel for="site-name">站点名称</FieldLabel>
                <Input
                  id="site-name"
                  bind:value={config.siteName}
                  name="site-name"
                  autocomplete="off"
                />
              </Field>
              <Field>
                <FieldLabel for="site-desc">站点描述</FieldLabel>
                <Input
                  id="site-desc"
                  bind:value={config.siteDescription}
                  name="site-desc"
                  autocomplete="off"
                />
                <FieldDescription>
                  显示在浏览器标签和搜索结果中。
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel for="site-keywords">关键词</FieldLabel>
                <Input
                  id="site-keywords"
                  bind:value={config.keywords}
                  name="site-keywords"
                  autocomplete="off"
                  spellcheck={false}
                />
                <FieldDescription>多个关键词用英文逗号分隔。</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
          <SystemSaveFooter
            dirty={siteDirty}
            loading={saving === "site"}
            label="保存基本信息"
            onSave={() => void handleSaveSite()}
          />
        </Card>

        <Card class={cn(PLAIN_CARD, "max-w-3xl")}>
          <CardHeader>
            <CardTitle>维护模式</CardTitle>
            <CardDescription>
              开启后除管理员以外的用户将无法登录。
            </CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <Field orientation="horizontal">
              <div class="flex flex-1 flex-col gap-1">
                <FieldLabel for="maintenance-enabled">开启维护模式</FieldLabel>
                <FieldDescription>
                  其他用户会看到维护提示，管理员仍可登录。
                </FieldDescription>
              </div>
              <Switch
                id="maintenance-enabled"
                bind:checked={config.maintenanceEnabled}
                aria-label="开启维护模式"
              />
            </Field>
            <Separator />
            <Field>
              <FieldLabel for="maintenance-message">维护提示信息</FieldLabel>
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
            label="保存维护设置"
            onSave={() => void handleSaveMaintenance()}
          />
        </Card>
      </TabsContent>

      <TabsContent
        value="register"
        class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
      >
        <Card class={cn(PLAIN_CARD, "max-w-3xl")}>
          <CardHeader>
            <CardTitle>注册策略</CardTitle>
            <CardDescription>控制用户注册方式和验证流程。</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <Field orientation="horizontal">
              <div class="flex flex-1 flex-col gap-1">
                <FieldLabel for="open-registration">开放注册</FieldLabel>
                <FieldDescription>允许新用户自行注册账号。</FieldDescription>
              </div>
              <Switch
                id="open-registration"
                bind:checked={config.openRegistration}
                aria-label="开放注册"
              />
            </Field>
            <Separator />
            <Field orientation="horizontal">
              <div class="flex flex-1 flex-col gap-1">
                <FieldLabel for="manual-review">人工审核</FieldLabel>
                <FieldDescription>
                  新注册用户需要管理员审核后才能使用系统。
                </FieldDescription>
              </div>
              <Switch
                id="manual-review"
                bind:checked={config.manualReview}
                aria-label="人工审核"
                disabled={!config.openRegistration}
              />
            </Field>
          </CardContent>
          <SystemSaveFooter
            dirty={registrationDirty}
            loading={saving === "registration"}
            label="保存注册策略"
            onSave={() => void handleSaveRegistration()}
          />
        </Card>

        <Card class={cn(PLAIN_CARD, "max-w-3xl")}>
          <CardHeader>
            <CardTitle>默认配置</CardTitle>
            <CardDescription>新注册用户的默认角色和欢迎信息。</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>默认角色</FieldLabel>
                <Select
                  type="single"
                  items={roleItems}
                  bind:value={config.defaultRoleId}
                >
                  <SelectTrigger class="w-full" aria-label="默认角色">
                    <SelectValue placeholder="请选择默认角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {#each roles as role (role.id)}
                        <SelectItem value={role.id} label={role.name}
                          >{role.name}</SelectItem
                        >
                      {/each}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>新注册用户自动分配的角色。</FieldDescription>
              </Field>
              <Field>
                <FieldLabel for="welcome-message">欢迎消息</FieldLabel>
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
            label="保存默认配置"
            onSave={() => void handleSaveDefault()}
          />
        </Card>
      </TabsContent>

      <TabsContent
        value="smtp"
        class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
      >
        <Card class={cn(PLAIN_CARD, "max-w-3xl")}>
          <CardHeader>
            <CardTitle>SMTP 邮件配置</CardTitle>
            <CardDescription>
              配置邮件服务器，用于发送系统通知邮件。
            </CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <Field orientation="horizontal">
              <div class="flex flex-1 flex-col gap-1">
                <FieldLabel for="smtp-enabled">启用邮件</FieldLabel>
                <FieldDescription>
                  开启后系统将通过 SMTP 发送邮件。
                </FieldDescription>
              </div>
              <Switch
                id="smtp-enabled"
                bind:checked={config.smtpEnabled}
                aria-label="启用邮件"
              />
            </Field>
            <Separator />

            <Field>
              <FieldLabel>快捷配置</FieldLabel>
              <Select
                type="single"
                items={smtpPresetItems}
                value={smtpPreset}
                onValueChange={(value) => applySmtpPreset(value)}
              >
                <SelectTrigger class="w-full" aria-label="快捷配置">
                  <SelectValue placeholder="选择常用邮箱快速配置…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {#each SMTP_PRESETS as preset (preset.name)}
                      <SelectItem
                        value={preset.name}
                        label={`${preset.name} - ${preset.host}`}
                      >
                        {preset.name} - {preset.host}
                      </SelectItem>
                    {/each}
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
              <div class="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel for="smtp-host">SMTP 服务器</FieldLabel>
                  <Input
                    id="smtp-host"
                    bind:value={config.smtpHost}
                    name="smtp-host"
                    autocomplete="off"
                    spellcheck={false}
                    placeholder="例如：smtp.qq.com"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel for="smtp-port">端口</FieldLabel>
                  <Input
                    id="smtp-port"
                    bind:value={smtpPort}
                    name="smtp-port"
                    autocomplete="off"
                    type="number"
                    min={1}
                    max={65535}
                    placeholder="例如：587"
                    required
                  />
                </Field>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel for="smtp-username">用户名</FieldLabel>
                  <Input
                    id="smtp-username"
                    bind:value={config.smtpUsername}
                    name="smtp-username"
                    autocomplete="off"
                    spellcheck={false}
                    placeholder="例如：your@email.com"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel for="smtp-password">密码 / 授权码</FieldLabel>
                  <Input
                    id="smtp-password"
                    bind:value={smtpPassword}
                    name="smtp-password"
                    type="password"
                    placeholder="留空保持不变"
                    autocomplete="new-password"
                  />
                </Field>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel for="smtp-from-name">发件人名称</FieldLabel>
                  <Input
                    id="smtp-from-name"
                    bind:value={config.smtpFromName}
                    name="smtp-from-name"
                    autocomplete="off"
                    placeholder="例如：管理系统"
                  />
                </Field>
                <Field>
                  <FieldLabel for="smtp-from-email">发件人邮箱</FieldLabel>
                  <Input
                    id="smtp-from-email"
                    bind:value={config.smtpFromEmail}
                    name="smtp-from-email"
                    autocomplete="off"
                    spellcheck={false}
                    type="email"
                    placeholder="例如：noreply@example.com"
                    required
                  />
                </Field>
              </div>
              <Field orientation="horizontal">
                <div class="flex flex-1 flex-col gap-1">
                  <FieldLabel for="smtp-ssl">使用 SSL</FieldLabel>
                  <FieldDescription>
                    大多数邮件服务器需要开启 SSL。
                  </FieldDescription>
                </div>
                <Switch
                  id="smtp-ssl"
                  bind:checked={config.smtpUseSsl}
                  aria-label="使用 SSL"
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <SystemSaveFooter
            dirty={smtpDirty}
            loading={saving === "smtp"}
            label="保存邮件配置"
            onSave={() => void handleSaveSmtp()}
          />
        </Card>

        <Card class={cn(PLAIN_CARD, "max-w-3xl")}>
          <CardHeader>
            <CardTitle>测试邮件</CardTitle>
            <CardDescription>
              发送测试邮件以验证邮件配置是否正确。
            </CardDescription>
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
                  <FieldLabel for="test-email">收件人邮箱</FieldLabel>
                  <Input
                    id="test-email"
                    bind:value={testEmailAddr}
                    name="test-email"
                    autocomplete="off"
                    spellcheck={false}
                    type="email"
                    placeholder="请输入测试收件人邮箱"
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
              发送测试邮件
            </LoadingButton>
            {#if !config.smtpEnabled}
              <span class="text-xs text-muted-foreground">
                请先开启“启用邮件”并保存 SMTP 配置。
              </span>
            {/if}
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  {/if}
</div>
