import assert from 'node:assert/strict';
import { test } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { generateProject, type BackendType, type FrontendType } from '../src/generator.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootPackage = JSON.parse(await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8')) as {
  version: string;
};

const combos: Array<{ frontend: FrontendType; backend: BackendType }> = [
  { frontend: 'react', backend: 'python' },
  { frontend: 'react', backend: 'java' },
  { frontend: 'vue', backend: 'python' },
  { frontend: 'vue', backend: 'java' },
  { frontend: 'svelte', backend: 'python' },
  { frontend: 'svelte', backend: 'java' },
];

const frontendLabels: Record<FrontendType, string> = {
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
};

const backendLabels: Record<BackendType, string> = {
  python: 'Python (FastAPI)',
  java: 'Java (Spring Boot)',
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function read(file: string): Promise<string> {
  return fs.readFile(file, 'utf8');
}

async function withTempProject(
  run: (projectPath: string, tempRoot: string) => Promise<void>
): Promise<void> {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'fullstack-generator-'));
  const originalCwd = process.cwd();
  try {
    process.chdir(tempRoot);
    await run(path.join(tempRoot, 'demo-app'), tempRoot);
  } finally {
    process.chdir(originalCwd);
    await fs.remove(tempRoot);
  }
}

for (const { frontend, backend } of combos) {
  test(`generates ${frontend} + ${backend}`, async () => {
    await withTempProject(async (projectPath) => {
      await generateProject('demo-app', frontend, backend);

      // Core files exist and the Docker/Nginx pair is wired for this backend.
      for (const file of [
        'Dockerfile',
        'nginx.conf',
        'docker-compose.yml',
        '.dockerignore',
        'dev.sh',
        'build.sh',
        'README.md',
        '.gitignore',
      ]) {
        assert.ok(await fs.pathExists(path.join(projectPath, file)), `${file} is missing`);
      }

      const dockerfile = await read(path.join(projectPath, 'Dockerfile'));
      assert.match(dockerfile, /EXPOSE 5173/);
      assert.match(
        dockerfile,
        backend === 'java' ? /http\.d\/default\.conf/ : /conf\.d\/default\.conf/,
        `${backend} Dockerfile must load the Nginx config from the correct directory`
      );

      const nginx = await read(path.join(projectPath, 'nginx.conf'));
      assert.match(nginx, /listen 5173;/);
      assert.match(nginx, /proxy_pass http:\/\/127\.0\.0\.1:8088/);

      // The generated frontend keeps the repository version.
      const frontendPackage = JSON.parse(
        await read(path.join(projectPath, 'frontend', 'package.json'))
      ) as { version: string };
      assert.equal(frontendPackage.version, rootPackage.version);
      assert.ok(await fs.pathExists(path.join(projectPath, 'frontend', 'package-lock.json')));

      // Both backends carry the same version in their manifest and export metadata.
      const version = escapeRegExp(rootPackage.version);
      if (backend === 'python') {
        const pyproject = await read(path.join(projectPath, 'backend', 'pyproject.toml'));
        assert.match(pyproject, new RegExp(`^version = "${version}"$`, 'm'));
        const service = await read(
          path.join(projectPath, 'backend', 'app', 'data_management', 'service.py')
        );
        assert.match(service, new RegExp(`APP_VERSION = "${version}"`));
        assert.ok(await fs.pathExists(path.join(projectPath, 'backend', 'uv.lock')));
        assert.ok(await fs.pathExists(path.join(projectPath, 'backend', 'app', 'main.py')));
      } else {
        const pom = await read(path.join(projectPath, 'backend', 'pom.xml'));
        assert.match(
          pom,
          new RegExp(`<artifactId>fullstack-backend</artifactId>\\s*<version>${version}</version>`)
        );
        const service = await read(
          path.join(
            projectPath,
            'backend',
            'src',
            'main',
            'java',
            'com',
            'hmilyld',
            'fullstack',
            'service',
            'DataManagementService.java'
          )
        );
        assert.match(service, new RegExp(`APP_VERSION = "${version}"`));
      }

      // The generated README names the project and the selected stack.
      const readme = await read(path.join(projectPath, 'README.md'));
      assert.match(readme, /# demo-app/);
      assert.match(readme, new RegExp(frontendLabels[frontend]));
      assert.match(readme, new RegExp(escapeRegExp(backendLabels[backend])));

      // Local build/runtime artifacts must never leak into a generated project.
      for (const artifact of [
        'frontend/node_modules',
        'frontend/dist',
        'frontend/.svelte-kit',
        'backend/target',
        'backend/.venv',
        'backend/__pycache__',
      ]) {
        assert.equal(
          await fs.pathExists(path.join(projectPath, artifact)),
          false,
          `${artifact} leaked into the generated project`
        );
      }

      const dataDir = path.join(projectPath, 'backend', 'data');
      assert.ok(await fs.pathExists(path.join(dataDir, '.gitkeep')));
      const dataFiles = await fs.readdir(dataDir);
      assert.deepEqual(
        dataFiles.filter((name) => name.endsWith('.db') || name.endsWith('.sqlite3')),
        []
      );
    });
  });
}

test('refuses to overwrite an existing project', async () => {
  await withTempProject(async (_projectPath, tempRoot) => {
    await fs.mkdir(path.join(tempRoot, 'demo-app'));
    await assert.rejects(generateProject('demo-app', 'react', 'python'), /已存在|exists/i);
  });
});
