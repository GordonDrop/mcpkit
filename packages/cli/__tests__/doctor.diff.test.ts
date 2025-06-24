import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execa } from 'execa';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const CLI_PATH = join(__dirname, '../dist/index.js');
const TEST_BASE_DIR = join(__dirname, 'fixtures');

describe('mcp doctor command - diff detection', () => {
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

  it('should create baseline when none exists', async () => {
    const serverContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('test', {
    input: schema(z.object({ input: z.string() })),
    output: schema(z.object({ output: z.string() })),
    handler: async ({ input }) => ({ output: input }),
  });
`;

    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'index.ts'), serverContent);

    const baselinePath = join(testDir, 'baseline.json');
    const result = await execa(
      'node',
      [CLI_PATH, 'doctor', join(testDir, 'src/index.ts'), '-b', baselinePath],
      {
        reject: false,
        cwd: process.cwd(),
      },
    );

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
    input: schema(z.object({ input: z.string() })),
    output: schema(z.object({ output: z.string() })),
    handler: async ({ input }) => ({ output: input }),
  });
`;

    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'index.ts'), serverContent);

    const baselinePath = join(testDir, 'baseline.json');

    await execa('node', [CLI_PATH, 'doctor', join(testDir, 'src/index.ts'), '-b', baselinePath], {
      cwd: process.cwd(),
    });

    const result = await execa(
      'node',
      [CLI_PATH, 'doctor', join(testDir, 'src/index.ts'), '-b', baselinePath],
      {
        reject: false,
        cwd: process.cwd(),
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('No schema changes detected');
  });

  it('should detect added tools', async () => {
    const originalContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('original', {
    input: schema(z.object({ input: z.string() })),
    output: schema(z.object({ output: z.string() })),
    handler: async ({ input }) => ({ output: input }),
  });
`;

    const updatedContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('original', {
    input: schema(z.object({ input: z.string() })),
    output: schema(z.object({ output: z.string() })),
    handler: async ({ input }) => ({ output: input }),
  })
  .tool('new-tool', {
    input: schema(z.object({ input: z.number() })),
    output: schema(z.object({ output: z.number() })),
    handler: async ({ input }) => ({ output: input * 2 }),
  });
`;

    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'index.ts'), originalContent);

    const baselinePath = join(testDir, 'baseline.json');

    await execa('node', [CLI_PATH, 'doctor', join(testDir, 'src/index.ts'), '-b', baselinePath], {
      cwd: process.cwd(),
    });

    writeFileSync(join(testDir, 'src', 'index.ts'), updatedContent);

    const result = await execa(
      'node',
      [CLI_PATH, 'doctor', join(testDir, 'src/index.ts'), '-b', baselinePath],
      {
        reject: false,
        cwd: process.cwd(),
      },
    );

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
    input: schema(z.object({ input: z.string() })),
    output: schema(z.object({ output: z.string() })),
    handler: async ({ input }) => ({ output: input }),
  })
  .tool('remove', {
    input: schema(z.object({ input: z.number() })),
    output: schema(z.object({ output: z.number() })),
    handler: async ({ input }) => ({ output: input }),
  });
`;

    const updatedContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('keep', {
    input: schema(z.object({ input: z.string() })),
    output: schema(z.object({ output: z.string() })),
    handler: async ({ input }) => ({ output: input }),
  });
`;

    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'index.ts'), originalContent);

    const baselinePath = join(testDir, 'baseline.json');

    await execa('node', [CLI_PATH, 'doctor', join(testDir, 'src/index.ts'), '-b', baselinePath], {
      cwd: process.cwd(),
    });

    writeFileSync(join(testDir, 'src', 'index.ts'), updatedContent);

    const result = await execa(
      'node',
      [CLI_PATH, 'doctor', join(testDir, 'src/index.ts'), '-b', baselinePath],
      {
        reject: false,
        cwd: process.cwd(),
      },
    );

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
    input: schema(z.object({ input: z.string() })),
    output: schema(z.object({ output: z.string() })),
    handler: async ({ input }) => ({ output: input }),
  });
`;

    const updatedContent = `
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('test', {
    input: schema(z.object({ input: z.number() })),
    output: schema(z.object({ output: z.number() })),
    handler: async ({ input }) => ({ output: input }),
  });
`;

    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'index.ts'), originalContent);

    const baselinePath = join(testDir, 'baseline.json');

    await execa('node', [CLI_PATH, 'doctor', join(testDir, 'src/index.ts'), '-b', baselinePath], {
      cwd: process.cwd(),
    });

    writeFileSync(join(testDir, 'src', 'index.ts'), updatedContent);

    const result = await execa(
      'node',
      [CLI_PATH, 'doctor', join(testDir, 'src/index.ts'), '-b', baselinePath, '--ci'],
      {
        reject: false,
        cwd: process.cwd(),
      },
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Schema validation failed in CI mode');
  });
});
