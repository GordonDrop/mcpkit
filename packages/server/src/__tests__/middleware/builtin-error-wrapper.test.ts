import { describe, expect, it } from 'vitest';
import { errorWrapperMiddleware } from '../../middleware/builtin-error-wrapper';
import type { CallCtx, InvokeFn } from '../../middleware/types';

describe('Error Wrapper Middleware', () => {
  const mockCtx: CallCtx = {
    type: 'tool',
    name: 'test-tool',
    input: 'test-input',
    meta: { start: BigInt(Date.now()) },
  };

  describe('Successful Execution', () => {
    it('should pass through successful results unchanged', async () => {
      const successfulNext: InvokeFn = async () => ({
        content: 'success-result',
      });

      const wrappedNext = errorWrapperMiddleware(successfulNext);
      const result = await wrappedNext(mockCtx);

      expect(result).toEqual({ content: 'success-result' });
      expect(result.isError).toBeUndefined();
    });

    it('should preserve existing result properties', async () => {
      const successfulNext: InvokeFn = async () => ({
        content: 'success-result',
        isError: false,
        customProperty: 'custom-value',
      });

      const wrappedNext = errorWrapperMiddleware(successfulNext);
      const result = await wrappedNext(mockCtx);

      expect(result).toEqual({
        content: 'success-result',
        isError: false,
        customProperty: 'custom-value',
      });
    });

    it('should handle async operations correctly', async () => {
      const asyncNext: InvokeFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return { content: 'async-result' };
      };

      const wrappedNext = errorWrapperMiddleware(asyncNext);
      const result = await wrappedNext(mockCtx);

      expect(result).toEqual({ content: 'async-result' });
    });
  });

  describe('Error Handling', () => {
    it('should catch and wrap thrown errors', async () => {
      const errorNext: InvokeFn = async () => {
        throw new Error('Test error message');
      };

      const wrappedNext = errorWrapperMiddleware(errorNext);
      const result = await wrappedNext(mockCtx);

      expect(result.isError).toBe(true);
      expect(result.content).toBeInstanceOf(Error);
      expect((result.content as Error).message).toBe('Test error message');
    });

    it('should handle different error types', async () => {
      const typeErrorNext: InvokeFn = async () => {
        throw new TypeError('Type error message');
      };

      const wrappedNext = errorWrapperMiddleware(typeErrorNext);
      const result = await wrappedNext(mockCtx);

      expect(result.isError).toBe(true);
      expect(result.content).toBeInstanceOf(TypeError);
      expect((result.content as TypeError).message).toBe('Type error message');
    });

    it('should handle string errors', async () => {
      const stringErrorNext: InvokeFn = async () => {
        throw 'String error';
      };

      const wrappedNext = errorWrapperMiddleware(stringErrorNext);
      const result = await wrappedNext(mockCtx);

      expect(result.isError).toBe(true);
      expect(result.content).toBe('String error');
    });

    it('should handle null/undefined errors', async () => {
      const nullErrorNext: InvokeFn = async () => {
        throw null;
      };

      const wrappedNext = errorWrapperMiddleware(nullErrorNext);
      const result = await wrappedNext(mockCtx);

      expect(result.isError).toBe(true);
      expect(result.content).toBe(null);
    });

    it('should handle object errors', async () => {
      const objectError = { code: 'CUSTOM_ERROR', message: 'Custom error' };
      const objectErrorNext: InvokeFn = async () => {
        throw objectError;
      };

      const wrappedNext = errorWrapperMiddleware(objectErrorNext);
      const result = await wrappedNext(mockCtx);

      expect(result.isError).toBe(true);
      expect(result.content).toEqual(objectError);
    });
  });

  describe('Error Result Structure', () => {
    it('should create proper error result structure', async () => {
      const errorNext: InvokeFn = async () => {
        throw new Error('Test error');
      };

      const wrappedNext = errorWrapperMiddleware(errorNext);
      const result = await wrappedNext(mockCtx);

      expect(result).toHaveProperty('isError', true);
      expect(result).toHaveProperty('content');
      expect(Object.keys(result)).toEqual(['isError', 'content']);
    });

    it('should not modify error results that are already wrapped', async () => {
      const alreadyWrappedNext: InvokeFn = async () => ({
        isError: true,
        content: new Error('Already wrapped'),
      });

      const wrappedNext = errorWrapperMiddleware(alreadyWrappedNext);
      const result = await wrappedNext(mockCtx);

      expect(result).toEqual({
        isError: true,
        content: new Error('Already wrapped'),
      });
    });
  });

  describe('Context Preservation', () => {
    it('should pass context through to next function', async () => {
      let receivedCtx: CallCtx | null = null;

      const contextCapturingNext: InvokeFn = async (ctx) => {
        receivedCtx = ctx;
        return { content: 'result' };
      };

      const wrappedNext = errorWrapperMiddleware(contextCapturingNext);
      await wrappedNext(mockCtx);

      expect(receivedCtx).toEqual(mockCtx);
    });

    it('should preserve context modifications in error cases', async () => {
      let receivedCtx: CallCtx | null = null;

      const contextCapturingErrorNext: InvokeFn = async (ctx) => {
        receivedCtx = ctx;
        throw new Error('Test error');
      };

      const wrappedNext = errorWrapperMiddleware(contextCapturingErrorNext);
      await wrappedNext(mockCtx);

      expect(receivedCtx).toEqual(mockCtx);
    });
  });
});
