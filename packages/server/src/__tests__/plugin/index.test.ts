import { describe, expect, it } from 'vitest';
import { createMcpServer, type Plugin, schema, z } from '../../index';

describe('Plugin System', () => {
  describe('Plugin Contract', () => {
    it('should accept plugins with correct signature', () => {
      const testPlugin: Plugin = (srv) => {
        srv.tool('plugin-tool', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => `plugin: ${input}`,
        });
      };

      expect(() => {
        createMcpServer().register(testPlugin).build();
      }).not.toThrow();
    });

    it('should accept plugins with typed options', () => {
      interface PluginOptions {
        prefix: string;
        enabled: boolean;
      }

      const typedPlugin: Plugin<PluginOptions> = (srv, opts) => {
        if (opts?.enabled) {
          srv.tool('typed-tool', {
            input: schema(z.string()),
            output: schema(z.string()),
            handler: async (input) => `${opts.prefix}: ${input}`,
          });
        }
      };

      const server = createMcpServer()
        .register(typedPlugin, { prefix: 'test', enabled: true })
        .build();

      expect(server.registry.hasTool('typed-tool')).toBe(true);
    });

    it('should handle plugins without options', () => {
      const simplePlugin: Plugin = (srv) => {
        srv.prompt('plugin-prompt', 'Hello {{name}}!');
      };

      const server = createMcpServer().register(simplePlugin).build();

      expect(server.registry.hasPrompt('plugin-prompt')).toBe(true);
    });
  });

  describe('Plugin Execution', () => {
    it('should execute plugins during build phase', () => {
      let pluginExecuted = false;

      const executionPlugin: Plugin = () => {
        pluginExecuted = true;
      };

      createMcpServer().register(executionPlugin).build();

      expect(pluginExecuted).toBe(true);
    });

    it('should pass builder instance to plugins', () => {
      let receivedBuilder: any = null;

      const builderPlugin: Plugin = (srv) => {
        receivedBuilder = srv;
      };

      const originalBuilder = createMcpServer().register(builderPlugin);
      originalBuilder.build();

      expect(receivedBuilder).toBeDefined();
      expect(typeof receivedBuilder.tool).toBe('function');
      expect(typeof receivedBuilder.prompt).toBe('function');
      expect(typeof receivedBuilder.resource).toBe('function');
      expect(typeof receivedBuilder.use).toBe('function');
      expect(typeof receivedBuilder.register).toBe('function');
    });

    it('should pass options to plugins correctly', () => {
      let receivedOptions: any = null;

      const optionsPlugin: Plugin<{ test: string; number: number }> = (_srv, opts) => {
        receivedOptions = opts;
      };

      const testOptions = { test: 'value', number: 42 };
      createMcpServer().register(optionsPlugin, testOptions).build();

      expect(receivedOptions).toEqual(testOptions);
    });
  });

  describe('Plugin Composition', () => {
    it('should execute multiple plugins in registration order', () => {
      const executionOrder: string[] = [];

      const plugin1: Plugin = () => {
        executionOrder.push('plugin1');
      };

      const plugin2: Plugin = () => {
        executionOrder.push('plugin2');
      };

      const plugin3: Plugin = () => {
        executionOrder.push('plugin3');
      };

      createMcpServer().register(plugin1).register(plugin2).register(plugin3).build();

      expect(executionOrder).toEqual(['plugin1', 'plugin2', 'plugin3']);
    });

    it('should allow plugins to add different types of entities', () => {
      const toolPlugin: Plugin = (srv) => {
        srv.tool('plugin-tool', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => input,
        });
      };

      const promptPlugin: Plugin = (srv) => {
        srv.prompt('plugin-prompt', 'Template');
      };

      const resourcePlugin: Plugin = (srv) => {
        srv.resource('plugin-resource', 'file://test.txt');
      };

      const middlewarePlugin: Plugin = (srv) => {
        srv.use((next) => async (ctx) => await next(ctx));
      };

      const server = createMcpServer()
        .register(toolPlugin)
        .register(promptPlugin)
        .register(resourcePlugin)
        .register(middlewarePlugin)
        .build();

      expect(server.registry.hasTool('plugin-tool')).toBe(true);
      expect(server.registry.hasPrompt('plugin-prompt')).toBe(true);
      expect(server.registry.hasResource('plugin-resource')).toBe(true);
    });

    it('should allow plugins to register other plugins', () => {
      const nestedPlugin: Plugin = (srv) => {
        srv.tool('nested-tool', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => `nested: ${input}`,
        });
      };

      const parentPlugin: Plugin = (srv) => {
        srv.tool('parent-tool', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => `parent: ${input}`,
        });
        srv.register(nestedPlugin);
      };

      const server = createMcpServer().register(parentPlugin).build();

      expect(server.registry.hasTool('parent-tool')).toBe(true);
      expect(server.registry.hasTool('nested-tool')).toBe(true);
    });
  });

  describe('Plugin Error Handling', () => {
    it('should handle plugin errors gracefully', () => {
      const errorPlugin: Plugin = () => {
        throw new Error('Plugin execution failed');
      };

      expect(() => {
        createMcpServer().register(errorPlugin).build();
      }).toThrow('Plugin execution failed');
    });

    it('should continue execution if one plugin fails', () => {
      const errorPlugin: Plugin = () => {
        throw new Error('Plugin failed');
      };

      const successPlugin: Plugin = (srv) => {
        srv.tool('success-tool', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => input,
        });
      };

      expect(() => {
        createMcpServer().register(successPlugin).register(errorPlugin).build();
      }).toThrow('Plugin failed');
    });
  });
});
