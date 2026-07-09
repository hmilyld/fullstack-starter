<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { updateMe, changePassword } from '@/lib/api'
import { useToast } from '@/composables/use-toast'

const route = useRoute()
const toast = useToast()

const activeTab = ref((route.query.tab as string) || 'profile')

watch(() => route.query.tab, (val) => {
  if (val) activeTab.value = val as string
})

const name = ref('')
const email = ref('')
const profileSaving = ref(false)

onMounted(() => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      name.value = user.name ?? ''
      email.value = user.email ?? ''
    }
  } catch {
    // ignore
  }
})

async function handleProfileSubmit() {
  profileSaving.value = true
  try {
    const res = await updateMe({ name: name.value, email: email.value })
    if (res.code === 0) {
      toast.success('保存成功')
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          user.name = name.value
          user.email = email.value
          localStorage.setItem('user', JSON.stringify(user))
        }
      } catch {
        // ignore
      }
    } else {
      toast.error(typeof res.message === 'string' ? res.message : '保存失败')
    }
  } catch {
    toast.error('网络请求失败')
  }
  profileSaving.value = false
}

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordSaving = ref(false)

async function handlePasswordSubmit() {
  if (newPassword.value !== confirmPassword.value) {
    toast.error('两次输入的密码不一致')
    return
  }
  passwordSaving.value = true
  try {
    const res = await changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    if (res.code === 0) {
      toast.success('密码修改成功')
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    } else {
      toast.error(typeof res.message === 'string' ? res.message : '修改失败')
    }
  } catch {
    toast.error('网络请求失败')
  }
  passwordSaving.value = false
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-xl font-semibold">个人设置</h1>
      <p class="text-sm text-base-content/50">管理您的账户设置和偏好。</p>
    </div>

    <div class="border-b border-base-content/10">
      <div class="flex gap-0">
        <button
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-base-content/50 hover:text-base-content'"
          @click="activeTab = 'profile'"
        >
          个人设置
        </button>
        <button
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="activeTab === 'security' ? 'border-b-2 border-primary text-primary' : 'text-base-content/50 hover:text-base-content'"
          @click="activeTab = 'security'"
        >
          密码修改
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'profile'" class="card border border-base-content/10 rounded-xl">
      <div class="card-body">
        <h3 class="text-sm font-medium">个人设置</h3>
        <p class="text-xs text-base-content/50">更新您的基本账户信息。</p>
        <form @submit.prevent="handleProfileSubmit">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">姓名</legend>
            <input v-model="name" type="text" placeholder="请输入姓名" class="input input-bordered input-sm w-full" />
          </fieldset>
          <fieldset class="fieldset mt-1">
            <legend class="fieldset-legend">邮箱</legend>
            <input v-model="email" type="email" placeholder="请输入邮箱" class="input input-bordered input-sm w-full" />
          </fieldset>
          <div class="card-actions justify-start mt-3">
            <button type="submit" class="btn btn-primary btn-sm" :disabled="profileSaving">
              <span v-if="profileSaving" class="loading loading-spinner loading-xs"></span>
              保存更改
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="activeTab === 'security'" class="card border border-base-content/10 rounded-xl">
      <div class="card-body">
        <h3 class="text-sm font-medium">密码修改</h3>
        <p class="text-xs text-base-content/50">修改您的登录密码。</p>
        <form @submit.prevent="handlePasswordSubmit">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">当前密码</legend>
            <input v-model="currentPassword" type="password" placeholder="请输入当前密码" class="input input-bordered input-sm w-full" />
          </fieldset>
          <fieldset class="fieldset mt-1">
            <legend class="fieldset-legend">新密码</legend>
            <input v-model="newPassword" type="password" placeholder="请输入新密码" class="input input-bordered input-sm w-full" />
          </fieldset>
          <fieldset class="fieldset mt-1">
            <legend class="fieldset-legend">确认密码</legend>
            <input v-model="confirmPassword" type="password" placeholder="请再次输入新密码" class="input input-bordered input-sm w-full" />
          </fieldset>
          <div class="card-actions justify-start mt-3">
            <button type="submit" class="btn btn-primary btn-sm" :disabled="passwordSaving">
              <span v-if="passwordSaving" class="loading loading-spinner loading-xs"></span>
              更新密码
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
