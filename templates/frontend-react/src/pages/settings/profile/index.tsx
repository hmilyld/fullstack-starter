import * as React from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"
import { KeyRoundIcon, UserRoundIcon } from "lucide-react"

import { useMediaQuery } from "@/hooks/use-media-query"

import { LoadingButton } from "@/components/shared/loading-button"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsNav } from "@/components/shared/settings-nav"
import { UnsavedChangesGuard } from "@/components/shared/unsaved-changes-guard"
import { PasswordInput } from "@/components/shared/password-input"
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
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { changePassword, updateMe } from "@/api/user"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"

const PROFILE_TABS = [
  {
    value: "profile",
    titleKey: "profilePage.tabs.profile",
    icon: UserRoundIcon,
  },
  {
    value: "security",
    titleKey: "profilePage.tabs.security",
    icon: KeyRoundIcon,
  },
] as const

export function ProfilePage() {
  const { t } = useTranslation()
  const { user, updateUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const isWide = useMediaQuery("(min-width: 1024px)")
  const tabs = PROFILE_TABS.map((tab) => ({
    ...tab,
    title: t(tab.titleKey),
  }))
  const activeTab =
    searchParams.get("tab") === "security" ? "security" : "profile"

  function setActiveTab(tab: string) {
    setSearchParams(tab === "profile" ? {} : { tab }, { replace: true })
  }

  const [name, setName] = React.useState(user?.name ?? "")
  const [email, setEmail] = React.useState(user?.email ?? "")
  const [profileSaving, setProfileSaving] = React.useState(false)

  const profileDirty =
    name !== (user?.name ?? "") || email !== (user?.email ?? "")

  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [passwordSaving, setPasswordSaving] = React.useState(false)

  function clearPasswordError() {
    if (passwordError) setPasswordError(null)
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileSaving(true)
    const res = await updateMe({ name, email })
    setProfileSaving(false)
    if (res.code !== 0) {
      appToast.error(res.message || t("profilePage.saveFailed"))
      return
    }
    updateUser({ name, email })
    appToast.success(t("profilePage.saveSuccess"))
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newPassword.length < 6) {
      setPasswordError(t("profilePage.passwordMin"))
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("profilePage.passwordMismatch"))
      return
    }

    setPasswordError(null)
    setPasswordSaving(true)
    const res = await changePassword({ currentPassword, newPassword })
    setPasswordSaving(false)
    if (res.code !== 0) {
      setPasswordError(res.message || t("profilePage.passwordFailed"))
      return
    }
    appToast.success(t("profilePage.passwordSuccess"))
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const passwordDirty =
    currentPassword !== "" || newPassword !== "" || confirmPassword !== ""

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <UnsavedChangesGuard when={profileDirty || passwordDirty} />
      <PageHeader
        title={t("profilePage.title")}
        description={t("profilePage.description")}
      />

      <Separator />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        orientation={isWide ? "vertical" : "horizontal"}
        className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-12"
      >
        <SettingsNav items={tabs} />

        <TabsContent
          value="profile"
          className="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
        >
          <Card variant="plain" className="max-w-2xl">
            <CardHeader>
              <CardTitle>{t("profilePage.profileTitle")}</CardTitle>
              <CardDescription>
                {t("profilePage.profileDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="profile-form" onSubmit={handleProfileSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">
                      {t("profilePage.name")}
                    </FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      placeholder={t("profilePage.namePlaceholder")}
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">
                      {t("profilePage.email")}
                    </FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t("profilePage.emailPlaceholder")}
                      autoComplete="email"
                      spellCheck={false}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
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
                className="w-full md:w-auto"
              >
                {t("profilePage.save")}
              </LoadingButton>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent
          value="security"
          className="flex min-w-0 flex-1 flex-col gap-(--page-gap) lg:gap-8"
        >
          <Card variant="plain" className="max-w-2xl">
            <CardHeader>
              <CardTitle>{t("profilePage.securityTitle")}</CardTitle>
              <CardDescription>
                {t("profilePage.securityDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="password-form" onSubmit={handlePasswordSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="current-password">
                      {t("profilePage.currentPassword")}
                    </FieldLabel>
                    <PasswordInput
                      id="current-password"
                      placeholder={t("profilePage.currentPasswordPlaceholder")}
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) => {
                        clearPasswordError()
                        setCurrentPassword(event.target.value)
                      }}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="new-password">
                      {t("profilePage.newPassword")}
                    </FieldLabel>
                    <PasswordInput
                      id="new-password"
                      placeholder={t("profilePage.newPasswordPlaceholder")}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => {
                        clearPasswordError()
                        setNewPassword(event.target.value)
                      }}
                      required
                    />
                  </Field>
                  <Field data-invalid={!!passwordError}>
                    <FieldLabel htmlFor="confirm-password">
                      {t("profilePage.confirmPassword")}
                    </FieldLabel>
                    <PasswordInput
                      id="confirm-password"
                      placeholder={t("profilePage.confirmPasswordPlaceholder")}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => {
                        clearPasswordError()
                        setConfirmPassword(event.target.value)
                      }}
                      aria-invalid={!!passwordError}
                      required
                    />
                    <FieldError>{passwordError}</FieldError>
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
                className="w-full md:w-auto"
              >
                {t("profilePage.updatePassword")}
              </LoadingButton>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
