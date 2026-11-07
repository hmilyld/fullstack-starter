import * as React from "react"
import { Link, useNavigate } from "react-router"

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
import { login as apiLogin } from "@/api/auth"
import { useAuth } from "@/lib/auth-context"
import { useSiteConfig } from "@/lib/site-config"
import { appToast } from "@/lib/toast"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
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
      setPasswordError("密码至少 6 位")
      return
    }

    setPasswordError(null)
    setSubmitting(true)
    const res = await apiLogin(account, password)
    if (res.code === 0) {
      login(res.data.token, res.data.user)
      appToast.success("登录成功")
      navigate("/dashboard", { replace: true })
      return
    }

    appToast.error(res.message || "登录失败")
    setSubmitting(false)
  }

  return (
    <div className={className} {...props}>
      <div className="flex flex-col gap-6">
        {maintenanceEnabled && (
          <Alert>
            <AlertTitle>系统维护中</AlertTitle>
            <AlertDescription>
              {config.maintenanceMessage || "系统正在维护中，请稍后再试。"}
            </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">欢迎回来</CardTitle>
            <CardDescription>使用邮箱或用户名登录您的账户</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="account">邮箱或用户名</FieldLabel>
                  <Input
                    id="account"
                    name="account"
                    placeholder="请输入邮箱或用户名"
                    autoComplete="username"
                    spellCheck={false}
                    value={account}
                    onChange={(event) => setAccount(event.target.value)}
                    required
                  />
                </Field>
                <Field data-invalid={!!passwordError}>
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="请输入密码"
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
                    登录
                  </LoadingButton>
                  <FieldDescription className="text-center">
                    还没有账号？
                    <Link
                      to="/register"
                      className="underline-offset-4 hover:underline"
                    >
                      立即注册
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
