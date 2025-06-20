import { expectType } from 'tsd';
import { z } from 'zod';
import type { PromptSpec, ResourceSpec, ToolSpec, Transport } from '../src';
import { s } from '../src/schema/zod';

const minimalTool: ToolSpec = {
  name: 'my-tool',
  description: 'A tool for doing things',
  input: s(z.string()),
  output: s(z.string()),
  handler: async () => 'result',
};
expectType<ToolSpec>(minimalTool);

const minimalResource: ResourceSpec = {
  name: 'test-resource',
  uri: 'file:///test.txt',
};
expectType<ResourceSpec>(minimalResource);

const minimalPrompt: PromptSpec = {
  name: 'test-prompt',
  template: 'Hello {{name}}!',
};
expectType<PromptSpec>(minimalPrompt);

const minimalTransport: Transport = {};
expectType<Transport>(minimalTransport);
