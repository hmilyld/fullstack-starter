/**
 * 校验设计规约与实现是否仍然一致。
 *
 * 1. React / Vue / Svelte 三份 `DESIGN.md` 除平台差异外必须逐字一致；
 * 2. `DESIGN.md` 第 2.1 节列出的语义 Token 必须与三个模板的全局 CSS 一致。
 *
 * 平台差异只允许出现在：栈名、CSS 路径、测试库。
 *
 * 用法：`npm run sync:design:check`
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TEMPLATES = path.join(REPO_ROOT, 'templates');

const STACKS = [
  {
    name: 'React',
    design: path.join(TEMPLATES, 'frontend-react/DESIGN.md'),
    css: path.join(TEMPLATES, 'frontend-react/src/index.css'),
  },
  {
    name: 'Vue',
    design: path.join(TEMPLATES, 'frontend-vue/DESIGN.md'),
    css: path.join(TEMPLATES, 'frontend-vue/src/assets/main.css'),
  },
  {
    name: 'Svelte',
    design: path.join(TEMPLATES, 'frontend-svelte/DESIGN.md'),
    css: path.join(TEMPLATES, 'frontend-svelte/src/routes/layout.css'),
  },
] as const;

/** 把三栈允许存在的差异归一，便于逐字比对 */
const PLATFORM_PATTERNS: Array<[RegExp, string]> = [
  [/frontend-react/g, '<stack>'],
  [/frontend-vue/g, '<stack>'],
  [/frontend-svelte/g, '<stack>'],
  [/Vitest \+ React Testing Library/g, '<test-lib>'],
  [/Vitest \+ `@testing-library\/vue`/g, '<test-lib>'],
  [/Vitest \+ `vitest-browser-svelte`/g, '<test-lib>'],
];

function normalize(markdown: string): string {
  let out = markdown.replace(/\r\n/g, '\n');
  for (const [pattern, replacement] of PLATFORM_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/** 取 §2.1 语义 Token 表格里的 `| --name | value |` 行 */
function readDocumentedTokens(markdown: string): Map<string, string> {
  const tokens = new Map<string, string>();
  const section = markdown.split('### 2.2')[0] ?? '';
  const row = /^\|\s*`(--[\w-]+)`\s*\|\s*`([^`]+)`/gm;
  for (const match of section.matchAll(row)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

/** 取 CSS `:root {}` 块里的变量 */
function readCssTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  const root = /:root\s*\{([\s\S]*?)\}/.exec(css);
  if (!root) return tokens;
  for (const match of root[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens.set(match[1], match[2].trim().replace(/\s+/g, ' '));
  }
  return tokens;
}

async function main(): Promise<void> {
  const [reactDesign, vueDesign, svelteDesign] = await Promise.all([
    fs.readFile(STACKS[0].design, 'utf8'),
    fs.readFile(STACKS[1].design, 'utf8'),
    fs.readFile(STACKS[2].design, 'utf8'),
  ]);

  const cssFiles = await Promise.all(
    STACKS.map(async (stack) => [stack, await fs.readFile(stack.css, 'utf8')] as const)
  );

  const problems: string[] = [];

  const normalized = {
    React: normalize(reactDesign),
    Vue: normalize(vueDesign),
    Svelte: normalize(svelteDesign),
  };

  for (const name of ['Vue', 'Svelte'] as const) {
    if (normalized.React !== normalized[name]) {
      problems.push(
        `React 与 ${name} 的 DESIGN.md 不一致：平台差异以外的内容必须逐字相同（templates/frontend-{react,vue,svelte}/DESIGN.md）`
      );
    }
  }

  const documented = readDocumentedTokens(reactDesign);
  if (documented.size === 0) {
    problems.push('DESIGN.md 第 2.1 节没有解析到任何 Token，检查表格格式');
  }

  for (const [stack, css] of cssFiles) {
    const implemented = readCssTokens(css);
    for (const [token, expected] of documented) {
      const actual = implemented.get(token);
      if (actual === undefined) {
        problems.push(`${stack.name}: ${path.relative(REPO_ROOT, stack.css)} 缺少 ${token}`);
        continue;
      }
      if (actual.replace(/\s+/g, ' ') !== expected) {
        problems.push(`${stack.name}: ${token} 文档为 ${expected}，代码为 ${actual}`);
      }
    }
  }

  if (problems.length > 0) {
    for (const problem of problems) console.error(`✗ ${problem}`);
    console.error('\n设计规约与实现不一致，请先同步 DESIGN.md 与 Token');
    process.exit(1);
  }

  console.log(`✓ 设计规约一致（${documented.size} 个语义 Token，三份 DESIGN.md 结构相同）`);
}

await main();
