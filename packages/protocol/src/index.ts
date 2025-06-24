/**
 * @mcpkit/protocol - Protocol bridge layer for MCP TypeScript SDK integration
 *
 * This package wraps the official MCP TypeScript SDK and provides a single source
 * of truth for protocol types while maintaining backward compatibility.
 */

// Re-export canonical MCP protocol types from the official SDK
export type {
  AudioContent,
  BlobResourceContents,
  CallToolRequest,
  CallToolResult,
  ClientCapabilities,
  ContentBlock,
  EmbeddedResource,
  GetPromptRequest,
  GetPromptResult,
  ImageContent,
  Implementation,
  // Request/Response types
  InitializeRequest,
  InitializeResult,
  JSONRPCError,
  // JSON-RPC types
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
  ListPromptsRequest,
  ListPromptsResult,
  ListResourcesRequest,
  ListResourcesResult,
  ListToolsRequest,
  ListToolsResult,
  // Prompt types
  Prompt,
  PromptArgument,
  PromptMessage,
  ReadResourceRequest,
  ReadResourceResult,
  // Resource types
  Resource,
  ResourceContents,
  ResourceLink,
  ResourceTemplate,
  // Capabilities and implementation
  ServerCapabilities,
  // Core content types
  TextContent,
  TextResourceContents,
  // Tool types
  Tool,
  ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js';

// Create SchemaJSON type alias for schema adapter generics
export type SchemaJSON = Record<string, unknown>;

// Re-export URI template utilities
export { UriTemplate } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';

// Create a simple renderPrompt utility that mimics the old template rendering
export function renderPrompt(template: string): (params: Record<string, unknown>) => string {
  return (params: Record<string, unknown>) => {
    if (!params || typeof params !== 'object') {
      return template;
    }

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = params[key];
      return value !== undefined ? String(value) : match;
    });
  };
}

// Create a Manifest type that aggregates the protocol information
export interface Manifest {
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
  }>;
  prompts: Array<{
    name: string;
    description: string;
    arguments?: Array<{
      name: string;
      description: string;
      required: boolean;
    }>;
  }>;
  resources: Array<{
    name: string;
    uri: string;
    description: string;
  }>;
  capabilities: {
    tools: Record<string, unknown>;
    prompts: Record<string, unknown>;
    resources: Record<string, unknown>;
  };
  implementation: {
    name: string;
    version: string;
  };
}

// Validation utility for manifests (simple validation since SDK doesn't provide one)
export function validateManifest(manifest: Manifest): boolean {
  try {
    // Basic validation - check required fields exist
    if (!manifest || typeof manifest !== 'object') return false;
    if (!Array.isArray(manifest.tools)) return false;
    if (!Array.isArray(manifest.prompts)) return false;
    if (!Array.isArray(manifest.resources)) return false;
    if (!manifest.capabilities || typeof manifest.capabilities !== 'object') return false;
    if (!manifest.implementation || typeof manifest.implementation !== 'object') return false;

    // Validate implementation has required fields
    if (!manifest.implementation.name || typeof manifest.implementation.name !== 'string')
      return false;
    if (!manifest.implementation.version || typeof manifest.implementation.version !== 'string')
      return false;

    return true;
  } catch {
    return false;
  }
}
