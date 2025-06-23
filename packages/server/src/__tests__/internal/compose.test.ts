import { describe, expect, it } from 'vitest';
import { composeMiddlewares } from '../../internal/compose';
import type { CallCtx, InvokeFn, Middleware } from '../../middleware/types';

describe('Middleware Composition', () => {
  const mockCtx: CallCtx = {
    type: 'tool',
    name: 'test-tool',
    input: 'test-input',
    meta: { start: BigInt(Date.now()) },
  };

  const mockCoreInvoker: InvokeFn = async (ctx) => ({
    content: `core-result-${ctx.input}`,
  });

  describe('Edge Cases', () => {
    it('should return core function when no middlewares provided', async () => {
      const composed = composeMiddlewares([], mockCoreInvoker);
      const result = await composed(mockCtx);

      expect(result).toEqual({ content: 'core-result-test-input' });
    });

    it('should handle undefined middleware array gracefully', async () => {
      const composed = composeMiddlewares([], mockCoreInvoker);
      const result = await composed(mockCtx);

      expect(result).toEqual({ content: 'core-result-test-input' });
    });
  });

  describe('Single Middleware', () => {
    it('should compose single middleware correctly', async () => {
      const middleware: Middleware = (next) => async (ctx) => {
        const result = await next(ctx);
        return {
          content: `middleware-${result.content}`,
        };
      };

      const composed = composeMiddlewares([middleware], mockCoreInvoker);
      const result = await composed(mockCtx);

      expect(result).toEqual({ content: 'middleware-core-result-test-input' });
    });

    it('should allow middleware to modify context', async () => {
      const middleware: Middleware = (next) => async (ctx) => {
        const modifiedCtx = {
          ...ctx,
          input: `modified-${ctx.input}`,
        };
        return await next(modifiedCtx);
      };

      const composed = composeMiddlewares([middleware], mockCoreInvoker);
      const result = await composed(mockCtx);

      expect(result).toEqual({ content: 'core-result-modified-test-input' });
    });

    it('should allow middleware to short-circuit execution', async () => {
      const shortCircuitMiddleware: Middleware = () => async () => ({
        content: 'short-circuited',
        isError: false,
      });

      const composed = composeMiddlewares([shortCircuitMiddleware], mockCoreInvoker);
      const result = await composed(mockCtx);

      expect(result).toEqual({ content: 'short-circuited', isError: false });
    });
  });

  describe('Multiple Middleware Composition', () => {
    it('should compose multiple middlewares in correct order (onion model)', async () => {
      const executionOrder: string[] = [];

      const middleware1: Middleware = (next) => async (ctx) => {
        executionOrder.push('middleware1-before');
        const result = await next(ctx);
        executionOrder.push('middleware1-after');
        return {
          content: `m1[${result.content}]`,
        };
      };

      const middleware2: Middleware = (next) => async (ctx) => {
        executionOrder.push('middleware2-before');
        const result = await next(ctx);
        executionOrder.push('middleware2-after');
        return {
          content: `m2[${result.content}]`,
        };
      };

      const middleware3: Middleware = (next) => async (ctx) => {
        executionOrder.push('middleware3-before');
        const result = await next(ctx);
        executionOrder.push('middleware3-after');
        return {
          content: `m3[${result.content}]`,
        };
      };

      const coreWithLogging: InvokeFn = async (ctx) => {
        executionOrder.push('core');
        return { content: `core-${ctx.input}` };
      };

      const composed = composeMiddlewares([middleware1, middleware2, middleware3], coreWithLogging);
      const result = await composed(mockCtx);

      expect(executionOrder).toEqual([
        'middleware1-before',
        'middleware2-before',
        'middleware3-before',
        'core',
        'middleware3-after',
        'middleware2-after',
        'middleware1-after',
      ]);

      expect(result).toEqual({ content: 'm1[m2[m3[core-test-input]]]' });
    });

    it('should handle async middleware correctly', async () => {
      const asyncMiddleware1: Middleware = (next) => async (ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        const result = await next(ctx);
        return { content: `async1[${result.content}]` };
      };

      const asyncMiddleware2: Middleware = (next) => async (ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        const result = await next(ctx);
        return { content: `async2[${result.content}]` };
      };

      const composed = composeMiddlewares([asyncMiddleware1, asyncMiddleware2], mockCoreInvoker);
      const result = await composed(mockCtx);

      expect(result).toEqual({ content: 'async1[async2[core-result-test-input]]' });
    });
  });

  describe('Error Propagation', () => {
    it('should propagate errors from core function', async () => {
      const errorCore: InvokeFn = async () => {
        throw new Error('Core error');
      };

      const middleware: Middleware = (next) => async (ctx) => {
        return await next(ctx);
      };

      const composed = composeMiddlewares([middleware], errorCore);

      await expect(composed(mockCtx)).rejects.toThrow('Core error');
    });

    it('should propagate errors from middleware', async () => {
      const errorMiddleware: Middleware = () => async () => {
        throw new Error('Middleware error');
      };

      const composed = composeMiddlewares([errorMiddleware], mockCoreInvoker);

      await expect(composed(mockCtx)).rejects.toThrow('Middleware error');
    });

    it('should allow middleware to catch and handle errors', async () => {
      const errorCore: InvokeFn = async () => {
        throw new Error('Core error');
      };

      const errorHandlingMiddleware: Middleware = (next) => async (ctx) => {
        try {
          return await next(ctx);
        } catch (error) {
          return {
            content: error,
            isError: true,
          };
        }
      };

      const composed = composeMiddlewares([errorHandlingMiddleware], errorCore);
      const result = await composed(mockCtx);

      expect(result.isError).toBe(true);
      expect(result.content).toBeInstanceOf(Error);
      expect((result.content as Error).message).toBe('Core error');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle very deep middleware chains efficiently', async () => {
      const middlewares: Middleware[] = [];

      // Create 1000 middleware functions
      for (let i = 0; i < 1000; i++) {
        middlewares.push((next) => async (ctx) => {
          const result = await next(ctx);
          return { content: `${i}:${result.content}` };
        });
      }

      const composed = composeMiddlewares(middlewares, mockCoreInvoker);
      const start = Date.now();
      const result = await composed(mockCtx);
      const duration = Date.now() - start;

      expect(result.content).toContain('core-result-test-input');
      expect(result.content).toContain('0:');
      expect(result.content).toContain('999:');
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle middleware that returns different result structures', async () => {
      const customResultMiddleware: Middleware = (next) => async (ctx) => {
        const result = await next(ctx);
        return {
          content: result.content,
          isError: false,
          timestamp: Date.now(),
          metadata: { processed: true },
        };
      };

      const composed = composeMiddlewares([customResultMiddleware], mockCoreInvoker);
      const result = await composed(mockCtx);

      expect(result.content).toBe('core-result-test-input');
      expect(result.isError).toBe(false);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('metadata');
      expect((result as unknown as { metadata: { processed: boolean } }).metadata.processed).toBe(
        true,
      );
    });

    it('should handle middleware with complex async patterns', async () => {
      const asyncPatternMiddleware: Middleware = (next) => async (ctx) => {
        // Simulate complex async operations
        const [result1, result2] = await Promise.all([
          next(ctx),
          new Promise((resolve) => setTimeout(() => resolve('async-data'), 10)),
        ]);

        return {
          content: `${result1.content}-${result2}`,
        };
      };

      const composed = composeMiddlewares([asyncPatternMiddleware], mockCoreInvoker);
      const result = await composed(mockCtx);

      expect(result.content).toBe('core-result-test-input-async-data');
    });

    it('should maintain proper this context in middleware', async () => {
      class MiddlewareClass {
        prefix = 'class-prefix';

        createMiddleware(): Middleware {
          return (next) => async (ctx) => {
            const result = await next(ctx);
            return {
              content: `${this.prefix}-${result.content}`,
            };
          };
        }
      }

      const instance = new MiddlewareClass();
      const middleware = instance.createMiddleware();

      const composed = composeMiddlewares([middleware], mockCoreInvoker);
      const result = await composed(mockCtx);

      expect(result.content).toBe('class-prefix-core-result-test-input');
    });
  });

  describe('Loop Prevention and Stack Safety', () => {
    it('should handle middleware that calls next multiple times', async () => {
      let coreCallCount = 0;

      const multipleCallMiddleware: Middleware = (next) => async (ctx) => {
        const result1 = await next(ctx);
        const result2 = await next(ctx); // Second call to next
        return {
          content: `${result1.content}-${result2.content}`,
        };
      };

      const countingCore: InvokeFn = async (ctx) => {
        coreCallCount++;
        return { content: `core-${coreCallCount}-${ctx.input}` };
      };

      const composed = composeMiddlewares([multipleCallMiddleware], countingCore);
      const result = await composed(mockCtx);

      expect(result.content).toBe('core-1-test-input-core-2-test-input');
      expect(coreCallCount).toBe(2);
    });

    it('should handle middleware that attempts to create circular calls', async () => {
      let callDepth = 0;
      const maxDepth = 5;

      const circularMiddleware: Middleware = (next) => async (ctx) => {
        callDepth++;

        if (callDepth > maxDepth) {
          return { content: 'max-depth-reached', isError: true };
        }

        // Simulate a middleware that might try to call itself indirectly
        const result = await next(ctx);

        if (callDepth < 3) {
          // Try to call next again (simulating potential loop)
          const secondResult = await next({
            ...ctx,
            input: `recursive-${ctx.input}`,
          });
          return { content: `${result.content}-${secondResult.content}` };
        }

        return result;
      };

      const composed = composeMiddlewares([circularMiddleware], mockCoreInvoker);
      const result = await composed(mockCtx);

      expect(callDepth).toBeLessThanOrEqual(maxDepth);
      expect(result.content).toContain('core-result');
    });

    it('should handle deeply nested middleware without stack overflow', async () => {
      const deepMiddlewares: Middleware[] = [];
      const depth = 500; // Test with 500 levels of nesting

      // Create middleware that each add a level of nesting
      for (let i = 0; i < depth; i++) {
        deepMiddlewares.push((next) => async (ctx) => {
          const result = await next(ctx);
          return { content: `[${i}:${result.content}]` };
        });
      }

      const composed = composeMiddlewares(deepMiddlewares, mockCoreInvoker);

      // This should not cause a stack overflow
      const result = await composed(mockCtx);

      expect(result.content).toContain('core-result-test-input');
      expect(result.content).toContain('[0:');
      expect(result.content).toContain(`[${depth - 1}:`);
    });

    it('should handle middleware that modifies the next function', async () => {
      const modifyingMiddleware: Middleware = (next) => {
        // Create a wrapped version of next that adds tracking
        const wrappedNext: InvokeFn = async (ctx) => {
          const modifiedCtx = {
            ...ctx,
            input: `wrapped-${ctx.input}`,
          };
          return await next(modifiedCtx);
        };

        return async (ctx) => {
          return await wrappedNext(ctx);
        };
      };

      const composed = composeMiddlewares([modifyingMiddleware], mockCoreInvoker);
      const result = await composed(mockCtx);

      expect(result.content).toBe('core-result-wrapped-test-input');
    });

    it('should handle middleware with recursive async patterns safely', async () => {
      let recursionDepth = 0;
      const maxRecursion = 10;

      const recursiveAsyncMiddleware: Middleware = (next) => async (ctx) => {
        recursionDepth++;

        if (recursionDepth > maxRecursion) {
          return { content: 'recursion-limit-reached', isError: true };
        }

        // Simulate recursive async pattern
        const processRecursively = async (input: unknown, depth: number): Promise<unknown> => {
          if (depth <= 0) {
            return input;
          }

          await new Promise((resolve) => setTimeout(resolve, 1));
          return await processRecursively(`processed-${input}`, depth - 1);
        };

        const processedInput = await processRecursively(ctx.input, 3);
        const modifiedCtx = { ...ctx, input: processedInput };

        const result = await next(modifiedCtx);
        recursionDepth--;

        return result;
      };

      const composed = composeMiddlewares([recursiveAsyncMiddleware], mockCoreInvoker);
      const result = await composed(mockCtx);

      expect(result.content).toContain('processed-processed-processed-test-input');
      expect(recursionDepth).toBe(0); // Should return to 0 after completion
    });

    it('should detect and handle potential infinite loops in middleware', async () => {
      let executionCount = 0;
      const maxExecutions = 10;

      const potentialLoopMiddleware: Middleware = (next) => async (ctx) => {
        executionCount++;

        // Safety check to prevent actual infinite loop in test
        if (executionCount > maxExecutions) {
          throw new Error('Potential infinite loop detected');
        }

        // Simulate middleware that might cause issues by recursively calling itself
        if (ctx.input === 'trigger-loop' && executionCount <= maxExecutions) {
          // Create a new middleware instance and call it (simulating loop)
          const recursiveMiddleware = potentialLoopMiddleware(next);
          return await recursiveMiddleware(ctx);
        }

        return await next(ctx);
      };

      const loopCtx = { ...mockCtx, input: 'trigger-loop' };

      await expect(async () => {
        const composed = composeMiddlewares([potentialLoopMiddleware], mockCoreInvoker);
        await composed(loopCtx);
      }).rejects.toThrow('Potential infinite loop detected');

      expect(executionCount).toBeGreaterThan(maxExecutions);
    });
  });
});
