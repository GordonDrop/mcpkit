---
"@mcpkit/server": patch
---

Implement comprehensive middleware system with onion-model architecture

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