import { EventEmitter } from 'node:events';
import type { InvokeFn } from '@mcpkit/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StdioTransport } from '../transport';

vi.mock('node:readline', () => ({
  createInterface: vi.fn(),
}));

describe('Stdio Transport Integration Tests', () => {
  let mockReadlineInterface: {
    on: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };
  let mockProcess: {
    stdin: EventEmitter;
    stdout: { write: ReturnType<typeof vi.fn> };
    on: ReturnType<typeof vi.fn>;
    hrtime: { bigint: ReturnType<typeof vi.fn> };
  };
  let mockConsoleLog: ReturnType<typeof vi.fn>;
  let originalProcess: typeof process;
  let originalConsole: typeof console;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockReadlineInterface = {
      on: vi.fn(),
      close: vi.fn(),
    };

    const mockStdin = new EventEmitter();
    Object.assign(mockStdin, {
      resume: vi.fn(),
      pause: vi.fn(),
      setEncoding: vi.fn(),
      read: vi.fn(),
      readable: true,
    });

    mockProcess = {
      stdin: mockStdin,
      stdout: { write: vi.fn() },
      on: vi.fn(),
      hrtime: { bigint: vi.fn().mockReturnValue(BigInt(Date.now())) },
    };

    mockConsoleLog = vi.fn();

    originalProcess = globalThis.process;
    originalConsole = globalThis.console;

    const { createInterface } = await import('node:readline');
    vi.mocked(createInterface).mockReturnValue(
      mockReadlineInterface as unknown as ReturnType<typeof createInterface>,
    );

    Object.defineProperty(globalThis, 'process', {
      value: mockProcess,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'console', {
      value: { log: mockConsoleLog },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(globalThis, 'process', {
      value: originalProcess,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'console', {
      value: originalConsole,
      writable: true,
      configurable: true,
    });
  });

  async function simulateJsonRpcRequest(request: string, mockInvoker: InvokeFn): Promise<void> {
    const transport = new StdioTransport();
    transport.start(mockInvoker);

    const lineHandler = mockReadlineInterface.on.mock.calls.find((call) => call[0] === 'line')?.[1];

    expect(lineHandler).toBeDefined();
    await lineHandler(request);
    await transport.stop();
  }

  describe('End-to-End JSON-RPC Protocol', () => {
    it('should handle parse errors end-to-end', async () => {
      const mockInvoker = vi.fn();
      await simulateJsonRpcRequest('{invalid json}', mockInvoker);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error',
          },
        }),
      );
      expect(mockInvoker).not.toHaveBeenCalled();
    });

    it('should handle unknown methods end-to-end', async () => {
      const mockInvoker = vi.fn();
      const request = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'unknown-method',
        params: { name: 'test', input: {} },
      });

      await simulateJsonRpcRequest(request, mockInvoker);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32601,
            message: 'Method not found',
          },
        }),
      );
      expect(mockInvoker).not.toHaveBeenCalled();
    });

    it('should handle tool runtime errors end-to-end', async () => {
      const mockInvoker = vi.fn().mockResolvedValue({
        isError: true,
        content: 'Tool execution failed',
      });
      const request = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tool',
        params: { name: 'nonexistent-tool', input: {} },
      });

      await simulateJsonRpcRequest(request, mockInvoker);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32603,
            message: 'Tool execution failed',
            data: 'Tool execution failed',
          },
        }),
      );
    });

    it('should handle successful tool execution end-to-end', async () => {
      const mockInvoker = vi.fn().mockResolvedValue({
        content: { result: 8 },
      });
      const request = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tool',
        params: { name: 'add', input: { a: 5, b: 3 } },
      });

      await simulateJsonRpcRequest(request, mockInvoker);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { result: 8 },
        }),
      );
    });
  });

  describe('JSON-RPC Protocol Compliance', () => {
    it('should handle requests with null id', async () => {
      const mockInvoker = vi.fn().mockResolvedValue({
        content: { result: 25 },
      });
      const request = JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        method: 'tool',
        params: { name: 'add', input: { a: 10, b: 15 } },
      });

      await simulateJsonRpcRequest(request, mockInvoker);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          result: { result: 25 },
        }),
      );
    });

    it('should handle invalid request structure', async () => {
      const mockInvoker = vi.fn();
      const request = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tool',
      });

      await simulateJsonRpcRequest(request, mockInvoker);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32602,
            message: 'Invalid params',
          },
        }),
      );
      expect(mockInvoker).not.toHaveBeenCalled();
    });
  });
});
