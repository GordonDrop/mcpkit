# server

## 0.0.2

### Patch Changes

- 640aea5: Implement comprehensive middleware system with onion-model architecture

  This patch introduces a complete middleware system for the MCP server package, enabling extensible request/response processing pipelines and plugin architecture. This is foundational implementation work as the framework is not yet production-ready.

  ## New Features

  ### Middleware System

  - **Onion-model middleware composition** with right-to-left execution order
  - **Built-in error wrapper middleware** that automatically converts exceptions to error result objects
  - **Type-safe middleware interfaces** with `CallCtx`, `CallResult`, `InvokeFn`, and `Middleware` types
  - **Functional composition engine** using `Array.reduceRight()` for optimal performance
  - **Loop prevention and stack safety** mechanisms to prevent infinite recursion

  ### Plugin Architecture

  - **Plugin contract interface** for extending server functionality
  - **Build-time plugin execution** with access to server builder
  - **Typed plugin options** with generic type support
  - **Nested plugin registration** for complex composition scenarios
  - **Plugin error isolation** to prevent cascading failures

  ### Enhanced Builder API

  - **`.use(middleware)` method** for registering middleware with runtime validation
  - **`.register(plugin, options)` method** for plugin registration with typed options
  - **Enhanced `.build()` method** with 5-phase construction:
    1. Plugin processing phase
    2. Middleware setup phase (auto-adds error wrapper)
    3. Registry & runtime assembly
    4. Middleware chain construction
    5. Enhanced bundle return with `invoke` function

  ### Public API Exports

  - **Type exports**: `Middleware`, `Plugin` for external middleware/plugin development
  - **Unified invoke function** for transport layer integration
  - **Backward compatible** with existing builder API

## 0.0.1

### Patch Changes

- 34b62a0: **New package: @mcpkit/server**

  - Introduces `createMcpServer()` fluent builder factory function
  - Provides chainable API methods: `.tool()`, `.prompt()`, `.resource()`, and `.use()`
  - The `.build()` method returns a complete McpRuntimeBundle containing both Registry and McpRuntime instances
  - Implements strict separation between declaration phase (builder methods) and execution phase (transport/middleware)

  This new package provides a convenient fluent API for building MCP servers, making it easier to configure and set up servers with tools, prompts, and resources in a chainable manner.

## 0.0.0

### Patch Changes

- Initial Changesets setup and configuration for automated version management
