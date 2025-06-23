import { createInterface } from 'node:readline';
import type { Transport } from '@mcpkit/core';
import { ndjsonWriter } from '@mcpkit/ndjson';

type InvokeFn = (ctx: {
  type: 'tool' | 'prompt' | 'resource';
  name: string;
  input: unknown;
  meta: { start: bigint };
}) => Promise<{ content: unknown; isError?: boolean }>;

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

const JSON_RPC_ERRORS = {
  PARSE_ERROR: { code: -32700, message: 'Parse error' },
  INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
  METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' },
} as const;

export class StdioTransport implements Transport {
  readonly name = 'stdio' as const;
  private abortController?: AbortController;
  private writer = ndjsonWriter(process.stdout);

  async start(invoker: InvokeFn): Promise<void> {
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    const cleanup = () => {
      rl.close();
    };

    signal.addEventListener('abort', cleanup);
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());

    return new Promise<void>((resolve, reject) => {
      rl.on('line', async (line) => {
        try {
          const trimmedLine = line.trim();
          if (!trimmedLine) return;

          let request: JsonRpcRequest;
          try {
            request = JSON.parse(trimmedLine);
          } catch {
            await this.sendError(null, JSON_RPC_ERRORS.PARSE_ERROR);
            return;
          }

          if (!this.isValidJsonRpcRequest(request)) {
            await this.sendError(null, JSON_RPC_ERRORS.INVALID_REQUEST);
            return;
          }

          if (request.method !== 'tool') {
            await this.sendError(request.id ?? null, JSON_RPC_ERRORS.METHOD_NOT_FOUND);
            return;
          }

          try {
            const params = request.params as { name?: string; input?: unknown } | undefined;
            if (!params || typeof params.name !== 'string') {
              await this.sendError(request.id ?? null, JSON_RPC_ERRORS.INVALID_PARAMS);
              return;
            }

            const ctx = {
              type: 'tool' as const,
              name: params.name,
              input: params.input,
              meta: { start: process.hrtime.bigint() },
            };

            const result = await invoker(ctx);

            if (result.isError) {
              await this.sendError(request.id ?? null, {
                code: JSON_RPC_ERRORS.INTERNAL_ERROR.code,
                message: 'Tool execution failed',
                data: result.content,
              });
            } else {
              await this.sendResponse(request.id ?? null, result.content);
            }
          } catch (error) {
            await this.sendError(request.id ?? null, {
              code: JSON_RPC_ERRORS.INTERNAL_ERROR.code,
              message: 'Internal error',
              data: error instanceof Error ? error.message : String(error),
            });
          }
        } catch (error) {
          await this.sendError(null, {
            code: JSON_RPC_ERRORS.INTERNAL_ERROR.code,
            message: 'Unexpected error',
            data: error instanceof Error ? error.message : String(error),
          });
        }
      });

      rl.on('close', () => {
        resolve();
      });

      rl.on('error', (error) => {
        reject(error);
      });

      process.stdin.on('end', () => {
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  private isValidJsonRpcRequest(obj: unknown): obj is JsonRpcRequest {
    if (typeof obj !== 'object' || obj === null) return false;
    const req = obj as Record<string, unknown>;
    return (
      req.jsonrpc === '2.0' &&
      typeof req.method === 'string' &&
      (req.id === undefined ||
        typeof req.id === 'string' ||
        typeof req.id === 'number' ||
        req.id === null)
    );
  }

  private async sendResponse(id: string | number | null, result: unknown): Promise<void> {
    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id,
      result,
    };
    await this.writer.write(response);
  }

  private async sendError(id: string | number | null, error: JsonRpcError): Promise<void> {
    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id,
      error,
    };
    await this.writer.write(response);
  }
}

export function createStdioTransport(): Transport {
  return new StdioTransport();
}
