import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execa } from 'execa';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const CLI_PATH = join(__dirname, '../dist/index.js');
const TEST_BASE_DIR = join(__dirname, 'fixtures');

describe('mcp doctor command - validation', () => {
  let testDir: string;

  beforeEach(() => {
    // Create unique test directory for each test
    testDir = join(TEST_BASE_DIR, `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up after each test
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should validate a simple MCP server', async () => {
    const serverContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('add', {
    input: schema(z.object({ a: z.number(), b: z.number() })),
    output: schema(z.object({ result: z.number() })),
    handler: async ({ a, b }) => ({ result: a + b }),
  })
  .prompt('greeting', 'Hello {{name}}!', {
    title: 'Greeting Template',
    params: schema(z.object({ name: z.string() })),
  })
  .resource('readme', 'file://README.md', {
    title: 'Project README',
  });
`;

    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'index.ts'), serverContent);

    const result = await execa('node', [CLI_PATH, 'doctor', join(testDir, 'src/index.ts')], {
      reject: false,
      cwd: process.cwd(),
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Schema Summary');
    expect(result.stdout).toContain('Tools: 1');
    expect(result.stdout).toContain('Prompts: 1');
    expect(result.stdout).toContain('Resources: 1');
    expect(result.stdout).toContain('add:');
    expect(result.stdout).toContain('greeting:');
    expect(result.stdout).toContain('readme:');
  });

  it('should generate schema snapshot', async () => {
    const serverContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('test-tool', {
    input: schema(z.string()),
    output: schema(z.string()),
    handler: async (input) => input,
  });
`;

    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'index.ts'), serverContent);

    const snapshotPath = join(testDir, 'schema.json');
    const result = await execa(
      'node',
      [CLI_PATH, 'doctor', join(testDir, 'src/index.ts'), '-o', snapshotPath],
      {
        reject: false,
        cwd: process.cwd(),
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Schema snapshot saved');

    const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'));
    expect(snapshot).toHaveProperty('tools');
    expect(snapshot).toHaveProperty('prompts');
    expect(snapshot).toHaveProperty('resources');
    expect(snapshot).toHaveProperty('timestamp');
    expect(snapshot.tools).toHaveProperty('test-tool');
  });

  it('should handle empty MCP server', async () => {
    const serverContent = `
import { createMcpServer } from '@mcpkit/server';

export default createMcpServer();
`;

    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'index.ts'), serverContent);

    const result = await execa('node', [CLI_PATH, 'doctor', join(testDir, 'src/index.ts')], {
      reject: false,
      cwd: process.cwd(),
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Tools: 0');
    expect(result.stdout).toContain('Prompts: 0');
    expect(result.stdout).toContain('Resources: 0');
  });

  it('should show help information', async () => {
    const result = await execa('node', [CLI_PATH, 'doctor', '--help'], {
      reject: false,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Validate MCP server schema and detect changes');
    expect(result.stdout).toContain('--output');
    expect(result.stdout).toContain('--baseline');
    expect(result.stdout).toContain('--ci');
  });

  it('should handle invalid entry file', async () => {
    const result = await execa('node', [CLI_PATH, 'doctor', join(testDir, 'nonexistent.ts')], {
      reject: false,
      cwd: process.cwd(),
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Entry file not found');
  });
});
