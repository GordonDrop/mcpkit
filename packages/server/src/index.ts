import {
  Registry as CoreRegistry,
  createMcpRuntime,
  type ExecutionCtx,
  type McpRuntime,
  type PromptSpec,
  type Registry,
  type ResourceSpec,
  s as schema,
  type ToolSpec,
  type Transport,
  z,
} from '@mcpkit/core';
import { composeMiddlewares } from './internal/compose';
import { errorWrapperMiddleware } from './middleware/builtin-error-wrapper';
import type { CallCtx, InvokeFn, Middleware } from './middleware/types';
import type { Plugin } from './plugin/index';
import { createDefaultStdIo } from './transport-default';

export { schema, z };

export type { Middleware } from './middleware/types';
export type { Plugin } from './plugin';
export { createDefaultStdIo } from './transport-default';

interface PendingPlugin {
  fn: Plugin<unknown>;
  options?: unknown;
}

export interface McpServerBuilder {
  tool<I, O>(name: string, definition: Omit<ToolSpec<I, O>, 'name'>): McpServerBuilder;

  prompt<P>(
    name: string,
    template: string,
    metadata?: Partial<Omit<PromptSpec<P>, 'name' | 'template'>>,
  ): McpServerBuilder;

  resource(
    name: string,
    uri: string,
    metadata?: Partial<Omit<ResourceSpec, 'name' | 'uri'>>,
  ): McpServerBuilder;

  use(middleware: Middleware): McpServerBuilder;
  register<T>(plugin: Plugin<T>, options?: T): McpServerBuilder;
  transport(transport: Transport): McpServerBuilder;
  build(): McpRuntimeBundle;
  listen(options?: { signal?: AbortSignal }): Promise<void>;
}

export interface McpRuntimeBundle {
  registry: Registry;
  runtime: McpRuntime;
  invoke: InvokeFn;
}

class McpServerBuilderImpl implements McpServerBuilder {
  private readonly pendingTools: ToolSpec[] = [];
  private readonly pendingPrompts: PromptSpec[] = [];
  private readonly pendingResources: ResourceSpec[] = [];
  private readonly pendingMiddlewares: Middleware[] = [];
  private readonly pendingPlugins: PendingPlugin[] = [];
  private selectedTransport?: Transport;
  private builtBundle?: McpRuntimeBundle;

  tool<I, O>(name: string, definition: Omit<ToolSpec<I, O>, 'name'>): McpServerBuilder {
    const tool: ToolSpec<I, O> = {
      name,
      ...definition,
    };
    this.pendingTools.push(tool);
    return this;
  }

  prompt<P>(
    name: string,
    template: string,
    metadata?: Partial<Omit<PromptSpec<P>, 'name' | 'template'>>,
  ): McpServerBuilder {
    const prompt: PromptSpec<P> = {
      name,
      template,
      ...metadata,
    };
    this.pendingPrompts.push(prompt);
    return this;
  }

  resource(
    name: string,
    uri: string,
    metadata?: Partial<Omit<ResourceSpec, 'name' | 'uri'>>,
  ): McpServerBuilder {
    const resource: ResourceSpec = {
      name,
      uri,
      ...metadata,
    };
    this.pendingResources.push(resource);
    return this;
  }

  use(middleware: Middleware): McpServerBuilder {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function');
    }
    this.pendingMiddlewares.push(middleware);
    return this;
  }

  register<T>(plugin: Plugin<T>, options?: T): McpServerBuilder {
    this.pendingPlugins.push({ fn: plugin as Plugin<unknown>, options });
    return this;
  }

  transport(transport: Transport): McpServerBuilder {
    if (this.selectedTransport) {
      throw new Error('Transport can only be set once');
    }
    this.selectedTransport = transport;
    return this;
  }

  async listen(options?: { signal?: AbortSignal }): Promise<void> {
    if (!this.builtBundle) {
      this.builtBundle = this.build();
    }

    const transport = this.selectedTransport || createDefaultStdIo();

    const handleAbort = () => {
      if (transport.stop) {
        transport.stop().catch(console.error);
      }
    };

    if (options?.signal) {
      options.signal.addEventListener('abort', handleAbort);
    }

    try {
      await transport.start(this.builtBundle.invoke);
    } finally {
      if (options?.signal) {
        options.signal.removeEventListener('abort', handleAbort);
      }
    }
  }

  build(): McpRuntimeBundle {
    for (const pluginEntry of this.pendingPlugins) {
      pluginEntry.fn(this, pluginEntry.options);
    }

    this.pendingMiddlewares.push(errorWrapperMiddleware);

    const registry = new CoreRegistry();

    const allNames = new Set<string>();

    for (const tool of this.pendingTools) {
      allNames.add(tool.name);
      registry.addTool(tool);
    }

    for (const prompt of this.pendingPrompts) {
      allNames.add(prompt.name);
      registry.addPrompt(prompt);
    }

    for (const resource of this.pendingResources) {
      allNames.add(resource.name);
      registry.addResource(resource);
    }

    const executionCtx: ExecutionCtx = {
      logger: {
        info: (obj: object, msg?: string) => console.log(msg || '', obj),
        warn: (obj: object, msg?: string) => console.warn(msg || '', obj),
        error: (obj: object, msg?: string) => console.error(msg || '', obj),
        debug: (obj: object, msg?: string) => console.debug(msg || '', obj),
      },
      version: '1.0.0',
    };

    const runtime = createMcpRuntime(registry, executionCtx);

    const coreInvoker: InvokeFn = async (ctx: CallCtx) => {
      switch (ctx.type) {
        case 'tool': {
          const result = await runtime.executeTool(ctx.name, ctx.input);
          return { content: result };
        }
        case 'prompt': {
          const result = await runtime.renderPrompt(ctx.name, ctx.input);
          return { content: result };
        }
        case 'resource': {
          const result = await runtime.getResource(ctx.name);
          return { content: result };
        }
        default: {
          throw new Error(`Unknown operation type: ${ctx.type}`);
        }
      }
    };

    const wrappedInvoker = composeMiddlewares(this.pendingMiddlewares, coreInvoker);

    return { registry, runtime, invoke: wrappedInvoker };
  }
}

export function createMcpServer(_options?: unknown): McpServerBuilder {
  return new McpServerBuilderImpl();
}
