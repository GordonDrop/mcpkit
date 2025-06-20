import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { s } from './zod';

describe('Schema adapter', () => {
  const userSchema = s(z.object({ id: z.number(), name: z.string() }));
  it('parses valid objects', () => {
    expect(userSchema.parse({ id: 1, name: 'Ann' })).toEqual({ id: 1, name: 'Ann' });
  });
  it('fails on invalid', () => {
    expect(() => userSchema.parse({ id: 'x' })).toThrow();
  });
  it('returns the underlying JSON schema', () => {
    expect(userSchema.json()).toBeDefined();
  });
});