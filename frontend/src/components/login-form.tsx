import * as React from "react"
import { Link, useNavigate } from "react-router"
import { cn } from "@/lib/utils"
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
import { login as apiLogin } from "@/lib/api"
import { appToast } from "@/lib/toast"
import { useAuth } from "@/lib/auth-context"
import { useSystemConfig } from "@/components/settings-loader"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = React.useState(false)
  const config = useSystemConfig()

  const maintenanceEnabled = config !== null && config.maintenanceEnabled

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const form = e.target as HTMLFormElement
    const account = (form.elements.namedItem("account") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value

    const res = await apiLogin(account, password)
    if (res.code === 0) {
      login(res.data.token, res.data.user)
      appToast.success("登录成功")
      navigate("/dashboard")
    } else {
      appToast.error(res.message)
      setSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
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
          <CardDescription>
            使用邮箱或用户名登录您的账户
          </CardDescription>
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
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">密码</FieldLabel>
                <Input id="password" name="password" type="password" placeholder="请输入密码" required />
              </Field>
              <Field>
                <LoadingButton type="submit" className="w-full" loading={submitting}>
                  登录
                </LoadingButton>
                <FieldDescription className="text-center">
                  还没有账号？<Link to="/register" className="underline-offset-4 hover:underline">立即注册</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
