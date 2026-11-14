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
  import { t } from "#lib/i18n.js"
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
      passwordError = $t("auth.login.passwordMin")
      return
    }

    passwordError = null
    submitting = true
    const res = await apiLogin(account, password)
    if (res.code === 0) {
      auth.login(res.data.token, res.data.user)
      toast.success($t("auth.login.success"))
      await goto(resolve("dashboard"), { replace: true })
      return
    }

    toast.error(res.message || $t("auth.login.failed"))
    submitting = false
  }
</script>

<svelte:head
  ><title>{$t("auth.login.submit")} · {$t("pwa.defaultName")}</title
  ></svelte:head
>

<AuthShell>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1.5">
      <h1 class="text-2xl font-semibold tracking-tight">
        {$t("auth.login.title")}
      </h1>
      <p class="text-sm text-muted-foreground">{$t("auth.login.subtitle")}</p>
    </div>

    {#if maintenanceEnabled}
      <Alert>
        <AlertTitle>{$t("auth.login.maintenanceTitle")}</AlertTitle>
        <AlertDescription>
          {siteConfig.config?.maintenanceMessage ||
            $t("auth.login.maintenanceFallback")}
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
          <FieldLabel for="account">{$t("auth.login.account")}</FieldLabel>
          <Input
            id="account"
            bind:value={account}
            name="account"
            placeholder={$t("auth.login.accountPlaceholder")}
            autocomplete="username"
            spellcheck={false}
            required
          />
        </Field>
        <Field data-invalid={!!passwordError}>
          <FieldLabel for="password">{$t("auth.login.password")}</FieldLabel>
          <PasswordInput
            id="password"
            bind:value={password}
            name="password"
            placeholder={$t("auth.login.passwordPlaceholder")}
            autocomplete="current-password"
            aria-invalid={!!passwordError}
            required
            oninput={() => (passwordError = null)}
          />
          {#if passwordError}<FieldError>{passwordError}</FieldError>{/if}
        </Field>
        <Field>
          <LoadingButton type="submit" class="w-full" loading={submitting}>
            {$t("auth.login.submit")}
          </LoadingButton>
          <FieldDescription class="text-center">
            {$t("auth.login.noAccount")}
            <a
              href={resolve("register")}
              class="underline-offset-4 hover:underline"
            >
              {$t("auth.login.registerLink")}
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  </div>
</AuthShell>
