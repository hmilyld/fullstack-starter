<script lang="ts">
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { resolve } from "$app/paths"
  import AuthShell from "#lib/components/shared/auth-shell.svelte"
  import LoadingButton from "#lib/components/shared/loading-button.svelte"
  import PasswordInput from "#lib/components/shared/password-input.svelte"
  import {
    Alert,
    AlertDescription,
    AlertTitle,
  } from "#lib/components/ui/alert/index.js"
  import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
  } from "#lib/components/ui/field/index.js"
  import { Input } from "#lib/components/ui/input/index.js"
  import { login as apiLogin } from "#lib/api/auth.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import { siteConfig } from "#lib/stores/site-config.svelte.js"

  const toast = useToast()

  let account = $state("")
  let password = $state("")
  let passwordError = $state<string | null>(null)
  let submitting = $state(false)

  const maintenanceEnabled = $derived(
    siteConfig.config !== null && siteConfig.config.maintenanceEnabled
  )

  onMount(() => {
    if (auth.isAuthenticated) void goto(resolve("dashboard"), { replace: true })
  })

  async function handleSubmit() {
    if (password.length < 6) {
      passwordError = "密码至少 6 位"
      return
    }

    passwordError = null
    submitting = true
    const res = await apiLogin(account, password)
    if (res.code === 0) {
      auth.login(res.data.token, res.data.user)
      toast.success("登录成功")
      await goto(resolve("dashboard"), { replace: true })
      return
    }

    toast.error(res.message || "登录失败")
    submitting = false
  }
</script>

<svelte:head><title>登录 · 管理系统</title></svelte:head>

<AuthShell>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1.5">
      <h1 class="text-2xl font-semibold tracking-tight">欢迎回来</h1>
      <p class="text-sm text-muted-foreground">使用邮箱或用户名登录您的账户</p>
    </div>

    {#if maintenanceEnabled}
      <Alert>
        <AlertTitle>系统维护中</AlertTitle>
        <AlertDescription>
          {siteConfig.config?.maintenanceMessage ||
            "系统正在维护中，请稍后再试。"}
        </AlertDescription>
      </Alert>
    {/if}

    <form
      onsubmit={(event) => {
        event.preventDefault()
        void handleSubmit()
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel for="account">邮箱或用户名</FieldLabel>
          <Input
            id="account"
            bind:value={account}
            name="account"
            placeholder="请输入邮箱或用户名"
            autocomplete="username"
            spellcheck={false}
            required
          />
        </Field>
        <Field data-invalid={!!passwordError}>
          <FieldLabel for="password">密码</FieldLabel>
          <PasswordInput
            id="password"
            bind:value={password}
            name="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            aria-invalid={!!passwordError}
            required
            oninput={() => (passwordError = null)}
          />
          {#if passwordError}<FieldError>{passwordError}</FieldError>{/if}
        </Field>
        <Field>
          <LoadingButton type="submit" class="w-full" loading={submitting}>
            登录
          </LoadingButton>
          <FieldDescription class="text-center">
            还没有账号？
            <a
              href={resolve("register")}
              class="underline-offset-4 hover:underline"
            >
              立即注册
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  </div>
</AuthShell>
