import type { Writable } from 'node:stream';

export interface NDJSONWriterOptions {
  replacer?: (key: string, value: unknown) => unknown;
  space?: string | number;
}

export class NDJSONWriter {
  private readonly stream: Writable;
  private readonly options: NDJSONWriterOptions;

  constructor(stream: Writable, options: NDJSONWriterOptions = {}) {
    this.stream = stream;
    this.options = options;
  }

  async write(obj: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const jsonString = JSON.stringify(obj, this.options.replacer, this.options.space);
        const line = `${jsonString}\n`;

        // Handle both real streams and simple mock objects
        if (typeof this.stream.write === 'function') {
          const success = this.stream.write(line);

          if (success || typeof this.stream.once !== 'function') {
            // Either write succeeded or this is a mock without event support
            resolve();
          } else {
            // Real stream with backpressure
            this.stream.once('drain', resolve);
            this.stream.once('error', reject);
          }
        } else {
          reject(new Error('Stream does not have a write method'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async end(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.end((error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  get writable(): boolean {
    return this.stream.writable;
  }

  get destroyed(): boolean {
    return this.stream.destroyed;
  }
}

export function ndjsonWriter(stream: Writable, options?: NDJSONWriterOptions): NDJSONWriter {
  return new NDJSONWriter(stream, options);
}
