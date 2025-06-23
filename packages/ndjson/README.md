# @mcpkit/ndjson

NDJSON (Newline Delimited JSON) reader and writer utilities for Node.js streams.

## Installation

```bash
npm install @mcpkit/ndjson
```

## Features

- **NDJSONReader**: Async iterator interface for reading NDJSON from any Node.js Readable stream
- **NDJSONWriter**: Promise-based writer for serializing objects to NDJSON format on any Node.js Writable stream
- **NDJSONParseError**: Custom error type with line number context and original error details
- **Stream compatibility**: Works with any Node.js Readable/Writable stream pair
- **Backpressure handling**: Proper backpressure support in writer with drain event handling
- **Error handling**: Comprehensive error handling with detailed context for debugging
- **Pure Node.js**: No external dependencies, uses only Node.js built-in modules

## Quick Start

### Reading NDJSON

```typescript
import { ndjsonReader } from '@mcpkit/ndjson';
import { createReadStream } from 'node:fs';

const stream = createReadStream('data.ndjson');
const reader = ndjsonReader(stream);

for await (const obj of reader) {
  console.log(obj);
}
```

### Writing NDJSON

```typescript
import { ndjsonWriter } from '@mcpkit/ndjson';
import { createWriteStream } from 'node:fs';

const stream = createWriteStream('output.ndjson');
const writer = ndjsonWriter(stream);

await writer.write({ name: 'Alice', age: 30 });
await writer.write({ name: 'Bob', age: 25 });
await writer.end();
```

### Error Handling

```typescript
import { ndjsonReader, NDJSONParseError } from '@mcpkit/ndjson';

try {
  for await (const obj of reader) {
    console.log(obj);
  }
} catch (error) {
  if (error instanceof NDJSONParseError) {
    console.error(`Parse error at line ${error.lineNumber}: ${error.message}`);
    console.error(`Content: ${error.partialContent}`);
    console.error(`Original error: ${error.originalError.message}`);
  }
}
```

## API Reference

### `ndjsonReader(stream, options?)`

Creates an NDJSON reader for the given stream.

**Parameters:**
- `stream: Readable` - Any Node.js Readable stream
- `options?: NDJSONReaderOptions` - Optional configuration
  - `skipEmptyLines?: boolean` - Skip empty lines (default: true)

**Returns:** `NDJSONReader` - An async iterable reader

### `ndjsonWriter(stream, options?)`

Creates an NDJSON writer for the given stream.

**Parameters:**
- `stream: Writable` - Any Node.js Writable stream
- `options?: NDJSONWriterOptions` - Optional configuration
  - `replacer?: (key: string, value: unknown) => unknown` - JSON.stringify replacer function
  - `space?: string | number` - JSON.stringify space parameter

**Returns:** `NDJSONWriter` - A writer with async write methods

### `NDJSONParseError`

Custom error class for NDJSON parsing errors.

**Properties:**
- `lineNumber: number` - The line number where the error occurred
- `originalError: Error` - The original parsing error
- `partialContent: string` - The content that failed to parse

## Integration with McpKit

This package is designed to work seamlessly with other McpKit packages, particularly for transport layer implementations that need reliable NDJSON stream processing.

## License

MIT
