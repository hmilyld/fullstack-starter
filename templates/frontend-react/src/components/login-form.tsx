import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"

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
import { login as apiLogin } from "@/api/auth"
import { useAuth } from "@/lib/auth-context"
import { useSiteConfig } from "@/lib/site-config"
import { appToast } from "@/lib/toast"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const { config } = useSiteConfig()
  const [account, setAccount] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const maintenanceEnabled = config !== null && config.maintenanceEnabled

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 6) {
      setPasswordError(t("auth.login.passwordMin"))
      return
    }

    setPasswordError(null)
    setSubmitting(true)
    const res = await apiLogin(account, password)
    if (res.code === 0) {
      login(res.data.token, res.data.user)
      appToast.success(t("auth.login.success"))
      navigate("/dashboard", { replace: true })
      return
    }

    appToast.error(res.message || t("auth.login.failed"))
    setSubmitting(false)
  }

  return (
    <div className={className} {...props}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("auth.login.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.login.subtitle")}
          </p>
        </div>
        {maintenanceEnabled && (
          <Alert>
            <AlertTitle>{t("auth.login.maintenanceTitle")}</AlertTitle>
            <AlertDescription>
              {config.maintenanceMessage || t("auth.login.maintenanceFallback")}
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="account">
                {t("auth.login.account")}
              </FieldLabel>
              <Input
                id="account"
                name="account"
                placeholder={t("auth.login.accountPlaceholder")}
                autoComplete="username"
                spellCheck={false}
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                required
              />
            </Field>
            <Field data-invalid={!!passwordError}>
              <FieldLabel htmlFor="password">
                {t("auth.login.password")}
              </FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                placeholder={t("auth.login.passwordPlaceholder")}
                autoComplete="current-password"
                value={password}
                aria-invalid={!!passwordError}
                onChange={(event) => {
                  setPasswordError(null)
                  setPassword(event.target.value)
                }}
                required
              />
              <FieldError>{passwordError}</FieldError>
            </Field>
            <Field>
              <LoadingButton
                type="submit"
                className="w-full"
                loading={submitting}
              >
                {t("auth.login.submit")}
              </LoadingButton>
              <FieldDescription className="text-center">
                {t("auth.login.noAccount")}
                <Link
                  to="/register"
                  className="underline-offset-4 hover:underline"
                >
                  {t("auth.login.registerLink")}
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
