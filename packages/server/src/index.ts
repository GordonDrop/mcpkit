import {
  Registry as CoreRegistry,
  createMcpRuntime,
  type ExecutionCtx,
  type McpRuntime,
  NameConflictError,
  type PromptSpec,
  type Registry,
  type ResourceSpec,
  s as schema,
  type ToolSpec,
  z,
} from '@mcpkit/core';

export { schema, z };

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

  use(middleware: unknown): McpServerBuilder;
  build(): McpRuntimeBundle;
}

export interface McpRuntimeBundle {
  registry: Registry;
  runtime: McpRuntime;
}

class McpServerBuilderImpl implements McpServerBuilder {
  private readonly pendingTools: ToolSpec[] = [];
  private readonly pendingPrompts: PromptSpec[] = [];
  private readonly pendingResources: ResourceSpec[] = [];

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

  use(_middleware: unknown): McpServerBuilder {
    return this;
  }

  build(): McpRuntimeBundle {
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

    return { registry, runtime };
  }
}

export function createMcpServer(_options?: unknown): McpServerBuilder {
  return new McpServerBuilderImpl();
}
