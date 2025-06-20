import type { PromptSpec } from '../contracts/prompt';
import type { ResourceSpec } from '../contracts/resource';
import type { ToolSpec } from '../contracts/tool';
import { NameConflictError } from './errors';

export class Registry {
  private readonly tools = new Map<string, ToolSpec>();
  private readonly prompts = new Map<string, PromptSpec>();
  private readonly resources = new Map<string, ResourceSpec>();

  addTool(tool: ToolSpec): void {
    if (this.tools.has(tool.name)) {
      throw new NameConflictError(tool.name, 'tool');
    }
    this.tools.set(tool.name, tool);
  }

  addPrompt(prompt: PromptSpec): void {
    if (this.prompts.has(prompt.name)) {
      throw new NameConflictError(prompt.name, 'prompt');
    }
    this.prompts.set(prompt.name, prompt);
  }

  addResource(resource: ResourceSpec): void {
    if (this.resources.has(resource.name)) {
      throw new NameConflictError(resource.name, 'resource');
    }
    this.resources.set(resource.name, resource);
  }

  getTool(name: string): ToolSpec | undefined {
    return this.tools.get(name);
  }

  getPrompt(name: string): PromptSpec | undefined {
    return this.prompts.get(name);
  }

  getResource(name: string): ResourceSpec | undefined {
    return this.resources.get(name);
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getPromptNames(): string[] {
    return Array.from(this.prompts.keys());
  }

  getResourceNames(): string[] {
    return Array.from(this.resources.keys());
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  hasPrompt(name: string): boolean {
    return this.prompts.has(name);
  }

  hasResource(name: string): boolean {
    return this.resources.has(name);
  }

  clear(): void {
    this.tools.clear();
    this.prompts.clear();
    this.resources.clear();
  }
}
