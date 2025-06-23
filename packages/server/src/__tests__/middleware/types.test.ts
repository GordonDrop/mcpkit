import { describe, expect, it } from 'vitest';
import type { CallCtx, CallResult, InvokeFn, Middleware } from '../../middleware/types';

describe('Middleware Types', () => {
  describe('CallCtx Interface', () => {
    it('should accept valid CallCtx objects', () => {
      const validCtx: CallCtx = {
        type: 'tool',
        name: 'test-tool',
        input: 'test-input',
        meta: { start: BigInt(Date.now()) },
      };

      expect(validCtx.type).toBe('tool');
      expect(validCtx.name).toBe('test-tool');
      expect(validCtx.input).toBe('test-input');
      expect(typeof validCtx.meta.start).toBe('bigint');
    });

    it('should support all operation types', () => {
      const toolCtx: CallCtx = {
        type: 'tool',
        name: 'test',
        input: {},
        meta: { start: BigInt(0) },
      };

      const promptCtx: CallCtx = {
        type: 'prompt',
        name: 'test',
        input: {},
        meta: { start: BigInt(0) },
      };

      const resourceCtx: CallCtx = {
        type: 'resource',
        name: 'test',
        input: {},
        meta: { start: BigInt(0) },
      };

      expect(toolCtx.type).toBe('tool');
      expect(promptCtx.type).toBe('prompt');
      expect(resourceCtx.type).toBe('resource');
    });

    it('should support different input types', () => {
      const stringInputCtx: CallCtx = {
        type: 'tool',
        name: 'test',
        input: 'string-input',
        meta: { start: BigInt(0) },
      };

      const objectInputCtx: CallCtx = {
        type: 'tool',
        name: 'test',
        input: { key: 'value', number: 42 },
        meta: { start: BigInt(0) },
      };

      const arrayInputCtx: CallCtx = {
        type: 'tool',
        name: 'test',
        input: [1, 2, 3],
        meta: { start: BigInt(0) },
      };

      expect(stringInputCtx.input).toBe('string-input');
      expect(objectInputCtx.input).toEqual({ key: 'value', number: 42 });
      expect(arrayInputCtx.input).toEqual([1, 2, 3]);
    });

    it('should support bigint timestamps for high precision', () => {
      const highPrecisionStart = process.hrtime.bigint();
      const ctx: CallCtx = {
        type: 'tool',
        name: 'test',
        input: null,
        meta: { start: highPrecisionStart },
      };

      expect(typeof ctx.meta.start).toBe('bigint');
      expect(ctx.meta.start).toBe(highPrecisionStart);
    });
  });

  describe('CallResult Interface', () => {
    it('should accept valid CallResult objects', () => {
      const successResult: CallResult = {
        content: 'success-content',
      };

      const errorResult: CallResult = {
        content: new Error('error-content'),
        isError: true,
      };

      expect(successResult.content).toBe('success-content');
      expect(successResult.isError).toBeUndefined();
      expect(errorResult.content).toBeInstanceOf(Error);
      expect(errorResult.isError).toBe(true);
    });

    it('should support different content types', () => {
      const stringResult: CallResult = { content: 'string' };
      const numberResult: CallResult = { content: 42 };
      const objectResult: CallResult = { content: { key: 'value' } };
      const arrayResult: CallResult = { content: [1, 2, 3] };
      const nullResult: CallResult = { content: null };

      expect(stringResult.content).toBe('string');
      expect(numberResult.content).toBe(42);
      expect(objectResult.content).toEqual({ key: 'value' });
      expect(arrayResult.content).toEqual([1, 2, 3]);
      expect(nullResult.content).toBe(null);
    });

    it('should make isError optional', () => {
      const resultWithoutError: CallResult = { content: 'test' };
      const resultWithError: CallResult = { content: 'test', isError: false };
      const errorResult: CallResult = { content: 'test', isError: true };

      expect('isError' in resultWithoutError).toBe(false);
      expect(resultWithError.isError).toBe(false);
      expect(errorResult.isError).toBe(true);
    });
  });

  describe('InvokeFn Type', () => {
    it('should accept functions with correct signature', async () => {
      const validInvokeFn: InvokeFn = async (ctx: CallCtx) => ({
        content: `processed-${ctx.name}`,
      });

      const ctx: CallCtx = {
        type: 'tool',
        name: 'test',
        input: 'input',
        meta: { start: BigInt(0) },
      };

      const result = await validInvokeFn(ctx);
      expect(result.content).toBe('processed-test');
    });

    it('should return Promise<CallResult>', async () => {
      const asyncInvokeFn: InvokeFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return { content: 'async-result' };
      };

      const ctx: CallCtx = {
        type: 'tool',
        name: 'test',
        input: null,
        meta: { start: BigInt(0) },
      };

      const result = await asyncInvokeFn(ctx);
      expect(result).toEqual({ content: 'async-result' });
    });
  });

  describe('Middleware Type', () => {
    it('should accept functions with correct signature', async () => {
      const validMiddleware: Middleware = (next: InvokeFn) => async (ctx: CallCtx) => {
        const result = await next(ctx);
        return {
          content: `middleware-${result.content}`,
        };
      };

      const mockNext: InvokeFn = async () => ({ content: 'next-result' });
      const ctx: CallCtx = {
        type: 'tool',
        name: 'test',
        input: null,
        meta: { start: BigInt(0) },
      };

      const wrappedFn = validMiddleware(mockNext);
      const result = await wrappedFn(ctx);

      expect(result.content).toBe('middleware-next-result');
    });

    it('should support middleware that modifies context', async () => {
      const contextModifyingMiddleware: Middleware = (next) => async (ctx) => {
        const modifiedCtx = {
          ...ctx,
          input: `modified-${ctx.input}`,
        };
        return await next(modifiedCtx);
      };

      const mockNext: InvokeFn = async (ctx) => ({ content: ctx.input });
      const ctx: CallCtx = {
        type: 'tool',
        name: 'test',
        input: 'original',
        meta: { start: BigInt(0) },
      };

      const wrappedFn = contextModifyingMiddleware(mockNext);
      const result = await wrappedFn(ctx);

      expect(result.content).toBe('modified-original');
    });

    it('should support middleware that short-circuits', async () => {
      const shortCircuitMiddleware: Middleware = () => async () => ({
        content: 'short-circuited',
        isError: false,
      });

      const mockNext: InvokeFn = async () => ({ content: 'should-not-reach' });
      const ctx: CallCtx = {
        type: 'tool',
        name: 'test',
        input: null,
        meta: { start: BigInt(0) },
      };

      const wrappedFn = shortCircuitMiddleware(mockNext);
      const result = await wrappedFn(ctx);

      expect(result.content).toBe('short-circuited');
    });
  });

  describe('Type Composition', () => {
    it('should allow complex middleware composition', async () => {
      const middleware1: Middleware = (next) => async (ctx) => {
        const result = await next(ctx);
        return { content: `m1[${result.content}]` };
      };

      const middleware2: Middleware = (next) => async (ctx) => {
        const result = await next(ctx);
        return { content: `m2[${result.content}]` };
      };

      const core: InvokeFn = async (ctx) => ({ content: `core-${ctx.name}` });
      const ctx: CallCtx = {
        type: 'tool',
        name: 'test',
        input: null,
        meta: { start: BigInt(0) },
      };

      const composed = middleware1(middleware2(core));
      const result = await composed(ctx);

      expect(result.content).toBe('m1[m2[core-test]]');
    });
  });
});
