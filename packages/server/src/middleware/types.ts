/**
 * Context object passed to middleware and execution handlers.
 * Contains information about the current operation being executed.
 */
export interface CallCtx {
  type: 'tool' | 'prompt' | 'resource';
  name: string;
  input: unknown;
  meta: {
    start: bigint;
  };
}

/**
 * Result object returned from middleware and execution handlers.
 * Note: This should be re-exported from @mcpkit/core in future iterations.
 */
export interface CallResult {
  content: unknown;
  isError?: boolean;
}

/**
 * Function signature for invoking the next layer in the middleware chain.
 */
export type InvokeFn = (ctx: CallCtx) => Promise<CallResult>;

/**
 * Middleware function signature following the onion-model pattern.
 * Takes the next function in the chain and returns a new function.
 */
export type Middleware = (next: InvokeFn) => InvokeFn;
