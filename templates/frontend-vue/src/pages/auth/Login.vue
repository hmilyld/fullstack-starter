<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink, useRouter } from "vue-router"
import AuthShell from "@/components/shared/AuthShell.vue"
import LoadingButton from "@/components/shared/LoadingButton.vue"
import PasswordInput from "@/components/shared/PasswordInput.vue"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { login as apiLogin } from "@/api/auth"
import { useAuthStore } from "@/stores/auth"
import { useSiteConfigStore } from "@/stores/site-config"
import { useToast } from "@/composables/use-toast"

const { t } = useI18n()
const auth = useAuthStore()
const siteConfig = useSiteConfigStore()
const router = useRouter()
const toast = useToast()

const account = ref("")
const password = ref("")
const passwordError = ref<string | null>(null)
const submitting = ref(false)

const maintenanceEnabled = computed(
  () => siteConfig.config !== null && siteConfig.config.maintenanceEnabled
)

async function handleSubmit() {
  if (password.value.length < 6) {
    passwordError.value = t("auth.login.passwordMin")
    return
  }

  passwordError.value = null
  submitting.value = true
  const res = await apiLogin(account.value, password.value)
  if (res.code === 0) {
    auth.login(res.data.token, res.data.user)
    toast.success(t("auth.login.success"))
    await router.replace("/dashboard")
    return
  }

  toast.error(res.message || t("auth.login.failed"))
  submitting.value = false
}
</script>

<template>
  <AuthShell>
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-1.5">
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ t("auth.login.title") }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t("auth.login.subtitle") }}
        </p>
      </div>

      <Alert v-if="maintenanceEnabled">
        <AlertTitle>{{ t("auth.login.maintenanceTitle") }}</AlertTitle>
        <AlertDescription>
          {{
            siteConfig.config?.maintenanceMessage ||
            t("auth.login.maintenanceFallback")
          }}
        </AlertDescription>
      </Alert>

      <form @submit.prevent="handleSubmit">
        <FieldGroup>
          <Field>
            <FieldLabel for="account">{{ t("auth.login.account") }}</FieldLabel>
            <Input
              id="account"
              v-model="account"
              name="account"
              :placeholder="t('auth.login.accountPlaceholder')"
              autocomplete="username"
              :spellcheck="false"
              required
            />
          </Field>
          <Field :data-invalid="!!passwordError">
            <FieldLabel for="password">{{
              t("auth.login.password")
            }}</FieldLabel>
            <PasswordInput
              id="password"
              v-model="password"
              name="password"
              :placeholder="t('auth.login.passwordPlaceholder')"
              autocomplete="current-password"
              :aria-invalid="!!passwordError"
              required
              @update:model-value="passwordError = null"
            />
            <FieldError v-if="passwordError">{{ passwordError }}</FieldError>
          </Field>
          <Field>
            <LoadingButton type="submit" class="w-full" :loading="submitting">
              {{ t("auth.login.submit") }}
            </LoadingButton>
            <FieldDescription class="text-center">
              {{ t("auth.login.noAccount") }}
              <RouterLink
                to="/register"
                class="underline-offset-4 hover:underline"
              >
                {{ t("auth.login.registerLink") }}
              </RouterLink>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  </AuthShell>
</template>
