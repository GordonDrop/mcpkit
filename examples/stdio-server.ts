#!/usr/bin/env node

import { createMcpServer, schema, z } from '@mcpkit/server';

const server = createMcpServer()
  .tool('add', {
    description: 'Add two numbers',
    input: schema(
      z.object({
        a: z.number().describe('First number'),
        b: z.number().describe('Second number'),
      }),
    ),
    output: schema(
      z.object({
        result: z.number().describe('Sum of the two numbers'),
      }),
    ),
    async handler({ a, b }) {
      return { result: a + b };
    },
  })
  .tool('echo', {
    description: 'Echo back the input message',
    input: schema(
      z.object({
        message: z.string().describe('Message to echo'),
      }),
    ),
    output: schema(
      z.object({
        echo: z.string().describe('Echoed message'),
      }),
    ),
    async handler({ message }) {
      return { echo: message };
    },
  })
  .tool('multiply', {
    description: 'Multiply two numbers',
    input: schema(
      z.object({
        x: z.number().describe('First number'),
        y: z.number().describe('Second number'),
      }),
    ),
    output: schema(
      z.object({
        product: z.number().describe('Product of the two numbers'),
      }),
    ),
    async handler({ x, y }) {
      return { product: x * y };
    },
  });

server.listen().catch(console.error);
