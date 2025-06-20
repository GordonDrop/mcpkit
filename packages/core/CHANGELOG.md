# @mcpkit/core

## 0.1.0

### Patch Changes

- Initial Changesets setup and configuration for automated version management

## 0.0.2 – 2025-06-19
### Added
- `Schema<T>` thin adapter over Zod (`ZodSchema`, helper `schema()`).
- Public interfaces `ToolSpec`, `ResourceSpec`, `PromptSpec`, `Transport`, `ExecutionCtx`, `Version`.
### Changed
- Exported `z` from `@mcpkit/core` to avoid duplicate Zod versions downstream.
### Tests
- Vitest suite for schema parse / json round-trip.