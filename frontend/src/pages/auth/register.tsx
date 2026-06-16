import * as React from "react"
import { Link, useNavigate } from "react-router"
import { LoadingButton } from "@/components/shared/loading-button"
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { register } from "@/lib/api"
import { appToast } from "@/lib/toast"
import { useSystemConfig } from "@/components/settings-loader"

export function RegisterPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = React.useState(false)
  const config = useSystemConfig()

  const registrationDisabled = config !== null && !config.openRegistration

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const form = e.target as HTMLFormElement
    const username = (form.elements.namedItem("username") as HTMLInputElement).value
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value

    const res = await register({ username, email, password })
    if (res.code === 0) {
      appToast.success("注册成功")
      navigate("/login")
    } else {
      appToast.error(res.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {registrationDisabled && (
          <Alert className="mb-6">
            <AlertTitle>注册功能已关闭</AlertTitle>
            <AlertDescription>请联系管理员开通注册。</AlertDescription>
          </Alert>
        )}
        {config?.manualReview && !registrationDisabled && (
          <Alert className="mb-6">
            <AlertDescription>注册后需管理员审核通过才能登录</AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">创建账号</CardTitle>
            <CardDescription>
              填写以下信息完成注册
            </CardDescription>
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
                    required
                    disabled={registrationDisabled}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="请输入密码"
                    required
                    disabled={registrationDisabled}
                  />
                </Field>
                <Field>
                  <LoadingButton type="submit" className="w-full" loading={submitting} disabled={registrationDisabled}>
                    注册
                  </LoadingButton>
                  <FieldDescription className="text-center">
                    已有账号？<Link to="/login" className="underline-offset-4 hover:underline">立即登录</Link>
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
