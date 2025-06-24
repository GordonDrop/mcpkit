/**
 * Protocol bridge - provides backward-compatible type aliases and integrates with @mcpkit/protocol
 *
 * This module creates backward-compatible type aliases for existing McpKit types
 * while establishing @mcpkit/protocol as the single source of truth for protocol types.
 */

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
  InitializeRequest,
  InitializeResult,
  JSONRPCError,
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
  ListPromptsRequest,
  ListPromptsResult,
  ListResourcesRequest,
  ListResourcesResult,
  ListToolsRequest,
  ListToolsResult,
  Prompt,
  PromptArgument,
  PromptMessage,
  ReadResourceRequest,
  ReadResourceResult,
  Resource,
  ResourceContents,
  ResourceLink,
  ResourceTemplate,
  SchemaJSON,
  ServerCapabilities,
  TextContent,
  TextResourceContents,
  Tool,
  ToolAnnotations,
  UriTemplate,
} from '@mcpkit/protocol';

export { renderPrompt } from '@mcpkit/protocol';

import type {
  ContentBlock as SDKContentBlock,
  Prompt as SDKPrompt,
  Resource as SDKResource,
  TextContent as SDKTextContent,
  Tool as SDKTool,
} from '@mcpkit/protocol';

export type ContentItem = SDKTextContent | SDKContentBlock;
export type ToolCall = SDKTool;
export type PromptTemplate = SDKPrompt;

import type {
  Implementation as SDKImplementation,
  ServerCapabilities as SDKServerCapabilities,
} from '@mcpkit/protocol';

export interface Manifest {
  tools: SDKTool[];
  prompts: SDKPrompt[];
  resources: SDKResource[];
  capabilities: SDKServerCapabilities;
  implementation: SDKImplementation;
}

export { ManifestSchema, validateManifest } from '@mcpkit/protocol';
