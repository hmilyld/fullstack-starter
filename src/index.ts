#!/usr/bin/env node

import { select, input } from '@inquirer/prompts';
import { generateProject, type FrontendType, type BackendType } from './generator.js';
import ora from 'ora';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🚀 Create Fullstack App\n'));

async function main() {
  try {
    const frontend = await select({
      message: '请选择前端框架:',
      choices: [
        { name: 'React', value: 'react' },
        { name: 'Vue', value: 'vue' },
      ],
    }) as FrontendType;

    const backend = await select({
      message: '请选择后端框架:',
      choices: [
        { name: 'Python (FastAPI)', value: 'python' },
        { name: 'Java (Spring Boot)', value: 'java' },
      ],
    }) as BackendType;

    const projectName = await input({
      message: '请输入项目名称:',
      default: 'my-fullstack-app',
      validate: (value) => {
        if (/^[a-z0-9-]+$/.test(value)) {
          return true;
        }
        return '项目名称只能包含小写字母、数字和连字符';
      },
    });

    const spinner = ora('正在生成项目...').start();

    try {
      await generateProject(projectName, frontend, backend);
      spinner.succeed(chalk.green(`项目 ${projectName} 创建成功！`));
      
      console.log(chalk.cyan('\n📁 项目结构:'));
      console.log(`   ${projectName}/`);
      console.log('   ├── frontend/          # 前端项目');
      console.log('   ├── backend/           # 后端项目');
      console.log('   ├── dev.sh             # 开发脚本');
      console.log('   ├── build.sh           # 构建脚本');
      console.log('   ├── docker-compose.yml # Docker 配置');
      console.log('   └── README.md          # 项目说明');

      console.log(chalk.cyan('\n🚀 开始使用:'));
      console.log(`   cd ${projectName}`);
      console.log('   ./dev.sh start');
      console.log('   # 或者使用 Docker 部署');
      console.log('   docker compose up -d');
      
    } catch (error) {
      spinner.fail(chalk.red('项目生成失败'));
      console.error(error);
      process.exit(1);
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log(chalk.yellow('\n操作已取消'));
    } else {
      console.error(chalk.red('错误:'), error);
    }
    process.exit(1);
  }
}

main();
