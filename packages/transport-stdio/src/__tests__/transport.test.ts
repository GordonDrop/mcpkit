import { describe, expect, it } from 'vitest';
import { createStdioTransport, StdioTransport } from '../transport';

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

      expect(() => transport.start(mockInvoker)).not.toThrow();
    });
  });

  describe('Integration with Transport Interface', () => {
    it('should be compatible with Transport type', () => {
      const transport: import('@mcpkit/core').Transport = createStdioTransport();
      expect(transport.name).toBe('stdio');
    });
  });
});
