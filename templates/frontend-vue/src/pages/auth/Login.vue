<script setup lang="ts">
import { computed, ref } from "vue"
import { RouterLink, useRouter } from "vue-router"
import AuthShell from "@/components/shared/AuthShell.vue"
import LoadingButton from "@/components/shared/LoadingButton.vue"
import PasswordInput from "@/components/shared/PasswordInput.vue"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    passwordError.value = "密码至少 6 位"
    return
  }

  passwordError.value = null
  submitting.value = true
  const res = await apiLogin(account.value, password.value)
  if (res.code === 0) {
    auth.login(res.data.token, res.data.user)
    toast.success("登录成功")
    await router.replace("/dashboard")
    return
  }

  toast.error(res.message || "登录失败")
  submitting.value = false
}
</script>

<template>
  <AuthShell>
    <div class="flex flex-col gap-6">
      <Alert v-if="maintenanceEnabled">
        <AlertTitle>系统维护中</AlertTitle>
        <AlertDescription>
          {{
            siteConfig.config?.maintenanceMessage ||
            "系统正在维护中，请稍后再试。"
          }}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader class="text-center">
          <CardTitle class="text-xl">欢迎回来</CardTitle>
          <CardDescription>使用邮箱或用户名登录您的账户</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleSubmit">
            <FieldGroup>
              <Field>
                <FieldLabel for="account">邮箱或用户名</FieldLabel>
                <Input
                  id="account"
                  v-model="account"
                  name="account"
                  placeholder="请输入邮箱或用户名"
                  autocomplete="username"
                  :spellcheck="false"
                  required
                />
              </Field>
              <Field :data-invalid="!!passwordError">
                <FieldLabel for="password">密码</FieldLabel>
                <PasswordInput
                  id="password"
                  v-model="password"
                  name="password"
                  placeholder="请输入密码"
                  autocomplete="current-password"
                  :aria-invalid="!!passwordError"
                  required
                  @update:model-value="passwordError = null"
                />
                <FieldError>{{ passwordError }}</FieldError>
              </Field>
              <Field>
                <LoadingButton
                  type="submit"
                  class="w-full"
                  :loading="submitting"
                >
                  登录
                </LoadingButton>
                <FieldDescription class="text-center">
                  还没有账号？
                  <RouterLink
                    to="/register"
                    class="underline-offset-4 hover:underline"
                  >
                    立即注册
                  </RouterLink>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  </AuthShell>
</template>
