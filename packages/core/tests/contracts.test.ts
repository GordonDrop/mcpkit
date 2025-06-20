import { describe, it } from 'vitest';
import { expectType } from 'tsd';
import { z } from 'zod';
import { s } from '../src/schema/zod';
import type { ToolSpec, ResourceSpec, PromptSpec, Transport } from '../src';

describe('Contracts', () => {
  it('should have sound ToolSpec type', () => {
    const minimalTool: ToolSpec = {
      name: 'my-tool',
      description: 'A tool for doing things',
      input: s(z.string()),
      output: s(z.string()),
      handler: async () => 'result',
    };
    expectType<ToolSpec>(minimalTool);
  });

  it('should have sound ResourceSpec type', () => {
    const minimalResource: ResourceSpec = {};
    expectType<ResourceSpec>(minimalResource);
  });

  it('should have sound PromptSpec type', () => {
    const minimalPrompt: PromptSpec = {};
    expectType<PromptSpec>(minimalPrompt);
  });

  it('should have sound Transport type', () => {
    const minimalTransport: Transport = {};
    expectType<Transport>(minimalTransport);
  });
});