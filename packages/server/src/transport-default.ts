import type { Transport } from '@mcpkit/core';
import { createStdioTransport } from '@mcpkit/transport-stdio';

/**
 * @internal
 * Creates a default stdio transport for MCP servers.
 * This is the default transport used when no transport is explicitly provided.
 */
export function createDefaultStdIo(): Transport {
  return createStdioTransport();
}
