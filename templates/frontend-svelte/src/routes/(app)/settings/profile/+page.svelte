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
  import { t } from "#lib/i18n.js"
  import { useToast } from "#lib/hooks/use-toast.js"
  import { auth } from "#lib/stores/auth.svelte.js"

  const toast = useToast()
  const isWide = useMediaQuery("(min-width: 1024px)")

  const profileTabs = $derived([
    {
      value: "profile",
      title: $t("profilePage.tabs.profile"),
      icon: UserRound,
    },
    {
      value: "security",
      title: $t("profilePage.tabs.security"),
      icon: KeyRound,
    },
  ])

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

  function clearPasswordError() {
    if (passwordError) passwordError = null
  }

  async function handleProfileSubmit() {
    profileSaving = true
    const res = await updateMe({ name, email })
    profileSaving = false
    if (res.code !== 0) {
      toast.error(res.message || $t("profilePage.saveFailed"))
      return
    }
    auth.updateUser({ name, email })
    toast.success($t("profilePage.saveSuccess"))
  }

  async function handlePasswordSubmit() {
    if (newPassword.length < 6) {
      passwordError = $t("profilePage.passwordMin")
      return
    }
    if (newPassword !== confirmPassword) {
      passwordError = $t("profilePage.passwordMismatch")
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
      passwordError = res.message || $t("profilePage.passwordFailed")
      return
    }
    toast.success($t("profilePage.passwordSuccess"))
    currentPassword = ""
    newPassword = ""
    confirmPassword = ""
  }
</script>

<svelte:head
  ><title>{$t("profilePage.title")} · {$t("pwa.defaultName")}</title
  ></svelte:head
>

<div class="flex flex-col gap-(--page-gap)">
  <UnsavedChangesGuard
    when={profileDirty ||
      currentPassword !== "" ||
      newPassword !== "" ||
      confirmPassword !== ""}
  />
  <PageHeader
    title={$t("profilePage.title")}
    description={$t("profilePage.description")}
  />

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
      <Card variant="plain">
        <CardHeader>
          <CardTitle>{$t("profilePage.profileTitle")}</CardTitle>
          <CardDescription
            >{$t("profilePage.profileDescription")}</CardDescription
          >
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
                <FieldLabel for="name">{$t("profilePage.name")}</FieldLabel>
                <Input
                  id="name"
                  bind:value={name}
                  name="name"
                  placeholder={$t("profilePage.namePlaceholder")}
                  autocomplete="name"
                />
              </Field>
              <Field>
                <FieldLabel for="email">{$t("profilePage.email")}</FieldLabel>
                <Input
                  id="email"
                  bind:value={email}
                  name="email"
                  type="email"
                  placeholder={$t("profilePage.emailPlaceholder")}
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
            {$t("profilePage.save")}
          </LoadingButton>
        </CardFooter>
      </Card>
    </TabsContent>

    <TabsContent
      value="security"
      class="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
    >
      <Card variant="plain">
        <CardHeader>
          <CardTitle>{$t("profilePage.securityTitle")}</CardTitle>
          <CardDescription
            >{$t("profilePage.securityDescription")}</CardDescription
          >
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
                <FieldLabel for="current-password"
                  >{$t("profilePage.currentPassword")}</FieldLabel
                >
                <PasswordInput
                  id="current-password"
                  bind:value={currentPassword}
                  placeholder={$t("profilePage.currentPasswordPlaceholder")}
                  autocomplete="current-password"
                  required
                  oninput={clearPasswordError}
                />
              </Field>
              <Field>
                <FieldLabel for="new-password"
                  >{$t("profilePage.newPassword")}</FieldLabel
                >
                <PasswordInput
                  id="new-password"
                  bind:value={newPassword}
                  placeholder={$t("profilePage.newPasswordPlaceholder")}
                  autocomplete="new-password"
                  required
                  oninput={clearPasswordError}
                />
              </Field>
              <Field data-invalid={!!passwordError}>
                <FieldLabel for="confirm-password"
                  >{$t("profilePage.confirmPassword")}</FieldLabel
                >
                <PasswordInput
                  id="confirm-password"
                  bind:value={confirmPassword}
                  placeholder={$t("profilePage.confirmPasswordPlaceholder")}
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
            {$t("profilePage.updatePassword")}
          </LoadingButton>
        </CardFooter>
      </Card>
    </TabsContent>
  </Tabs>
</div>
