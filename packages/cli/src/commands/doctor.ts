import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import deepDiff from 'deep-diff';

const { diff } = deepDiff;

import type { Manifest } from '@mcpkit/core';
import { printError } from '../utils/pretty-error.js';

// Type definitions for deep-diff library
interface DiffChange {
  kind: 'N' | 'D' | 'E' | 'A';
  path?: (string | number)[];
  lhs?: unknown;
  rhs?: unknown;
  index?: number;
  item?: DiffChange;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ToolSchema {
  description?: string;
  inputSchema: unknown;
  outputSchema: unknown;
}

interface PromptSchema {
  template: string;
  title?: string;
  paramsSchema: unknown;
}

interface ResourceSchema {
  uri: string;
  title?: string;
}

interface SchemaSnapshot {
  tools: Record<string, ToolSchema>;
  prompts: Record<string, PromptSchema>;
  resources: Record<string, ResourceSchema>;
  timestamp: string;
  manifest?: Manifest; // Optional manifest for future use
}

export const doctorCommand = new Command('doctor')
  .description('Validate MCP server schema and detect changes')
  .argument('[entry]', 'Entry file path', 'src/index.ts')
  .option('-o, --output <file>', 'Output file for schema snapshot')
  .option('-b, --baseline <file>', 'Baseline file for comparison')
  .option('--ci', 'CI mode: non-interactive, exit on first error')
  .action(async (entry: string, options: { output?: string; baseline?: string; ci?: boolean }) => {
    try {
      const entryPath = findEntryFile(entry);
      if (!entryPath) {
        printError(new Error(`Entry file not found: ${entry}`), 'Entry Resolution');
        process.exit(1);
      }

      console.log(chalk.blue('🔍 McpKit Schema Doctor'));
      console.log(chalk.gray(`Entry: ${entryPath}`));
      console.log();

      const snapshot = await extractSchemaSnapshot(entryPath);

      if (options.output) {
        writeFileSync(options.output, JSON.stringify(snapshot, null, 2));
        console.log(chalk.green(`✅ Schema snapshot saved to ${options.output}`));
      }

      if (options.baseline) {
        await compareWithBaseline(snapshot, options.baseline, options.ci);
      } else {
        displaySchemaInfo(snapshot);
      }
    } catch (error) {
      printError(error, 'Schema Validation');
      process.exit(1);
    }
  });

async function extractSchemaSnapshot(entryPath: string): Promise<SchemaSnapshot> {
  const tempScript = `
import { createMcpServer } from '@mcpkit/server';
import { validateManifest, ManifestSchema } from '@mcpkit/core';
import { z } from 'zod';

async function extractSchema() {
  try {
    const module = await import('${isAbsolute(entryPath) ? pathToFileURL(entryPath).href : entryPath}');

    let server;
    if (module.default && typeof module.default === 'function') {
      server = module.default();
    } else if (module.default && module.default.default && typeof module.default.default.build === 'function') {
      server = module.default.default.build();
    } else if (module.default && typeof module.default.build === 'function') {
      server = module.default.build();
    } else if (module.default) {
      server = module.default;
    } else if (module.server) {
      server = module.server;
    } else {
      server = createMcpServer().build();
    }

    let bundle;
    if (typeof server.build === 'function') {
      bundle = server.build();
    } else if (server.registry && server.runtime) {
      bundle = server;
    } else {
      throw new Error('Invalid server object - no build method or registry/runtime');
    }

    const { registry, runtime } = bundle;

    // Try to get manifest from runtime first, fallback to registry extraction
    let manifest = runtime.getManifest && runtime.getManifest();

    if (!manifest) {
      // Fallback: extract from registry (backward compatibility)
      manifest = {
        tools: [],
        prompts: [],
        resources: [],
        capabilities: { tools: {}, prompts: {}, resources: {} },
        implementation: { name: 'mcpkit-server', version: '0.1.0' }
      };

      for (const toolName of registry.getToolNames()) {
        const tool = registry.getTool(toolName);
        if (tool) {
          manifest.tools.push({
            name: tool.name,
            description: tool.description || '',
            inputSchema: tool.input.json(),
          });
        }
      }

      for (const promptName of registry.getPromptNames()) {
        const prompt = registry.getPrompt(promptName);
        if (prompt) {
          manifest.prompts.push({
            name: prompt.name,
            description: prompt.template,
            arguments: prompt.params ? [{
              name: 'params',
              description: 'Prompt parameters',
              required: true
            }] : [],
          });
        }
      }

      for (const resourceName of registry.getResourceNames()) {
        const resource = registry.getResource(resourceName);
        if (resource) {
          manifest.resources.push({
            name: resource.name,
            uri: resource.uri,
            description: resource.title || '',
          });
        }
      }
    }

    // Validate manifest using SDK Zod schemas
    try {
      ManifestSchema.parse(manifest);
      console.error('✓ Manifest is valid according to MCP SDK schemas');
    } catch (error) {
      console.error('✗ Manifest validation failed');
      if (error instanceof z.ZodError) {
        console.error('Validation errors:');
        error.errors.forEach(err => {
          const path = err.path.length > 0 ? err.path.join('.') : 'root';
          console.error('  - ' + path + ': ' + err.message);
        });
      }
      throw new Error('Generated manifest failed SDK schema validation');
    }

    // Convert manifest to legacy snapshot format for backward compatibility
    const tools = {};
    const prompts = {};
    const resources = {};

    for (const tool of manifest.tools) {
      tools[tool.name] = {
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema || null,
      };
    }

    for (const prompt of manifest.prompts) {
      prompts[prompt.name] = {
        template: prompt.description, // Using description as template for backward compatibility
        title: prompt.name,
        paramsSchema: prompt.arguments && prompt.arguments.length > 0 ? prompt.arguments : null,
      };
    }

    for (const resource of manifest.resources) {
      resources[resource.name] = {
        uri: resource.uri,
        title: resource.description,
      };
    }

    console.log(JSON.stringify({
      tools,
      prompts,
      resources,
      timestamp: new Date().toISOString(),
      manifest: manifest, // Include full manifest for future use
    }));
  } catch (error) {
    console.error('Schema extraction error:', error.message);
    process.exit(1);
  }
}

extractSchema();
`;

  try {
    const tsxPath = resolve(__dirname, '../../node_modules/.bin/tsx');
    const output = execSync(`"${tsxPath}" -e "${tempScript.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    return JSON.parse(output.trim());
  } catch (error) {
    throw new Error(
      `Failed to extract schema: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function compareWithBaseline(
  snapshot: SchemaSnapshot,
  baselinePath: string,
  ciMode?: boolean,
): Promise<void> {
  if (!existsSync(baselinePath)) {
    console.log(chalk.yellow(`⚠️  Baseline file not found: ${baselinePath}`));
    console.log(chalk.gray('Creating new baseline...'));
    writeFileSync(baselinePath, JSON.stringify(snapshot, null, 2));
    console.log(chalk.green(`✅ Baseline created at ${baselinePath}`));
    return;
  }

  const baselineContent = readFileSync(baselinePath, 'utf-8');
  const baseline: SchemaSnapshot = JSON.parse(baselineContent);

  // Exclude timestamp from comparison
  const { timestamp: _, ...baselineForComparison } = baseline;
  const { timestamp: __, ...snapshotForComparison } = snapshot;

  const differences: DiffChange[] | undefined = diff(baselineForComparison, snapshotForComparison);

  if (!differences || differences.length === 0) {
    console.log(chalk.green('✅ No schema changes detected'));
    displaySchemaInfo(snapshot);
    return;
  }

  console.log(chalk.yellow(`⚠️  Schema changes detected (${differences.length} changes)`));
  console.log();

  for (const change of differences) {
    displayDifference(change);
  }

  if (ciMode) {
    console.log();
    console.log(chalk.red('❌ Schema validation failed in CI mode'));
    process.exit(1);
  }
}

function displaySchemaInfo(snapshot: SchemaSnapshot): void {
  const toolCount = Object.keys(snapshot.tools).length;
  const promptCount = Object.keys(snapshot.prompts).length;
  const resourceCount = Object.keys(snapshot.resources).length;

  console.log(chalk.blue('📊 Schema Summary'));
  console.log(`${chalk.green('✓')} Tools: ${toolCount}`);
  console.log(`${chalk.green('✓')} Prompts: ${promptCount}`);
  console.log(`${chalk.green('✓')} Resources: ${resourceCount}`);
  console.log();

  if (toolCount > 0) {
    console.log(chalk.bold('Tools:'));
    for (const [name, tool] of Object.entries(snapshot.tools)) {
      console.log(`  ${chalk.cyan(name)}: ${tool.description || 'No description'}`);
    }
    console.log();
  }

  if (promptCount > 0) {
    console.log(chalk.bold('Prompts:'));
    for (const [name, prompt] of Object.entries(snapshot.prompts)) {
      console.log(`  ${chalk.cyan(name)}: ${prompt.title || 'No title'}`);
    }
    console.log();
  }

  if (resourceCount > 0) {
    console.log(chalk.bold('Resources:'));
    for (const [name, resource] of Object.entries(snapshot.resources)) {
      console.log(`  ${chalk.cyan(name)}: ${resource.uri}`);
    }
    console.log();
  }
}

function displayDifference(change: DiffChange): void {
  const path = change.path ? change.path.join('.') : 'root';

  switch (change.kind) {
    case 'N': // New
      console.log(`${chalk.green('+')} Added: ${path} = ${JSON.stringify(change.rhs)}`);
      break;
    case 'D': // Deleted
      console.log(`${chalk.red('-')} Removed: ${path} = ${JSON.stringify(change.lhs)}`);
      break;
    case 'E': // Edited
      console.log(`${chalk.yellow('~')} Changed: ${path}`);
      console.log(`  ${chalk.red('-')} ${JSON.stringify(change.lhs)}`);
      console.log(`  ${chalk.green('+')} ${JSON.stringify(change.rhs)}`);
      break;
    case 'A': // Array
      console.log(`${chalk.blue('*')} Array change: ${path}[${change.index}]`);
      if (change.item?.kind) {
        displayDifference(change.item);
      }
      break;
  }
}

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
