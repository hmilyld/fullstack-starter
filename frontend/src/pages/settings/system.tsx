import * as React from "react"
import { LoadingButton } from "@/components/shared/loading-button"
import { Spinner } from "@/components/ui/spinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSystemConfig, updateSystemConfig, getRoles } from "@/lib/api"
import type { SystemConfig } from "@/types/api"

export function SystemPage() {
  const [config, setConfig] = React.useState<SystemConfig | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [siteMsg, setSiteMsg] = React.useState("")
  const [maintainMsg, setMaintainMsg] = React.useState("")
  const [registerMsg, setRegisterMsg] = React.useState("")
  const [defaultMsg, setDefaultMsg] = React.useState("")
  const [siteSaving, setSiteSaving] = React.useState(false)
  const [maintainSaving, setMaintainSaving] = React.useState(false)
  const [registerSaving, setRegisterSaving] = React.useState(false)
  const [defaultSaving, setDefaultSaving] = React.useState(false)
  const [roles, setRoles] = React.useState<{ id: string; name: string }[]>([])

  React.useEffect(() => {
    async function load() {
      const res = await getSystemConfig()
      if (res.code === 0) setConfig(res.data)
      setLoading(false)
    }
    load()
    getRoles({ pageSize: 100 }).then((res) => {
      if (res.code === 0) setRoles(res.data.list)
    })
  }, [])

  function updateField<K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) {
    if (!config) return
    setConfig({ ...config, [key]: value })
  }

  async function handleSaveSite() {
    if (!config) return
    setSiteSaving(true)
    const res = await updateSystemConfig({
      siteName: config.siteName,
      siteDescription: config.siteDescription,
      keywords: config.keywords,
    })
    setSiteSaving(false)
    setSiteMsg(res.code === 0 ? "保存成功" : res.message)
    setTimeout(() => setSiteMsg(""), 3000)
  }

  async function handleSaveMaintenance() {
    if (!config) return
    setMaintainSaving(true)
    const res = await updateSystemConfig({
      maintenanceEnabled: config.maintenanceEnabled,
      maintenanceMessage: config.maintenanceMessage,
    })
    setMaintainSaving(false)
    setMaintainMsg(res.code === 0 ? "保存成功" : res.message)
    setTimeout(() => setMaintainMsg(""), 3000)
  }

  async function handleSaveRegistration() {
    if (!config) return
    setRegisterSaving(true)
    const res = await updateSystemConfig({
      openRegistration: config.openRegistration,
      manualReview: config.manualReview,
    })
    setRegisterSaving(false)
    setRegisterMsg(res.code === 0 ? "保存成功" : res.message)
    setTimeout(() => setRegisterMsg(""), 3000)
  }

  async function handleSaveDefault() {
    if (!config) return
    setDefaultSaving(true)
    const res = await updateSystemConfig({
      defaultRoleId: config.defaultRoleId,
      welcomeMessage: config.welcomeMessage,
    })
    setDefaultSaving(false)
    setDefaultMsg(res.code === 0 ? "保存成功" : res.message)
    setTimeout(() => setDefaultMsg(""), 3000)
  }

  if (loading) return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
      <Spinner />加载中...
    </div>
  )
  if (!config) return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
      加载失败
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground">管理站点全局配置和注册策略。</p>
      </div>

      <Tabs defaultValue="site" className="w-full">
        <TabsList>
          <TabsTrigger value="site">站点设置</TabsTrigger>
          <TabsTrigger value="register">注册设置</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>配置站点名称、描述等基本信息。</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="site-name">站点名称</FieldLabel>
                  <Input id="site-name" value={config.siteName} onChange={(e) => updateField("siteName", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="site-desc">站点描述</FieldLabel>
                  <Input id="site-desc" value={config.siteDescription} onChange={(e) => updateField("siteDescription", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="site-keywords">关键词</FieldLabel>
                  <Input id="site-keywords" value={config.keywords} onChange={(e) => updateField("keywords", e.target.value)} />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-4">
                <LoadingButton onClick={handleSaveSite} loading={siteSaving}>
                  保存基本信息
                </LoadingButton>
                {siteMsg && <span className="text-sm text-muted-foreground">{siteMsg}</span>}
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>维护模式</CardTitle>
              <CardDescription>开启后普通用户将无法访问系统。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel>开启维护模式</FieldLabel>
                  <FieldDescription>仅管理员可登录，其他用户看到维护提示。</FieldDescription>
                </div>
                <Switch checked={config.maintenanceEnabled} onCheckedChange={(v) => updateField("maintenanceEnabled", v)} />
              </Field>
              <Separator />
              <Field>
                <FieldLabel htmlFor="maintain-msg">维护提示信息</FieldLabel>
                <Input id="maintain-msg" value={config.maintenanceMessage} onChange={(e) => updateField("maintenanceMessage", e.target.value)} />
              </Field>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-4">
                <LoadingButton onClick={handleSaveMaintenance} loading={maintainSaving}>
                  保存维护设置
                </LoadingButton>
                {maintainMsg && <span className="text-sm text-muted-foreground">{maintainMsg}</span>}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="register" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>注册策略</CardTitle>
              <CardDescription>控制用户注册方式和验证流程。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel>开放注册</FieldLabel>
                  <FieldDescription>允许新用户自行注册账号。</FieldDescription>
                </div>
                <Switch checked={config.openRegistration} onCheckedChange={(v) => updateField("openRegistration", v)} />
              </Field>
              <Separator />

              <Field orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel>人工审核</FieldLabel>
                  <FieldDescription>新注册用户需要管理员审核后才能使用系统。</FieldDescription>
                </div>
                <Switch checked={config.manualReview} onCheckedChange={(v) => updateField("manualReview", v)} />
              </Field>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-4">
                <LoadingButton onClick={handleSaveRegistration} loading={registerSaving}>
                  保存注册策略
                </LoadingButton>
                {registerMsg && <span className="text-sm text-muted-foreground">{registerMsg}</span>}
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>默认配置</CardTitle>
              <CardDescription>新注册用户的默认角色和状态。</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>默认角色</FieldLabel>
                  <Select value={config.defaultRoleId} onValueChange={(v) => updateField("defaultRoleId", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="请选择默认角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>新注册用户自动分配的角色。</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="welcome-msg">欢迎消息</FieldLabel>
                  <Input id="welcome-msg" value={config.welcomeMessage} onChange={(e) => updateField("welcomeMessage", e.target.value)} />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-4">
                <LoadingButton onClick={handleSaveDefault} loading={defaultSaving}>
                  保存默认配置
                </LoadingButton>
                {defaultMsg && <span className="text-sm text-muted-foreground">{defaultMsg}</span>}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
