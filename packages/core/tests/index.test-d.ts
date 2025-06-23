import { expectType } from 'tsd';
import { z } from 'zod';
import type { InvokeFn, PromptSpec, ResourceSpec, ToolSpec, Transport } from '../src';
import { s } from '../src/schema/zod';

// =============================================================================
// Core Contracts
// =============================================================================

// ToolSpec Type Tests
const minimalTool: ToolSpec = {
  name: 'my-tool',
  description: 'A tool for doing things',
  input: s(z.string()),
  output: s(z.string()),
  handler: async () => 'result',
};
expectType<ToolSpec>(minimalTool);

// ResourceSpec Type Tests
const minimalResource: ResourceSpec = {
  name: 'test-resource',
  uri: 'file:///test.txt',
};
expectType<ResourceSpec>(minimalResource);

// PromptSpec Type Tests
const minimalPrompt: PromptSpec = {
  name: 'test-prompt',
  template: 'Hello {{name}}!',
};
expectType<PromptSpec>(minimalPrompt);

// =============================================================================
// Transport Contract
// =============================================================================

// InvokeFn Type Tests
const basicInvoker: InvokeFn = async (ctx) => {
  expectType<'tool' | 'prompt' | 'resource'>(ctx.type);
  expectType<string>(ctx.name);
  expectType<unknown>(ctx.input);
  expectType<bigint>(ctx.meta.start);

  return { content: 'result' };
};
expectType<InvokeFn>(basicInvoker);

// InvokeFn with error response
const errorInvoker: InvokeFn = async () => {
  return { content: 'error', isError: true };
};
expectType<InvokeFn>(errorInvoker);

// InvokeFn with type narrowing
const typedInvoker: InvokeFn = async (ctx) => {
  if (ctx.type === 'tool') {
    expectType<'tool'>(ctx.type);
  }
  if (ctx.type === 'prompt') {
    expectType<'prompt'>(ctx.type);
  }
  if (ctx.type === 'resource') {
    expectType<'resource'>(ctx.type);
  }

  return { content: { data: 'success' } };
};
expectType<InvokeFn>(typedInvoker);

// InvokeFn with minimal response
const minimalInvoker: InvokeFn = async () => {
  return { content: null };
};
expectType<InvokeFn>(minimalInvoker);

// Transport Interface Tests
const fullTransport: Transport = {
  name: 'stdio',
  async start(invoker) {
    expectType<InvokeFn>(invoker);
  },
  async stop() {},
};
expectType<Transport>(fullTransport);

// Transport with minimal implementation (no stop method)
const minimalTransport: Transport = {
  name: 'stdio',
  async start() {},
};
expectType<Transport>(minimalTransport);

// Transport with strictly typed name
const strictlyTypedTransport: Transport = {
  name: 'stdio',
  async start() {},
};
expectType<Transport>(strictlyTypedTransport);
