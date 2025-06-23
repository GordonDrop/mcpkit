import { LifecycleError } from '@mcpkit/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMcpServer, type Middleware, type Plugin, schema, z } from './index';

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

  describe('Middleware integration', () => {
    it('should accept middleware and integrate with runtime', async () => {
      const testMiddleware: Middleware = (next) => async (ctx) => {
        const result = await next(ctx);
        return result;
      };

      const server = createMcpServer()
        .use(testMiddleware)
        .tool('test', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => `result: ${input}`,
        })
        .build();

      const result = await server.runtime.executeTool('test', 'input');
      expect(result).toBe('result: input');
      expect(server.invoke).toBeDefined();
      expect(typeof server.invoke).toBe('function');
    });

    it('should execute operations through the invoke function', async () => {
      const server = createMcpServer()
        .tool('test-tool', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => `processed: ${input}`,
        })
        .build();

      const result = await server.invoke({
        type: 'tool',
        name: 'test-tool',
        input: 'hello',
        meta: { start: BigInt(Date.now()) },
      });

      expect(result).toEqual({ content: 'processed: hello' });
    });

    it('should handle errors through the error wrapper middleware', async () => {
      const server = createMcpServer()
        .tool('failing-tool', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async () => {
            throw new Error('Tool execution failed');
          },
        })
        .build();

      const result = await server.invoke({
        type: 'tool',
        name: 'failing-tool',
        input: 'test',
        meta: { start: BigInt(Date.now()) },
      });

      expect(result.isError).toBe(true);
      expect(result.content).toBeInstanceOf(Error);
      expect((result.content as Error).message).toContain('Tool execution failed');
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

    it('should re-export middleware system types', () => {
      // Test that types are available for import (compilation test)
      const testMiddleware: Middleware = (next) => async (ctx) => {
        return await next(ctx);
      };

      const testPlugin: Plugin<{ message: string }> = (srv, opts) => {
        if (opts?.message) {
          srv.tool('plugin-tool', {
            input: schema(z.string()),
            output: schema(z.string()),
            handler: async (input) => `${opts.message}: ${input}`,
          });
        }
      };

      expect(typeof testMiddleware).toBe('function');
      expect(typeof testPlugin).toBe('function');
    });

    it('should support plugin registration with re-exported types', () => {
      const testPlugin: Plugin<{ prefix: string }> = (srv, opts) => {
        srv.tool('plugin-added-tool', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => `${opts?.prefix || 'default'}: ${input}`,
        });
      };

      const server = createMcpServer().register(testPlugin, { prefix: 'test' }).build();

      expect(server.registry.hasTool('plugin-added-tool')).toBe(true);
    });

    it('should demonstrate complete middleware system integration', async () => {
      // Create a logging middleware
      const loggingMiddleware: Middleware = (next) => async (ctx) => {
        const start = Date.now();
        const result = await next(ctx);
        const duration = Date.now() - start;
        console.log(`[${ctx.type}] ${ctx.name} executed in ${duration}ms`);
        return result;
      };

      // Create a plugin that adds tools
      const mathPlugin: Plugin<{ operations: string[] }> = (srv, opts) => {
        if (opts?.operations.includes('multiply')) {
          srv.tool('multiply', {
            input: schema(z.object({ a: z.number(), b: z.number() })),
            output: schema(z.object({ result: z.number() })),
            handler: async ({ a, b }) => ({ result: a * b }),
          });
        }
      };

      // Build server with middleware and plugin
      const server = createMcpServer()
        .use(loggingMiddleware)
        .register(mathPlugin, { operations: ['multiply'] })
        .tool('add', {
          input: schema(z.object({ a: z.number(), b: z.number() })),
          output: schema(z.object({ result: z.number() })),
          handler: async ({ a, b }) => ({ result: a + b }),
        })
        .build();

      // Test that everything works together
      const addResult = await server.invoke({
        type: 'tool',
        name: 'add',
        input: { a: 2, b: 3 },
        meta: { start: BigInt(Date.now()) },
      });

      const multiplyResult = await server.invoke({
        type: 'tool',
        name: 'multiply',
        input: { a: 4, b: 5 },
        meta: { start: BigInt(Date.now()) },
      });

      expect(addResult.content).toEqual({ result: 5 });
      expect(multiplyResult.content).toEqual({ result: 20 });
      expect(server.registry.hasTool('add')).toBe(true);
      expect(server.registry.hasTool('multiply')).toBe(true);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle invalid middleware types', () => {
      expect(() => {
        createMcpServer()
          // @ts-expect-error - Testing runtime validation
          .use('not-a-function')
          .build();
      }).toThrow('Middleware must be a function');

      expect(() => {
        createMcpServer()
          // @ts-expect-error - Testing runtime validation
          .use(null)
          .build();
      }).toThrow('Middleware must be a function');

      expect(() => {
        createMcpServer()
          // @ts-expect-error - Testing runtime validation
          .use({})
          .build();
      }).toThrow('Middleware must be a function');
    });

    it('should handle middleware that throws during composition', () => {
      const throwingMiddleware: Middleware = () => {
        throw new Error('Middleware composition error');
      };

      expect(() => {
        createMcpServer()
          .use(throwingMiddleware)
          .tool('test', {
            input: schema(z.string()),
            output: schema(z.string()),
            handler: async (input) => input,
          })
          .build();
      }).toThrow('Middleware composition error');
    });

    it('should handle unknown operation types gracefully', async () => {
      const server = createMcpServer().build();

      const result = await server.invoke({
        // @ts-expect-error - Testing runtime validation
        type: 'unknown-type',
        name: 'test',
        input: 'test',
        meta: { start: BigInt(Date.now()) },
      });

      expect(result.isError).toBe(true);
      expect(result.content).toBeInstanceOf(Error);
      expect((result.content as Error).message).toContain('Unknown operation type');
    });

    it('should handle very large middleware chains', async () => {
      const server = createMcpServer();

      // Add 100 middleware functions
      for (let i = 0; i < 100; i++) {
        server.use((next) => async (ctx) => {
          const result = await next(ctx);
          return {
            content: `m${i}[${result.content}]`,
          };
        });
      }

      server.tool('test', {
        input: schema(z.string()),
        output: schema(z.string()),
        handler: async (input) => `core-${input}`,
      });

      const built = server.build();
      const result = await built.invoke({
        type: 'tool',
        name: 'test',
        input: 'test',
        meta: { start: BigInt(Date.now()) },
      });

      expect(result.content).toContain('core-test');
      expect(result.content).toContain('m0[');
      expect(result.content).toContain('m99[');
    });

    it('should handle concurrent middleware execution', async () => {
      const server = createMcpServer()
        .use((next) => async (ctx) => {
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
          const result = await next(ctx);
          return { content: `concurrent-${result.content}` };
        })
        .tool('test', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => `result-${input}`,
        })
        .build();

      const promises = Array.from({ length: 10 }, (_, i) =>
        server.invoke({
          type: 'tool',
          name: 'test',
          input: `input-${i}`,
          meta: { start: BigInt(Date.now()) },
        }),
      );

      const results = await Promise.all(promises);

      results.forEach((result, i) => {
        expect(result.content).toBe(`concurrent-result-input-${i}`);
      });
    });
  });

  describe('Lifecycle Management', () => {
    describe('Duplicate listen() prevention', () => {
      it('should throw LifecycleError when listen() is called twice', async () => {
        const server = createMcpServer().tool('test', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => input,
        });

        const abortController = new AbortController();

        // Start first listen() call
        const firstListenPromise = server.listen({ signal: abortController.signal });

        // Immediately abort to prevent hanging
        abortController.abort();

        // Wait for first listen to complete
        await firstListenPromise;

        // Second listen() call should throw LifecycleError
        await expect(server.listen()).rejects.toThrow(LifecycleError);
        await expect(server.listen()).rejects.toThrow(
          'Lifecycle violation: listen() - method can only be called once',
        );
      });

      it('should throw LifecycleError even if first listen() failed', async () => {
        const server = createMcpServer().tool('test', {
          input: schema(z.string()),
          output: schema(z.string()),
          handler: async (input) => input,
        });

        // First listen() call that will fail due to invalid transport
        const mockTransport = {
          name: 'stdio' as const,
          start: async () => {
            throw new Error('Transport failed');
          },
        };

        server.transport(mockTransport);

        // First listen() should fail
        await expect(server.listen()).rejects.toThrow('Transport failed');

        // Second listen() should still throw LifecycleError
        await expect(server.listen()).rejects.toThrow(LifecycleError);
      });
    });

    describe('Plugin build() prevention', () => {
      it('should throw LifecycleError when plugin calls build()', () => {
        const buildCallingPlugin: Plugin = (srv) => {
          srv.tool('test-tool', {
            input: schema(z.string()),
            output: schema(z.string()),
            handler: async (input) => input,
          });

          // This should throw LifecycleError
          srv.build();
        };

        expect(() => {
          createMcpServer().register(buildCallingPlugin).build();
        }).toThrow(LifecycleError);

        expect(() => {
          createMcpServer().register(buildCallingPlugin).build();
        }).toThrow('Lifecycle violation: build() - plugins cannot call build() during execution');
      });

      it('should throw LifecycleError when plugin calls listen()', () => {
        const listenCallingPlugin: Plugin = (srv) => {
          srv.tool('test-tool', {
            input: schema(z.string()),
            output: schema(z.string()),
            handler: async (input) => input,
          });

          // This should throw LifecycleError
          srv.listen();
        };

        expect(() => {
          createMcpServer().register(listenCallingPlugin).build();
        }).toThrow(LifecycleError);

        expect(() => {
          createMcpServer().register(listenCallingPlugin).build();
        }).toThrow('Lifecycle violation: listen() - plugins cannot call listen() during execution');
      });

      it('should allow plugins to use all other builder methods', () => {
        const validPlugin: Plugin = (srv) => {
          srv.tool('plugin-tool', {
            input: schema(z.string()),
            output: schema(z.string()),
            handler: async (input) => `plugin: ${input}`,
          });

          srv.prompt('plugin-prompt', 'Hello {{name}}!', {
            params: schema(z.object({ name: z.string() })),
          });

          srv.resource('plugin-resource', 'file://plugin.txt');

          srv.use((next) => async (ctx) => {
            const result = await next(ctx);
            return { content: `plugin-middleware: ${result.content}` };
          });

          srv.register((innerSrv) => {
            innerSrv.tool('nested-tool', {
              input: schema(z.string()),
              output: schema(z.string()),
              handler: async (input) => `nested: ${input}`,
            });
          });
        };

        expect(() => {
          const server = createMcpServer().register(validPlugin).build();
          expect(server.registry.hasTool('plugin-tool')).toBe(true);
          expect(server.registry.hasPrompt('plugin-prompt')).toBe(true);
          expect(server.registry.hasResource('plugin-resource')).toBe(true);
          expect(server.registry.hasTool('nested-tool')).toBe(true);
        }).not.toThrow();
      });
    });

    describe('Error message consistency', () => {
      it('should have consistent LifecycleError codes and messages for duplicate listen()', async () => {
        const server = createMcpServer();

        // First listen() call
        const abortController = new AbortController();
        const listenPromise = server.listen({ signal: abortController.signal });
        abortController.abort();

        // Wait for first listen to complete
        await listenPromise;

        // Test duplicate listen() error
        try {
          await server.listen();
          expect.fail('Expected LifecycleError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(LifecycleError);
          expect((error as LifecycleError).code).toBe('LIFECYCLE_ERROR');
          expect((error as LifecycleError).message).toContain('Lifecycle violation');
          expect((error as LifecycleError).message).toContain('listen()');
        }
      });

      it('should have consistent LifecycleError codes and messages for plugin build()', () => {
        // Test plugin build() error
        const buildPlugin: Plugin = (srv) => {
          srv.build(); // This should throw
        };

        try {
          createMcpServer().register(buildPlugin).build();
          expect.fail('Expected LifecycleError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(LifecycleError);
          expect((error as LifecycleError).code).toBe('LIFECYCLE_ERROR');
          expect((error as LifecycleError).message).toContain('Lifecycle violation');
          expect((error as LifecycleError).message).toContain('build()');
        }
      });
    });
  });
});
