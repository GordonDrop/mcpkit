import type { Schema } from '../schema';

export interface Logger {
  info(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
  error(obj: object, msg?: string): void;
  debug(obj: object, msg?: string): void;
}

export type Version = `${number}.${number}.${number}`;

export interface ExecutionCtx {
  readonly logger: Logger;
  readonly version: Version;
}

export interface ToolSpec<I = unknown, O = unknown> {
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly input:  Schema<I>;
  readonly output: Schema<O>;
  handler(input: I, ctx: ExecutionCtx): Promise<O>;
}