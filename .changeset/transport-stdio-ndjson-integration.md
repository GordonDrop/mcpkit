---
"@mcpkit/transport-stdio": patch
---

refactor(transport-stdio): integrate @mcpkit/ndjson utilities for improved output formatting

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
