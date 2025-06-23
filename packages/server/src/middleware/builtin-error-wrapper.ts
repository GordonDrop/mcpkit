import type { CallResult, Middleware } from './types';

/**
 * Built-in error wrapper middleware that automatically converts thrown exceptions
 * into error result objects. This middleware ensures that all errors are handled
 * consistently across the middleware pipeline.
 *
 * On successful execution: returns the result unchanged
 * On error: catches any thrown exception and returns { isError: true, content: error }
 *
 * Note: This middleware will be automatically registered during builder.build() in future steps.
 */
export const errorWrapperMiddleware: Middleware = (next) => {
  return async (ctx) => {
    try {
      const result = await next(ctx);
      return result;
    } catch (error) {
      const errorResult: CallResult = {
        isError: true,
        content: error,
      };
      return errorResult;
    }
  };
};
