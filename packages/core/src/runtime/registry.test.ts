import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { PromptSpec } from '../contracts/prompt';
import type { ResourceSpec } from '../contracts/resource';
import type { ToolSpec } from '../contracts/tool';
import { s } from '../schema/zod';
import { NameConflictError } from './errors';
import { Registry } from './registry';

describe('Registry', () => {
  let registry: Registry;

  beforeEach(() => {
    registry = new Registry();
  });

  describe('Tool management', () => {
    const mockTool: ToolSpec = {
      name: 'test-tool',
      description: 'A test tool',
      input: s(z.string()),
      output: s(z.string()),
      handler: async (input) => `processed: ${input}`,
    };

    it('should add a tool successfully', () => {
      registry.addTool(mockTool);

      expect(registry.hasTool('test-tool')).toBe(true);
      expect(registry.getTool('test-tool')).toBe(mockTool);
      expect(registry.getToolNames()).toContain('test-tool');
    });

    it('should throw NameConflictError when adding duplicate tool', () => {
      registry.addTool(mockTool);

      expect(() => registry.addTool(mockTool)).toThrow(NameConflictError);
      expect(() => registry.addTool(mockTool)).toThrow(
        "tool with name 'test-tool' already exists in registry",
      );
    });

    it('should return undefined for non-existent tool', () => {
      expect(registry.getTool('non-existent')).toBeUndefined();
      expect(registry.hasTool('non-existent')).toBe(false);
    });

    it('should return all tool names', () => {
      const tool1: ToolSpec = { ...mockTool, name: 'tool-1' };
      const tool2: ToolSpec = { ...mockTool, name: 'tool-2' };

      registry.addTool(tool1);
      registry.addTool(tool2);

      const names = registry.getToolNames();
      expect(names).toHaveLength(2);
      expect(names).toContain('tool-1');
      expect(names).toContain('tool-2');
    });
  });

  describe('Prompt management', () => {
    const mockPrompt: PromptSpec = {
      name: 'test-prompt',
      template: 'Hello {{name}}!',
      params: s(z.object({ name: z.string() })),
    };

    it('should add a prompt successfully', () => {
      registry.addPrompt(mockPrompt);

      expect(registry.hasPrompt('test-prompt')).toBe(true);
      expect(registry.getPrompt('test-prompt')).toBe(mockPrompt);
      expect(registry.getPromptNames()).toContain('test-prompt');
    });

    it('should throw NameConflictError when adding duplicate prompt', () => {
      registry.addPrompt(mockPrompt);

      expect(() => registry.addPrompt(mockPrompt)).toThrow(NameConflictError);
      expect(() => registry.addPrompt(mockPrompt)).toThrow(
        "prompt with name 'test-prompt' already exists in registry",
      );
    });

    it('should return undefined for non-existent prompt', () => {
      expect(registry.getPrompt('non-existent')).toBeUndefined();
      expect(registry.hasPrompt('non-existent')).toBe(false);
    });

    it('should return all prompt names', () => {
      const prompt1: PromptSpec = { ...mockPrompt, name: 'prompt-1' };
      const prompt2: PromptSpec = { ...mockPrompt, name: 'prompt-2' };

      registry.addPrompt(prompt1);
      registry.addPrompt(prompt2);

      const names = registry.getPromptNames();
      expect(names).toHaveLength(2);
      expect(names).toContain('prompt-1');
      expect(names).toContain('prompt-2');
    });
  });

  describe('Resource management', () => {
    const mockResource: ResourceSpec = {
      name: 'test-resource',
      uri: 'file:///test.txt',
      title: 'A test resource',
    };

    it('should add a resource successfully', () => {
      registry.addResource(mockResource);

      expect(registry.hasResource('test-resource')).toBe(true);
      expect(registry.getResource('test-resource')).toBe(mockResource);
      expect(registry.getResourceNames()).toContain('test-resource');
    });

    it('should throw NameConflictError when adding duplicate resource', () => {
      registry.addResource(mockResource);

      expect(() => registry.addResource(mockResource)).toThrow(NameConflictError);
      expect(() => registry.addResource(mockResource)).toThrow(
        "resource with name 'test-resource' already exists in registry",
      );
    });

    it('should return undefined for non-existent resource', () => {
      expect(registry.getResource('non-existent')).toBeUndefined();
      expect(registry.hasResource('non-existent')).toBe(false);
    });

    it('should return all resource names', () => {
      const resource1: ResourceSpec = { ...mockResource, name: 'resource-1' };
      const resource2: ResourceSpec = { ...mockResource, name: 'resource-2' };

      registry.addResource(resource1);
      registry.addResource(resource2);

      const names = registry.getResourceNames();
      expect(names).toHaveLength(2);
      expect(names).toContain('resource-1');
      expect(names).toContain('resource-2');
    });
  });

  describe('Clear functionality', () => {
    it('should clear all registered entities', () => {
      const mockTool: ToolSpec = {
        name: 'test-tool',
        input: s(z.string()),
        output: s(z.string()),
        handler: async () => 'result',
      };
      const mockPrompt: PromptSpec = {
        name: 'test-prompt',
        template: 'Hello!',
      };
      const mockResource: ResourceSpec = {
        name: 'test-resource',
        uri: 'file:///test.txt',
      };

      registry.addTool(mockTool);
      registry.addPrompt(mockPrompt);
      registry.addResource(mockResource);

      expect(registry.getToolNames()).toHaveLength(1);
      expect(registry.getPromptNames()).toHaveLength(1);
      expect(registry.getResourceNames()).toHaveLength(1);

      registry.clear();

      expect(registry.getToolNames()).toHaveLength(0);
      expect(registry.getPromptNames()).toHaveLength(0);
      expect(registry.getResourceNames()).toHaveLength(0);
      expect(registry.hasTool('test-tool')).toBe(false);
      expect(registry.hasPrompt('test-prompt')).toBe(false);
      expect(registry.hasResource('test-resource')).toBe(false);
    });
  });
});
