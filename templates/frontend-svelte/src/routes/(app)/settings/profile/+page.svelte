<script lang="ts">
  import { goto } from "$app/navigation"
  import { resolve } from "$app/paths"
  import { page } from "$app/state"
  import { KeyRound, UserRound } from "@lucide/svelte"
  import LoadingButton from "#lib/components/shared/loading-button.svelte"
  import PageHeader from "#lib/components/shared/page-header.svelte"
  import PasswordInput from "#lib/components/shared/password-input.svelte"
  import SettingsNav from "#lib/components/shared/settings-nav.svelte"
  import UnsavedChangesGuard from "#lib/components/shared/unsaved-changes-guard.svelte"
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "#lib/components/ui/card/index.js"
  import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
  } from "#lib/components/ui/field/index.js"
  import { Input } from "#lib/components/ui/input/index.js"
  import { Separator } from "#lib/components/ui/separator/index.js"
  import { Tabs, TabsContent } from "#lib/components/ui/tabs/index.js"
  import { changePassword, updateMe } from "#lib/api/user.js"
  import { useMediaQuery } from "#lib/hooks/use-media-query.svelte.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { auth } from "#lib/stores/auth.svelte.js"

  const toast = useToast()
  const isWide = useMediaQuery("(min-width: 1024px)")

  const profileTabs = [
    { value: "profile", title: "基本资料", icon: UserRound },
    { value: "security", title: "密码修改", icon: KeyRound },
  ]

  const activeTab = $derived(
    page.url.searchParams.get("tab") === "security" ? "security" : "profile"
  )

  function setActiveTab(tab: string) {
    void goto(
      resolve(
        tab === "profile"
          ? "/(app)/settings/profile"
          : `/(app)/settings/profile?tab=${tab}`
      ),
      { replace: true, reset: false }
    )
  }

  let name = $state(auth.user?.name ?? "")
  let email = $state(auth.user?.email ?? "")
  let profileSaving = $state(false)

  const profileDirty = $derived(
    name !== (auth.user?.name ?? "") || email !== (auth.user?.email ?? "")
  )

  let currentPassword = $state("")
  let newPassword = $state("")
  let confirmPassword = $state("")
  let passwordError = $state<string | null>(null)
  let passwordSaving = $state(false)

  const plainCardClass =
    "max-w-2xl gap-5 overflow-visible border-0 bg-transparent py-0 shadow-none ring-0 [--card-spacing:0px] [&>[data-slot=card-header]]:border-b [&>[data-slot=card-header]]:pb-4 [&_[data-slot=card-title]]:text-lg"

  function clearPasswordError() {
    if (passwordError) passwordError = null
  }

  async function handleProfileSubmit() {
    profileSaving = true
    const res = await updateMe({ name, email })
    profileSaving = false
    if (res.code !== 0) {
      toast.error(res.message || "保存失败")
      return
    }
    auth.updateUser({ name, email })
    toast.success("保存成功")
  }

  async function handlePasswordSubmit() {
    if (newPassword.length < 6) {
      passwordError = "新密码至少 6 位"
      return
    }
    if (newPassword !== confirmPassword) {
      passwordError = "两次输入的密码不一致"
      return
    }

    passwordError = null
    passwordSaving = true
    const res = await changePassword({
      currentPassword,
      newPassword,
    })
    passwordSaving = false
    if (res.code !== 0) {
      passwordError = res.message || "修改失败"
      return
    }
    toast.success("密码修改成功")
    currentPassword = ""
    newPassword = ""
    confirmPassword = ""
  }
</script>

<svelte:head><title>个人设置 · 管理系统</title></svelte:head>

<div class="flex flex-col gap-(--page-gap)">
  <UnsavedChangesGuard
    when={profileDirty ||
      currentPassword !== "" ||
      newPassword !== "" ||
      confirmPassword !== ""}
  />
  <PageHeader title="个人设置" description="管理您的账户信息与登录密码。" />

  <Separator />

  <Tabs
    value={activeTab}
    orientation={isWide.matches ? "vertical" : "horizontal"}
    onValueChange={setActiveTab}
    class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-12"
  >
    <SettingsNav items={profileTabs} />

    <TabsContent
      value="profile"
      class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
    >
      <Card class={plainCardClass}>
        <CardHeader>
          <CardTitle>基本资料</CardTitle>
          <CardDescription>更新您的姓名和邮箱地址。</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="profile-form"
            onsubmit={(event) => {
              event.preventDefault()
              void handleProfileSubmit()
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel for="name">姓名</FieldLabel>
                <Input
                  id="name"
                  bind:value={name}
                  name="name"
                  placeholder="请输入姓名"
                  autocomplete="name"
                />
              </Field>
              <Field>
                <FieldLabel for="email">邮箱</FieldLabel>
                <Input
                  id="email"
                  bind:value={email}
                  name="email"
                  type="email"
                  placeholder="请输入邮箱"
                  autocomplete="email"
                  spellcheck={false}
                />
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <LoadingButton
            type="submit"
            form="profile-form"
            loading={profileSaving}
            disabled={!profileDirty}
            class="w-full md:w-auto"
          >
            保存更改
          </LoadingButton>
        </CardFooter>
      </Card>
    </TabsContent>

    <TabsContent
      value="security"
      class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
    >
      <Card class={plainCardClass}>
        <CardHeader>
          <CardTitle>密码修改</CardTitle>
          <CardDescription>
            修改后需要重新登录其他设备上的会话。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="password-form"
            onsubmit={(event) => {
              event.preventDefault()
              void handlePasswordSubmit()
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel for="current-password">当前密码</FieldLabel>
                <PasswordInput
                  id="current-password"
                  bind:value={currentPassword}
                  placeholder="请输入当前密码"
                  autocomplete="current-password"
                  required
                  oninput={clearPasswordError}
                />
              </Field>
              <Field>
                <FieldLabel for="new-password">新密码</FieldLabel>
                <PasswordInput
                  id="new-password"
                  bind:value={newPassword}
                  placeholder="至少 6 位"
                  autocomplete="new-password"
                  required
                  oninput={clearPasswordError}
                />
              </Field>
              <Field data-invalid={!!passwordError}>
                <FieldLabel for="confirm-password">确认新密码</FieldLabel>
                <PasswordInput
                  id="confirm-password"
                  bind:value={confirmPassword}
                  placeholder="请再次输入新密码"
                  autocomplete="new-password"
                  aria-invalid={!!passwordError}
                  required
                  oninput={clearPasswordError}
                />
                {#if passwordError}
                  <FieldError>{passwordError}</FieldError>
                {/if}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <LoadingButton
            type="submit"
            form="password-form"
            loading={passwordSaving}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            class="w-full md:w-auto"
          >
            更新密码
          </LoadingButton>
        </CardFooter>
      </Card>
    </TabsContent>
  </Tabs>
</div>
