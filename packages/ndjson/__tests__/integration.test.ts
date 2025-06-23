import { PassThrough, Readable, Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { ndjsonReader, ndjsonWriter } from '../src';

describe('NDJSON Integration Tests', () => {
  describe('Reader and Writer together', () => {
    it('should round-trip data correctly', async () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { type: 'array', data: [1, 2, 3] },
        null,
        true,
        42,
        'string',
      ];

      const passThrough = new PassThrough();
      const writer = ndjsonWriter(passThrough);
      const reader = ndjsonReader(passThrough);

      const writePromises = data.map((item) => writer.write(item));
      await Promise.all(writePromises);
      await writer.end();

      const results = [];
      for await (const obj of reader) {
        results.push(obj);
      }

      expect(results).toEqual(data);
    });

    it('should handle large datasets', async () => {
      const dataSize = 1000;
      const data = Array.from({ length: dataSize }, (_, i) => ({
        id: i,
        value: `item-${i}`,
        timestamp: Date.now() + i,
      }));

      const passThrough = new PassThrough();
      const writer = ndjsonWriter(passThrough);
      const reader = ndjsonReader(passThrough);

      const writePromise = (async () => {
        for (const item of data) {
          await writer.write(item);
        }
        await writer.end();
      })();

      const readPromise = (async () => {
        const results = [];
        for await (const obj of reader) {
          results.push(obj);
        }
        return results;
      })();

      await writePromise;
      const results = await readPromise;

      expect(results).toHaveLength(dataSize);
      expect(results).toEqual(data);
    });

    it('should handle concurrent reads and writes', async () => {
      const passThrough = new PassThrough();
      const writer = ndjsonWriter(passThrough);
      const reader = ndjsonReader(passThrough);

      const data = [{ message: 'first' }, { message: 'second' }, { message: 'third' }];

      const results: unknown[] = [];
      const readPromise = (async () => {
        for await (const obj of reader) {
          results.push(obj);
        }
      })();

      for (const item of data) {
        await writer.write(item);
        await new Promise((resolve) => setImmediate(resolve));
      }
      await writer.end();

      await readPromise;
      expect(results).toEqual(data);
    });
  });

  describe('Stream compatibility', () => {
    it('should work with any Readable stream', async () => {
      const content = '{"a":1}\n{"b":2}\n{"c":3}\n';
      const readable = Readable.from([content]);
      const reader = ndjsonReader(readable);

      const results = [];
      for await (const obj of reader) {
        results.push(obj);
      }

      expect(results).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    });

    it('should work with any Writable stream', async () => {
      const chunks: string[] = [];
      const writable = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(chunk.toString());
          callback();
        },
      });

      const writer = ndjsonWriter(writable);
      await writer.write({ test: 'data' });
      await writer.write({ another: 'object' });

      expect(chunks).toEqual(['{"test":"data"}\n', '{"another":"object"}\n']);
    });
  });

  describe('Error handling in integration', () => {
    it('should handle reader errors without affecting writer', async () => {
      const passThrough = new PassThrough();
      const writer = ndjsonWriter(passThrough);

      await writer.write({ valid: 'data' });
      passThrough.write('invalid json\n');
      await writer.write({ more: 'valid data' });
      await writer.end();

      const reader = ndjsonReader(passThrough);
      const results = [];
      let errorCount = 0;

      try {
        for await (const obj of reader) {
          results.push(obj);
        }
      } catch (error) {
        errorCount++;
        expect(error.message).toContain('NDJSON parse error');
      }

      expect(errorCount).toBe(1);
      expect(results).toEqual([{ valid: 'data' }]);
    });
  });
});
