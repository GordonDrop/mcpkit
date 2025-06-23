import { createInterface } from 'node:readline';
import type { Readable } from 'node:stream';
import { NDJSONParseError } from './errors';

export interface NDJSONReaderOptions {
  skipEmptyLines?: boolean;
}

export class NDJSONReader {
  private readonly stream: Readable;
  private readonly options: Required<NDJSONReaderOptions>;

  constructor(stream: Readable, options: NDJSONReaderOptions = {}) {
    this.stream = stream;
    this.options = {
      skipEmptyLines: options.skipEmptyLines ?? true,
    };
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<unknown> {
    const rl = createInterface({
      input: this.stream,
      crlfDelay: Number.POSITIVE_INFINITY,
    });

    let lineNumber = 0;

    try {
      for await (const line of rl) {
        lineNumber++;

        const trimmedLine = line.trim();

        if (!trimmedLine) {
          if (this.options.skipEmptyLines) {
            continue;
          } else {
            throw new NDJSONParseError(lineNumber, new Error('Empty line encountered'), line);
          }
        }

        try {
          yield JSON.parse(trimmedLine);
        } catch (error) {
          const parseError = error instanceof Error ? error : new Error(String(error));
          throw new NDJSONParseError(lineNumber, parseError, trimmedLine);
        }
      }
    } finally {
      rl.close();
    }
  }
}

export function ndjsonReader(stream: Readable, options?: NDJSONReaderOptions): NDJSONReader {
  return new NDJSONReader(stream, options);
}
