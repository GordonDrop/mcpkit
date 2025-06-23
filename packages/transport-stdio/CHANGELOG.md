# transport-stdio

## 1.0.1

### Patch Changes

- db0c8d3: refactor(transport-stdio): integrate @mcpkit/ndjson utilities for improved output formatting

  Refactor the internal implementation of @mcpkit/transport-stdio to use @mcpkit/ndjson utilities for JSON-RPC response formatting instead of direct console.log calls. This change improves the reliability and consistency of NDJSON output formatting while maintaining full backward compatibility.

  **Key improvements:**

  - **Enhanced reliability**: Uses dedicated NDJSON writer with proper stream handling and backpressure support
  - **Consistent formatting**: Ensures all JSON-RPC responses are properly formatted as NDJSON (JSON + newline)
  - **Better error handling**: Leverages NDJSON utilities' robust error handling for stream operations
  - **Future-proof architecture**: Establishes foundation for potential future transport enhancements

  **Implementation details:**

  - Replaced `console.log(JSON.stringify(...))` with `ndjsonWriter(process.stdout).write(...)`
  - Updated internal response methods to use async NDJSON writer operations
  - Enhanced test mocks to provide proper stream interface for NDJSON writer compatibility
  - All test expectations updated to verify NDJSON format output (`JSON + '\n'`)

  **Backward compatibility:**

  - **External API unchanged**: All public interfaces remain identical
  - **Behavior preserved**: JSON-RPC protocol compliance maintained
  - **Output format consistent**: Still produces valid NDJSON as before
  - **Test coverage maintained**: All existing tests continue to pass (21/21 tests)

  This refactoring is purely internal and does not affect consumers of the transport-stdio package. The JSON-RPC communication protocol and all external behaviors remain exactly the same.

- Updated dependencies [db0c8d3]
  - @mcpkit/ndjson@0.0.1

## 1.0.0

### Patch Changes

- b35a0d2: feat: add stdio transport implementation for MCP servers

  Introduce new @mcpkit/transport-stdio package providing JSON-RPC communication over stdin/stdout. This transport implementation enables MCP servers to communicate with clients using the standard stdio protocol.

  Key features:

  - Complete JSON-RPC 2.0 protocol implementation
  - Standard error codes (-32700 parse error, -32601 method not found, etc.)
  - Graceful shutdown with SIGINT/SIGTERM signal handling
  - AbortController support for programmatic cancellation
  - Tool execution with proper error wrapping and response formatting
  - Type-safe integration with Transport interface from @mcpkit/core

  The stdio transport serves as the default communication layer for MCP servers, providing reliable and standards-compliant message exchange between servers and clients.

- Updated dependencies [b35a0d2]
  - @mcpkit/server@0.1.0

## 0.0.0

### Patch Changes

- Initial Changesets setup and configuration for automated version management
