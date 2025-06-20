// packages/core/src/schema/index.ts
export interface Schema<T> {
  parse(data: unknown): T;
  json(): unknown;
}