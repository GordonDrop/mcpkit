export type InvokeFn = (ctx: {
  type: 'tool' | 'prompt' | 'resource';
  name: string;
  input: unknown;
  meta: { start: bigint };
}) => Promise<{ content: unknown; isError?: boolean }>;

export interface Transport {
  readonly name: 'stdio';
  start(invoker: InvokeFn): Promise<void>;
  stop?(): Promise<void>;
}
