import * as React from "react"
import { Link, useNavigate } from "react-router"

import { AuthShell } from "@/components/shared/auth-shell"
import { LoadingButton } from "@/components/shared/loading-button"
import { PasswordInput } from "@/components/shared/password-input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
      setPasswordError("密码至少 6 位")
      return
    }

    setPasswordError(null)
    setSubmitting(true)
    const res = await register({ username, email, password })
    if (res.code === 0 && res.data?.token) {
      login(res.data.token, res.data.user)
      appToast.success("注册成功")
      navigate("/dashboard", { replace: true })
      return
    }
    if (res.code === 0) {
      appToast.success(res.message || "注册成功，请等待管理员审核")
      navigate("/login", { replace: true })
      return
    }

    appToast.error(res.message || "注册失败")
    setSubmitting(false)
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-4">
        {registrationDisabled && (
          <Alert>
            <AlertTitle>注册功能已关闭</AlertTitle>
            <AlertDescription>请联系管理员开通注册。</AlertDescription>
          </Alert>
        )}
        {config?.manualReview && !registrationDisabled && (
          <Alert>
            <AlertDescription>注册后需管理员审核通过才能登录</AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">创建账号</CardTitle>
            <CardDescription>填写以下信息完成注册</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">用户名</FieldLabel>
                  <Input
                    id="username"
                    name="username"
                    placeholder="请输入用户名"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    disabled={registrationDisabled}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">邮箱</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="请输入邮箱"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={registrationDisabled}
                  />
                </Field>
                <Field data-invalid={!!passwordError}>
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="至少 6 位"
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
                    注册
                  </LoadingButton>
                  <FieldDescription className="text-center">
                    已有账号？
                    <Link
                      to="/login"
                      className="underline-offset-4 hover:underline"
                    >
                      立即登录
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  )
}
