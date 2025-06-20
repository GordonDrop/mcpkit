import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { PromptSpec } from '../contracts/prompt';
import type { ResourceSpec } from '../contracts/resource';
import type { ExecutionCtx, ToolSpec } from '../contracts/tool';
import { s } from '../schema/zod';
import {
  ExecutionFailure,
  InvalidInputError,
  PromptNotFoundError,
  ResourceNotFoundError,
  ToolNotFoundError,
} from './errors';
import { Registry } from './registry';
import { createMcpRuntime, DefaultMcpRuntime } from './runtime';

describe('McpRuntime', () => {
  let registry: Registry;
  let runtime: DefaultMcpRuntime;
  let mockExecutionCtx: ExecutionCtx;

  beforeEach(() => {
    registry = new Registry();
    mockExecutionCtx = {
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
      version: '1.0.0',
    };
    runtime = new DefaultMcpRuntime(registry, mockExecutionCtx);
  });

  describe('Tool execution', () => {
    const mockTool: ToolSpec<string, string> = {
      name: 'echo-tool',
      description: 'Echoes the input',
      input: s(z.string()),
      output: s(z.string()),
      handler: async (input) => `echo: ${input}`,
    };

    beforeEach(() => {
      registry.addTool(mockTool);
    });

    it('should execute tool successfully with valid input', async () => {
      const result = await runtime.executeTool('echo-tool', 'hello');

      expect(result).toBe('echo: hello');
    });

    it('should throw ToolNotFoundError for non-existent tool', async () => {
      await expect(runtime.executeTool('non-existent', 'input')).rejects.toThrow(ToolNotFoundError);

      await expect(runtime.executeTool('non-existent', 'input')).rejects.toThrow(
        "Tool 'non-existent' not found in registry",
      );
    });

    it('should throw InvalidInputError for invalid input', async () => {
      await expect(runtime.executeTool('echo-tool', 123)).rejects.toThrow(InvalidInputError);
    });

    it('should throw ExecutionFailure when tool handler fails', async () => {
      const failingTool: ToolSpec = {
        name: 'failing-tool',
        input: s(z.string()),
        output: s(z.string()),
        handler: async () => {
          throw new Error('Tool execution failed');
        },
      };

      registry.addTool(failingTool);

      await expect(runtime.executeTool('failing-tool', 'input')).rejects.toThrow(ExecutionFailure);

      await expect(runtime.executeTool('failing-tool', 'input')).rejects.toThrow(
        "Execution failed for tool 'failing-tool': Tool execution failed",
      );
    });

    it('should pass execution context to tool handler', async () => {
      const contextTool: ToolSpec = {
        name: 'context-tool',
        input: s(z.string()),
        output: s(z.string()),
        handler: async (_input, ctx) => {
          expect(ctx).toBe(mockExecutionCtx);
          return `version: ${ctx.version}`;
        },
      };

      registry.addTool(contextTool);

      const result = await runtime.executeTool('context-tool', 'test');
      expect(result).toBe('version: 1.0.0');
    });
  });

  describe('Prompt rendering', () => {
    const mockPrompt: PromptSpec<{ name: string }> = {
      name: 'greeting-prompt',
      template: 'Hello {{name}}!',
      params: s(z.object({ name: z.string() })),
    };

    beforeEach(() => {
      registry.addPrompt(mockPrompt);
    });

    it('should render prompt successfully with valid parameters', async () => {
      const result = await runtime.renderPrompt('greeting-prompt', {
        name: 'Alice',
      });

      expect(result).toBe('Hello Alice!');
    });

    it('should throw PromptNotFoundError for non-existent prompt', async () => {
      await expect(runtime.renderPrompt('non-existent', {})).rejects.toThrow(PromptNotFoundError);

      await expect(runtime.renderPrompt('non-existent', {})).rejects.toThrow(
        "Prompt 'non-existent' not found in registry",
      );
    });

    it('should throw InvalidInputError for invalid parameters', async () => {
      await expect(runtime.renderPrompt('greeting-prompt', { name: 123 })).rejects.toThrow(
        InvalidInputError,
      );
    });

    it('should render prompt without schema validation when no schema provided', async () => {
      const noSchemaPrompt: PromptSpec = {
        name: 'no-schema-prompt',
        template: 'Hello {{name}}!',
      };

      registry.addPrompt(noSchemaPrompt);

      const result = await runtime.renderPrompt('no-schema-prompt', {
        name: 'Bob',
      });
      expect(result).toBe('Hello Bob!');
    });

    it('should handle template with missing variables', async () => {
      const result = await runtime.renderPrompt('greeting-prompt', {
        name: 'Dave',
      });
      expect(result).toBe('Hello Dave!');

      // Test with extra variables (should be ignored)
      const result2 = await runtime.renderPrompt('greeting-prompt', {
        name: 'Eve',
        extra: 'ignored',
      });
      expect(result2).toBe('Hello Eve!');
    });
  });

  describe('Resource access', () => {
    it('should throw ResourceNotFoundError for non-existent resource', async () => {
      await expect(runtime.getResource('non-existent')).rejects.toThrow(ResourceNotFoundError);

      await expect(runtime.getResource('non-existent')).rejects.toThrow(
        "Resource 'non-existent' not found in registry",
      );
    });

    it('should throw ExecutionFailure for unsupported URI schemes', async () => {
      const unsupportedResource: ResourceSpec = {
        name: 'unsupported-resource',
        uri: 'ftp://example.com/file.txt',
      };

      registry.addResource(unsupportedResource);

      await expect(runtime.getResource('unsupported-resource')).rejects.toThrow(ExecutionFailure);
    });

    // Note: Testing file:// and http:// schemes would require mocking fs and fetch
    // These are integration tests that would be better suited for a separate test suite
  });

  describe('createMcpRuntime factory function', () => {
    it('should create a runtime instance', () => {
      const runtime = createMcpRuntime(registry, mockExecutionCtx);

      expect(runtime).toBeInstanceOf(DefaultMcpRuntime);
    });
  });
});
