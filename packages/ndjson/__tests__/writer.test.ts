import { Writable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import { NDJSONWriter, ndjsonWriter } from '../src/writer';

class MockWritable extends Writable {
  public chunks: string[] = [];
  public writeCalls: Array<{ chunk: string; callback?: () => void }> = [];
  public shouldDrain = false;
  public endCalled = false;

  _write(chunk: Buffer | string, _encoding: string, callback: () => void): void {
    const chunkStr = chunk.toString();
    this.chunks.push(chunkStr);
    this.writeCalls.push({ chunk: chunkStr, callback });

    if (this.shouldDrain) {
      setImmediate(() => {
        this.emit('drain');
        callback();
      });
      return;
    }

    callback();
  }

  write(chunk: string): boolean {
    this._write(chunk, 'utf8', () => {});
    return !this.shouldDrain;
  }

  end(callback?: () => void): this {
    this.endCalled = true;
    if (callback) {
      setImmediate(callback);
    }
    return this;
  }
}

describe('NDJSONWriter', () => {
  describe('constructor', () => {
    it('should create writer with default options', () => {
      const stream = new MockWritable();
      const writer = new NDJSONWriter(stream);

      expect(writer).toBeInstanceOf(NDJSONWriter);
    });

    it('should accept custom options', () => {
      const stream = new MockWritable();
      const writer = new NDJSONWriter(stream, { space: 2 });

      expect(writer).toBeInstanceOf(NDJSONWriter);
    });
  });

  describe('write method', () => {
    it('should write JSON objects with newlines', async () => {
      const stream = new MockWritable();
      const writer = ndjsonWriter(stream);

      await writer.write({ name: 'Alice', age: 30 });
      await writer.write({ name: 'Bob', age: 25 });

      expect(stream.chunks).toEqual(['{"name":"Alice","age":30}\n', '{"name":"Bob","age":25}\n']);
    });

    it('should handle different data types', async () => {
      const stream = new MockWritable();
      const writer = ndjsonWriter(stream);

      await writer.write(null);
      await writer.write(true);
      await writer.write(42);
      await writer.write('string');
      await writer.write([1, 2, 3]);
      await writer.write({});

      expect(stream.chunks).toEqual([
        'null\n',
        'true\n',
        '42\n',
        '"string"\n',
        '[1,2,3]\n',
        '{}\n',
      ]);
    });

    it('should use custom replacer function', async () => {
      const stream = new MockWritable();
      const replacer = (key: string, value: unknown) => {
        if (key === 'password') return '[REDACTED]';
        return value;
      };
      const writer = ndjsonWriter(stream, { replacer });

      await writer.write({ username: 'alice', password: 'secret123' });

      expect(stream.chunks).toEqual(['{"username":"alice","password":"[REDACTED]"}\n']);
    });

    it('should use custom space formatting', async () => {
      const stream = new MockWritable();
      const writer = ndjsonWriter(stream, { space: 2 });

      await writer.write({ name: 'Alice', nested: { value: 42 } });

      expect(stream.chunks[0]).toBe(
        '{\n  "name": "Alice",\n  "nested": {\n    "value": 42\n  }\n}\n',
      );
    });

    it('should handle backpressure correctly', async () => {
      const stream = new MockWritable();
      stream.shouldDrain = true;
      const writer = ndjsonWriter(stream);

      const writePromise = writer.write({ test: 'data' });

      expect(stream.chunks).toEqual(['{"test":"data"}\n']);
      await writePromise;
    });

    it('should reject on JSON serialization error', async () => {
      const stream = new MockWritable();
      const writer = ndjsonWriter(stream);

      const circular: any = {};
      circular.self = circular;

      await expect(writer.write(circular)).rejects.toThrow();
    });
  });

  describe('end method', () => {
    it('should end the stream', async () => {
      const stream = new MockWritable();
      const writer = ndjsonWriter(stream);

      await writer.end();

      expect(stream.endCalled).toBe(true);
    });

    it('should handle stream end errors', async () => {
      const stream = new MockWritable();
      stream.end = vi.fn((callback?: () => void) => {
        if (callback) {
          setImmediate(() => callback());
        }
        return stream;
      });
      const writer = ndjsonWriter(stream);

      await writer.end();

      expect(stream.end).toHaveBeenCalled();
    });
  });

  describe('properties', () => {
    it('should expose writable property', () => {
      const stream = new MockWritable();
      const writer = ndjsonWriter(stream);

      expect(writer.writable).toBe(stream.writable);
    });

    it('should expose destroyed property', () => {
      const stream = new MockWritable();
      const writer = ndjsonWriter(stream);

      expect(writer.destroyed).toBe(stream.destroyed);
    });
  });
});

describe('ndjsonWriter factory function', () => {
  it('should create NDJSONWriter instance', () => {
    const stream = new MockWritable();
    const writer = ndjsonWriter(stream);

    expect(writer).toBeInstanceOf(NDJSONWriter);
  });

  it('should pass options to constructor', () => {
    const stream = new MockWritable();
    const writer = ndjsonWriter(stream, { space: 2 });

    expect(writer).toBeInstanceOf(NDJSONWriter);
  });
});
