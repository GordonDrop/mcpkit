---
"@mcpkit/ndjson": patch
---

feat: add @mcpkit/ndjson package for NDJSON stream utilities

Introduce new @mcpkit/ndjson package providing reusable NDJSON (Newline Delimited JSON) reader and writer utilities for Node.js streams. This package extracts NDJSON handling into a shared utility for consistent reuse across future transports.

Key features:

- **NDJSONReader**: Async iterator interface for reading NDJSON from any Node.js Readable stream
- **NDJSONWriter**: Promise-based writer for serializing objects to NDJSON format on any Node.js Writable stream  
- **NDJSONParseError**: Custom error type with line number context and original error details
- **Stream compatibility**: Works with any Node.js Readable/Writable stream pair
- **Backpressure handling**: Proper backpressure support in writer with drain event handling
- **Error handling**: Comprehensive error handling with detailed context for debugging
- **Pure Node.js**: No external dependencies, uses only Node.js built-in modules

The package follows project conventions with comprehensive test coverage, TypeScript declarations, and colocated testing patterns. It serves as a foundation for future transport implementations that need reliable NDJSON stream processing.
