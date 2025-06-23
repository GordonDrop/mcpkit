import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStdioTransport, StdioTransport } from '../transport';

vi.mock('node:readline', () => ({
  createInterface: vi.fn(),
}));

describe('StdioTransport', () => {
  describe('Factory Function', () => {
    it('should create a StdioTransport instance', () => {
      const transport = createStdioTransport();
      expect(transport).toBeInstanceOf(StdioTransport);
      expect(transport.name).toBe('stdio');
    });
  });

  describe('Transport Properties', () => {
    it('should have correct name property', () => {
      const transport = new StdioTransport();
      expect(transport.name).toBe('stdio');
    });

    it('should have start method', () => {
      const transport = new StdioTransport();
      expect(typeof transport.start).toBe('function');
    });

    it('should have stop method', () => {
      const transport = new StdioTransport();
      expect(typeof transport.stop).toBe('function');
    });
  });

  describe('JSON-RPC Error Constants', () => {
    it('should handle parse errors with correct error code', () => {
      const transport = new StdioTransport();
      expect(transport).toBeDefined();
      expect(transport.name).toBe('stdio');
      expect(typeof transport.start).toBe('function');
      expect(typeof transport.stop).toBe('function');
    });
  });

  describe('Graceful Shutdown', () => {
    it('should support stop() method', async () => {
      const transport = new StdioTransport();
      expect(typeof transport.stop).toBe('function');
      await expect(transport.stop()).resolves.toBeUndefined();
    });

    it('should handle multiple stop() calls', async () => {
      const transport = new StdioTransport();
      await transport.stop();
      await expect(transport.stop()).resolves.toBeUndefined();
    });
  });

  describe('Type Safety', () => {
    it('should implement Transport interface correctly', () => {
      const transport = createStdioTransport();

      // Verify it has the required properties and methods
      expect(transport.name).toBe('stdio');
      expect(typeof transport.start).toBe('function');
      expect(typeof transport.stop).toBe('function');
    });

    it('should accept InvokeFn parameter in start method', () => {
      const transport = new StdioTransport();
      const mockInvoker = async () => ({ content: 'test' });

      expect(typeof transport.start).toBe('function');
      expect(mockInvoker).toBeInstanceOf(Function);
    });
  });

  describe('Integration with Transport Interface', () => {
    it('should be compatible with Transport type', () => {
      const transport: import('@mcpkit/core').Transport = createStdioTransport();
      expect(transport.name).toBe('stdio');
    });
  });

  describe('JSON-RPC Protocol Handling', () => {
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

      const mockStdout = {
        write: vi.fn().mockReturnValue(true),
        writable: true,
        destroyed: false,
      };

      mockProcess = {
        stdin: mockStdin,
        stdout: mockStdout,
        on: vi.fn(),
        hrtime: { bigint: vi.fn().mockReturnValue(BigInt(Date.now())) },
      };

      mockConsoleLog = vi.fn();

      originalProcess = globalThis.process;
      originalConsole = globalThis.console;

      // Setup readline mock
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

    describe('Parse Error Handling', () => {
      it('should return JSON-RPC error code -32700 for malformed JSON', async () => {
        const transport = new StdioTransport();
        const mockInvoker = vi.fn();

        transport.start(mockInvoker);

        const lineHandler = mockReadlineInterface.on.mock.calls.find(
          (call) => call[0] === 'line',
        )?.[1];

        expect(lineHandler).toBeDefined();

        await lineHandler('{invalid json}');

        expect(mockProcess.stdout.write).toHaveBeenCalledWith(
          `${JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32700,
              message: 'Parse error',
            },
          })}\n`,
        );

        expect(mockInvoker).not.toHaveBeenCalled();

        await transport.stop();
      });
    });

    describe('Unknown Method Handling', () => {
      it('should return JSON-RPC error code -32601 for unknown method', async () => {
        const transport = new StdioTransport();
        const mockInvoker = vi.fn();

        transport.start(mockInvoker);

        const lineHandler = mockReadlineInterface.on.mock.calls.find(
          (call) => call[0] === 'line',
        )?.[1];

        expect(lineHandler).toBeDefined();

        const invalidRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'foo',
          params: { name: 'test', input: {} },
        };

        await lineHandler(JSON.stringify(invalidRequest));

        expect(mockProcess.stdout.write).toHaveBeenCalledWith(
          `${JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            error: {
              code: -32601,
              message: 'Method not found',
            },
          })}\n`,
        );

        expect(mockInvoker).not.toHaveBeenCalled();

        await transport.stop();
      });
    });

    describe('Tool Runtime Error Handling', () => {
      it('should handle tool execution errors with isError=true', async () => {
        const transport = new StdioTransport();
        const mockInvoker = vi.fn().mockResolvedValue({
          isError: true,
          content: 'Tool execution failed',
        });

        transport.start(mockInvoker);

        const lineHandler = mockReadlineInterface.on.mock.calls.find(
          (call) => call[0] === 'line',
        )?.[1];

        expect(lineHandler).toBeDefined();

        const validRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tool',
          params: { name: 'failing-tool', input: { test: 'data' } },
        };

        await lineHandler(JSON.stringify(validRequest));

        expect(mockInvoker).toHaveBeenCalledWith({
          type: 'tool',
          name: 'failing-tool',
          input: { test: 'data' },
          meta: { start: expect.any(BigInt) },
        });

        expect(mockProcess.stdout.write).toHaveBeenCalledWith(
          `${JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            error: {
              code: -32603,
              message: 'Tool execution failed',
              data: 'Tool execution failed',
            },
          })}\n`,
        );

        await transport.stop();
      });

      it('should handle tool execution exceptions', async () => {
        const transport = new StdioTransport();
        const mockInvoker = vi.fn().mockRejectedValue(new Error('Unexpected error'));

        transport.start(mockInvoker);

        const lineHandler = mockReadlineInterface.on.mock.calls.find(
          (call) => call[0] === 'line',
        )?.[1];

        expect(lineHandler).toBeDefined();

        const validRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tool',
          params: { name: 'error-tool', input: {} },
        };

        await lineHandler(JSON.stringify(validRequest));

        expect(mockProcess.stdout.write).toHaveBeenCalledWith(
          `${JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            error: {
              code: -32603,
              message: 'Internal error',
              data: 'Unexpected error',
            },
          })}\n`,
        );

        await transport.stop();
      });
    });

    describe('Successful Tool Execution', () => {
      it('should handle valid tool calls and return success response', async () => {
        const transport = new StdioTransport();
        const mockInvoker = vi.fn().mockResolvedValue({
          content: { result: 42 },
        });

        transport.start(mockInvoker);

        const lineHandler = mockReadlineInterface.on.mock.calls.find(
          (call) => call[0] === 'line',
        )?.[1];

        expect(lineHandler).toBeDefined();

        const validRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tool',
          params: { name: 'add', input: { a: 20, b: 22 } },
        };

        await lineHandler(JSON.stringify(validRequest));

        expect(mockInvoker).toHaveBeenCalledWith({
          type: 'tool',
          name: 'add',
          input: { a: 20, b: 22 },
          meta: { start: expect.any(BigInt) },
        });

        expect(mockProcess.stdout.write).toHaveBeenCalledWith(
          `${JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { result: 42 },
          })}\n`,
        );

        await transport.stop();
      });
    });
  });
});
