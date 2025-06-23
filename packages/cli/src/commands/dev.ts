import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { Command } from 'commander';
import prettyMs from 'pretty-ms';
import { printError } from '../utils/pretty-error.js';

export const devCommand = new Command('dev')
  .description('Start development server with hot-reload')
  .argument('[entry]', 'Entry file path', 'src/index.ts')
  .option('-w, --watch <glob>', 'Watch pattern for file changes', 'src/**/*.{ts,js}')
  .option('-e, --env <file>', 'Environment file to load')
  .option('-p, --port <number>', 'Port number for server', '3000')
  .action(async (entry: string, options: { watch: string; env?: string; port: string }) => {
    const startTime = Date.now();

    const entryPath = findEntryFile(entry);
    if (!entryPath) {
      printError(new Error(`Entry file not found: ${entry}`), 'Entry Resolution');
      process.exit(1);
    }

    console.log(chalk.blue('🚀 McpKit Development Server'));
    console.log(chalk.gray(`Entry: ${entryPath}`));
    console.log(chalk.gray(`Watch: ${options.watch}`));
    if (options.env) {
      console.log(chalk.gray(`Env: ${options.env}`));
    }
    console.log();

    let childProcess: ChildProcess | null = null;
    let isRestarting = false;

    const startServer = () => {
      if (isRestarting) return;

      const serverStartTime = Date.now();
      console.log(chalk.yellow('⚡ Starting server...'));

      const args = [entryPath];
      if (options.env) {
        args.unshift('--env-file', options.env);
      }

      childProcess = spawn('tsx', args, {
        stdio: 'inherit',
        env: {
          ...process.env,
          PORT: options.port,
        },
      });

      childProcess.on('spawn', () => {
        const duration = Date.now() - serverStartTime;
        console.log(chalk.green(`✅ Server started in ${prettyMs(duration)}`));
        console.log(chalk.gray('Watching for changes...'));
        console.log();
      });

      childProcess.on('error', (error) => {
        printError(error, 'Server Error');
      });

      childProcess.on('exit', (code, signal) => {
        if (signal === 'SIGTERM' || signal === 'SIGINT') {
          return;
        }

        if (code !== 0) {
          console.log(chalk.red(`❌ Server exited with code ${code}`));
          console.log(chalk.yellow('Waiting for changes to restart...'));
          console.log();
        }

        childProcess = null;
      });
    };

    const stopServer = () => {
      if (childProcess && !childProcess.killed) {
        childProcess.kill('SIGTERM');
        childProcess = null;
      }
    };

    const restartServer = () => {
      if (isRestarting) return;
      isRestarting = true;

      console.log(chalk.yellow('🔄 File changed, restarting server...'));
      stopServer();

      setTimeout(() => {
        isRestarting = false;
        startServer();
      }, 100);
    };

    const watcher = chokidar.watch(options.watch, {
      ignored: /node_modules|\.git|dist/,
      persistent: true,
    });

    watcher.on('change', (path) => {
      console.log(chalk.cyan(`📝 Changed: ${path}`));
      restartServer();
    });

    watcher.on('error', (error) => {
      printError(error, 'File Watcher');
    });

    const cleanup = () => {
      console.log(chalk.yellow('\n🛑 Shutting down...'));
      stopServer();
      watcher.close();

      const totalTime = Date.now() - startTime;
      console.log(chalk.green(`✅ Development server stopped after ${prettyMs(totalTime)}`));
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    startServer();
  });

function findEntryFile(entry: string): string | null {
  // If a specific entry is provided (not the default), only check that file
  if (entry !== 'src/index.ts') {
    const candidates = [entry, resolve(entry)];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return resolve(candidate);
      }
    }
    return null;
  }

  // For default entry, check common locations
  const candidates = ['src/index.ts', 'src/index.js', 'index.ts', 'index.js'];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return resolve(candidate);
    }
  }

  const mcpFiles = ['src/server.mcp.ts', 'server.mcp.ts', 'src/index.mcp.ts', 'index.mcp.ts'];
  for (const mcpFile of mcpFiles) {
    if (existsSync(mcpFile)) {
      return resolve(mcpFile);
    }
  }

  return null;
}
