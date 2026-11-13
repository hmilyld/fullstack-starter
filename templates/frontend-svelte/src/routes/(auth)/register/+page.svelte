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
  import { register } from "#lib/api/auth.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import { siteConfig } from "#lib/stores/site-config.svelte.js"

  const toast = useToast()

  let username = $state("")
  let email = $state("")
  let password = $state("")
  let passwordError = $state<string | null>(null)
  let submitting = $state(false)

  const registrationDisabled = $derived(
    siteConfig.config !== null && !siteConfig.config.openRegistration
  )
  const manualReview = $derived(
    !!siteConfig.config?.manualReview && !registrationDisabled
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
    const res = await register({ username, email, password })
    if (res.code === 0 && res.data?.token) {
      auth.login(res.data.token, res.data.user)
      toast.success("注册成功")
      await goto(resolve("dashboard"), { replace: true })
      return
    }
    if (res.code === 0) {
      toast.success(res.message || "注册成功，请等待管理员审核")
      await goto(resolve("login"), { replace: true })
      return
    }

    toast.error(res.message || "注册失败")
    submitting = false
  }
</script>

<svelte:head><title>注册 · 管理系统</title></svelte:head>

<AuthShell>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1.5">
      <h1 class="text-2xl font-semibold tracking-tight">创建账号</h1>
      <p class="text-sm text-muted-foreground">填写以下信息完成注册</p>
    </div>

    {#if registrationDisabled}
      <Alert>
        <AlertTitle>注册功能已关闭</AlertTitle>
        <AlertDescription>请联系管理员开通注册。</AlertDescription>
      </Alert>
    {/if}
    {#if manualReview}
      <Alert>
        <AlertDescription>注册后需管理员审核通过才能登录</AlertDescription>
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
          <FieldLabel for="username">用户名</FieldLabel>
          <Input
            id="username"
            bind:value={username}
            name="username"
            placeholder="请输入用户名"
            autocomplete="username"
            spellcheck={false}
            required
            disabled={registrationDisabled}
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
            required
            disabled={registrationDisabled}
          />
        </Field>
        <Field data-invalid={!!passwordError}>
          <FieldLabel for="password">密码</FieldLabel>
          <PasswordInput
            id="password"
            bind:value={password}
            name="password"
            placeholder="至少 6 位"
            autocomplete="new-password"
            aria-invalid={!!passwordError}
            required
            disabled={registrationDisabled}
            oninput={() => (passwordError = null)}
          />
          {#if passwordError}<FieldError>{passwordError}</FieldError>{/if}
        </Field>
        <Field>
          <LoadingButton
            type="submit"
            class="w-full"
            loading={submitting}
            disabled={registrationDisabled}
          >
            注册
          </LoadingButton>
          <FieldDescription class="text-center">
            已有账号？
            <a
              href={resolve("login")}
              class="underline-offset-4 hover:underline"
            >
              立即登录
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  </div>
</AuthShell>
