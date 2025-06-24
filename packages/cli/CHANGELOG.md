# cli

## 0.1.1

### Patch Changes

- bb98555: feat(cli): implement CLI package with development and validation commands

  - **New Package**: `@mcpkit/cli` featuring development and validation tools for MCP servers
  - **Development Command**: `mcp dev` with hot-reload functionality, file watching, and graceful shutdown
  - **Validation Command**: `mcp doctor` with schema validation, baseline comparison, and CI mode
  - **Auto-detection**: Smart entry file detection for `.mcp.ts`, `index.ts`, and other common patterns
  - **Error Handling**: Consistent error formatting with colored output using chalk
  - **Testing**: Comprehensive test suite with 80%+ coverage using vitest and execa
  - **CI Integration**: CI-friendly exit codes and non-interactive mode for automated workflows

  Key features:

  - Hot-reload development server with tsx execution
  - Schema snapshot generation and diff detection
  - Colorized terminal output with timing information
  - Graceful process management and cleanup
  - Integration with existing McpKit ecosystem

## 0.0.0

### Patch Changes

- Initial Changesets setup and configuration for automated version management
