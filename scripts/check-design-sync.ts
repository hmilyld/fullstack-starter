/**
 * 校验设计规约与实现是否仍然一致。
 *
 * 1. React / Vue 两份 `DESIGN.md` 除平台差异外必须逐字一致；
 * 2. `DESIGN.md` 第 2.1 节列出的语义 Token 必须与两个模板 CSS 中的变量一致。
 *
 * 平台差异只允许出现在：栈名、CSS 路径、测试库、路由与事件 API。
 *
 * 用法：`npm run sync:design:check`
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TEMPLATES = path.join(REPO_ROOT, 'templates');
const REACT_DESIGN = path.join(TEMPLATES, 'frontend-react/DESIGN.md');
const VUE_DESIGN = path.join(TEMPLATES, 'frontend-vue/DESIGN.md');
const REACT_CSS = path.join(TEMPLATES, 'frontend-react/src/index.css');
const VUE_CSS = path.join(TEMPLATES, 'frontend-vue/src/assets/main.css');

/** 把两栈允许存在的差异归一，便于逐字比对 */
const PLATFORM_PATTERNS: Array<[RegExp, string]> = [
  [/frontend-react/g, '<stack>'],
  [/frontend-vue/g, '<stack>'],
  [/src\/assets\/main\.css/g, '<css>'],
  [/src\/index\.css/g, '<css>'],
  [/`index\.css`/g, '`<css>`'],
  [/`main\.css`/g, '`<css>`'],
  [/Vitest \+ React Testing Library/g, '<test-lib>'],
  [/Vitest \+ `@testing-library\/vue`/g, '<test-lib>'],
  [/（`RouterLink` \/ `<a>`）/g, '（<link>）'],
  [/（`Link` \/ `<a>`）/g, '（<link>）'],
  [/`@click`/g, '`<handler>`'],
  [/`onClick`/g, '`<handler>`'],
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
  const [reactDesign, vueDesign, reactCss, vueCss] = await Promise.all([
    fs.readFile(REACT_DESIGN, 'utf8'),
    fs.readFile(VUE_DESIGN, 'utf8'),
    fs.readFile(REACT_CSS, 'utf8'),
    fs.readFile(VUE_CSS, 'utf8'),
  ]);

  const problems: string[] = [];

  if (normalize(reactDesign) !== normalize(vueDesign)) {
    problems.push(
      '两份 DESIGN.md 不一致：平台差异以外的内容必须逐字相同（templates/frontend-{react,vue}/DESIGN.md）'
    );
  }

  const documented = readDocumentedTokens(reactDesign);
  if (documented.size === 0) {
    problems.push('DESIGN.md 第 2.1 节没有解析到任何 Token，检查表格格式');
  }

  for (const [name, cssPath, css] of [
    ['React', REACT_CSS, reactCss],
    ['Vue', VUE_CSS, vueCss],
  ] as const) {
    const implemented = readCssTokens(css);
    for (const [token, expected] of documented) {
      const actual = implemented.get(token);
      if (actual === undefined) {
        problems.push(`${name}: ${path.relative(REPO_ROOT, cssPath)} 缺少 ${token}`);
        continue;
      }
      if (actual.replace(/\s+/g, ' ') !== expected) {
        problems.push(`${name}: ${token} 文档为 ${expected}，代码为 ${actual}`);
      }
    }
  }

  if (problems.length > 0) {
    for (const problem of problems) console.error(`✗ ${problem}`);
    console.error('\n设计规约与实现不一致，请先同步 DESIGN.md 与 Token');
    process.exit(1);
  }

  console.log(`✓ 设计规约一致（${documented.size} 个语义 Token，两份 DESIGN.md 结构相同）`);
}

await main();
