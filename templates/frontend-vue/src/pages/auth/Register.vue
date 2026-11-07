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
import { register } from "@/api/auth"
import { useAuthStore } from "@/stores/auth"
import { useSiteConfigStore } from "@/stores/site-config"
import { useToast } from "@/composables/use-toast"

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
    passwordError.value = "密码至少 6 位"
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
    toast.success("注册成功")
    await router.replace("/dashboard")
    return
  }
  if (res.code === 0) {
    toast.success(res.message || "注册成功，请等待管理员审核")
    await router.replace("/login")
    return
  }

  toast.error(res.message || "注册失败")
  submitting.value = false
}
</script>

<template>
  <AuthShell>
    <div class="flex flex-col gap-4">
      <Alert v-if="registrationDisabled">
        <AlertTitle>注册功能已关闭</AlertTitle>
        <AlertDescription>请联系管理员开通注册。</AlertDescription>
      </Alert>
      <Alert v-if="manualReview">
        <AlertDescription>注册后需管理员审核通过才能登录</AlertDescription>
      </Alert>

      <Card>
        <CardHeader class="text-center">
          <CardTitle class="text-xl">创建账号</CardTitle>
          <CardDescription>填写以下信息完成注册</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleSubmit">
            <FieldGroup>
              <Field>
                <FieldLabel for="username">用户名</FieldLabel>
                <Input
                  id="username"
                  v-model="username"
                  name="username"
                  placeholder="请输入用户名"
                  autocomplete="username"
                  :spellcheck="false"
                  required
                  :disabled="registrationDisabled"
                />
              </Field>
              <Field>
                <FieldLabel for="email">邮箱</FieldLabel>
                <Input
                  id="email"
                  v-model="email"
                  name="email"
                  type="email"
                  placeholder="请输入邮箱"
                  autocomplete="email"
                  :spellcheck="false"
                  required
                  :disabled="registrationDisabled"
                />
              </Field>
              <Field :data-invalid="!!passwordError">
                <FieldLabel for="password">密码</FieldLabel>
                <PasswordInput
                  id="password"
                  v-model="password"
                  name="password"
                  placeholder="至少 6 位"
                  autocomplete="new-password"
                  :aria-invalid="!!passwordError"
                  required
                  :disabled="registrationDisabled"
                  @update:model-value="passwordError = null"
                />
                <FieldError v-if="passwordError">{{
                  passwordError
                }}</FieldError>
              </Field>
              <Field>
                <LoadingButton
                  type="submit"
                  class="w-full"
                  :loading="submitting"
                  :disabled="registrationDisabled"
                >
                  注册
                </LoadingButton>
                <FieldDescription class="text-center">
                  已有账号？
                  <RouterLink
                    to="/login"
                    class="underline-offset-4 hover:underline"
                  >
                    立即登录
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
