import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execa } from 'execa';
import { beforeEach, describe, expect, it } from 'vitest';

const CLI_PATH = join(__dirname, '../dist/index.js');
const TEST_DIR = join(__dirname, 'fixtures');

describe('mcp doctor command - diff detection', () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  it('should create baseline when none exists', async () => {
    const serverContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('test', {
    input: schema(z.string()),
    output: schema(z.string()),
    handler: async (input) => input,
  });
`;

    mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'src', 'index.ts'), serverContent);

    const baselinePath = join(TEST_DIR, 'baseline.json');
    const result = await execa('node', [CLI_PATH, 'doctor', 'src/index.ts', '-b', baselinePath], {
      reject: false,
      cwd: TEST_DIR,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Baseline file not found');
    expect(result.stdout).toContain('Creating new baseline');
    expect(result.stdout).toContain('Baseline created');
  });

  it('should detect no changes when schema is identical', async () => {
    const serverContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('test', {
    input: schema(z.string()),
    output: schema(z.string()),
    handler: async (input) => input,
  });
`;

    mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'src', 'index.ts'), serverContent);

    const baselinePath = join(TEST_DIR, 'baseline.json');

    await execa('node', [CLI_PATH, 'doctor', 'src/index.ts', '-b', baselinePath], {
      cwd: TEST_DIR,
    });

    const result = await execa('node', [CLI_PATH, 'doctor', 'src/index.ts', '-b', baselinePath], {
      reject: false,
      cwd: TEST_DIR,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('No schema changes detected');
  });

  it('should detect added tools', async () => {
    const originalContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('original', {
    input: schema(z.string()),
    output: schema(z.string()),
    handler: async (input) => input,
  });
`;

    const updatedContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('original', {
    input: schema(z.string()),
    output: schema(z.string()),
    handler: async (input) => input,
  })
  .tool('new-tool', {
    input: schema(z.number()),
    output: schema(z.number()),
    handler: async (input) => input * 2,
  });
`;

    mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'src', 'index.ts'), originalContent);

    const baselinePath = join(TEST_DIR, 'baseline.json');

    await execa('node', [CLI_PATH, 'doctor', 'src/index.ts', '-b', baselinePath], {
      cwd: TEST_DIR,
    });

    writeFileSync(join(TEST_DIR, 'src', 'index.ts'), updatedContent);

    const result = await execa('node', [CLI_PATH, 'doctor', 'src/index.ts', '-b', baselinePath], {
      reject: false,
      cwd: TEST_DIR,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Schema changes detected');
    expect(result.stdout).toContain('Added:');
    expect(result.stdout).toContain('new-tool');
  });

  it('should detect removed tools', async () => {
    const originalContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('keep', {
    input: schema(z.string()),
    output: schema(z.string()),
    handler: async (input) => input,
  })
  .tool('remove', {
    input: schema(z.number()),
    output: schema(z.number()),
    handler: async (input) => input,
  });
`;

    const updatedContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('keep', {
    input: schema(z.string()),
    output: schema(z.string()),
    handler: async (input) => input,
  });
`;

    mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'src', 'index.ts'), originalContent);

    const baselinePath = join(TEST_DIR, 'baseline.json');

    await execa('node', [CLI_PATH, 'doctor', 'src/index.ts', '-b', baselinePath], {
      cwd: TEST_DIR,
    });

    writeFileSync(join(TEST_DIR, 'src', 'index.ts'), updatedContent);

    const result = await execa('node', [CLI_PATH, 'doctor', 'src/index.ts', '-b', baselinePath], {
      reject: false,
      cwd: TEST_DIR,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Schema changes detected');
    expect(result.stdout).toContain('Removed:');
    expect(result.stdout).toContain('remove');
  });

  it('should exit with error in CI mode when changes detected', async () => {
    const originalContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('test', {
    input: schema(z.string()),
    output: schema(z.string()),
    handler: async (input) => input,
  });
`;

    const updatedContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('test', {
    input: schema(z.number()),
    output: schema(z.number()),
    handler: async (input) => input,
  });
`;

    mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'src', 'index.ts'), originalContent);

    const baselinePath = join(TEST_DIR, 'baseline.json');

    await execa('node', [CLI_PATH, 'doctor', 'src/index.ts', '-b', baselinePath], {
      cwd: TEST_DIR,
    });

    writeFileSync(join(TEST_DIR, 'src', 'index.ts'), updatedContent);

    const result = await execa(
      'node',
      [CLI_PATH, 'doctor', 'src/index.ts', '-b', baselinePath, '--ci'],
      {
        reject: false,
        cwd: TEST_DIR,
      },
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Schema validation failed in CI mode');
  });
});
