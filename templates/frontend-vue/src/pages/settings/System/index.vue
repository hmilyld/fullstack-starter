<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
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
import type { Locale } from "@/lib/i18n"
import { translateOr } from "@/lib/label"

type SaveKey = "site" | "maintenance" | "registration" | "default" | "smtp"

const SMTP_PRESETS = [
  { id: "qq", host: "smtp.qq.com", port: 465, ssl: true },
  { id: "net163", host: "smtp.163.com", port: 465, ssl: true },
  { id: "gmail", host: "smtp.gmail.com", port: 587, ssl: true },
  { id: "outlook", host: "smtp.office365.com", port: 587, ssl: true },
  { id: "wecom", host: "smtp.exmail.qq.com", port: 465, ssl: true },
  { id: "aliyun", host: "smtp.mxhichina.com", port: 465, ssl: true },
  { id: "foxmail", host: "smtp.qq.com", port: 465, ssl: true },
] as const

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en", label: "English" },
]

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const siteConfig = useSiteConfigStore()
const toast = useToast()

const config = ref<SystemConfig | null>(null)
const savedConfig = ref<SystemConfig | null>(null)
const loading = ref(true)
const saving = ref<SaveKey | null>(null)
const roles = ref<{ id: string; name: string }[]>([])

function roleLabel(role: { id: string; name: string }) {
  return translateOr(`roles.${role.id}`, role.name)
}

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
    toast.error(res.message || t("systemPage.loadFailed"))
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
  isDirty(["siteName", "siteDescription", "keywords", "defaultLocale"])
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

const settingsTabs = computed(() => [
  { value: "site", title: t("systemPage.tabs.site"), icon: Settings2 },
  { value: "register", title: t("systemPage.tabs.register"), icon: UserPlus },
  { value: "smtp", title: t("systemPage.tabs.smtp"), icon: Mail },
])

const activePreset = computed(() =>
  SMTP_PRESETS.find((preset) => preset.id === smtpPreset.value)
)

async function savePatch(
  key: SaveKey,
  patch: Partial<SystemConfig>,
  successMessage = t("systemPage.saveSuccess")
) {
  if (!config.value || !savedConfig.value) return false
  saving.value = key
  const res = await updateSystemConfig(patch)
  saving.value = null
  if (res.code !== 0) {
    toast.error(res.message || t("systemPage.saveFailed"))
    return false
  }
  savedConfig.value = { ...savedConfig.value, ...patch, smtpPassword: "" }
  config.value = { ...config.value, ...patch, smtpPassword: "" }
  toast.success(successMessage)
  return true
}

async function handleSaveSite() {
  if (!config.value?.siteName.trim()) {
    toast.error(t("systemPage.site.nameRequired"))
    return
  }
  const ok = await savePatch("site", {
    siteName: config.value.siteName,
    siteDescription: config.value.siteDescription,
    keywords: config.value.keywords,
    defaultLocale: config.value.defaultLocale,
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
    toast.error(t("systemPage.smtp.required"))
    return
  }
  const port = Number(smtpPort.value)
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    toast.error(t("systemPage.smtp.invalidPort"))
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
  if (res.code === 0) toast.success(t("systemPage.testEmail.success"))
  else toast.error(res.message || t("systemPage.testEmail.failed"))
}

function applySmtpPreset(id: string) {
  smtpPreset.value = id
  const preset = SMTP_PRESETS.find((item) => item.id === id)
  if (!preset || !config.value) return
  config.value = {
    ...config.value,
    smtpHost: preset.host,
    smtpPort: preset.port,
    smtpUseSsl: preset.ssl,
    smtpFromName: t(`systemPage.smtp.presets.${preset.id}.name`),
  }
  smtpPort.value = String(preset.port)
}
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <UnsavedChangesGuard :when="pageDirty" />
    <PageHeader
      :title="t('systemPage.title')"
      :description="t('systemPage.description')"
    />

    <Separator />

    <PageFormSkeleton v-if="loading" />
    <template v-else-if="config">
      <Tabs
        :model-value="activeTab"
        :orientation="isWide ? 'vertical' : 'horizontal'"
        class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-12"
        @update:model-value="setActiveTab(String($event))"
      >
        <SettingsNav :items="settingsTabs" />

        <TabsContent
          value="site"
          class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
        >
          <Card variant="plain" class="max-w-3xl">
            <CardHeader>
              <CardTitle>{{ t("systemPage.site.title") }}</CardTitle>
              <CardDescription>{{
                t("systemPage.site.description")
              }}</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel for="site-name">{{
                    t("systemPage.site.name")
                  }}</FieldLabel>
                  <Input
                    id="site-name"
                    v-model="config.siteName"
                    name="site-name"
                    autocomplete="off"
                  />
                </Field>
                <Field>
                  <FieldLabel for="site-desc">{{
                    t("systemPage.site.descriptionLabel")
                  }}</FieldLabel>
                  <Input
                    id="site-desc"
                    v-model="config.siteDescription"
                    name="site-desc"
                    autocomplete="off"
                  />
                  <FieldDescription>
                    {{ t("systemPage.site.descriptionHint") }}
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel for="site-keywords">{{
                    t("systemPage.site.keywords")
                  }}</FieldLabel>
                  <Input
                    id="site-keywords"
                    v-model="config.keywords"
                    name="site-keywords"
                    autocomplete="off"
                    :spellcheck="false"
                  />
                  <FieldDescription>{{
                    t("systemPage.site.keywordsHint")
                  }}</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>{{ t("systemPage.site.language") }}</FieldLabel>
                  <Select v-model="config.defaultLocale">
                    <SelectTrigger
                      class="w-full"
                      :aria-label="t('systemPage.site.language')"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem
                          v-for="option in LOCALE_OPTIONS"
                          :key="option.value"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {{ t("systemPage.site.languageHint") }}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <SystemSaveFooter
              :dirty="siteDirty"
              :loading="saving === 'site'"
              :label="t('systemPage.site.save')"
              @save="handleSaveSite"
            />
          </Card>

          <Card variant="plain" class="max-w-3xl">
            <CardHeader>
              <CardTitle>{{ t("systemPage.maintenance.title") }}</CardTitle>
              <CardDescription>{{
                t("systemPage.maintenance.description")
              }}</CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div class="flex flex-1 flex-col gap-1">
                  <FieldLabel for="maintenance-enabled">{{
                    t("systemPage.maintenance.enabled")
                  }}</FieldLabel>
                  <FieldDescription>
                    {{ t("systemPage.maintenance.enabledHint") }}
                  </FieldDescription>
                </div>
                <Switch
                  id="maintenance-enabled"
                  v-model="config.maintenanceEnabled"
                  :aria-label="t('systemPage.maintenance.enabled')"
                />
              </Field>
              <Separator />
              <Field>
                <FieldLabel for="maintenance-message">{{
                  t("systemPage.maintenance.message")
                }}</FieldLabel>
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
              :label="t('systemPage.maintenance.save')"
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
              <CardTitle>{{ t("systemPage.registration.title") }}</CardTitle>
              <CardDescription>{{
                t("systemPage.registration.description")
              }}</CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div class="flex flex-1 flex-col gap-1">
                  <FieldLabel for="open-registration">{{
                    t("systemPage.registration.open")
                  }}</FieldLabel>
                  <FieldDescription>{{
                    t("systemPage.registration.openHint")
                  }}</FieldDescription>
                </div>
                <Switch
                  id="open-registration"
                  v-model="config.openRegistration"
                  :aria-label="t('systemPage.registration.open')"
                />
              </Field>
              <Separator />
              <Field orientation="horizontal">
                <div class="flex flex-1 flex-col gap-1">
                  <FieldLabel for="manual-review">{{
                    t("systemPage.registration.manual")
                  }}</FieldLabel>
                  <FieldDescription>
                    {{ t("systemPage.registration.manualHint") }}
                  </FieldDescription>
                </div>
                <Switch
                  id="manual-review"
                  v-model="config.manualReview"
                  :aria-label="t('systemPage.registration.manual')"
                  :disabled="!config.openRegistration"
                />
              </Field>
            </CardContent>
            <SystemSaveFooter
              :dirty="registrationDirty"
              :loading="saving === 'registration'"
              :label="t('systemPage.registration.save')"
              @save="handleSaveRegistration"
            />
          </Card>

          <Card variant="plain" class="max-w-3xl">
            <CardHeader>
              <CardTitle>{{ t("systemPage.defaults.title") }}</CardTitle>
              <CardDescription>{{
                t("systemPage.defaults.description")
              }}</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>{{ t("systemPage.defaults.role") }}</FieldLabel>
                  <Select v-model="config.defaultRoleId">
                    <SelectTrigger
                      class="w-full"
                      :aria-label="t('systemPage.defaults.role')"
                    >
                      <SelectValue
                        :placeholder="t('systemPage.defaults.selectRole')"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem
                          v-for="role in roles"
                          :key="role.id"
                          :value="role.id"
                        >
                          {{ roleLabel(role) }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>{{
                    t("systemPage.defaults.roleHint")
                  }}</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel for="welcome-message">{{
                    t("systemPage.defaults.welcome")
                  }}</FieldLabel>
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
              :label="t('systemPage.defaults.save')"
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
              <CardTitle>{{ t("systemPage.smtp.title") }}</CardTitle>
              <CardDescription>{{
                t("systemPage.smtp.description")
              }}</CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div class="flex flex-1 flex-col gap-1">
                  <FieldLabel for="smtp-enabled">{{
                    t("systemPage.smtp.enabled")
                  }}</FieldLabel>
                  <FieldDescription>
                    {{ t("systemPage.smtp.enabledHint") }}
                  </FieldDescription>
                </div>
                <Switch
                  id="smtp-enabled"
                  v-model="config.smtpEnabled"
                  :aria-label="t('systemPage.smtp.enabled')"
                />
              </Field>
              <Separator />

              <Field>
                <FieldLabel>{{ t("systemPage.smtp.preset") }}</FieldLabel>
                <Select
                  :model-value="smtpPreset"
                  @update:model-value="applySmtpPreset(String($event))"
                >
                  <SelectTrigger
                    class="w-full"
                    :aria-label="t('systemPage.smtp.preset')"
                  >
                    <SelectValue
                      :placeholder="t('systemPage.smtp.presetPlaceholder')"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        v-for="preset in SMTP_PRESETS"
                        :key="preset.id"
                        :value="preset.id"
                      >
                        {{ t(`systemPage.smtp.presets.${preset.id}.name`) }}
                        - {{ preset.host }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {{
                    activePreset
                      ? t(`systemPage.smtp.presets.${activePreset.id}.tip`)
                      : t("systemPage.smtp.presetHint")
                  }}
                </FieldDescription>
              </Field>

              <Separator />

              <FieldGroup>
                <div class="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel for="smtp-host">{{
                      t("systemPage.smtp.host")
                    }}</FieldLabel>
                    <Input
                      id="smtp-host"
                      v-model="config.smtpHost"
                      name="smtp-host"
                      autocomplete="off"
                      :spellcheck="false"
                      :placeholder="t('systemPage.smtp.hostPlaceholder')"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel for="smtp-port">{{
                      t("systemPage.smtp.port")
                    }}</FieldLabel>
                    <Input
                      id="smtp-port"
                      v-model="smtpPort"
                      name="smtp-port"
                      autocomplete="off"
                      type="number"
                      :min="1"
                      :max="65535"
                      :placeholder="t('systemPage.smtp.portPlaceholder')"
                      required
                    />
                  </Field>
                </div>
                <div class="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel for="smtp-username">{{
                      t("systemPage.smtp.username")
                    }}</FieldLabel>
                    <Input
                      id="smtp-username"
                      v-model="config.smtpUsername"
                      name="smtp-username"
                      autocomplete="off"
                      :spellcheck="false"
                      :placeholder="t('systemPage.smtp.usernamePlaceholder')"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel for="smtp-password">{{
                      t("systemPage.smtp.password")
                    }}</FieldLabel>
                    <Input
                      id="smtp-password"
                      v-model="smtpPassword"
                      name="smtp-password"
                      type="password"
                      :placeholder="t('systemPage.smtp.passwordPlaceholder')"
                      autocomplete="new-password"
                    />
                  </Field>
                </div>
                <div class="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel for="smtp-from-name">{{
                      t("systemPage.smtp.fromName")
                    }}</FieldLabel>
                    <Input
                      id="smtp-from-name"
                      v-model="config.smtpFromName"
                      name="smtp-from-name"
                      autocomplete="off"
                      :placeholder="t('systemPage.smtp.fromNamePlaceholder')"
                    />
                  </Field>
                  <Field>
                    <FieldLabel for="smtp-from-email">{{
                      t("systemPage.smtp.fromEmail")
                    }}</FieldLabel>
                    <Input
                      id="smtp-from-email"
                      v-model="config.smtpFromEmail"
                      name="smtp-from-email"
                      autocomplete="off"
                      :spellcheck="false"
                      type="email"
                      :placeholder="t('systemPage.smtp.fromEmailPlaceholder')"
                      required
                    />
                  </Field>
                </div>
                <Field orientation="horizontal">
                  <div class="flex flex-1 flex-col gap-1">
                    <FieldLabel for="smtp-ssl">{{
                      t("systemPage.smtp.ssl")
                    }}</FieldLabel>
                    <FieldDescription>
                      {{ t("systemPage.smtp.sslHint") }}
                    </FieldDescription>
                  </div>
                  <Switch
                    id="smtp-ssl"
                    v-model="config.smtpUseSsl"
                    :aria-label="t('systemPage.smtp.ssl')"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <SystemSaveFooter
              :dirty="smtpDirty"
              :loading="saving === 'smtp'"
              :label="t('systemPage.smtp.save')"
              @save="handleSaveSmtp"
            />
          </Card>

          <Card variant="plain" class="max-w-3xl">
            <CardHeader>
              <CardTitle>{{ t("systemPage.testEmail.title") }}</CardTitle>
              <CardDescription>{{
                t("systemPage.testEmail.description")
              }}</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="test-email-form" @submit.prevent="handleTestEmail">
                <FieldGroup>
                  <Field>
                    <FieldLabel for="test-email">{{
                      t("systemPage.testEmail.recipient")
                    }}</FieldLabel>
                    <Input
                      id="test-email"
                      v-model="testEmailAddr"
                      name="test-email"
                      autocomplete="off"
                      :spellcheck="false"
                      type="email"
                      :placeholder="t('systemPage.testEmail.placeholder')"
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
                {{ t("systemPage.testEmail.send") }}
              </LoadingButton>
              <span
                v-if="!config.smtpEnabled"
                class="text-xs text-muted-foreground"
              >
                {{ t("systemPage.testEmail.disabledHint") }}
              </span>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </template>
  </div>
</template>
