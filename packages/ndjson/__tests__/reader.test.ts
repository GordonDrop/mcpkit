import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { NDJSONParseError } from '../src/errors';
import { NDJSONReader, ndjsonReader } from '../src/reader';

function createReadableStream(lines: string[]): Readable {
  const content = lines.join('\n');
  return Readable.from([content]);
}

describe('NDJSONReader', () => {
  describe('constructor', () => {
    it('should create reader with default options', () => {
      const stream = createReadableStream([]);
      const reader = new NDJSONReader(stream);

      expect(reader).toBeInstanceOf(NDJSONReader);
    });

    it('should accept custom options', () => {
      const stream = createReadableStream([]);
      const reader = new NDJSONReader(stream, { skipEmptyLines: false });

      expect(reader).toBeInstanceOf(NDJSONReader);
    });
  });

  describe('async iteration', () => {
    it('should parse valid NDJSON lines', async () => {
      const lines = [
        '{"name": "Alice", "age": 30}',
        '{"name": "Bob", "age": 25}',
        '{"type": "array", "data": [1, 2, 3]}',
      ];
      const stream = createReadableStream(lines);
      const reader = ndjsonReader(stream);

      const results = [];
      for await (const obj of reader) {
        results.push(obj);
      }

      expect(results).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { type: 'array', data: [1, 2, 3] },
      ]);
    });

    it('should skip empty lines by default', async () => {
      const lines = ['{"first": true}', '', '   ', '{"second": true}'];
      const stream = createReadableStream(lines);
      const reader = ndjsonReader(stream);

      const results = [];
      for await (const obj of reader) {
        results.push(obj);
      }

      expect(results).toEqual([{ first: true }, { second: true }]);
    });

    it('should throw error for empty lines when skipEmptyLines is false', async () => {
      const lines = ['{"valid": true}', '', '{"also": "valid"}'];
      const stream = createReadableStream(lines);
      const reader = ndjsonReader(stream, { skipEmptyLines: false });

      const iterator = reader[Symbol.asyncIterator]();

      await expect(iterator.next()).resolves.toEqual({
        done: false,
        value: { valid: true },
      });

      await expect(iterator.next()).rejects.toThrow(NDJSONParseError);
    });

    it('should throw NDJSONParseError for malformed JSON', async () => {
      const lines = ['{"valid": true}', '{"invalid": json}', '{"never": "reached"}'];
      const stream = createReadableStream(lines);
      const reader = ndjsonReader(stream);

      const iterator = reader[Symbol.asyncIterator]();

      await expect(iterator.next()).resolves.toEqual({
        done: false,
        value: { valid: true },
      });

      await expect(iterator.next()).rejects.toThrow(NDJSONParseError);
    });

    it('should provide detailed error information', async () => {
      const lines = ['{"invalid": json}'];
      const stream = createReadableStream(lines);
      const reader = ndjsonReader(stream);

      try {
        for await (const _obj of reader) {
          // Should not reach here
        }
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(NDJSONParseError);
        const ndjsonError = error as NDJSONParseError;
        expect(ndjsonError.lineNumber).toBe(1);
        expect(ndjsonError.partialContent).toBe('{"invalid": json}');
        expect(ndjsonError.originalError).toBeInstanceOf(Error);
      }
    });

    it('should handle different JSON types', async () => {
      const lines = ['null', 'true', 'false', '42', '"string"', '[]', '{}'];
      const stream = createReadableStream(lines);
      const reader = ndjsonReader(stream);

      const results = [];
      for await (const obj of reader) {
        results.push(obj);
      }

      expect(results).toEqual([null, true, false, 42, 'string', [], {}]);
    });

    it('should handle empty stream', async () => {
      const stream = createReadableStream([]);
      const reader = ndjsonReader(stream);

      const results = [];
      for await (const obj of reader) {
        results.push(obj);
      }

      expect(results).toEqual([]);
    });
  });
});

describe('ndjsonReader factory function', () => {
  it('should create NDJSONReader instance', () => {
    const stream = createReadableStream([]);
    const reader = ndjsonReader(stream);

    expect(reader).toBeInstanceOf(NDJSONReader);
  });

  it('should pass options to constructor', () => {
    const stream = createReadableStream([]);
    const reader = ndjsonReader(stream, { skipEmptyLines: false });

    expect(reader).toBeInstanceOf(NDJSONReader);
  });
});
