/**
 * 从后端权限目录生成文档站的权限码页面。
 *
 * 权限码的唯一来源是代码：
 *   - Python: templates/backend-python/app/catalogs/permissions.py
 *   - Java:   templates/backend-java/.../catalog/PermissionCatalog.java
 *
 * 本脚本读取 Python 目录（结构更易解析），并交叉校验 Java 目录，
 * 两侧不一致时直接失败——这样「改了 catalog 忘了同步另一栈」会在生成阶段暴露，
 * 而不是等到运行时才发现。
 *
 * 用法：
 *   node dist/scripts/sync-permission-docs.js [--check]
 *
 * --check 只校验不写文件，供 CI 使用。
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// tsx 直接运行 scripts/ 下的源码，因此仓库根是上一级
const REPO_ROOT = path.resolve(__dirname, '..');
const PY_CATALOG = path.join(REPO_ROOT, 'templates/backend-python/app/catalogs/permissions.py');
const JAVA_CATALOG = path.join(
  REPO_ROOT,
  'templates/backend-java/src/main/java/com/hmilyld/fullstack/catalog/PermissionCatalog.java'
);
const DOCS_ROOT = path.resolve(REPO_ROOT, '..', 'fullstack-starter-docs/src/content/docs');

/** 文档里的表格区块标记；生成器只替换标记之间的内容。 */
const BEGIN = '<!-- BEGIN GENERATED: permissions -->';
const END = '<!-- END GENERATED: permissions -->';

export interface PermissionItem {
  code: string;
  name: string;
  type: 'menu' | 'operation';
  parent?: string;
}

interface Catalog {
  menu: PermissionItem[];
  operations: PermissionItem[];
}

/** 英文文档里的权限名称。中文名以 catalog 为准，这里只是文档翻译。 */
const EN_NAMES: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'User Management',
  roles: 'Role Management',
  permissions: 'Permission Overview',
  menus: 'Menu & Permissions',
  settings: 'System Settings',
  ai_models: 'AI Model Configuration',
  audit_logs: 'Audit Logs',
  data_management: 'Data Management',
  'users.create': 'Create user',
  'users.edit': 'Edit user',
  'users.delete': 'Delete user',
  'users.assign_role': 'Assign role (non-default)',
  'roles.create': 'Create role',
  'roles.edit': 'Edit role',
  'roles.delete': 'Delete role',
  'permissions.create': 'Create permission / sync',
  'permissions.edit': 'Edit permission',
  'permissions.delete': 'Delete permission',
  'menus.create': 'Create menu / group',
  'menus.edit': 'Edit menu / group',
  'menus.delete': 'Delete custom menu / empty group',
  'menus.reorder': 'Save menu order',
  'settings.edit': 'Edit system settings / test email',
  'ai_models.create': 'Create model',
  'ai_models.edit': 'Edit model',
  'ai_models.delete': 'Delete model',
  'ai_models.presets.create': 'Create preset',
  'ai_models.presets.edit': 'Edit preset',
  'ai_models.presets.delete': 'Delete preset',
  'data_management.export': 'Export full data',
  'data_management.import': 'Import full data',
};

/** 解析 Python catalog：按列表名切块，再逐条提取字段。 */
export function parsePythonCatalog(source: string): Catalog {
  const parseList = (listName: string): PermissionItem[] => {
    const block = new RegExp(`^${listName} = \\[(.*?)^\\]`, 'smu').exec(source);
    if (!block) throw new Error(`未找到 ${listName}`);
    const items: PermissionItem[] = [];
    for (const match of block[1].matchAll(/\{(.*?)\}/gsu)) {
      const fields = Object.fromEntries(
        [...match[1].matchAll(/"(\w+)":\s*"([^"]*)"/gu)].map((m) => [m[1], m[2]])
      );
      if (!fields.code) continue;
      items.push({
        code: fields.code,
        name: fields.name,
        type: fields.type as 'menu' | 'operation',
        parent: fields.parent,
      });
    }
    return items;
  };

  return {
    menu: parseList('MENU_PERMISSIONS'),
    operations: parseList('OPERATION_PERMISSIONS'),
  };
}

/** 解析 Java catalog：匹配 new PermissionItem("code", "name", "type", parent)。 */
export function parseJavaCatalog(source: string): Catalog {
  const stripped = source.replace(/\/\/.*$/gmu, '');
  const items: PermissionItem[] = [];
  for (const match of stripped.matchAll(/new PermissionItem\((.*?)\)(?:,|;|\s*\})/gsu)) {
    const args = [...match[1].matchAll(/"([^"]*)"|null/gu)].map((m) =>
      m[0] === 'null' ? undefined : m[1]
    );
    if (args.length < 3 || !args[0]) continue;
    items.push({
      code: args[0],
      name: args[1] ?? '',
      type: args[2] as 'menu' | 'operation',
      parent: args[3],
    });
  }
  return {
    menu: items.filter((item) => item.type === 'menu'),
    operations: items.filter((item) => item.type === 'operation'),
  };
}

function assertCatalogsMatch(py: Catalog, java: Catalog): void {
  const key = (item: PermissionItem) =>
    `${item.code}|${item.name}|${item.type}|${item.parent ?? ''}`;
  const pySet = new Set([...py.menu, ...py.operations].map(key));
  const javaSet = new Set([...java.menu, ...java.operations].map(key));

  const onlyPy = [...pySet].filter((x) => !javaSet.has(x));
  const onlyJava = [...javaSet].filter((x) => !pySet.has(x));
  if (onlyPy.length || onlyJava.length) {
    throw new Error(
      '两栈权限目录不一致：\n' +
        (onlyPy.length ? `  仅 Python: ${onlyPy.join(', ')}\n` : '') +
        (onlyJava.length ? `  仅 Java:   ${onlyJava.join(', ')}\n` : '')
    );
  }
}

function renderTable(
  items: PermissionItem[],
  nameOf: (item: PermissionItem) => string,
  header: [string, string]
): string {
  const rows = items.map((item) => `| \`${item.code}\` | ${nameOf(item)} |`);
  return [`| ${header[0]} | ${header[1]} |`, '| --- | --- |', ...rows].join('\n');
}

export function renderChinese(catalog: Catalog): string {
  const total = catalog.menu.length + catalog.operations.length;
  return [
    `权限码是接口鉴权的唯一依据。共 ${total} 个：${catalog.menu.length} 个菜单权限 + ${catalog.operations.length} 个操作权限。`,
    '',
    '## 菜单权限',
    '',
    renderTable(catalog.menu, (item) => item.name, ['权限码', '名称']),
    '',
    '## 操作权限',
    '',
    renderTable(catalog.operations, (item) => item.name, ['权限码', '名称']),
    '',
    '## 默认角色映射',
    '',
    '| 角色 | 拥有的权限 |',
    '| --- | --- |',
    `| \`admin\` | 全部 ${total} 个 |`,
    '| `user` | `dashboard`、`users`、`settings` |',
    '| `pending_review` | 无 |',
  ].join('\n');
}

export function renderEnglish(catalog: Catalog): string {
  const total = catalog.menu.length + catalog.operations.length;
  const nameOf = (item: PermissionItem) => EN_NAMES[item.code] ?? item.name;
  return [
    `Permission codes are the sole basis for API authorization. There are ${total} in total: ${catalog.menu.length} menu permissions and ${catalog.operations.length} operation permissions.`,
    '',
    '## Menu Permissions',
    '',
    renderTable(catalog.menu, nameOf, ['Permission code', 'Name']),
    '',
    '## Operation Permissions',
    '',
    renderTable(catalog.operations, nameOf, ['Permission code', 'Name']),
    '',
    '## Default Role Mapping',
    '',
    '| Role | Permissions held |',
    '| --- | --- |',
    `| \`admin\` | All ${total} |`,
    '| `user` | `dashboard`, `users`, `settings` |',
    '| `pending_review` | None |',
  ].join('\n');
}

/** 用生成内容替换标记之间的区块；找不到标记时抛错，避免静默不更新。 */
export function replaceGeneratedBlock(document: string, generated: string): string {
  const start = document.indexOf(BEGIN);
  const end = document.indexOf(END);
  if (start === -1 || end === -1) {
    throw new Error(`文档缺少生成标记 ${BEGIN} / ${END}`);
  }
  return `${document.slice(0, start + BEGIN.length)}\n${generated}\n${document.slice(end)}`;
}

async function main(): Promise<void> {
  const checkOnly = process.argv.includes('--check');
  const catalogOnly = process.argv.includes('--catalog-only');

  const pyCatalog = parsePythonCatalog(await fs.readFile(PY_CATALOG, 'utf8'));
  const javaCatalog = parseJavaCatalog(await fs.readFile(JAVA_CATALOG, 'utf8'));
  assertCatalogsMatch(pyCatalog, javaCatalog);

  const total = pyCatalog.menu.length + pyCatalog.operations.length;
  console.log(
    `权限目录一致（${pyCatalog.menu.length} 菜单 + ${pyCatalog.operations.length} 操作 = ${total}）`
  );

  // CI 只校验两栈目录一致：文档站是独立仓库，不一定与脚手架同目录
  if (catalogOnly) return;

  const targets: Array<{ file: string; content: string }> = [
    {
      file: path.join(DOCS_ROOT, 'reference/permissions.md'),
      content: renderChinese(pyCatalog),
    },
    {
      file: path.join(DOCS_ROOT, 'en/reference/permissions.md'),
      content: renderEnglish(pyCatalog),
    },
  ];

  let changed = 0;
  for (const target of targets) {
    if (!(await fs.pathExists(target.file))) {
      console.warn(`跳过（文档站不在同级目录）: ${target.file}`);
      continue;
    }
    const current = await fs.readFile(target.file, 'utf8');
    const next = replaceGeneratedBlock(current, target.content);
    if (next !== current) {
      changed += 1;
      if (!checkOnly) await fs.writeFile(target.file, next, 'utf8');
      console.log(`${checkOnly ? '需更新' : '已更新'}: ${path.relative(REPO_ROOT, target.file)}`);
    }
  }

  if (checkOnly && changed > 0) {
    console.error('文档与权限目录不一致，请运行 npm run sync:permissions');
    process.exit(1);
  }
  if (changed === 0) console.log('文档已是最新');
}

await main();
