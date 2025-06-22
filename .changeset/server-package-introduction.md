---
"@mcpkit/server": patch
---

**New package: @mcpkit/server**

- Introduces `createMcpServer()` fluent builder factory function
- Provides chainable API methods: `.tool()`, `.prompt()`, `.resource()`, and `.use()`
- The `.build()` method returns a complete McpRuntimeBundle containing both Registry and McpRuntime instances
- Implements strict separation between declaration phase (builder methods) and execution phase (transport/middleware)

This new package provides a convenient fluent API for building MCP servers, making it easier to configure and set up servers with tools, prompts, and resources in a chainable manner.
