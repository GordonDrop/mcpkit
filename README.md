# McpKit

A modern, type-safe toolkit for building Model Context Protocol (MCP) servers with TypeScript. McpKit provides a chainable builder API, comprehensive middleware system, and robust transport layer for creating production-ready MCP servers.

## Features

- 🏗️ **Chainable Builder API** - Fluent interface for defining tools, prompts, and resources
- 🔒 **Type Safety** - Full TypeScript support with schema validation using Zod
- 🧩 **Middleware System** - Onion-model middleware for extensible functionality
- 🚀 **Transport Layer** - Built-in stdio transport with JSON-RPC protocol
- 🔧 **Development Tools** - CLI with hot-reload and schema validation
- 📦 **Plugin System** - Extensible architecture for custom functionality

## Quick Start

### 1. Install the CLI

```bash
npm install -g @mcpkit/cli
```

### 2. Create a New Project

Create a new directory and initialize your MCP server project:

```bash
mkdir my-mcp-server
cd my-mcp-server
npm init -y
npm install @mcpkit/server @mcpkit/core
npm install -D typescript tsx @types/node
```

### 3. Create Your Server

Create a `src/index.ts` file with your MCP server definition:

```typescript
import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer()
  .tool('calculate', {
    description: 'Perform basic mathematical calculations',
    input: schema(z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('Mathematical operation'),
      a: z.number().describe('First number'),
      b: z.number().describe('Second number')
    })),
    output: schema(z.object({
      result: z.number().describe('Calculation result')
    })),
    async handler({ operation, a, b }) {
      switch (operation) {
        case 'add': return { result: a + b };
        case 'subtract': return { result: a - b };
        case 'multiply': return { result: a * b };
        case 'divide':
          if (b === 0) throw new Error('Division by zero');
          return { result: a / b };
      }
    }
  })
  .tool('get-time', {
    description: 'Get current time in various formats',
    input: schema(z.object({
      format: z.enum(['iso', 'timestamp', 'locale']).optional().describe('Time format')
    })),
    output: schema(z.object({
      time: z.string().describe('Formatted time')
    })),
    async handler({ format = 'iso' }) {
      const now = new Date();
      switch (format) {
        case 'iso': return { time: now.toISOString() };
        case 'timestamp': return { time: now.getTime().toString() };
        case 'locale': return { time: now.toLocaleString() };
      }
    }
  })
  .prompt('code-review', 'Please review the following code:\n\n```{{language}}\n{{code}}\n```\n\nFocus on: {{focus}}', {
    title: 'Code Review Template',
    description: 'Template for requesting code reviews',
    params: schema(z.object({
      language: z.string().describe('Programming language'),
      code: z.string().describe('Code to review'),
      focus: z.string().describe('Areas to focus on during review')
    }))
  })
  .resource('project-info', 'file://package.json', {
    title: 'Project Information',
    description: 'Package.json file containing project metadata'
  })
  .resource('readme', 'file://README.md', {
    title: 'Project README',
    description: 'Project documentation and setup instructions'
  });
```

### 4. Add a Startup Script

Create a `src/server.ts` file to run your server:

```typescript
import server from './index.js';

// Start the server with stdio transport
await server.listen();
```

### 5. Configure TypeScript

Create a `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 6. Add Package Scripts

Update your `package.json` to include build and development scripts:

```json
{
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "mcp dev",
    "start": "node dist/server.js",
    "validate": "mcp doctor"
  }
}
```

### 7. Start Development

Start the development server with hot-reload:

```bash
npm run dev
```

The server will start and watch for file changes, automatically restarting when you modify your code.

### 8. Test Your Server

You can test your server by sending JSON-RPC requests via stdin:

```bash
# Test the calculate tool
echo '{"jsonrpc":"2.0","id":1,"method":"tool","params":{"name":"calculate","input":{"operation":"add","a":5,"b":3}}}' | npm start

# Test the get-time tool
echo '{"jsonrpc":"2.0","id":2,"method":"tool","params":{"name":"get-time","input":{"format":"iso"}}}' | npm start
```

### 9. Validate Your Schema

Check your server's schema and ensure everything is properly configured:

```bash
npm run validate
```

This will display a summary of your tools, prompts, and resources, helping you verify your server configuration.

## Next Steps

Now that you have a working MCP server, you can:

- **Add More Tools**: Extend your server with additional tools for specific use cases
- **Implement Middleware**: Add custom middleware for logging, authentication, or request processing
- **Use Plugins**: Integrate community plugins or create your own for reusable functionality
- **Deploy**: Build and deploy your server to production environments
- **Integrate**: Connect your server with MCP-compatible clients and applications

## Architecture Overview

McpKit is built around several core concepts:

### Builder Pattern
The `createMcpServer()` function returns a builder that allows you to chain method calls to configure your server:

```typescript
const server = createMcpServer()
  .tool('name', { /* tool definition */ })
  .prompt('name', 'template', { /* metadata */ })
  .resource('name', 'uri', { /* metadata */ })
  .use(middleware)
  .build();
```

### Registry and Runtime
- **Registry**: Stores all registered tools, prompts, and resources
- **Runtime**: Handles execution of tools and prompts with middleware support
- **Transport**: Manages communication protocol (stdio, HTTP, etc.)

### Middleware System
McpKit uses an onion-model middleware system that wraps around tool execution:

```typescript
const server = createMcpServer()
  .use(async (ctx, next) => {
    console.log(`Executing ${ctx.type}: ${ctx.name}`);
    const result = await next();
    console.log(`Completed in ${Date.now() - ctx.meta.start}ms`);
    return result;
  })
  .tool('example', { /* ... */ });
```

## Packages

McpKit is organized as a monorepo with several focused packages:

- **[@mcpkit/core](./packages/core)** - Core types, interfaces, and runtime
- **[@mcpkit/server](./packages/server)** - Builder API and server implementation
- **[@mcpkit/cli](./packages/cli)** - Development tools and CLI commands
- **[@mcpkit/transport-stdio](./packages/transport-stdio)** - Stdio transport implementation
- **[@mcpkit/ndjson](./packages/ndjson)** - NDJSON utilities for reliable streaming

## Examples

Check out the [examples directory](./examples) for complete working examples:

- **[stdio-server.ts](./examples/stdio-server.ts)** - Complete MCP server with multiple tools
- **[test-client.ts](./examples/test-client.ts)** - Test client for JSON-RPC communication
- **NDJSON examples** - Stream processing and data transformation demos

## Development

### Prerequisites

- Node.js 18+
- pnpm 9.1.0+

### Setup

```bash
# Clone the repository
git clone https://github.com/GordonDrop/mcpkit.git
cd mcpkit

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint
```

### Project Structure

```
mcpkit/
├── packages/
│   ├── core/           # Core types and runtime
│   ├── server/         # Builder API
│   ├── cli/            # Development tools
│   ├── transport-stdio/# Stdio transport
│   └── ndjson/         # NDJSON utilities
├── examples/           # Working examples
└── docs/              # Documentation
```