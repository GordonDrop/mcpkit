# @mcpkit/cli

CLI tools for McpKit development and validation. Provides hot-reload development server and schema validation commands for MCP servers.

## Installation

```bash
npm install -g @mcpkit/cli
# or
pnpm add -g @mcpkit/cli
```

## Commands

### `mcp dev` - Development Server

Start a development server with hot-reload functionality for rapid MCP server development.

```bash
mcp dev [entry.ts] [options]
```

**Arguments:**
- `entry` - Entry file path (default: `src/index.ts`)

**Options:**
- `-w, --watch <glob>` - Watch pattern for file changes (default: `src/**/*.{ts,js}`)
- `-e, --env <file>` - Environment file to load
- `-p, --port <number>` - Port number for server (default: `3000`)

**Examples:**

```bash
# Start with default settings
mcp dev

# Start with custom entry file
mcp dev src/server.ts

# Watch specific files and set port
mcp dev --watch "src/**/*.ts" --port 8080

# Load environment variables
mcp dev --env .env.development
```

**Features:**
- 🔥 Hot-reload on file changes
- 📁 Auto-detection of entry files (`.mcp.ts`, `index.ts`)
- ⚡ Fast startup with tsx
- 🎨 Colorized output with timing information
- 🛑 Graceful shutdown handling

### `mcp doctor` - Schema Validation

Validate MCP server schema and detect changes between versions.

```bash
mcp doctor [entry.ts] [options]
```

**Arguments:**
- `entry` - Entry file path (default: `src/index.ts`)

**Options:**
- `-o, --output <file>` - Output file for schema snapshot
- `-b, --baseline <file>` - Baseline file for comparison
- `--ci` - CI mode: non-interactive, exit on first error

**Examples:**

```bash
# Validate current schema
mcp doctor

# Generate schema snapshot
mcp doctor --output schema.json

# Compare against baseline
mcp doctor --baseline schema-baseline.json

# CI mode for automated checks
mcp doctor --baseline schema-baseline.json --ci
```

**Features:**
- 📊 Schema summary with counts
- 🔍 Detailed tool/prompt/resource inspection
- 📈 Baseline comparison and diff detection
- ✅ CI-friendly exit codes
- 🎨 Colorized diff output

## Entry File Detection

The CLI automatically detects entry files in the following order:

1. Specified entry argument
2. `src/index.ts`
3. `src/index.js`
4. `index.ts`
5. `index.js`
6. `src/server.mcp.ts`
7. `server.mcp.ts`
8. `src/index.mcp.ts`
9. `index.mcp.ts`

## Exit Codes

- `0` - Success
- `1` - Validation/compile errors
- `>1` - Process crashes

## Integration with McpKit

The CLI works seamlessly with the McpKit ecosystem:

```typescript
// src/index.ts
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
```

Then run:

```bash
# Development
mcp dev

# Validation
mcp doctor --output schema.json
```

## CI/CD Integration

For automated schema validation in CI:

```yaml
# .github/workflows/validate-schema.yml
name: Validate MCP Schema

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx @mcpkit/cli doctor --baseline schema-baseline.json --ci
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Lint
pnpm lint
```

## License

MIT
