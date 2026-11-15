import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Read and validate the repository changelog.
 *
 *   pnpm run changelog:show              # section for the package version
 *   pnpm run changelog:show -- Unreleased
 *   pnpm run changelog:check             # package + Unreleased sections exist
 */

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const changelogPath = path.join(repoRoot, 'CHANGELOG.md');
const packagePath = path.join(repoRoot, 'package.json');

process.stdout.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EPIPE') process.exit(0);
  throw error;
});

type ChangelogSection = {
  name: string;
  date?: string;
  heading: string;
  body: string;
};

function parseChangelog(text: string): ChangelogSection[] {
  const headingPattern = /^## \[([^\]]+)\](?: - ([^\n]+))?$/gm;
  const matches = [...text.matchAll(headingPattern)];
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    const body = text
      .slice(start, end)
      .split(/\n(?=\[[^\]]+\]:\s+\S+\s*$)/m)[0]
      .trim();
    return {
      name: match[1].trim(),
      date: match[2]?.trim(),
      heading: match[0].trim(),
      body,
    };
  });
}

function formatSection(section: ChangelogSection): string {
  if (!section.body) return `${section.heading}\n\n_No changes in this section._\n`;
  return `${section.heading}\n\n${section.body}\n`;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const sectionFlag = args.indexOf('--section');
if (sectionFlag >= 0 && !args[sectionFlag + 1]) {
  fail('--section requires a changelog section name.');
}
const requestedSection =
  sectionFlag >= 0 ? args[sectionFlag + 1] : args.find((value) => !value.startsWith('--'));

const packageJson = (await fs.readJson(packagePath)) as { version: string };
const changelog = await fs.readFile(changelogPath, 'utf8');
const sections = parseChangelog(changelog);
const names = new Set(sections.map((section) => section.name));

if (sections.length === 0) fail('CHANGELOG.md contains no version sections.');

if (checkOnly) {
  const missing: string[] = [];
  if (!names.has('Unreleased')) missing.push('Unreleased');
  if (!names.has(packageJson.version)) missing.push(packageJson.version);
  const duplicate = sections
    .map((section) => section.name)
    .filter((name, index, list) => list.indexOf(name) !== index);
  if (duplicate.length > 0) {
    fail(`CHANGELOG.md has duplicate sections: ${[...new Set(duplicate)].join(', ')}`);
  }
  const empty = sections
    .filter((section) => section.name !== 'Unreleased' && section.body.length === 0)
    .map((section) => section.name);
  if (empty.length > 0) {
    fail(`CHANGELOG.md has empty sections: ${empty.join(', ')}`);
  }
  if (missing.length > 0) {
    fail(`CHANGELOG.md is missing sections: ${missing.join(', ')}`);
  }
  console.log(
    `CHANGELOG.md is valid (Unreleased + ${packageJson.version}, ${sections.length} section(s)).`
  );
  process.exit(0);
}

const sectionName = requestedSection ?? packageJson.version;
const section = sections.find((candidate) => candidate.name === sectionName);
if (!section) {
  fail(
    `CHANGELOG.md has no section "${sectionName}". Available sections: ${sections
      .map((candidate) => candidate.name)
      .join(', ')}`
  );
}

process.stdout.write(formatSection(section));
