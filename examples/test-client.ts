#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: {
    name: string;
    input: unknown;
  };
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

async function testStdioServer() {
  console.log('🚀 Starting MCP Server with stdio transport...\n');

  const serverPath = resolve(__dirname, 'stdio-server.ts');
  const server = spawn('npx', ['tsx', serverPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  let responseCount = 0;
  const expectedResponses = 4;

  server.stdout?.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response: JsonRpcResponse = JSON.parse(line);
          console.log('📥 Response:', JSON.stringify(response, null, 2));
          responseCount++;

          if (responseCount >= expectedResponses) {
            console.log('\n✅ All tests completed successfully!');
            server.kill();
            process.exit(0);
          }
        } catch {
          console.error('❌ Failed to parse response:', line);
        }
      }
    }
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });

  server.on('exit', (code) => {
    console.log(`\n🏁 Server exited with code ${code}`);
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const testCases: JsonRpcRequest[] = [
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'tool',
      params: {
        name: 'add',
        input: { a: 5, b: 3 },
      },
    },
    {
      jsonrpc: '2.0',
      id: 2,
      method: 'tool',
      params: {
        name: 'echo',
        input: { message: 'Hello, MCP!' },
      },
    },
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'tool',
      params: {
        name: 'multiply',
        input: { x: 4, y: 7 },
      },
    },
    {
      jsonrpc: '2.0',
      id: 4,
      method: 'tool',
      params: {
        name: 'nonexistent',
        input: {},
      },
    },
  ];

  for (const testCase of testCases) {
    console.log('📤 Sending request:', JSON.stringify(testCase, null, 2));
    server.stdin?.write(`${JSON.stringify(testCase)}\n`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  setTimeout(() => {
    console.log('\n⏰ Test timeout reached');
    server.kill();
    process.exit(1);
  }, 10000);
}

if (require.main === module) {
  testStdioServer().catch(console.error);
}
