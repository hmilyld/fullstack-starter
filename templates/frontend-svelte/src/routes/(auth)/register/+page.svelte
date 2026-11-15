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
  import { t } from "#lib/i18n.js"
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
      passwordError = $t("auth.register.passwordMin")
      return
    }

    passwordError = null
    submitting = true
    const res = await register({ username, email, password })
    if (res.code === 0 && res.data?.token) {
      auth.login(res.data.token, res.data.user)
      toast.success($t("auth.register.success"))
      await goto(resolve("dashboard"), { replace: true })
      return
    }
    if (res.code === 0) {
      toast.success(res.message || $t("auth.register.successPending"))
      await goto(resolve("login"), { replace: true })
      return
    }

    toast.error(res.message || $t("auth.register.failed"))
    submitting = false
  }
</script>

<svelte:head
  ><title
    >{$t("auth.register.submit")} · {siteConfig.config?.siteName?.trim() ||
      $t("pwa.defaultName")}</title
  ></svelte:head
>

<AuthShell>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1.5">
      <h1 class="text-2xl font-semibold tracking-tight">
        {$t("auth.register.title")}
      </h1>
      <p class="text-sm text-muted-foreground">
        {$t("auth.register.subtitle")}
      </p>
    </div>

    {#if registrationDisabled}
      <Alert>
        <AlertTitle>{$t("auth.register.disabledTitle")}</AlertTitle>
        <AlertDescription
          >{$t("auth.register.disabledDescription")}</AlertDescription
        >
      </Alert>
    {/if}
    {#if manualReview}
      <Alert>
        <AlertDescription>{$t("auth.register.reviewNotice")}</AlertDescription>
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
          <FieldLabel for="username">{$t("auth.register.username")}</FieldLabel>
          <Input
            id="username"
            bind:value={username}
            name="username"
            placeholder={$t("auth.register.usernamePlaceholder")}
            autocomplete="username"
            spellcheck={false}
            required
            disabled={registrationDisabled}
          />
        </Field>
        <Field>
          <FieldLabel for="email">{$t("auth.register.email")}</FieldLabel>
          <Input
            id="email"
            bind:value={email}
            name="email"
            type="email"
            placeholder={$t("auth.register.emailPlaceholder")}
            autocomplete="email"
            spellcheck={false}
            required
            disabled={registrationDisabled}
          />
        </Field>
        <Field data-invalid={!!passwordError}>
          <FieldLabel for="password">{$t("auth.register.password")}</FieldLabel>
          <PasswordInput
            id="password"
            bind:value={password}
            name="password"
            placeholder={$t("auth.register.passwordPlaceholder")}
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
            {$t("auth.register.submit")}
          </LoadingButton>
          <FieldDescription class="text-center">
            {$t("auth.register.hasAccount")}
            <a
              href={resolve("login")}
              class="underline-offset-4 hover:underline"
            >
              {$t("auth.register.loginLink")}
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  </div>
</AuthShell>
