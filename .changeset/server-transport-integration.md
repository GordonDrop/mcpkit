---
"@mcpkit/server": minor
---

feat: enhance server builder API with transport integration

Extend the McpServerBuilder with transport selection and listening capabilities, enabling seamless integration with transport layers for MCP server communication.

New API methods:
- `.transport(transport)` - Configure transport with single-assignment validation to prevent conflicts
- `.listen(options?)` - Start server with optional AbortSignal support for graceful shutdown
- Automatic fallback to default stdio transport when no transport is explicitly provided

Key improvements:
- Maintains full backward compatibility with existing builder API
- Integrates with @mcpkit/transport-stdio for out-of-the-box stdio communication
- Supports programmatic shutdown via AbortSignal for clean resource management
- Validates transport assignment to prevent configuration errors
- Seamless builder pattern extension without breaking existing workflows

The enhanced builder API provides a unified interface for configuring and starting MCP servers with flexible transport options while preserving the familiar chainable API design.
