import { beforeEach, describe, expect, it } from 'vitest';
import { createMcpServer, schema, z } from './index';

describe('@mcpkit/server', () => {
  describe('createMcpServer', () => {
    it('should create a builder instance', () => {
      const builder = createMcpServer();
      expect(builder).toBeDefined();
      expect(typeof builder.tool).toBe('function');
      expect(typeof builder.prompt).toBe('function');
      expect(typeof builder.resource).toBe('function');
      expect(typeof builder.use).toBe('function');
      expect(typeof builder.build).toBe('function');
    });

    it('should support chainable API', () => {
      const builder = createMcpServer()
        .tool('test-tool', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => `processed: ${input}`,
        })
        .prompt('test-prompt', 'Hello {{name}}!')
        .resource('test-resource', 'file://test.txt');

      expect(builder).toBeDefined();
      expect(typeof builder.build).toBe('function');
    });
  });

  describe('Compilation and type safety test', () => {
    it('should compile and execute the example from requirements', async () => {
      const server = createMcpServer()
        .tool('add', {
          input: schema(z.object({ a: z.number(), b: z.number() })),
          output: schema(z.object({ result: z.number() })),
          async handler({ a, b }) {
            return { result: a + b };
          },
        })
        .prompt('greeting', 'Hello {{name}}')
        .resource('readme', 'file://README.md', { title: 'Project README' })
        .build();

      expect(server.registry).toBeDefined();
      expect(server.runtime).toBeDefined();

      const result = await server.runtime.executeTool('add', { a: 2, b: 3 });
      expect(result).toEqual({ result: 5 });
    });
  });

  describe('Duplicate name validation', () => {
    it('should throw error for duplicate tool names', () => {
      expect(() => {
        createMcpServer()
          .tool('duplicate', {
            input: schema(z.string()),
            output: schema(z.string()),
            handler: async (input) => input,
          })
          .tool('duplicate', {
            input: schema(z.number()),
            output: schema(z.number()),
            handler: async (input) => input,
          })
          .build();
      }).toThrow("tool with name 'duplicate' already exists in registry");
    });

    it('should throw error for duplicate prompt names', () => {
      expect(() => {
        createMcpServer()
          .prompt('duplicate', 'Template 1')
          .prompt('duplicate', 'Template 2')
          .build();
      }).toThrow("prompt with name 'duplicate' already exists in registry");
    });

    it('should throw error for duplicate resource names', () => {
      expect(() => {
        createMcpServer()
          .resource('duplicate', 'file://test1.txt')
          .resource('duplicate', 'file://test2.txt')
          .build();
      }).toThrow("resource with name 'duplicate' already exists in registry");
    });

    it('should not throw error for duplicate names across different types', () => {
      expect(() => {
        createMcpServer()
          .tool('duplicate', {
            input: schema(z.string()),
            output: schema(z.string()),
            handler: async (input) => input,
          })
          .prompt('duplicate', 'Template')
          .build();
      }).not.toThrow();
    });
  });

  describe('Runtime execution', () => {
    let server: ReturnType<ReturnType<typeof createMcpServer>['build']>;

    beforeEach(() => {
      server = createMcpServer()
        .tool('echo', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => `echo: ${input}`,
        })
        .tool('math', {
          input: schema(z.object({ x: z.number(), y: z.number() })),
          output: schema(z.object({ sum: z.number(), product: z.number() })),
          handler: async ({ x, y }) => ({ sum: x + y, product: x * y }),
        })
        .prompt('greeting', 'Hello {{name}}!', {
          params: schema(z.object({ name: z.string() })),
        })
        .resource('config', 'file://config.json', { title: 'Configuration' })
        .build();
    });

    it('should execute tools correctly', async () => {
      const echoResult = await server.runtime.executeTool('echo', 'test');
      expect(echoResult).toBe('echo: test');

      const mathResult = await server.runtime.executeTool('math', { x: 5, y: 3 });
      expect(mathResult).toEqual({ sum: 8, product: 15 });
    });

    it('should render prompts correctly', async () => {
      const result = await server.runtime.renderPrompt('greeting', { name: 'Alice' });
      expect(result).toBe('Hello Alice!');
    });

    it('should have registered entities in registry', () => {
      expect(server.registry.hasTool('echo')).toBe(true);
      expect(server.registry.hasTool('math')).toBe(true);
      expect(server.registry.hasPrompt('greeting')).toBe(true);
      expect(server.registry.hasResource('config')).toBe(true);

      expect(server.registry.getToolNames()).toContain('echo');
      expect(server.registry.getToolNames()).toContain('math');
      expect(server.registry.getPromptNames()).toContain('greeting');
      expect(server.registry.getResourceNames()).toContain('config');
    });
  });

  describe('Middleware no-op', () => {
    it('should accept middleware but not affect runtime behavior', async () => {
      const server = createMcpServer()
        .use('some-middleware')
        .use({ type: 'middleware', config: {} })
        .tool('test', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => `result: ${input}`,
        })
        .build();

      const result = await server.runtime.executeTool('test', 'input');
      expect(result).toBe('result: input');
    });
  });

  describe('Re-exports', () => {
    it('should re-export z and schema from @mcpkit/core', () => {
      expect(z).toBeDefined();
      expect(schema).toBeDefined();
      expect(typeof schema).toBe('function');

      const testSchema = schema(z.string());
      expect(testSchema.parse('test')).toBe('test');
      expect(() => testSchema.parse(123)).toThrow();
    });
  });
});
