<script setup lang="ts">
import { computed, ref } from "vue"
import { useMediaQuery } from "@vueuse/core"
import { useRoute, useRouter } from "vue-router"
import LoadingButton from "@/components/shared/LoadingButton.vue"
import PageHeader from "@/components/shared/PageHeader.vue"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { changePassword, updateMe } from "@/api/user"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/composables/use-toast"

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const isDesktop = useMediaQuery("(min-width: 1024px)")
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
    toast.error(res.message || "保存失败")
    return
  }
  auth.updateUser({ name: name.value, email: email.value })
  toast.success("保存成功")
}

async function handlePasswordSubmit() {
  if (newPassword.value.length < 6) {
    passwordError.value = "新密码至少 6 位"
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = "两次输入的密码不一致"
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
    passwordError.value = res.message || "修改失败"
    return
  }
  toast.success("密码修改成功")
  currentPassword.value = ""
  newPassword.value = ""
  confirmPassword.value = ""
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-(--page-gap)">
    <PageHeader title="个人设置" description="管理您的账户信息与登录密码。" />

    <Tabs
      :model-value="activeTab"
      :orientation="isDesktop ? 'vertical' : 'horizontal'"
      class="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10"
      @update:model-value="setActiveTab(String($event))"
    >
      <TabsList class="w-full lg:sticky lg:top-20 lg:w-52 lg:shrink-0">
        <TabsTrigger value="profile">基本资料</TabsTrigger>
        <TabsTrigger value="security">密码修改</TabsTrigger>
      </TabsList>

      <TabsContent
        value="profile"
        class="flex min-w-0 flex-1 flex-col gap-(--page-gap)"
      >
        <Card class="max-w-2xl">
          <CardHeader>
            <CardTitle>基本资料</CardTitle>
            <CardDescription>更新您的姓名和邮箱地址。</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="profile-form" @submit.prevent="handleProfileSubmit">
              <FieldGroup>
                <Field>
                  <FieldLabel for="name">姓名</FieldLabel>
                  <Input
                    id="name"
                    v-model="name"
                    name="name"
                    placeholder="请输入姓名"
                    autocomplete="name"
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
              保存更改
            </LoadingButton>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent
        value="security"
        class="flex min-w-0 flex-1 flex-col gap-(--page-gap)"
      >
        <Card class="max-w-2xl">
          <CardHeader>
            <CardTitle>密码修改</CardTitle>
            <CardDescription>
              修改后需要重新登录其他设备上的会话。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="password-form" @submit.prevent="handlePasswordSubmit">
              <FieldGroup>
                <Field>
                  <FieldLabel for="current-password">当前密码</FieldLabel>
                  <PasswordInput
                    id="current-password"
                    v-model="currentPassword"
                    placeholder="请输入当前密码"
                    autocomplete="current-password"
                    required
                    @update:model-value="clearPasswordError"
                  />
                </Field>
                <Field>
                  <FieldLabel for="new-password">新密码</FieldLabel>
                  <PasswordInput
                    id="new-password"
                    v-model="newPassword"
                    placeholder="至少 6 位"
                    autocomplete="new-password"
                    required
                    @update:model-value="clearPasswordError"
                  />
                </Field>
                <Field :data-invalid="!!passwordError">
                  <FieldLabel for="confirm-password">确认新密码</FieldLabel>
                  <PasswordInput
                    id="confirm-password"
                    v-model="confirmPassword"
                    placeholder="请再次输入新密码"
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
              更新密码
            </LoadingButton>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
