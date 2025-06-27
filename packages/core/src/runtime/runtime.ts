import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import type { ExecutionCtx } from '../contracts/tool';
import type { Manifest } from '../protocol-bridge';
import { renderPrompt } from '../protocol-bridge';
import {
  ExecutionFailure,
  InvalidInputError,
  PromptNotFoundError,
  ResourceNotFoundError,
  ToolNotFoundError,
} from './errors';
import type { Registry } from './registry';

export interface McpRuntime {
  executeTool<_I, O>(name: string, input: unknown): Promise<O>;
  renderPrompt<_P>(name: string, params: unknown): Promise<string>;
  getResource(name: string): Promise<string>;
  getManifest?(): Manifest | undefined;
  setManifest?(manifest: Manifest): void;
}

export class DefaultMcpRuntime implements McpRuntime {
  private manifest?: Manifest;

  constructor(
    private readonly registry: Registry,
    private readonly executionCtx: ExecutionCtx,
  ) {}

  setManifest(manifest: Manifest): void {
    this.manifest = manifest;
  }

  getManifest(): Manifest | undefined {
    return this.manifest;
  }

  async executeTool<I, O>(name: string, input: unknown): Promise<O> {
    const { logger } = this.executionCtx;
    logger.info({ tool: name }, '[runtime] Executing tool');

    const tool = this.registry.getTool(name);
    if (!tool) {
      logger.error({ tool: name }, 'Tool not found');
      throw new ToolNotFoundError(name);
    }

    try {
      const validatedInput = tool.input.parse(input) as I;
      logger.info({ tool: name }, 'Input validated successfully');

      const result = await tool.handler(validatedInput, this.executionCtx);
      logger.info({ tool: name }, 'Execution completed successfully');

      return result as O;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError' || error.message.includes('validation')) {
          logger.error({ tool: name, error: error.message }, 'Invalid input');
          throw new InvalidInputError(name, 'tool', error);
        }

        logger.error({ tool: name, error: error.message }, 'Execution failed');
        throw new ExecutionFailure(name, 'tool', error);
      }

      throw error;
    }
  }

  async renderPrompt<P>(name: string, params: unknown): Promise<string> {
    const { logger } = this.executionCtx;
    logger.info({ prompt: name }, '[runtime] Rendering prompt');

    const prompt = this.registry.getPrompt(name);
    if (!prompt) {
      logger.error({ prompt: name }, 'Prompt not found');
      throw new PromptNotFoundError(name);
    }

    try {
      let validatedParams: P;
      if (prompt.params) {
        validatedParams = prompt.params.parse(params) as P;
        logger.info({ prompt: name }, 'Parameters validated successfully');
      } else {
        validatedParams = params as P;
      }

      const templateRenderer = renderPrompt(prompt.template);
      const renderedText = templateRenderer(validatedParams as Record<string, unknown>);

      logger.info({ prompt: name }, 'Rendering completed successfully');
      return renderedText;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError' || error.message.includes('validation')) {
          logger.error({ prompt: name, error: error.message }, 'Invalid parameters');
          throw new InvalidInputError(name, 'prompt', error);
        }

        logger.error({ prompt: name, error: error.message }, 'Rendering failed');
        throw new ExecutionFailure(name, 'prompt', error);
      }

      throw error;
    }
  }

  async getResource(name: string): Promise<string> {
    const { logger } = this.executionCtx;
    logger.info({ resource: name }, '[runtime] Getting resource');

    const resource = this.registry.getResource(name);
    if (!resource) {
      logger.error({ resource: name }, 'Resource not found');
      throw new ResourceNotFoundError(name);
    }

    try {
      const url = new URL(resource.uri);
      if (!['file:', 'http:', 'https:'].includes(url.protocol)) {
        logger.error({ resource: name, protocol: url.protocol }, 'Unsupported URI scheme');
        throw new ExecutionFailure(
          name,
          'resource',
          new Error(`Unsupported URI scheme: ${url.protocol}`),
        );
      }

      const content = await this.loadResource(resource.uri);

      logger.info({ resource: name }, 'Resource loaded successfully');
      return content;
    } catch (error) {
      if (error instanceof ExecutionFailure) {
        throw error;
      }

      if (error instanceof Error) {
        logger.error({ resource: name, error: error.message }, 'Loading failed');
        throw new ExecutionFailure(name, 'resource', error);
      }

      throw error;
    }
  }

  private async loadResource(uri: string): Promise<string> {
    const url = new URL(uri);

    switch (url.protocol) {
      case 'file:': {
        const content = await readFile(url, 'utf-8');
        return content;
      }

      case 'http:':
      case 'https:': {
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.text();
      }

      default:
        throw new Error(`Unsupported URI scheme: ${url.protocol}`);
    }
  }
}

export function createMcpRuntime(registry: Registry, executionCtx: ExecutionCtx): McpRuntime {
  return new DefaultMcpRuntime(registry, executionCtx);
}
