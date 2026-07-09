import type { User, Role, Permission, SystemConfig } from "@/types/api"
import {
  SEED_MENU_PERMISSIONS,
  SEED_OPERATION_PERMISSIONS,
  SEED_PRESET_ROLES,
} from "@/lib/permissions"

// ============================================================
// localStorage Key
// ============================================================

const KEYS = {
  users: "mock_users",
  roles: "mock_roles",
  menuPermissions: "mock_menu_permissions",
  operationPermissions: "mock_operation_permissions",
  systemConfig: "mock_system_config",
} as const

// ============================================================
// 辅助函数
// ============================================================

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data))
}

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================
// 初始化种子数据
// ============================================================

function initSeedData() {
  if (!localStorage.getItem(KEYS.menuPermissions)) {
    save(KEYS.menuPermissions, SEED_MENU_PERMISSIONS)
  }
  if (!localStorage.getItem(KEYS.operationPermissions)) {
    save(KEYS.operationPermissions, SEED_OPERATION_PERMISSIONS)
  }
  if (!localStorage.getItem(KEYS.roles)) {
    save(KEYS.roles, SEED_PRESET_ROLES)
  }
  if (!localStorage.getItem(KEYS.users)) {
    const seedUsers: User[] = [
      { id: "1", username: "admin", name: "管理员", email: "admin@example.com", roleId: "admin", avatar: "" },
      { id: "2", username: "zhangsan", name: "张三", email: "zhangsan@example.com", roleId: "admin", avatar: "" },
      { id: "3", username: "lisi", name: "李四", email: "lisi@example.com", roleId: "user", avatar: "" },
      { id: "4", username: "wangwu", name: "王五", email: "wangwu@example.com", roleId: "user", avatar: "" },
      { id: "5", username: "zhaoliu", name: "赵六", email: "zhaoliu@example.com", roleId: "user", avatar: "" },
    ]
    save(KEYS.users, seedUsers)
  }
  if (!localStorage.getItem(KEYS.systemConfig)) {
    const seedConfig: SystemConfig = {
      siteName: "管理系统",
      siteDescription: "一个基于 React 的后台管理框架",
      keywords: "管理后台, React, shadcn",
      maintenanceEnabled: false,
      maintenanceMessage: "系统正在进行升级维护，预计 30 分钟后恢复。",
      openRegistration: true,
      manualReview: false,
      defaultRoleId: "user",
      welcomeMessage: "欢迎加入！请先完善个人信息。",
      smtpEnabled: false,
      smtpHost: "",
      smtpPort: 587,
      smtpUsername: "",
      smtpPassword: "",
      smtpFromName: "管理系统",
      smtpFromEmail: "",
      smtpUseSsl: true,
    }
    save(KEYS.systemConfig, seedConfig)
  }
}

// 首次加载时初始化
initSeedData()

// ============================================================
// Users CRUD
// ============================================================

export const usersDb = {
  async list(params?: { search?: string; page?: number; pageSize?: number }) {
    await delay()
    let list: User[] = load<User[]>(KEYS.users, [])
    const search = params?.search ?? ""
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    }
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const total = list.length
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total, page, pageSize }
  },

  async getById(id: string) {
    await delay()
    const list = load<User[]>(KEYS.users, [])
    return list.find((u) => u.id === id) ?? null
  },

  async create(data: Omit<User, "id" | "avatar">) {
    await delay()
    const list = load<User[]>(KEYS.users, [])
    const newUser: User = { ...data, id: String(Date.now()), avatar: "" }
    list.push(newUser)
    save(KEYS.users, list)
    return newUser
  },

  async update(id: string, data: Partial<Omit<User, "id">>) {
    await delay()
    const list = load<User[]>(KEYS.users, [])
    const idx = list.findIndex((u) => u.id === id)
    if (idx === -1) throw new Error("用户不存在")
    list[idx] = { ...list[idx], ...data }
    save(KEYS.users, list)
    return list[idx]
  },

  async delete(id: string) {
    await delay()
    const list = load<User[]>(KEYS.users, [])
    save(
      KEYS.users,
      list.filter((u) => u.id !== id)
    )
  },

  async updateMe(data: { name: string; email: string }) {
    await delay()
    const list = load<User[]>(KEYS.users, [])
    // 模拟更新第一个用户（管理员）
    if (list.length > 0) {
      list[0] = { ...list[0], ...data }
      save(KEYS.users, list)
      return list[0]
    }
    throw new Error("用户不存在")
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    await delay(200)
    // Mock: 只要当前密码不为空就认为成功
    if (!data.currentPassword) throw new Error("请输入当前密码")
    if (!data.newPassword) throw new Error("请输入新密码")
    return {}
  },
}

// ============================================================
// Roles CRUD
// ============================================================

export const rolesDb = {
  async list(params?: { search?: string; page?: number; pageSize?: number }) {
    await delay()
    let list: Role[] = load<Role[]>(KEYS.roles, [])
    const search = params?.search ?? ""
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      )
    }
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const total = list.length
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total, page, pageSize }
  },

  async create(data: Omit<Role, "id" | "isPreset">) {
    await delay()
    const list = load<Role[]>(KEYS.roles, [])
    const newRole: Role = { ...data, id: String(Date.now()), isPreset: false }
    list.push(newRole)
    save(KEYS.roles, list)
    return newRole
  },

  async update(id: string, data: Partial<Omit<Role, "id" | "isPreset">>) {
    await delay()
    const list = load<Role[]>(KEYS.roles, [])
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error("角色不存在")
    list[idx] = { ...list[idx], ...data }
    save(KEYS.roles, list)
    return list[idx]
  },

  async delete(id: string) {
    await delay()
    const list = load<Role[]>(KEYS.roles, [])
    const target = list.find((r) => r.id === id)
    if (target?.isPreset) throw new Error("预设角色不可删除")
    save(
      KEYS.roles,
      list.filter((r) => r.id !== id)
    )
  },
}

// ============================================================
// Permissions CRUD
// ============================================================

export const permissionsDb = {
  async list(params?: { type?: "menu" | "operation"; parent?: string }) {
    await delay()
    if (params?.type === "menu") {
      return load<Permission[]>(KEYS.menuPermissions, [])
    }
    if (params?.type === "operation") {
      let list = load<Permission[]>(KEYS.operationPermissions, [])
      if (params.parent) {
        list = list.filter((p) => p.parent === params.parent)
      }
      return list
    }
    // 返回全部
    const menus = load<Permission[]>(KEYS.menuPermissions, [])
    const ops = load<Permission[]>(KEYS.operationPermissions, [])
    return [...menus, ...ops]
  },

  async create(data: Permission) {
    await delay()
    if (data.type === "menu") {
      const list = load<Permission[]>(KEYS.menuPermissions, [])
      if (list.some((p) => p.code === data.code)) throw new Error("权限编码已存在")
      list.push(data)
      save(KEYS.menuPermissions, list)
    } else {
      const list = load<Permission[]>(KEYS.operationPermissions, [])
      if (list.some((p) => p.code === data.code)) throw new Error("权限编码已存在")
      list.push(data)
      save(KEYS.operationPermissions, list)
    }
    return data
  },

  async update(code: string, data: Partial<Pick<Permission, "name" | "parent">>) {
    await delay()
    // 先在菜单权限中查找
    const menus = load<Permission[]>(KEYS.menuPermissions, [])
    const menuIdx = menus.findIndex((p) => p.code === code)
    if (menuIdx !== -1) {
      menus[menuIdx] = { ...menus[menuIdx], ...data }
      save(KEYS.menuPermissions, menus)
      return menus[menuIdx]
    }
    // 再在操作权限中查找
    const ops = load<Permission[]>(KEYS.operationPermissions, [])
    const opIdx = ops.findIndex((p) => p.code === code)
    if (opIdx !== -1) {
      ops[opIdx] = { ...ops[opIdx], ...data }
      save(KEYS.operationPermissions, ops)
      return ops[opIdx]
    }
    throw new Error("权限不存在")
  },

  async delete(code: string) {
    await delay(200)
    // 先尝试删除菜单权限（级联删除子权限）
    const menus = load<Permission[]>(KEYS.menuPermissions, [])
    const menuIdx = menus.findIndex((p) => p.code === code)
    if (menuIdx !== -1) {
      save(
        KEYS.menuPermissions,
        menus.filter((p) => p.code !== code)
      )
      // 级联删除操作权限
      const ops = load<Permission[]>(KEYS.operationPermissions, [])
      save(
        KEYS.operationPermissions,
        ops.filter((p) => p.parent !== code)
      )
      return
    }
    // 删除操作权限
    const ops = load<Permission[]>(KEYS.operationPermissions, [])
    save(
      KEYS.operationPermissions,
      ops.filter((p) => p.code !== code)
    )
  },
}

// ============================================================
// System Config
// ============================================================

export const systemDb = {
  async getConfig() {
    await delay()
    return load<SystemConfig>(KEYS.systemConfig, {} as SystemConfig)
  },

  async updateConfig(data: Partial<SystemConfig>) {
    await delay()
    const config = load<SystemConfig>(KEYS.systemConfig, {} as SystemConfig)
    const updated = { ...config, ...data }
    save(KEYS.systemConfig, updated)
    return updated
  },
}

// ============================================================
// Auth
// ============================================================

export const authDb = {
  async login(account: string) {
    await delay(400)
    if (!account) throw new Error("请输入账号")
    const list = load<User[]>(KEYS.users, [])
    const user = list.find(
      (u) => u.username === account || u.email === account
    )
    if (!user) throw new Error("用户不存在")

    // 根据角色获取权限
    const roles = load<Role[]>(KEYS.roles, [])
    const role = roles.find((r) => r.id === user.roleId)
    const permissions = role ? role.permissions : []

    return {
      token: "mock_token_" + Date.now(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.roleId,
        permissions,
      },
    }
  },

  async register(data: { username: string; email: string; password: string }) {
    await delay(400)
    if (!data.username) throw new Error("请输入用户名")
    if (!data.email) throw new Error("请输入邮箱")
    if (!data.password) throw new Error("请输入密码")
    const list = load<User[]>(KEYS.users, [])
    if (list.some((u) => u.username === data.username)) {
      throw new Error("用户名已存在")
    }
    if (list.some((u) => u.email === data.email)) {
      throw new Error("邮箱已被注册")
    }
    const newUser: User = {
      id: String(Date.now()),
      username: data.username,
      name: data.username,
      email: data.email,
      roleId: "user",
      avatar: "",
    }
    list.push(newUser)
    save(KEYS.users, list)
    return {
      token: "mock_token_" + Date.now(),
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        role: newUser.roleId,
      },
    }
  },

  async logout() {
    await delay(100)
    return {}
  },
}

// ============================================================
// Dashboard
// ============================================================

export const dashboardDb = {
  async getStats() {
    await delay(200)
    const users = load<User[]>(KEYS.users, [])
    return {
      totalUsers: users.length,
      activeNow: Math.floor(Math.random() * 100) + 10,
      revenue: "¥" + (Math.floor(Math.random() * 90000) + 10000).toLocaleString(),
      growth: "+" + (Math.floor(Math.random() * 30) + 5) + "%",
    }
  },

  async getActivity() {
    await delay(200)
    return [
      { user: "张三", action: "创建了新项目", time: "2 分钟前" },
      { user: "李四", action: "更新了账户设置", time: "15 分钟前" },
      { user: "王五", action: "上传了 3 个文件", time: "1 小时前" },
      { user: "赵六", action: "发表了评论", time: "2 小时前" },
      { user: "孙七", action: "完成了新手引导", time: "5 小时前" },
    ]
  },
}
