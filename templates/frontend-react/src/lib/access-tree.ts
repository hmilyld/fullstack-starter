import type { Permission } from "@/types/permission"

export type PermissionTreeNode = Permission & {
  children: Permission[]
}

/** 把菜单权限和操作权限拼成同一棵树，供权限总览与角色授权复用。 */
export function buildPermissionTree(
  menuPermissions: Permission[],
  operationPermissions: Permission[]
): PermissionTreeNode[] {
  const operationsByParent = new Map<string, Permission[]>()
  for (const operation of operationPermissions) {
    if (!operation.parent) continue
    const list = operationsByParent.get(operation.parent) ?? []
    list.push(operation)
    operationsByParent.set(operation.parent, list)
  }

  return menuPermissions.map((menu) => ({
    ...menu,
    children: operationsByParent.get(menu.code) ?? [],
  }))
}

/** 按名称/编码过滤树；菜单命中时保留全部子项，仅子项命中时只保留命中的子项。 */
export function filterPermissionTree(
  tree: PermissionTreeNode[],
  keyword: string
): PermissionTreeNode[] {
  const query = keyword.trim().toLowerCase()
  if (!query) return tree

  return tree.flatMap((node) => {
    const nodeMatch =
      node.code.toLowerCase().includes(query) ||
      node.name.toLowerCase().includes(query)
    const matchedChildren = node.children.filter(
      (child) =>
        child.code.toLowerCase().includes(query) ||
        child.name.toLowerCase().includes(query)
    )
    if (!nodeMatch && matchedChildren.length === 0) return []
    return [{ ...node, children: nodeMatch ? node.children : matchedChildren }]
  })
}

export type OperationPreset = {
  verb: string
  label: string
}

export const OPERATION_PRESETS: OperationPreset[] = [
  { verb: "view", label: "查看" },
  { verb: "create", label: "新增" },
  { verb: "edit", label: "编辑" },
  { verb: "delete", label: "删除" },
  { verb: "export", label: "导出" },
  { verb: "import", label: "导入" },
]

export function buildOperationCode(menuCode: string, verb: string): string {
  return `${menuCode}.${verb}`
}
