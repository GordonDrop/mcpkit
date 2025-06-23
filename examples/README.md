# McpKit Examples

This directory contains examples demonstrating the usage of McpKit packages.

## Stdio Transport Example

### Files

- `stdio-server.ts` - A complete MCP server using stdio transport
- `test-client.ts` - A test client that communicates with the server via JSON-RPC
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

### Integration with MCP Clients

This server can be used with any MCP client that supports stdio transport. The JSON-RPC protocol follows the MCP specification for tool execution.
