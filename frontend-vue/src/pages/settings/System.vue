<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getSystemConfig, updateSystemConfig, getRoles, testEmail } from '@/lib/api'
import type { SystemConfig } from '@/types/api'
import { useToast } from '@/composables/use-toast'

const toast = useToast()

const config = ref<SystemConfig | null>(null)
const loading = ref(true)
const activeTab = ref('site')
const siteSaving = ref(false)
const maintainSaving = ref(false)
const registerSaving = ref(false)
const defaultSaving = ref(false)
const smtpSaving = ref(false)
const testEmailAddr = ref('')
const testEmailSaving = ref(false)
const smtpPreset = ref('')
const roles = ref<{ id: string; name: string }[]>([])

const SMTP_PRESETS = [
  { name: 'QQ 邮箱', host: 'smtp.qq.com', port: 465, ssl: true, fromName: 'QQ邮箱' },
  { name: '163 邮箱', host: 'smtp.163.com', port: 465, ssl: true, fromName: '163邮箱' },
  { name: 'Gmail', host: 'smtp.gmail.com', port: 587, ssl: true, fromName: 'Gmail' },
  { name: 'Outlook', host: 'smtp.office365.com', port: 587, ssl: true, fromName: 'Outlook' },
]

onMounted(async () => {
  const res = await getSystemConfig()
  if (res.code === 0) config.value = res.data
  loading.value = false

  const rolesRes = await getRoles({ pageSize: 100 })
  if (rolesRes.code === 0) roles.value = rolesRes.data.list
})

function updateField<K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) {
  if (!config.value) return
  config.value = { ...config.value, [key]: value }
}

function applySmtpPreset() {
  const preset = SMTP_PRESETS.find((p) => p.name === smtpPreset.value)
  if (preset) {
    updateField('smtpHost', preset.host)
    updateField('smtpPort', preset.port)
    updateField('smtpUseSsl', preset.ssl)
    updateField('smtpFromName', preset.fromName)
  }
}

async function handleSaveSite() {
  if (!config.value) return
  siteSaving.value = true
  const res = await updateSystemConfig({
    siteName: config.value.siteName,
    siteDescription: config.value.siteDescription,
    keywords: config.value.keywords,
  })
  siteSaving.value = false
  if (res.code === 0) {
    toast.success('保存成功')
    const fresh = await getSystemConfig()
    if (fresh.code === 0) config.value = fresh.data
  } else {
    toast.error(res.message)
  }
}

async function handleSaveMaintenance() {
  if (!config.value) return
  maintainSaving.value = true
  const res = await updateSystemConfig({
    maintenanceEnabled: config.value.maintenanceEnabled,
    maintenanceMessage: config.value.maintenanceMessage,
  })
  maintainSaving.value = false
  if (res.code === 0) {
    toast.success('保存成功')
    const fresh = await getSystemConfig()
    if (fresh.code === 0) config.value = fresh.data
  } else {
    toast.error(res.message)
  }
}

async function handleSaveRegistration() {
  if (!config.value) return
  registerSaving.value = true
  const res = await updateSystemConfig({
    openRegistration: config.value.openRegistration,
    manualReview: config.value.manualReview,
  })
  registerSaving.value = false
  if (res.code === 0) {
    toast.success('保存成功')
    const fresh = await getSystemConfig()
    if (fresh.code === 0) config.value = fresh.data
  } else {
    toast.error(res.message)
  }
}

async function handleSaveDefault() {
  if (!config.value) return
  defaultSaving.value = true
  const res = await updateSystemConfig({
    defaultRoleId: config.value.defaultRoleId,
    welcomeMessage: config.value.welcomeMessage,
  })
  defaultSaving.value = false
  if (res.code === 0) {
    toast.success('保存成功')
    const fresh = await getSystemConfig()
    if (fresh.code === 0) config.value = fresh.data
  } else {
    toast.error(res.message)
  }
}

async function handleSaveSmtp() {
  if (!config.value) return
  smtpSaving.value = true
  const res = await updateSystemConfig({
    smtpEnabled: config.value.smtpEnabled,
    smtpHost: config.value.smtpHost,
    smtpPort: config.value.smtpPort,
    smtpUsername: config.value.smtpUsername,
    smtpPassword: config.value.smtpPassword,
    smtpFromName: config.value.smtpFromName,
    smtpFromEmail: config.value.smtpFromEmail,
    smtpUseSsl: config.value.smtpUseSsl,
  })
  smtpSaving.value = false
  if (res.code === 0) {
    toast.success('保存成功')
    const fresh = await getSystemConfig()
    if (fresh.code === 0) config.value = fresh.data
  } else {
    toast.error(res.message)
  }
}

async function handleTestEmail() {
  if (!config.value || !testEmailAddr.value) return
  testEmailSaving.value = true
  const res = await testEmail(testEmailAddr.value)
  testEmailSaving.value = false
  if (res.code === 0) {
    toast.success('测试邮件发送成功')
  } else {
    toast.error(res.message)
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">系统设置</h1>
      <p class="text-base-content/50">管理站点全局配置和注册策略。</p>
    </div>

    <div v-if="loading" class="flex flex-col gap-4">
      <div class="skeleton h-10 w-full"></div>
      <div class="skeleton h-48 w-full"></div>
    </div>

    <template v-else-if="config">
      <div role="tablist" class="tabs tabs-border">
        <button role="tab" class="tab" :class="{ 'tab-active': activeTab === 'site' }" @click="activeTab = 'site'">站点设置</button>
        <button role="tab" class="tab" :class="{ 'tab-active': activeTab === 'register' }" @click="activeTab = 'register'">注册设置</button>
        <button role="tab" class="tab" :class="{ 'tab-active': activeTab === 'smtp' }" @click="activeTab = 'smtp'">邮件配置</button>
      </div>

      <!-- 站点设置 -->
      <div v-show="activeTab === 'site'" class="flex flex-col gap-6">
        <div class="card border border-base-content/10 rounded-xl">
          <div class="card-body">
            <h3 class="card-title">基本信息</h3>
            <p class="text-sm text-base-content/50">配置站点名称、描述等基本信息。</p>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">站点名称</legend>
              <input :value="config.siteName" @input="updateField('siteName', ($event.target as HTMLInputElement).value)" class="input input-bordered w-full" />
            </fieldset>
            <fieldset class="fieldset mt-2">
              <legend class="fieldset-legend">站点描述</legend>
              <input :value="config.siteDescription" @input="updateField('siteDescription', ($event.target as HTMLInputElement).value)" class="input input-bordered w-full" />
            </fieldset>
            <fieldset class="fieldset mt-2">
              <legend class="fieldset-legend">关键词</legend>
              <input :value="config.keywords" @input="updateField('keywords', ($event.target as HTMLInputElement).value)" class="input input-bordered w-full" />
            </fieldset>
            <div class="card-actions justify-start mt-4">
              <button class="btn btn-primary" :disabled="siteSaving" @click="handleSaveSite">
                <span v-if="siteSaving" class="loading loading-spinner loading-sm"></span>
                保存基本信息
              </button>
            </div>
          </div>
        </div>

        <div class="card border border-base-content/10 rounded-xl">
          <div class="card-body">
            <h3 class="card-title">维护模式</h3>
            <p class="text-sm text-base-content/50">开启后普通用户将无法访问系统。</p>
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">开启维护模式</div>
                <div class="text-sm text-base-content/50">仅管理员可登录，其他用户看到维护提示。</div>
              </div>
              <input type="checkbox" class="toggle toggle-primary" :checked="config.maintenanceEnabled" @change="updateField('maintenanceEnabled', ($event.target as HTMLInputElement).checked)" />
            </div>
            <div class="divider"></div>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">维护提示信息</legend>
              <input :value="config.maintenanceMessage" @input="updateField('maintenanceMessage', ($event.target as HTMLInputElement).value)" class="input input-bordered w-full" />
            </fieldset>
            <div class="card-actions justify-start mt-4">
              <button class="btn btn-primary" :disabled="maintainSaving" @click="handleSaveMaintenance">
                <span v-if="maintainSaving" class="loading loading-spinner loading-sm"></span>
                保存维护设置
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 注册设置 -->
      <div v-show="activeTab === 'register'" class="flex flex-col gap-6">
        <div class="card border border-base-content/10 rounded-xl">
          <div class="card-body">
            <h3 class="card-title">注册策略</h3>
            <p class="text-sm text-base-content/50">控制用户注册方式和验证流程。</p>
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">开放注册</div>
                <div class="text-sm text-base-content/50">允许新用户自行注册账号。</div>
              </div>
              <input type="checkbox" class="toggle toggle-primary" :checked="config.openRegistration" @change="updateField('openRegistration', ($event.target as HTMLInputElement).checked)" />
            </div>
            <div class="divider"></div>
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">人工审核</div>
                <div class="text-sm text-base-content/50">新注册用户需要管理员审核后才能使用系统。</div>
              </div>
              <input type="checkbox" class="toggle toggle-primary" :checked="config.manualReview" @change="updateField('manualReview', ($event.target as HTMLInputElement).checked)" />
            </div>
            <div class="card-actions justify-start mt-4">
              <button class="btn btn-primary" :disabled="registerSaving" @click="handleSaveRegistration">
                <span v-if="registerSaving" class="loading loading-spinner loading-sm"></span>
                保存注册策略
              </button>
            </div>
          </div>
        </div>

        <div class="card border border-base-content/10 rounded-xl">
          <div class="card-body">
            <h3 class="card-title">默认配置</h3>
            <p class="text-sm text-base-content/50">新注册用户的默认角色和状态。</p>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">默认角色</legend>
              <select class="select select-bordered w-full" :value="config.defaultRoleId" @change="updateField('defaultRoleId', ($event.target as HTMLSelectElement).value)">
                <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
              </select>
              <div class="label">新注册用户自动分配的角色。</div>
            </fieldset>
            <fieldset class="fieldset mt-2">
              <legend class="fieldset-legend">欢迎消息</legend>
              <input :value="config.welcomeMessage" @input="updateField('welcomeMessage', ($event.target as HTMLInputElement).value)" class="input input-bordered w-full" />
            </fieldset>
            <div class="card-actions justify-start mt-4">
              <button class="btn btn-primary" :disabled="defaultSaving" @click="handleSaveDefault">
                <span v-if="defaultSaving" class="loading loading-spinner loading-sm"></span>
                保存默认配置
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 邮件配置 -->
      <div v-show="activeTab === 'smtp'" class="flex flex-col gap-6">
        <div class="card border border-base-content/10 rounded-xl">
          <div class="card-body">
            <h3 class="card-title">SMTP 邮件配置</h3>
            <p class="text-sm text-base-content/50">配置邮件服务器，用于发送系统通知邮件。</p>
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">启用邮件</div>
                <div class="text-sm text-base-content/50">开启后系统将通过 SMTP 发送邮件。</div>
              </div>
              <input type="checkbox" class="toggle toggle-primary" :checked="config.smtpEnabled" @change="updateField('smtpEnabled', ($event.target as HTMLInputElement).checked)" />
            </div>
            <div class="divider"></div>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">快捷配置</legend>
              <select class="select select-bordered w-full" :value="smtpPreset" @change="smtpPreset = ($event.target as HTMLSelectElement).value; applySmtpPreset()">
                <option value="">选择常用邮箱快速配置...</option>
                <option v-for="preset in SMTP_PRESETS" :key="preset.name" :value="preset.name">{{ preset.name }} - {{ preset.host }}</option>
              </select>
            </fieldset>

            <div class="divider"></div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">SMTP 服务器 *</legend>
                <input :value="config.smtpHost" @input="updateField('smtpHost', ($event.target as HTMLInputElement).value)" placeholder="例如: smtp.qq.com" class="input input-bordered w-full" />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">端口 *</legend>
                <input type="number" :value="config.smtpPort" @input="updateField('smtpPort', parseInt(($event.target as HTMLInputElement).value) || 587)" placeholder="例如: 587" class="input input-bordered w-full" />
              </fieldset>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">用户名 *</legend>
                <input :value="config.smtpUsername" @input="updateField('smtpUsername', ($event.target as HTMLInputElement).value)" placeholder="例如: your@email.com" class="input input-bordered w-full" />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">密码 *</legend>
                <input type="password" :value="config.smtpPassword" @input="updateField('smtpPassword', ($event.target as HTMLInputElement).value)" placeholder="请输入 SMTP 密码或授权码" class="input input-bordered w-full" />
              </fieldset>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">发件人名称</legend>
                <input :value="config.smtpFromName" @input="updateField('smtpFromName', ($event.target as HTMLInputElement).value)" placeholder="例如: 管理系统" class="input input-bordered w-full" />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">发件人邮箱 *</legend>
                <input type="email" :value="config.smtpFromEmail" @input="updateField('smtpFromEmail', ($event.target as HTMLInputElement).value)" placeholder="例如: noreply@example.com" class="input input-bordered w-full" />
              </fieldset>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">使用 SSL</div>
                <div class="text-sm text-base-content/50">大多数邮件服务器需要开启 SSL。</div>
              </div>
              <input type="checkbox" class="toggle toggle-primary" :checked="config.smtpUseSsl" @change="updateField('smtpUseSsl', ($event.target as HTMLInputElement).checked)" />
            </div>
            <div class="card-actions justify-start mt-4">
              <button class="btn btn-primary" :disabled="smtpSaving" @click="handleSaveSmtp">
                <span v-if="smtpSaving" class="loading loading-spinner loading-sm"></span>
                保存邮件配置
              </button>
            </div>
          </div>
        </div>

        <div class="card border border-base-content/10 rounded-xl">
          <div class="card-body">
            <h3 class="card-title">测试邮件</h3>
            <p class="text-sm text-base-content/50">发送测试邮件以验证邮件配置是否正确。</p>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">收件人邮箱</legend>
              <input v-model="testEmailAddr" type="email" placeholder="请输入测试收件人邮箱" class="input input-bordered w-full" />
            </fieldset>
            <div class="card-actions justify-start mt-4">
              <button class="btn btn-primary" :disabled="!testEmailAddr || !config.smtpEnabled || testEmailSaving" @click="handleTestEmail">
                <span v-if="testEmailSaving" class="loading loading-spinner loading-sm"></span>
                发送测试邮件
              </button>
              <p v-if="!config.smtpEnabled" class="text-xs text-base-content/50">请先开启"启用邮件"开关并配置SMTP服务器</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
