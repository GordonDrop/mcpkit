---
"@mcpkit/core": patch
"@mcpkit/protocol": patch
"@mcpkit/cli": patch
---

Implement CLI doctor SDK Zod schema validation

Replace basic manual validation with official MCP SDK Zod schemas for proper manifest validation in CLI doctor command. This enhances validation accuracy and provides detailed error reporting when manifests don't conform to MCP SDK standards.

**Changes:**

- **@mcpkit/protocol**: Added SDK Zod schema imports and composite ManifestSchema validation
- **@mcpkit/core**: Updated to use enhanced SDK-based validation from protocol package
- **@mcpkit/cli**: Enhanced doctor command with detailed SDK schema validation and error reporting
- **@mcpkit/cli**: doctor: validates `runtime.manifest` with SDK Zod schema before diffing.

**Features:**
- Uses official MCP SDK Zod schemas (ToolSchema, PromptSchema, ResourceSchema, etc.)
- Provides detailed validation error messages with specific field paths
- Maintains backward compatibility with existing CLI interface
- Proper error handling and reporting for validation failures