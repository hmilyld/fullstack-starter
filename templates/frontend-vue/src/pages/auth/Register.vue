<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useSiteConfigStore } from '@/stores/site-config'
import { register } from '@/lib/api'
import { useToast } from '@/composables/use-toast'

const router = useRouter()
const siteConfig = useSiteConfigStore()
const toast = useToast()

const username = ref('')
const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const touched = ref({ username: false, email: false, password: false })

const registrationDisabled = siteConfig.config !== null && !siteConfig.config.openRegistration
const manualReview = siteConfig.config?.manualReview && !registrationDisabled

const usernameError = ref('')
const emailError = ref('')
const passwordError = ref('')

function validateUsername() {
  if (!username.value) {
    usernameError.value = '请输入用户名'
    return false
  }
  if (username.value.length < 3) {
    usernameError.value = '用户名至少3个字符'
    return false
  }
  usernameError.value = ''
  return true
}

function validateEmail() {
  if (!email.value) {
    emailError.value = '请输入邮箱'
    return false
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    emailError.value = '请输入有效的邮箱地址'
    return false
  }
  emailError.value = ''
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

function handleBlur(field: 'username' | 'email' | 'password') {
  touched.value[field] = true
  if (field === 'username') validateUsername()
  else if (field === 'email') validateEmail()
  else validatePassword()
}

async function handleSubmit() {
  touched.value = { username: true, email: true, password: true }
  const usernameValid = validateUsername()
  const emailValid = validateEmail()
  const passwordValid = validatePassword()
  if (!usernameValid || !emailValid || !passwordValid) return

  submitting.value = true
  errorMessage.value = ''
  const res = await register({
    username: username.value,
    email: email.value,
    password: password.value,
  })
  if (res.code === 0) {
    toast.success('注册成功')
    router.push('/login')
  } else {
    errorMessage.value = res.message || '注册失败'
  }
  submitting.value = false
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <div class="w-full max-w-sm">
      <div v-if="registrationDisabled" role="alert" class="mb-4 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
        <div class="font-medium">注册功能已关闭</div>
        <div class="mt-1 text-xs opacity-80">请联系管理员开通注册。</div>
      </div>

      <div v-if="manualReview" role="alert" class="mb-4 rounded-lg border border-info/20 bg-info/10 px-4 py-3 text-sm text-info">
        <div class="text-xs">注册后需管理员审核通过才能登录</div>
      </div>

      <div class="card border border-base-content/10 rounded-xl">
        <div class="card-body">
          <h2 class="card-title justify-center text-lg">创建账号</h2>
          <p class="text-center text-xs text-base-content/50">填写以下信息完成注册</p>

          <div v-if="errorMessage" role="alert" class="mb-2 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {{ errorMessage }}
          </div>

          <form @submit.prevent="handleSubmit">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs">用户名</legend>
              <input
                v-model="username"
                type="text"
                placeholder="请输入用户名"
                class="input input-bordered input-sm w-full"
                :class="{ 'input-error': touched.username && usernameError }"
                required
                :disabled="registrationDisabled"
                @blur="handleBlur('username')"
              />
              <span v-if="touched.username && usernameError" class="text-xs text-error mt-1">{{ usernameError }}</span>
            </fieldset>

            <fieldset class="fieldset mt-1">
              <legend class="fieldset-legend text-xs">邮箱</legend>
              <input
                v-model="email"
                type="email"
                placeholder="请输入邮箱"
                class="input input-bordered input-sm w-full"
                :class="{ 'input-error': touched.email && emailError }"
                required
                :disabled="registrationDisabled"
                @blur="handleBlur('email')"
              />
              <span v-if="touched.email && emailError" class="text-xs text-error mt-1">{{ emailError }}</span>
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
                :disabled="registrationDisabled"
                @blur="handleBlur('password')"
              />
              <span v-if="touched.password && passwordError" class="text-xs text-error mt-1">{{ passwordError }}</span>
            </fieldset>

            <button
              type="submit"
              class="btn btn-primary btn-sm mt-3 w-full"
              :disabled="submitting || registrationDisabled"
            >
              <span v-if="submitting" class="loading loading-spinner loading-xs"></span>
              注册
            </button>

            <p class="mt-3 text-center text-xs text-base-content/50">
              已有账号？
              <RouterLink to="/login" class="link link-primary">立即登录</RouterLink>
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
