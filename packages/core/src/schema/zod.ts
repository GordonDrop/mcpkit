// packages/core/src/schema/zod.ts
import type { ZodTypeAny, z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Schema } from '.';

export class ZodSchema<T> implements Schema<T> {
  constructor(private readonly zod: ZodTypeAny) {}
  parse(d: unknown) {
    return this.zod.parse(d) as T;
  }
  json() {
    return zodToJsonSchema(this.zod);
  }
}

export const s = <T>(zod: z.ZodType<T>): Schema<T> => new ZodSchema<T>(zod);
