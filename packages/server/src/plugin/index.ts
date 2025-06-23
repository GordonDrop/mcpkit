import type { McpServerBuilder } from '../index';

/**
 * Complete plugin contract for extending MCP server functionality.
 * Plugins can modify the server builder by adding tools, prompts, resources, or middleware.
 *
 * This is the complete plugin contract with no additional responsibilities.
 * Future lifecycle hooks (onInit, onClose) are explicitly out-of-scope for this implementation.
 */
export type Plugin<T = unknown> = (srv: McpServerBuilder, opts?: T) => void;
