import * as React from "react"
import { useLocation } from "react-router"
import { LoadingButton } from "@/components/shared/loading-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateMe, changePassword } from "@/lib/api"

export function ProfilePage() {
  const location = useLocation()
  const state = location.state as { tab?: string } | null
  const [activeTab, setActiveTab] = React.useState(state?.tab ?? "profile")

  React.useEffect(() => {
    if (state?.tab) {
      setActiveTab(state.tab)
    }
  }, [state])

  // 个人信息表单
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [profileMsg, setProfileMsg] = React.useState("")
  const [profileSaving, setProfileSaving] = React.useState(false)

  React.useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setName(user.name ?? "")
      setEmail(user.email ?? "")
    }
  }, [])

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    const res = await updateMe({ name, email })
    setProfileSaving(false)
    if (res.code === 0) {
      setProfileMsg("保存成功")
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        user.name = name
        user.email = email
        localStorage.setItem("user", JSON.stringify(user))
      }
    } else {
      setProfileMsg(res.message)
    }
    setTimeout(() => setProfileMsg(""), 3000)
  }

  // 密码修改表单
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [passwordMsg, setPasswordMsg] = React.useState("")
  const [passwordSaving, setPasswordSaving] = React.useState(false)

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMsg("两次输入的密码不一致")
      setTimeout(() => setPasswordMsg(""), 3000)
      return
    }
    setPasswordSaving(true)
    const res = await changePassword({ currentPassword, newPassword })
    setPasswordSaving(false)
    if (res.code === 0) {
      setPasswordMsg("密码修改成功")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      setPasswordMsg(res.message)
    }
    setTimeout(() => setPasswordMsg(""), 3000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">个人设置</h1>
        <p className="text-muted-foreground">
          管理您的账户设置和偏好。
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="profile">个人设置</TabsTrigger>
          <TabsTrigger value="security">密码修改</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>个人设置</CardTitle>
              <CardDescription>
                更新您的基本账户信息。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">姓名</FieldLabel>
                    <Input id="name" placeholder="请输入姓名" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">邮箱</FieldLabel>
                    <Input id="email" type="email" placeholder="请输入邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                </FieldGroup>
                <CardFooter className="px-0 pt-4">
                  <div className="flex items-center gap-4">
                    <LoadingButton type="submit" loading={profileSaving}>
                      保存更改
                    </LoadingButton>
                    {profileMsg && <span className="text-sm text-muted-foreground">{profileMsg}</span>}
                  </div>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>密码修改</CardTitle>
              <CardDescription>修改您的登录密码。</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="current-password">当前密码</FieldLabel>
                    <Input id="current-password" type="password" placeholder="请输入当前密码" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="new-password">新密码</FieldLabel>
                    <Input id="new-password" type="password" placeholder="请输入新密码" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">确认密码</FieldLabel>
                    <Input id="confirm-password" type="password" placeholder="请再次输入新密码" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </Field>
                </FieldGroup>
                <CardFooter className="px-0 pt-4">
                  <div className="flex items-center gap-4">
                    <LoadingButton type="submit" loading={passwordSaving}>
                      更新密码
                    </LoadingButton>
                    {passwordMsg && <span className="text-sm text-muted-foreground">{passwordMsg}</span>}
                  </div>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
