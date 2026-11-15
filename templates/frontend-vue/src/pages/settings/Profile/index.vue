<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useMediaQuery } from "@vueuse/core"
import { KeyRound, UserRound } from "@lucide/vue"
import { useRoute, useRouter } from "vue-router"
import LoadingButton from "@/components/shared/LoadingButton.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
import SettingsNav from "@/components/shared/SettingsNav.vue"
import UnsavedChangesGuard from "@/components/shared/UnsavedChangesGuard.vue"
import PasswordInput from "@/components/shared/PasswordInput.vue"
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { changePassword, updateMe } from "@/api/user"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"

const { t } = useI18n()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const isWide = useMediaQuery("(min-width: 1024px)")

const profileTabs = computed(() => [
  { value: "profile", title: t("profilePage.tabs.profile"), icon: UserRound },
  {
    value: "security",
    title: t("profilePage.tabs.security"),
    icon: KeyRound,
  },
])
const activeTab = computed(() =>
  route.query.tab === "security" ? "security" : "profile"
)

function setActiveTab(tab: string) {
  void router.replace({ query: tab === "profile" ? {} : { tab } })
}

const name = ref(auth.user?.name ?? "")
const email = ref(auth.user?.email ?? "")
const profileSaving = ref(false)

const profileDirty = computed(
  () =>
    name.value !== (auth.user?.name ?? "") ||
    email.value !== (auth.user?.email ?? "")
)

const currentPassword = ref("")
const newPassword = ref("")
const confirmPassword = ref("")
const passwordError = ref<string | null>(null)
const passwordSaving = ref(false)

function clearPasswordError() {
  if (passwordError.value) passwordError.value = null
}

async function handleProfileSubmit() {
  profileSaving.value = true
  const res = await updateMe({ name: name.value, email: email.value })
  profileSaving.value = false
  if (res.code !== 0) {
    toast.error(res.message || t("profilePage.saveFailed"))
    return
  }
  auth.updateUser({ name: name.value, email: email.value })
  toast.success(t("profilePage.saveSuccess"))
}

async function handlePasswordSubmit() {
  if (newPassword.value.length < 6) {
    passwordError.value = t("profilePage.passwordMin")
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = t("profilePage.passwordMismatch")
    return
  }

  passwordError.value = null
  passwordSaving.value = true
  const res = await changePassword({
    currentPassword: currentPassword.value,
    newPassword: newPassword.value,
  })
  passwordSaving.value = false
  if (res.code !== 0) {
    passwordError.value = res.message || t("profilePage.passwordFailed")
    return
  }
  toast.success(t("profilePage.passwordSuccess"))
  currentPassword.value = ""
  newPassword.value = ""
  confirmPassword.value = ""
}
</script>

<template>
  <div class="flex flex-col gap-(--page-gap)">
    <UnsavedChangesGuard
      :when="
        profileDirty ||
        currentPassword !== '' ||
        newPassword !== '' ||
        confirmPassword !== ''
      "
    />
    <PageHeader
      :title="t('profilePage.title')"
      :description="t('profilePage.description')"
    />

    <Separator />

    <Tabs
      :model-value="activeTab"
      :orientation="isWide ? 'vertical' : 'horizontal'"
      class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-12"
      @update:model-value="setActiveTab(String($event))"
    >
      <SettingsNav :items="profileTabs" />

      <TabsContent
        value="profile"
        class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
      >
        <Card variant="plain" class="max-w-2xl">
          <CardHeader>
            <CardTitle>{{ t("profilePage.profileTitle") }}</CardTitle>
            <CardDescription>{{
              t("profilePage.profileDescription")
            }}</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="profile-form" @submit.prevent="handleProfileSubmit">
              <FieldGroup>
                <Field>
                  <FieldLabel for="name">{{
                    t("profilePage.name")
                  }}</FieldLabel>
                  <Input
                    id="name"
                    v-model="name"
                    name="name"
                    :placeholder="t('profilePage.namePlaceholder')"
                    autocomplete="name"
                  />
                </Field>
                <Field>
                  <FieldLabel for="email">{{
                    t("profilePage.email")
                  }}</FieldLabel>
                  <Input
                    id="email"
                    v-model="email"
                    name="email"
                    type="email"
                    :placeholder="t('profilePage.emailPlaceholder')"
                    autocomplete="email"
                    :spellcheck="false"
                  />
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter>
            <LoadingButton
              type="submit"
              form="profile-form"
              :loading="profileSaving"
              :disabled="!profileDirty"
              class="w-full md:w-auto"
            >
              {{ t("profilePage.save") }}
            </LoadingButton>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent
        value="security"
        class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
      >
        <Card variant="plain" class="max-w-2xl">
          <CardHeader>
            <CardTitle>{{ t("profilePage.securityTitle") }}</CardTitle>
            <CardDescription>
              {{ t("profilePage.securityDescription") }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="password-form" @submit.prevent="handlePasswordSubmit">
              <FieldGroup>
                <Field>
                  <FieldLabel for="current-password">{{
                    t("profilePage.currentPassword")
                  }}</FieldLabel>
                  <PasswordInput
                    id="current-password"
                    v-model="currentPassword"
                    :placeholder="t('profilePage.currentPasswordPlaceholder')"
                    autocomplete="current-password"
                    required
                    @update:model-value="clearPasswordError"
                  />
                </Field>
                <Field>
                  <FieldLabel for="new-password">{{
                    t("profilePage.newPassword")
                  }}</FieldLabel>
                  <PasswordInput
                    id="new-password"
                    v-model="newPassword"
                    :placeholder="t('profilePage.newPasswordPlaceholder')"
                    autocomplete="new-password"
                    required
                    @update:model-value="clearPasswordError"
                  />
                </Field>
                <Field :data-invalid="!!passwordError">
                  <FieldLabel for="confirm-password">{{
                    t("profilePage.confirmPassword")
                  }}</FieldLabel>
                  <PasswordInput
                    id="confirm-password"
                    v-model="confirmPassword"
                    :placeholder="t('profilePage.confirmPasswordPlaceholder')"
                    autocomplete="new-password"
                    :aria-invalid="!!passwordError"
                    required
                    @update:model-value="clearPasswordError"
                  />
                  <FieldError v-if="passwordError">{{
                    passwordError
                  }}</FieldError>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter>
            <LoadingButton
              type="submit"
              form="password-form"
              :loading="passwordSaving"
              :disabled="!currentPassword || !newPassword || !confirmPassword"
              class="w-full md:w-auto"
            >
              {{ t("profilePage.updatePassword") }}
            </LoadingButton>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
