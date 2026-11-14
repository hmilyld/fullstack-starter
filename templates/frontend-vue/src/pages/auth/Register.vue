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
import { register } from "@/api/auth"
import { useAuthStore } from "@/stores/auth"
import { useSiteConfigStore } from "@/stores/site-config"
import { useToast } from "@/composables/use-toast"

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const siteConfig = useSiteConfigStore()
const toast = useToast()

const username = ref("")
const email = ref("")
const password = ref("")
const passwordError = ref<string | null>(null)
const submitting = ref(false)

const registrationDisabled = computed(
  () => siteConfig.config !== null && !siteConfig.config.openRegistration
)
const manualReview = computed(
  () => !!siteConfig.config?.manualReview && !registrationDisabled.value
)

async function handleSubmit() {
  if (password.value.length < 6) {
    passwordError.value = t("auth.register.passwordMin")
    return
  }

  passwordError.value = null
  submitting.value = true
  const res = await register({
    username: username.value,
    email: email.value,
    password: password.value,
  })
  if (res.code === 0 && res.data?.token) {
    auth.login(res.data.token, res.data.user)
    toast.success(t("auth.register.success"))
    await router.replace("/dashboard")
    return
  }
  if (res.code === 0) {
    toast.success(res.message || t("auth.register.successPending"))
    await router.replace("/login")
    return
  }

  toast.error(res.message || t("auth.register.failed"))
  submitting.value = false
}
</script>

<template>
  <AuthShell>
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-1.5">
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ t("auth.register.title") }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t("auth.register.subtitle") }}
        </p>
      </div>

      <Alert v-if="registrationDisabled">
        <AlertTitle>{{ t("auth.register.disabledTitle") }}</AlertTitle>
        <AlertDescription>{{
          t("auth.register.disabledDescription")
        }}</AlertDescription>
      </Alert>
      <Alert v-if="manualReview">
        <AlertDescription>{{
          t("auth.register.reviewNotice")
        }}</AlertDescription>
      </Alert>

      <form @submit.prevent="handleSubmit">
        <FieldGroup>
          <Field>
            <FieldLabel for="username">{{
              t("auth.register.username")
            }}</FieldLabel>
            <Input
              id="username"
              v-model="username"
              name="username"
              :placeholder="t('auth.register.usernamePlaceholder')"
              autocomplete="username"
              :spellcheck="false"
              required
              :disabled="registrationDisabled"
            />
          </Field>
          <Field>
            <FieldLabel for="email">{{ t("auth.register.email") }}</FieldLabel>
            <Input
              id="email"
              v-model="email"
              name="email"
              type="email"
              :placeholder="t('auth.register.emailPlaceholder')"
              autocomplete="email"
              :spellcheck="false"
              required
              :disabled="registrationDisabled"
            />
          </Field>
          <Field :data-invalid="!!passwordError">
            <FieldLabel for="password">{{
              t("auth.register.password")
            }}</FieldLabel>
            <PasswordInput
              id="password"
              v-model="password"
              name="password"
              :placeholder="t('auth.register.passwordPlaceholder')"
              autocomplete="new-password"
              :aria-invalid="!!passwordError"
              required
              :disabled="registrationDisabled"
              @update:model-value="passwordError = null"
            />
            <FieldError v-if="passwordError">{{ passwordError }}</FieldError>
          </Field>
          <Field>
            <LoadingButton
              type="submit"
              class="w-full"
              :loading="submitting"
              :disabled="registrationDisabled"
            >
              {{ t("auth.register.submit") }}
            </LoadingButton>
            <FieldDescription class="text-center">
              {{ t("auth.register.hasAccount") }}
              <RouterLink
                to="/login"
                class="underline-offset-4 hover:underline"
              >
                {{ t("auth.register.loginLink") }}
              </RouterLink>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  </AuthShell>
</template>
