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

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

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

    it('should re-throw non-Error objects from tool handlers', async () => {
      const stringThrowingTool: ToolSpec = {
        name: 'string-throwing-tool',
        input: s(z.string()),
        output: s(z.string()),
        handler: async () => {
          throw 'string error';
        },
      };

      registry.addTool(stringThrowingTool);

      await expect(runtime.executeTool('string-throwing-tool', 'input')).rejects.toBe(
        'string error',
      );
    });

    it('should re-throw non-Error numbers from tool handlers', async () => {
      const numberThrowingTool: ToolSpec = {
        name: 'number-throwing-tool',
        input: s(z.string()),
        output: s(z.string()),
        handler: async () => {
          throw 42;
        },
      };

      registry.addTool(numberThrowingTool);

      await expect(runtime.executeTool('number-throwing-tool', 'input')).rejects.toBe(42);
    });

    it('should re-throw non-Error objects from tool handlers', async () => {
      const objectThrowingTool: ToolSpec = {
        name: 'object-throwing-tool',
        input: s(z.string()),
        output: s(z.string()),
        handler: async () => {
          throw { code: 'CUSTOM_ERROR', message: 'Custom error object' };
        },
      };

      registry.addTool(objectThrowingTool);

      await expect(runtime.executeTool('object-throwing-tool', 'input')).rejects.toEqual({
        code: 'CUSTOM_ERROR',
        message: 'Custom error object',
      });
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

    it('should handle template rendering with non-object params', async () => {
      const simplePrompt: PromptSpec = {
        name: 'simple-prompt',
        template: 'Hello {{name}}!',
      };

      registry.addPrompt(simplePrompt);

      const result1 = await runtime.renderPrompt('simple-prompt', null);
      expect(result1).toBe('Hello {{name}}!');

      const result2 = await runtime.renderPrompt('simple-prompt', undefined);
      expect(result2).toBe('Hello {{name}}!');

      const result3 = await runtime.renderPrompt('simple-prompt', 'not an object');
      expect(result3).toBe('Hello {{name}}!');
    });

    it('should re-throw non-Error objects from prompt parameter validation', async () => {
      const mockSchema = {
        parse: vi.fn().mockImplementation(() => {
          throw 'validation string error';
        }),
      } as unknown as ReturnType<typeof s>;

      const stringThrowingPrompt: PromptSpec = {
        name: 'string-throwing-prompt',
        template: 'Hello {{name}}!',
        params: mockSchema,
      };

      registry.addPrompt(stringThrowingPrompt);

      await expect(runtime.renderPrompt('string-throwing-prompt', { name: 'test' })).rejects.toBe(
        'validation string error',
      );
    });

    it('should re-throw non-Error numbers from prompt operations', async () => {
      const mockSchema = {
        parse: vi.fn().mockImplementation(() => {
          throw 404;
        }),
      } as unknown as ReturnType<typeof s>;

      const numberThrowingPrompt: PromptSpec = {
        name: 'number-throwing-prompt',
        template: 'Hello {{name}}!',
        params: mockSchema,
      };

      registry.addPrompt(numberThrowingPrompt);

      await expect(runtime.renderPrompt('number-throwing-prompt', { name: 'test' })).rejects.toBe(
        404,
      );
    });

    it('should re-throw non-Error objects from prompt operations', async () => {
      const customError = { type: 'VALIDATION_ERROR', details: 'Custom validation failed' };
      const mockSchema = {
        parse: vi.fn().mockImplementation(() => {
          throw customError;
        }),
      } as unknown as ReturnType<typeof s>;

      const objectThrowingPrompt: PromptSpec = {
        name: 'object-throwing-prompt',
        template: 'Hello {{name}}!',
        params: mockSchema,
      };

      registry.addPrompt(objectThrowingPrompt);

      await expect(
        runtime.renderPrompt('object-throwing-prompt', { name: 'test' }),
      ).rejects.toEqual(customError);
    });

    it('should handle Error objects that are not validation errors in prompt rendering', async () => {
      const mockSchema = {
        parse: vi.fn().mockImplementation(() => {
          throw new Error('Template rendering failed');
        }),
      } as unknown as ReturnType<typeof s>;

      const errorThrowingPrompt: PromptSpec = {
        name: 'error-throwing-prompt',
        template: 'Hello {{name}}!',
        params: mockSchema,
      };

      registry.addPrompt(errorThrowingPrompt);

      await expect(runtime.renderPrompt('error-throwing-prompt', { name: 'test' })).rejects.toThrow(
        ExecutionFailure,
      );
      await expect(runtime.renderPrompt('error-throwing-prompt', { name: 'test' })).rejects.toThrow(
        "Execution failed for prompt 'error-throwing-prompt': Template rendering failed",
      );
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

    it('should load http:// resources', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('http content'),
      });
      global.fetch = mockFetch;

      const httpResource: ResourceSpec = {
        name: 'http-resource',
        title: 'HTTP Resource',
        uri: 'http://example.com/data.txt',
      };

      registry.addResource(httpResource);

      const result = await runtime.getResource('http-resource');
      expect(result).toBe('http content');
      expect(mockFetch).toHaveBeenCalledWith('http://example.com/data.txt');
    });

    it('should load https:// resources', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('https content'),
      });
      global.fetch = mockFetch;

      const httpsResource: ResourceSpec = {
        name: 'https-resource',
        title: 'HTTPS Resource',
        uri: 'https://example.com/data.txt',
      };

      registry.addResource(httpsResource);

      const result = await runtime.getResource('https-resource');
      expect(result).toBe('https content');
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/data.txt');
    });

    it('should handle HTTP errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      global.fetch = mockFetch;

      const httpResource: ResourceSpec = {
        name: 'http-error-resource',
        title: 'HTTP Error Resource',
        uri: 'http://example.com/notfound.txt',
      };

      registry.addResource(httpResource);

      await expect(runtime.getResource('http-error-resource')).rejects.toThrow(
        'HTTP 404: Not Found',
      );
    });

    it('should load file:// resources successfully', async () => {
      const { readFile } = await import('node:fs/promises');
      const mockReadFile = vi.mocked(readFile);
      mockReadFile.mockResolvedValue('file content');

      const fileResource: ResourceSpec = {
        name: 'file-resource',
        title: 'File Resource',
        uri: 'file:///path/to/file.txt',
      };

      registry.addResource(fileResource);

      const result = await runtime.getResource('file-resource');
      expect(result).toBe('file content');
      expect(mockReadFile).toHaveBeenCalledWith(new URL('file:///path/to/file.txt'), 'utf-8');
    });

    it('should handle file:// resource loading errors', async () => {
      const { readFile } = await import('node:fs/promises');
      const mockReadFile = vi.mocked(readFile);
      mockReadFile.mockRejectedValue(new Error('File not found'));

      const fileResource: ResourceSpec = {
        name: 'file-error-resource',
        title: 'File Error Resource',
        uri: 'file:///nonexistent/file.txt',
      };

      registry.addResource(fileResource);

      await expect(runtime.getResource('file-error-resource')).rejects.toThrow(ExecutionFailure);
      await expect(runtime.getResource('file-error-resource')).rejects.toThrow(
        "Execution failed for resource 'file-error-resource': File not found",
      );
    });

    it('should test various unsupported URI schemes for comprehensive coverage', async () => {
      const schemes = ['ftp', 'sftp', 'ssh', 'ldap', 'custom'];

      for (const scheme of schemes) {
        const unsupportedResource: ResourceSpec = {
          name: `${scheme}-resource`,
          uri: `${scheme}://example.com/file.txt`,
        };

        registry.addResource(unsupportedResource);

        await expect(runtime.getResource(`${scheme}-resource`)).rejects.toThrow(ExecutionFailure);
        await expect(runtime.getResource(`${scheme}-resource`)).rejects.toThrow(
          `Unsupported URI scheme: ${scheme}:`,
        );
      }
    });

    it('should re-throw non-Error objects from resource loading operations', async () => {
      const mockFetch = vi.fn().mockImplementation(() => {
        throw 'network string error';
      });
      global.fetch = mockFetch;

      const stringThrowingResource: ResourceSpec = {
        name: 'string-throwing-resource',
        uri: 'http://example.com/data.txt',
      };

      registry.addResource(stringThrowingResource);

      await expect(runtime.getResource('string-throwing-resource')).rejects.toBe(
        'network string error',
      );
    });

    it('should re-throw non-Error numbers from resource loading operations', async () => {
      const mockFetch = vi.fn().mockImplementation(() => {
        throw 500;
      });
      global.fetch = mockFetch;

      const numberThrowingResource: ResourceSpec = {
        name: 'number-throwing-resource',
        uri: 'http://example.com/data.txt',
      };

      registry.addResource(numberThrowingResource);

      await expect(runtime.getResource('number-throwing-resource')).rejects.toBe(500);
    });

    it('should re-throw non-Error objects from resource loading operations', async () => {
      const customError = { code: 'NETWORK_ERROR', message: 'Custom network error' };
      const mockFetch = vi.fn().mockImplementation(() => {
        throw customError;
      });
      global.fetch = mockFetch;

      const objectThrowingResource: ResourceSpec = {
        name: 'object-throwing-resource',
        uri: 'http://example.com/data.txt',
      };

      registry.addResource(objectThrowingResource);

      await expect(runtime.getResource('object-throwing-resource')).rejects.toEqual(customError);
    });
  });

  describe('createMcpRuntime factory function', () => {
    it('should create a runtime instance', () => {
      const runtime = createMcpRuntime(registry, mockExecutionCtx);

      expect(runtime).toBeInstanceOf(DefaultMcpRuntime);
    });
  });
});
