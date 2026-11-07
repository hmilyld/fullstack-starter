import * as React from "react"
import { useSearchParams } from "react-router"

import { LoadingButton } from "@/components/shared/loading-button"
import { PageHeader } from "@/components/shared/page-header"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { changePassword, updateMe } from "@/api/user"
import { useAuth } from "@/lib/auth-context"
import { appToast } from "@/lib/toast"

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
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
      appToast.error(res.message || "保存失败")
      return
    }
    updateUser({ name, email })
    appToast.success("保存成功")
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newPassword.length < 6) {
      setPasswordError("新密码至少 6 位")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的密码不一致")
      return
    }

    setPasswordError(null)
    setPasswordSaving(true)
    const res = await changePassword({ currentPassword, newPassword })
    setPasswordSaving(false)
    if (res.code !== 0) {
      setPasswordError(res.message || "修改失败")
      return
    }
    appToast.success("密码修改成功")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader title="个人设置" description="管理您的账户信息与登录密码。" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="profile">基本资料</TabsTrigger>
          <TabsTrigger value="security">密码修改</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex flex-col gap-(--page-gap)">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>基本资料</CardTitle>
              <CardDescription>更新您的姓名和邮箱地址。</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="profile-form" onSubmit={handleProfileSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">姓名</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      placeholder="请输入姓名"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
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
                保存更改
              </LoadingButton>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent
          value="security"
          className="flex flex-col gap-(--page-gap)"
        >
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>密码修改</CardTitle>
              <CardDescription>
                修改后需要重新登录其他设备上的会话。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="password-form" onSubmit={handlePasswordSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="current-password">当前密码</FieldLabel>
                    <PasswordInput
                      id="current-password"
                      placeholder="请输入当前密码"
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
                    <FieldLabel htmlFor="new-password">新密码</FieldLabel>
                    <PasswordInput
                      id="new-password"
                      placeholder="至少 6 位"
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
                      确认新密码
                    </FieldLabel>
                    <PasswordInput
                      id="confirm-password"
                      placeholder="请再次输入新密码"
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
                更新密码
              </LoadingButton>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
