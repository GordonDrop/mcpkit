# @mcpkit/core

## 0.1.1

### Patch Changes

- 9e2f1e0: Add @mcpkit/server package with fluent builder API

  - **New Package**: `@mcpkit/server` featuring the `createMcpServer()` fluent builder function
  - Chainable API methods for server configuration:
    - `.tool()` - Register tools with the server
    - `.prompt()` - Register prompts with the server
    - `.resource()` - Register resources with the server
    - `.use()` - Add middleware or plugins to the server
  - `.build()` method returns a ready-to-use Registry and McpRuntime instance

  This new package provides a convenient fluent API for building MCP servers, making it easier to configure and set up servers with tools, prompts, and resources in a chainable manner.

## 0.1.1 – 2025-06-19

### Added

- `Schema<T>` thin adapter over Zod (`ZodSchema`, helper `schema()`).
- Public interfaces `ToolSpec`, `ResourceSpec`, `PromptSpec`, `Transport`, `ExecutionCtx`, `Version`.

### Changed

- Exported `z` from `@mcpkit/core` to avoid duplicate Zod versions downstream.

### Tests

- Vitest suite for schema parse / json round-trip.

## 0.1.0

### Patch Changes

- Initial Changesets setup and configuration for automated version management
