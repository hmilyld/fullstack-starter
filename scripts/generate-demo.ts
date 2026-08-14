import path from 'path';
import fs from 'fs-extra';
import { generateProject } from '../src/generator.js';

const outputDir = path.resolve(process.argv[2] ?? '.');
const projectName = process.argv[3] ?? 'demo';
const frontend = process.argv[4] === 'vue' ? 'vue' : 'react';
const backend = process.argv[5] === 'java' ? 'java' : 'python';

await fs.ensureDir(outputDir);
process.chdir(outputDir);

await generateProject(projectName, frontend, backend);
console.log(path.join(outputDir, projectName));
