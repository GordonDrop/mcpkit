#!/usr/bin/env node

import { Command } from 'commander';
import { devCommand } from './commands/dev.js';
import { doctorCommand } from './commands/doctor.js';

const cli = new Command();

cli
  .name('mcp')
  .description('McpKit CLI - Development and validation tools for MCP servers')
  .version('0.1.0');

cli.addCommand(devCommand);
cli.addCommand(doctorCommand);

try {
  await cli.parseAsync(process.argv);
} catch (error) {
  console.error('CLI Error:', error);
  process.exit(1);
}
