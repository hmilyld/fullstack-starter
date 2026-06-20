<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSiteConfigStore } from '@/stores/site-config'
import { login as apiLogin } from '@/lib/api'
import { useToast } from '@/composables/use-toast'

const router = useRouter()
const auth = useAuthStore()
const siteConfig = useSiteConfigStore()
const toast = useToast()

const account = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const touched = ref({ account: false, password: false })

const maintenanceEnabled = siteConfig.config !== null && siteConfig.config.maintenanceEnabled

const accountError = ref('')
const passwordError = ref('')

function validateAccount() {
  if (!account.value) {
    accountError.value = '请输入邮箱或用户名'
    return false
  }
  accountError.value = ''
  return true
}

function validatePassword() {
  if (!password.value) {
    passwordError.value = '请输入密码'
    return false
  }
  if (password.value.length < 6) {
    passwordError.value = '密码至少6个字符'
    return false
  }
  passwordError.value = ''
  return true
}

function handleBlur(field: 'account' | 'password') {
  touched.value[field] = true
  if (field === 'account') validateAccount()
  else validatePassword()
}

async function handleSubmit() {
  touched.value = { account: true, password: true }
  const accountValid = validateAccount()
  const passwordValid = validatePassword()
  if (!accountValid || !passwordValid) return

  submitting.value = true
  errorMessage.value = ''
  const res = await apiLogin(account.value, password.value)
  if (res.code === 0) {
    auth.login(res.data.token, res.data.user)
    toast.success('登录成功')
    router.push('/dashboard')
  } else {
    errorMessage.value = res.message || '登录失败'
  }
  submitting.value = false
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <div class="w-full max-w-sm">
      <div v-if="maintenanceEnabled" role="alert" class="mb-4 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
        <div class="font-medium">系统维护中</div>
        <div class="mt-1 text-xs opacity-80">{{ siteConfig.config?.maintenanceMessage || '系统正在维护中，请稍后再试。' }}</div>
      </div>

      <div class="card border border-base-content/10 rounded-xl">
        <div class="card-body">
          <h2 class="card-title justify-center text-lg">欢迎回来</h2>
          <p class="text-center text-xs text-base-content/50">使用邮箱或用户名登录您的账户</p>

          <div v-if="errorMessage" role="alert" class="mb-2 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {{ errorMessage }}
          </div>

          <form @submit.prevent="handleSubmit">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs">邮箱或用户名</legend>
              <input
                v-model="account"
                type="text"
                placeholder="请输入邮箱或用户名"
                class="input input-bordered input-sm w-full"
                :class="{ 'input-error': touched.account && accountError }"
                required
                @blur="handleBlur('account')"
              />
              <span v-if="touched.account && accountError" class="text-xs text-error mt-1">{{ accountError }}</span>
            </fieldset>

            <fieldset class="fieldset mt-1">
              <legend class="fieldset-legend text-xs">密码</legend>
              <input
                v-model="password"
                type="password"
                placeholder="请输入密码"
                class="input input-bordered input-sm w-full"
                :class="{ 'input-error': touched.password && passwordError }"
                required
                @blur="handleBlur('password')"
              />
              <span v-if="touched.password && passwordError" class="text-xs text-error mt-1">{{ passwordError }}</span>
            </fieldset>

            <button
              type="submit"
              class="btn btn-primary btn-sm mt-3 w-full"
              :disabled="submitting"
            >
              <span v-if="submitting" class="loading loading-spinner loading-xs"></span>
              登录
            </button>

            <p class="mt-3 text-center text-xs text-base-content/50">
              还没有账号？
              <RouterLink to="/register" class="link link-primary">立即注册</RouterLink>
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
