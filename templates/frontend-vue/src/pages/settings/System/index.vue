<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Mail } from "@lucide/vue"
import LoadingButton from "@/components/shared/LoadingButton.vue"
import PageFormSkeleton from "@/components/shared/PageFormSkeleton.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import SettingsNav from "@/components/shared/SettingsNav.vue"
import UnsavedChangesGuard from "@/components/shared/UnsavedChangesGuard.vue"
import SystemSaveFooter from "@/pages/settings/System/SystemSaveFooter.vue"
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
import { useMediaQuery } from "@vueuse/core"
import { Settings2, UserPlus } from "@lucide/vue"
import { getRoles } from "@/api/role"
import { getSystemConfig, testEmail, updateSystemConfig } from "@/api/system"
import { useSiteConfigStore } from "@/stores/site-config"
import { useToast } from "@/composables/use-toast"
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

const route = useRoute()
const router = useRouter()
const siteConfig = useSiteConfigStore()
const toast = useToast()

const config = ref<SystemConfig | null>(null)
const savedConfig = ref<SystemConfig | null>(null)
const loading = ref(true)
const saving = ref<SaveKey | null>(null)
const roles = ref<{ id: string; name: string }[]>([])

const smtpPassword = ref("")
const smtpPort = ref("")
const smtpPreset = ref("")
const testEmailAddr = ref("")
const testEmailSending = ref(false)

const activeTab = computed(() => {
  const tab = route.query.tab
  return tab === "register" || tab === "smtp" ? String(tab) : "site"
})

function setActiveTab(value: string) {
  void router.replace({ query: value === "site" ? {} : { tab: value } })
}

onMounted(async () => {
  const res = await getSystemConfig()
  if (res.code === 0) {
    config.value = { ...res.data }
    savedConfig.value = { ...res.data }
    smtpPort.value = String(res.data.smtpPort ?? "")
  } else if (res.message !== "请求已取消") {
    toast.error(res.message || "数据加载失败")
  }
  loading.value = false

  const rolesRes = await getRoles({ pageSize: 100 })
  if (rolesRes.code === 0) roles.value = rolesRes.data.list
})

function isDirty(keys: (keyof SystemConfig)[]) {
  if (!savedConfig.value || !config.value) return false
  return keys.some((key) => config.value![key] !== savedConfig.value![key])
}

const siteDirty = computed(() =>
  isDirty(["siteName", "siteDescription", "keywords"])
)
const maintenanceDirty = computed(() =>
  isDirty(["maintenanceEnabled", "maintenanceMessage"])
)
const registrationDirty = computed(() =>
  isDirty(["openRegistration", "manualReview"])
)
const defaultDirty = computed(() =>
  isDirty(["defaultRoleId", "welcomeMessage"])
)
const smtpDirty = computed(
  () =>
    isDirty([
      "smtpEnabled",
      "smtpHost",
      "smtpUsername",
      "smtpFromName",
      "smtpFromEmail",
      "smtpUseSsl",
    ]) ||
    smtpPort.value !== String(savedConfig.value?.smtpPort ?? "") ||
    smtpPassword.value.trim() !== ""
)

const pageDirty = computed(
  () =>
    siteDirty.value ||
    maintenanceDirty.value ||
    registrationDirty.value ||
    defaultDirty.value ||
    smtpDirty.value
)

const isWide = useMediaQuery("(min-width: 1024px)")

const settingsTabs = [
  { value: "site", title: "站点设置", icon: Settings2 },
  { value: "register", title: "注册设置", icon: UserPlus },
  { value: "smtp", title: "邮件配置", icon: Mail },
]

const activePreset = computed(() =>
  SMTP_PRESETS.find((preset) => preset.name === smtpPreset.value)
)

async function savePatch(
  key: SaveKey,
  patch: Partial<SystemConfig>,
  successMessage = "保存成功"
) {
  if (!config.value || !savedConfig.value) return false
  saving.value = key
  const res = await updateSystemConfig(patch)
  saving.value = null
  if (res.code !== 0) {
    toast.error(res.message || "保存失败")
    return false
  }
  savedConfig.value = { ...savedConfig.value, ...patch, smtpPassword: "" }
  config.value = { ...config.value, ...patch, smtpPassword: "" }
  toast.success(successMessage)
  return true
}

async function handleSaveSite() {
  if (!config.value?.siteName.trim()) {
    toast.error("请输入站点名称")
    return
  }
  const ok = await savePatch("site", {
    siteName: config.value.siteName,
    siteDescription: config.value.siteDescription,
    keywords: config.value.keywords,
  })
  if (ok) await siteConfig.refresh()
}

async function handleSaveMaintenance() {
  if (!config.value) return
  await savePatch("maintenance", {
    maintenanceEnabled: config.value.maintenanceEnabled,
    maintenanceMessage: config.value.maintenanceMessage,
  })
}

async function handleSaveRegistration() {
  if (!config.value) return
  await savePatch("registration", {
    openRegistration: config.value.openRegistration,
    manualReview: config.value.manualReview,
  })
}

async function handleSaveDefault() {
  if (!config.value) return
  await savePatch("default", {
    defaultRoleId: config.value.defaultRoleId,
    welcomeMessage: config.value.welcomeMessage,
  })
}

async function handleSaveSmtp() {
  if (!config.value) return
  if (
    !config.value.smtpHost.trim() ||
    !config.value.smtpUsername.trim() ||
    !config.value.smtpFromEmail.trim()
  ) {
    toast.error("请填写 SMTP 服务器、用户名和发件人邮箱")
    return
  }
  const port = Number(smtpPort.value)
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    toast.error("请输入 1-65535 之间的端口号")
    return
  }
  const patch: Partial<SystemConfig> = {
    smtpEnabled: config.value.smtpEnabled,
    smtpHost: config.value.smtpHost,
    smtpPort: port,
    smtpUsername: config.value.smtpUsername,
    smtpFromName: config.value.smtpFromName,
    smtpFromEmail: config.value.smtpFromEmail,
    smtpUseSsl: config.value.smtpUseSsl,
  }
  if (smtpPassword.value.trim()) patch.smtpPassword = smtpPassword.value

  const ok = await savePatch("smtp", patch)
  if (ok) {
    smtpPassword.value = ""
    smtpPort.value = String(port)
  }
}

async function handleTestEmail() {
  if (!testEmailAddr.value) return
  testEmailSending.value = true
  const res = await testEmail(testEmailAddr.value)
  testEmailSending.value = false
  if (res.code === 0) toast.success("测试邮件发送成功")
  else toast.error(res.message || "测试邮件发送失败")
}

function applySmtpPreset(name: string) {
  smtpPreset.value = name
  const preset = SMTP_PRESETS.find((item) => item.name === name)
  if (!preset || !config.value) return
  config.value = {
    ...config.value,
    smtpHost: preset.host,
    smtpPort: preset.port,
    smtpUseSsl: preset.ssl,
    smtpFromName: preset.fromName,
  }
  smtpPort.value = String(preset.port)
}
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <UnsavedChangesGuard :when="pageDirty" />
    <PageHeader
      title="系统设置"
      description="管理站点全局配置、注册策略与邮件服务。"
    />

    <Separator />

    <PageFormSkeleton v-if="loading" />
    <template v-else-if="config">
      <Tabs
        :model-value="activeTab"
        :orientation="isWide ? 'vertical' : 'horizontal'"
        class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-10"
        @update:model-value="setActiveTab(String($event))"
      >
        <SettingsNav :items="settingsTabs" />

        <TabsContent
          value="site"
          class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
        >
          <Card variant="plain" class="max-w-3xl">
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
                    v-model="config.siteName"
                    name="site-name"
                    autocomplete="off"
                  />
                </Field>
                <Field>
                  <FieldLabel for="site-desc">站点描述</FieldLabel>
                  <Input
                    id="site-desc"
                    v-model="config.siteDescription"
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
                    v-model="config.keywords"
                    name="site-keywords"
                    autocomplete="off"
                    :spellcheck="false"
                  />
                  <FieldDescription
                    >多个关键词用英文逗号分隔。</FieldDescription
                  >
                </Field>
              </FieldGroup>
            </CardContent>
            <SystemSaveFooter
              :dirty="siteDirty"
              :loading="saving === 'site'"
              label="保存基本信息"
              @save="handleSaveSite"
            />
          </Card>

          <Card variant="plain" class="max-w-3xl">
            <CardHeader>
              <CardTitle>维护模式</CardTitle>
              <CardDescription>
                开启后除管理员以外的用户将无法登录。
              </CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div class="flex flex-1 flex-col gap-1">
                  <FieldLabel for="maintenance-enabled">
                    开启维护模式
                  </FieldLabel>
                  <FieldDescription>
                    其他用户会看到维护提示，管理员仍可登录。
                  </FieldDescription>
                </div>
                <Switch
                  id="maintenance-enabled"
                  v-model="config.maintenanceEnabled"
                  aria-label="开启维护模式"
                />
              </Field>
              <Separator />
              <Field>
                <FieldLabel for="maintenance-message">
                  维护提示信息
                </FieldLabel>
                <Input
                  id="maintenance-message"
                  v-model="config.maintenanceMessage"
                  name="maintenance-message"
                  autocomplete="off"
                />
              </Field>
            </CardContent>
            <SystemSaveFooter
              :dirty="maintenanceDirty"
              :loading="saving === 'maintenance'"
              label="保存维护设置"
              @save="handleSaveMaintenance"
            />
          </Card>
        </TabsContent>

        <TabsContent
          value="register"
          class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
        >
          <Card variant="plain" class="max-w-3xl">
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
                  v-model="config.openRegistration"
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
                  v-model="config.manualReview"
                  aria-label="人工审核"
                  :disabled="!config.openRegistration"
                />
              </Field>
            </CardContent>
            <SystemSaveFooter
              :dirty="registrationDirty"
              :loading="saving === 'registration'"
              label="保存注册策略"
              @save="handleSaveRegistration"
            />
          </Card>

          <Card variant="plain" class="max-w-3xl">
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
                  <Select v-model="config.defaultRoleId">
                    <SelectTrigger class="w-full" aria-label="默认角色">
                      <SelectValue placeholder="请选择默认角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem
                          v-for="role in roles"
                          :key="role.id"
                          :value="role.id"
                        >
                          {{ role.name }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription
                    >新注册用户自动分配的角色。</FieldDescription
                  >
                </Field>
                <Field>
                  <FieldLabel for="welcome-message">欢迎消息</FieldLabel>
                  <Input
                    id="welcome-message"
                    v-model="config.welcomeMessage"
                    name="welcome-message"
                    autocomplete="off"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <SystemSaveFooter
              :dirty="defaultDirty"
              :loading="saving === 'default'"
              label="保存默认配置"
              @save="handleSaveDefault"
            />
          </Card>
        </TabsContent>

        <TabsContent
          value="smtp"
          class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
        >
          <Card variant="plain" class="max-w-3xl">
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
                  v-model="config.smtpEnabled"
                  aria-label="启用邮件"
                />
              </Field>
              <Separator />

              <Field>
                <FieldLabel>快捷配置</FieldLabel>
                <Select
                  :model-value="smtpPreset"
                  @update:model-value="applySmtpPreset(String($event))"
                >
                  <SelectTrigger class="w-full" aria-label="快捷配置">
                    <SelectValue placeholder="选择常用邮箱快速配置…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        v-for="preset in SMTP_PRESETS"
                        :key="preset.name"
                        :value="preset.name"
                      >
                        {{ preset.name }} - {{ preset.host }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {{
                    activePreset
                      ? activePreset.tip
                      : "选择后会自动填充服务器、端口和 SSL 配置。"
                  }}
                </FieldDescription>
              </Field>

              <Separator />

              <FieldGroup>
                <div class="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel for="smtp-host">SMTP 服务器</FieldLabel>
                    <Input
                      id="smtp-host"
                      v-model="config.smtpHost"
                      name="smtp-host"
                      autocomplete="off"
                      :spellcheck="false"
                      placeholder="例如：smtp.qq.com"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel for="smtp-port">端口</FieldLabel>
                    <Input
                      id="smtp-port"
                      v-model="smtpPort"
                      name="smtp-port"
                      autocomplete="off"
                      type="number"
                      :min="1"
                      :max="65535"
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
                      v-model="config.smtpUsername"
                      name="smtp-username"
                      autocomplete="off"
                      :spellcheck="false"
                      placeholder="例如：your@email.com"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel for="smtp-password">密码 / 授权码</FieldLabel>
                    <Input
                      id="smtp-password"
                      v-model="smtpPassword"
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
                      v-model="config.smtpFromName"
                      name="smtp-from-name"
                      autocomplete="off"
                      placeholder="例如：管理系统"
                    />
                  </Field>
                  <Field>
                    <FieldLabel for="smtp-from-email">发件人邮箱</FieldLabel>
                    <Input
                      id="smtp-from-email"
                      v-model="config.smtpFromEmail"
                      name="smtp-from-email"
                      autocomplete="off"
                      :spellcheck="false"
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
                    v-model="config.smtpUseSsl"
                    aria-label="使用 SSL"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <SystemSaveFooter
              :dirty="smtpDirty"
              :loading="saving === 'smtp'"
              label="保存邮件配置"
              @save="handleSaveSmtp"
            />
          </Card>

          <Card variant="plain" class="max-w-3xl">
            <CardHeader>
              <CardTitle>测试邮件</CardTitle>
              <CardDescription>
                发送测试邮件以验证邮件配置是否正确。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="test-email-form" @submit.prevent="handleTestEmail">
                <FieldGroup>
                  <Field>
                    <FieldLabel for="test-email">收件人邮箱</FieldLabel>
                    <Input
                      id="test-email"
                      v-model="testEmailAddr"
                      name="test-email"
                      autocomplete="off"
                      :spellcheck="false"
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
                :loading="testEmailSending"
                :disabled="!config.smtpEnabled || !testEmailAddr"
                class="w-full md:w-auto"
              >
                <Mail data-icon="inline-start" />
                发送测试邮件
              </LoadingButton>
              <span
                v-if="!config.smtpEnabled"
                class="text-xs text-muted-foreground"
              >
                请先开启“启用邮件”并保存 SMTP 配置。
              </span>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </template>
  </div>
</template>
