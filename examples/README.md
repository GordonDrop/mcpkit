# McpKit Examples

This directory contains examples demonstrating the usage of McpKit packages, including the stdio transport and NDJSON utilities.

## Stdio Transport Example

### Files

- `stdio-server.ts` - A complete MCP server using stdio transport
- `test-client.ts` - A test client that communicates with the server via JSON-RPC
- `ndjson-reader-example.ts` - Demonstrates reading NDJSON streams
- `ndjson-writer-example.ts` - Demonstrates writing NDJSON streams
- `ndjson-stream-processing-example.ts` - Shows NDJSON stream processing and transformation
- `README.md` - This file

### Running the Example

1. **Install dependencies** (from the project root):
   ```bash
   pnpm install
   ```

2. **Build the packages** (from the project root):
   ```bash
   pnpm build
   ```

3. **Run the server directly**:
   ```bash
   npx tsx examples/stdio-server.ts
   ```
   
   The server will start and wait for JSON-RPC requests on stdin. You can send requests manually:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"tool","params":{"name":"add","input":{"a":5,"b":3}}}' | npx tsx examples/stdio-server.ts
   ```

4. **Run the automated test client**:
   ```bash
   npx tsx examples/test-client.ts
   ```

   This will start the server and send several test requests, demonstrating:
   - Successful tool execution
   - Error handling for non-existent tools
   - JSON-RPC protocol compliance

5. **Run NDJSON examples**:
   ```bash
   # Individual examples
   npx tsx examples/ndjson-reader-example.ts
   npx tsx examples/ndjson-writer-example.ts
   npx tsx examples/ndjson-stream-processing-example.ts

   # Or run all NDJSON demos
   cd examples && npm run ndjson-demo
   ```

### Example JSON-RPC Communication

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tool",
  "params": {
    "name": "add",
    "input": { "a": 5, "b": 3 }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { "result": 8 }
}
```

**Error Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "error": {
    "code": -32603,
    "message": "Tool execution failed",
    "data": "Tool 'nonexistent' not found"
  }
}
```

### Features Demonstrated

1. **Transport Layer**: Stdio transport for JSON-RPC communication
2. **Server Builder API**: Fluent API for defining tools
3. **Type Safety**: Full TypeScript support with schema validation
4. **Error Handling**: Proper JSON-RPC error responses
5. **Graceful Shutdown**: Signal handling and cleanup

### Server API

The example server provides these tools:

- `add(a: number, b: number)` → `{ result: number }`
- `echo(message: string)` → `{ echo: string }`
- `multiply(x: number, y: number)` → `{ product: number }`

## NDJSON Format and Transport Improvements

### What is NDJSON?

NDJSON (Newline Delimited JSON) is a format where each line contains a valid JSON object, separated by newlines. This format is ideal for streaming data and is used by the stdio transport for reliable communication.

**Example NDJSON:**
```
{"jsonrpc":"2.0","id":1,"result":{"result":8}}
{"jsonrpc":"2.0","id":2,"result":{"echo":"Hello, MCP!"}}
{"jsonrpc":"2.0","id":3,"error":{"code":-32603,"message":"Tool execution failed"}}
```

### Transport Improvements

The @mcpkit/transport-stdio package now uses dedicated @mcpkit/ndjson utilities for improved reliability:

- **Enhanced reliability**: Uses dedicated NDJSON writer with proper stream handling and backpressure support
- **Consistent formatting**: Ensures all JSON-RPC responses are properly formatted as NDJSON (JSON + newline)
- **Better error handling**: Leverages NDJSON utilities' robust error handling for stream operations
- **Future-proof architecture**: Establishes foundation for potential future transport enhancements

All responses from the stdio transport are now formatted as NDJSON, ensuring consistent and reliable communication.

### NDJSON Examples

The examples directory includes several demonstrations of NDJSON utilities:

1. **ndjson-reader-example.ts**: Shows how to read NDJSON from files and streams
2. **ndjson-writer-example.ts**: Demonstrates writing NDJSON with various formatting options
3. **ndjson-stream-processing-example.ts**: Real-time stream processing and data transformation

### Integration with MCP Clients

This server can be used with any MCP client that supports stdio transport. The JSON-RPC protocol follows the MCP specification for tool execution, with all responses properly formatted as NDJSON.
