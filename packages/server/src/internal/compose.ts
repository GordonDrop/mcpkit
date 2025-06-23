import type { InvokeFn, Middleware } from '../middleware/types';

/**
 * Composes an array of middleware functions into a single invoke function using the onion-model pattern.
 *
 * The composition works right-to-left: the last middleware in the array wraps the core function,
 * and the first middleware becomes the outermost layer. This creates an "onion" where each
 * middleware can execute code before and after calling the next layer.
 *
 * Example execution flow with middlewares [A, B, C]:
 * 1. A (before) -> B (before) -> C (before) -> core -> C (after) -> B (after) -> A (after)
 *
 * @param middlewares - Array of middleware functions to compose
 * @param coreInvokeFn - The core function that performs the actual operation
 * @returns A composed function that applies all middleware in the correct order
 */
export function composeMiddlewares(middlewares: Middleware[], coreInvokeFn: InvokeFn): InvokeFn {
  if (middlewares.length === 0) {
    return coreInvokeFn;
  }

  return middlewares.reduceRight(
    (next: InvokeFn, middleware: Middleware) => middleware(next),
    coreInvokeFn,
  );
}
