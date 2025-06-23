import type { Transport } from '@mcpkit/core';
import { createStdioTransport } from '@mcpkit/transport-stdio';

/**
 * @internal
 * Creates a default stdio transport for MCP servers.
 */
export function createDefaultStdIo(): Transport {
  return createStdioTransport();
}
