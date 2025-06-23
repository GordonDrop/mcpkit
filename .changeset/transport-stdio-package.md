---
"@mcpkit/transport-stdio": patch
---

feat: add stdio transport implementation for MCP servers

Introduce new @mcpkit/transport-stdio package providing JSON-RPC communication over stdin/stdout. This transport implementation enables MCP servers to communicate with clients using the standard stdio protocol.

Key features:
- Complete JSON-RPC 2.0 protocol implementation
- Standard error codes (-32700 parse error, -32601 method not found, etc.)
- Graceful shutdown with SIGINT/SIGTERM signal handling
- AbortController support for programmatic cancellation
- Tool execution with proper error wrapping and response formatting
- Type-safe integration with Transport interface from @mcpkit/core

The stdio transport serves as the default communication layer for MCP servers, providing reliable and standards-compliant message exchange between servers and clients.
