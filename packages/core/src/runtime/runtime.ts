import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import type { ExecutionCtx } from '../contracts/tool';
import {
  ExecutionFailure,
  InvalidInputError,
  PromptNotFoundError,
  ResourceNotFoundError,
  ToolNotFoundError,
} from './errors';
import type { Registry } from './registry';

export interface McpRuntime {
  executeTool<I, O>(name: string, input: unknown): Promise<O>;
  renderPrompt<P>(name: string, params: unknown): Promise<string>;
  getResource(name: string): Promise<string>;
}

export class DefaultMcpRuntime implements McpRuntime {
  constructor(
    private readonly registry: Registry,
    private readonly executionCtx: ExecutionCtx,
  ) {}

  async executeTool<I, O>(name: string, input: unknown): Promise<O> {
    console.log(`[runtime] Executing tool: ${name}`);

    const tool = this.registry.getTool(name);
    if (!tool) {
      console.error(`[tool:${name}] Tool not found`);
      throw new ToolNotFoundError(name);
    }

    try {
      const validatedInput = tool.input.parse(input) as I;
      console.log(`[tool:${name}] Input validated successfully`);

      const result = await tool.handler(validatedInput, this.executionCtx);
      console.log(`[tool:${name}] Execution completed successfully`);

      return result as O;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError' || error.message.includes('validation')) {
          console.error(`[tool:${name}] Invalid input`, error);
          throw new InvalidInputError(name, 'tool', error);
        }

        console.error(`[tool:${name}] Execution failed`, error);
        throw new ExecutionFailure(name, 'tool', error);
      }

      throw error;
    }
  }

  async renderPrompt<P>(name: string, params: unknown): Promise<string> {
    console.log(`[runtime] Rendering prompt: ${name}`);

    const prompt = this.registry.getPrompt(name);
    if (!prompt) {
      console.error(`[prompt:${name}] Prompt not found`);
      throw new PromptNotFoundError(name);
    }

    try {
      let validatedParams: P;
      if (prompt.params) {
        validatedParams = prompt.params.parse(params) as P;
        console.log(`[prompt:${name}] Parameters validated successfully`);
      } else {
        validatedParams = params as P;
      }

      const renderedText = this.renderTemplate(prompt.template, validatedParams);

      console.log(`[prompt:${name}] Rendering completed successfully`);
      return renderedText;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError' || error.message.includes('validation')) {
          console.error(`[prompt:${name}] Invalid parameters`, error);
          throw new InvalidInputError(name, 'prompt', error);
        }

        console.error(`[prompt:${name}] Rendering failed`, error);
        throw new ExecutionFailure(name, 'prompt', error);
      }

      throw error;
    }
  }

  async getResource(name: string): Promise<string> {
    console.log(`[runtime] Getting resource: ${name}`);

    const resource = this.registry.getResource(name);
    if (!resource) {
      console.error(`[resource:${name}] Resource not found`);
      throw new ResourceNotFoundError(name);
    }

    try {
      const url = new URL(resource.uri);
      if (!['file:', 'http:', 'https:'].includes(url.protocol)) {
        console.error(`[resource:${name}] Unsupported URI scheme: ${url.protocol}`);
        throw new ExecutionFailure(
          name,
          'resource',
          new Error(`Unsupported URI scheme: ${url.protocol}`),
        );
      }

      const content = await this.loadResource(resource.uri);

      console.log(`[resource:${name}] Resource loaded successfully`);
      return content;
    } catch (error) {
      if (error instanceof ExecutionFailure) {
        throw error;
      }

      if (error instanceof Error) {
        console.error(`[resource:${name}] Loading failed`, error);
        throw new ExecutionFailure(name, 'resource', error);
      }

      throw error;
    }
  }

  private renderTemplate(template: string, params: unknown): string {
    if (!params || typeof params !== 'object') {
      return template;
    }

    const paramObj = params as Record<string, unknown>;
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = paramObj[key];
      return value !== undefined ? String(value) : match;
    });
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
