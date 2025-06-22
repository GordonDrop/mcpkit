# @mcpkit/server

A chainable builder API for creating MCP (Model Context Protocol) servers with type-safe tool, prompt, and resource registration.

## Installation

```bash
npm install @mcpkit/server @mcpkit/core
```

## Quick Start

```typescript
import { createMcpServer, schema, z } from '@mcpkit/server';

const server = createMcpServer()
  .tool('add', {
    input: schema(z.object({ a: z.number(), b: z.number() })),
    output: schema(z.object({ result: z.number() })),
    async handler({ a, b }) {
      return { result: a + b };
    }
  })
  .prompt('greeting', 'Hello {{name}}!', {
    title: 'Greeting Template',
    params: schema(z.object({ name: z.string() }))
  })
  .resource('readme', 'file://README.md', {
    title: 'Project README'
  })
  .build();

// Use the built server
const result = await server.runtime.executeTool('add', { a: 2, b: 3 });
console.log(result); // { result: 5 }

const greeting = await server.runtime.renderPrompt('greeting', { name: 'Alice' });
console.log(greeting); // "Hello Alice!"
```