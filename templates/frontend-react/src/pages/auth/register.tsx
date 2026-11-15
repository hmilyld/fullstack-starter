import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"

import { AuthShell } from "@/components/shared/auth-shell"
import { LoadingButton } from "@/components/shared/loading-button"
import { PasswordInput } from "@/components/shared/password-input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { register } from "@/api/auth"
import { useAuth } from "@/lib/auth-context"
import { useSiteConfig } from "@/lib/site-config"
import { appToast } from "@/lib/toast"

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const { config } = useSiteConfig()
  const [username, setUsername] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const registrationDisabled = config !== null && !config.openRegistration

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 6) {
      setPasswordError(t("auth.register.passwordMin"))
      return
    }

    setPasswordError(null)
    setSubmitting(true)
    const res = await register({ username, email, password })
    if (res.code === 0 && res.data?.token) {
      login(res.data.token, res.data.user)
      appToast.success(t("auth.register.success"))
      navigate("/dashboard", { replace: true })
      return
    }
    if (res.code === 0) {
      appToast.success(res.message || t("auth.register.successPending"))
      navigate("/login", { replace: true })
      return
    }

    appToast.error(res.message || t("auth.register.failed"))
    setSubmitting(false)
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("auth.register.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.register.subtitle")}
          </p>
        </div>
        {registrationDisabled && (
          <Alert>
            <AlertTitle>{t("auth.register.disabledTitle")}</AlertTitle>
            <AlertDescription>
              {t("auth.register.disabledDescription")}
            </AlertDescription>
          </Alert>
        )}
        {config?.manualReview && !registrationDisabled && (
          <Alert>
            <AlertDescription>
              {t("auth.register.reviewNotice")}
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="username">
                {t("auth.register.username")}
              </FieldLabel>
              <Input
                id="username"
                name="username"
                placeholder={t("auth.register.usernamePlaceholder")}
                autoComplete="username"
                spellCheck={false}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                disabled={registrationDisabled}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">
                {t("auth.register.email")}
              </FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("auth.register.emailPlaceholder")}
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={registrationDisabled}
              />
            </Field>
            <Field data-invalid={!!passwordError}>
              <FieldLabel htmlFor="password">
                {t("auth.register.password")}
              </FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                placeholder={t("auth.register.passwordPlaceholder")}
                autoComplete="new-password"
                value={password}
                aria-invalid={!!passwordError}
                onChange={(event) => {
                  setPasswordError(null)
                  setPassword(event.target.value)
                }}
                required
                disabled={registrationDisabled}
              />
              <FieldError>{passwordError}</FieldError>
            </Field>
            <Field>
              <LoadingButton
                type="submit"
                className="w-full"
                loading={submitting}
                disabled={registrationDisabled}
              >
                {t("auth.register.submit")}
              </LoadingButton>
              <FieldDescription className="text-center">
                {t("auth.register.hasAccount")}
                <Link
                  to="/login"
                  className="underline-offset-4 hover:underline"
                >
                  {t("auth.register.loginLink")}
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </AuthShell>
  )
}
