import { createMcpServer, schema, z } from '@mcpkit/server';

export default createMcpServer().tool('mcp-test', {
  input: schema(z.string()),
  output: schema(z.string()),
  handler: async (input) => input,
});
