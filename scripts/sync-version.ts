import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Keep every shipped version in sync with the root package.json.
 *
 *   pnpm run sync:version         # write the version into templates and locks
 *   pnpm run sync:version:check   # exit 1 if anything drifted (used by CI)
 */

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const rootPackage = JSON.parse(await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8')) as {
  version: string;
};
const version = rootPackage.version;
const mismatches: string[] = [];
const changed: string[] = [];

async function updateJson(relativePath: string): Promise<void> {
  const file = path.join(repoRoot, relativePath);
  const data = JSON.parse(await fs.readFile(file, 'utf8')) as {
    version?: string;
    packages?: Record<string, { version?: string }>;
  };

  const current = data.version;
  const lockRoot = data.packages?.['']?.version;
  const expected = [current, lockRoot].filter((value) => value !== undefined);
  const drifted = expected.some((value) => value !== version);
  if (!drifted) return;

  if (checkOnly) {
    mismatches.push(`${relativePath}: ${expected.join(' / ')} (expected ${version})`);
    return;
  }

  data.version = version;
  if (data.packages?.['']) data.packages['']!.version = version;
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n');
  changed.push(`${relativePath}: ${expected.join(' / ')} -> ${version}`);
}

async function updateText(
  relativePath: string,
  pattern: RegExp,
  description: string
): Promise<void> {
  const file = path.join(repoRoot, relativePath);
  const text = await fs.readFile(file, 'utf8');
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`${relativePath}: cannot find ${description}`);
  }
  const current = match[2];
  if (current === version) return;

  if (checkOnly) {
    mismatches.push(`${relativePath}: ${current} (expected ${version})`);
    return;
  }

  await fs.writeFile(file, text.replace(pattern, `$1${version}$3`));
  changed.push(`${relativePath}: ${current} -> ${version}`);
}

await Promise.all([
  updateJson('templates/frontend-react/package.json'),
  updateJson('templates/frontend-vue/package.json'),
  updateJson('templates/frontend-svelte/package.json'),
  updateJson('templates/frontend-react/package-lock.json'),
  updateJson('templates/frontend-vue/package-lock.json'),
  updateJson('templates/frontend-svelte/package-lock.json'),
  updateText(
    'templates/backend-python/pyproject.toml',
    /^(version = ")([^"]+)(")$/m,
    'the project version'
  ),
  updateText(
    'templates/backend-python/app/data_management/service.py',
    /(APP_VERSION = ")([^"]+)(")/,
    'APP_VERSION'
  ),
  updateText(
    'templates/backend-java/pom.xml',
    /(<artifactId>fullstack-backend<\/artifactId>\s*<version>)([^<]+)(<\/version>)/,
    'the project version'
  ),
  updateText(
    'templates/backend-java/src/main/java/com/hmilyld/fullstack/service/DataManagementService.java',
    /(APP_VERSION = ")([^"]+)(")/,
    'APP_VERSION'
  ),
  updateText(
    'templates/backend-python/uv.lock',
    /(\[\[package\]\]\nname = "backend"\nversion = ")([^"]+)(")/,
    'the locked backend version'
  ),
]);

if (mismatches.length > 0) {
  console.error('Version drift detected (root package.json is the source of truth):');
  for (const mismatch of mismatches) console.error(`  - ${mismatch}`);
  console.error('Run `pnpm run sync:version` and commit the result.');
  process.exit(1);
}

if (changed.length > 0) {
  console.log(`Updated ${changed.length} file(s) to ${version}:`);
  for (const change of changed) console.log(`  - ${change}`);
} else {
  console.log(`All versions match ${version}.`);
}
