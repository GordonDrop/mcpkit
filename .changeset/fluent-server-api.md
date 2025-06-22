---
"@mcpkit/core": patch
---

Add @mcpkit/server package with fluent builder API

- **New Package**: `@mcpkit/server` featuring the `createMcpServer()` fluent builder function
- Chainable API methods for server configuration:
  - `.tool()` - Register tools with the server
  - `.prompt()` - Register prompts with the server  
  - `.resource()` - Register resources with the server
  - `.use()` - Add middleware or plugins to the server
- `.build()` method returns a ready-to-use Registry and McpRuntime instance

This new package provides a convenient fluent API for building MCP servers, making it easier to configure and set up servers with tools, prompts, and resources in a chainable manner.
