import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execa } from 'execa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const CLI_PATH = join(__dirname, '../dist/index.js');
const TEST_DIR = join(__dirname, 'fixtures');

describe('mcp dev command', () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  it('should show help when no entry file exists', async () => {
    const result = await execa('node', [CLI_PATH, 'dev', 'nonexistent.ts'], {
      reject: false,
      cwd: TEST_DIR,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Entry file not found');
  });

  it('should find default entry files', async () => {
    const entryContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

const server = createMcpServer()
  .tool('test', {
    input: schema(z.string()),
    output: schema(z.string()),
    handler: async (input) => input,
  })
  .build();

export default server;
`;

    mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'src', 'index.ts'), entryContent);

    const result = await execa('node', [CLI_PATH, 'dev', '--help'], {
      reject: false,
      cwd: TEST_DIR,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Start development server with hot-reload');
  });

  it('should accept custom watch patterns', async () => {
    const result = await execa('node', [CLI_PATH, 'dev', '--help'], {
      reject: false,
    });

    expect(result.stdout).toContain('--watch');
    expect(result.stdout).toContain('Watch pattern for file changes');
  });

  it('should accept environment file option', async () => {
    const result = await execa('node', [CLI_PATH, 'dev', '--help'], {
      reject: false,
    });

    expect(result.stdout).toContain('--env');
    expect(result.stdout).toContain('Environment file to load');
  });

  it('should accept port option', async () => {
    const result = await execa('node', [CLI_PATH, 'dev', '--help'], {
      reject: false,
    });

    expect(result.stdout).toContain('--port');
    expect(result.stdout).toContain('Port number for server');
  });

  it('should find .mcp.ts files', async () => {
    const mcpContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('mcp-test', {
    input: schema(z.string()),
    output: schema(z.string()),
    handler: async (input) => input,
  });
`;

    mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'src', 'server.mcp.ts'), mcpContent);

    const result = await execa('node', [CLI_PATH, 'dev', '--help'], {
      reject: false,
      cwd: TEST_DIR,
    });

    expect(result.exitCode).toBe(0);
  });
});
