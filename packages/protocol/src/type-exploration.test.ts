import { describe, expect, it } from 'vitest';
import type { Prompt, Resource, SchemaJSON, TextContent, Tool } from '../src/index.js';

describe('Protocol Types', () => {
  describe('Tool type compatibility', () => {
    it('should create valid Tool objects', () => {
      const tool: Tool = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            input: { type: 'string' },
          },
          required: ['input'],
        },
      };

      expect(tool.name).toBe('test-tool');
      expect(tool.description).toBe('A test tool');
      expect(tool.inputSchema.type).toBe('object');
    });

    it('should support optional fields', () => {
      const tool: Tool = {
        name: 'minimal-tool',
        description: 'Minimal tool',
        inputSchema: { type: 'object' },
      };

      expect(tool.name).toBe('minimal-tool');
    });
  });

  describe('Prompt type compatibility', () => {
    it('should create valid Prompt objects', () => {
      const prompt: Prompt = {
        name: 'test-prompt',
        description: 'A test prompt',
        arguments: [
          {
            name: 'param1',
            description: 'First parameter',
            required: true,
          },
        ],
      };

      expect(prompt.name).toBe('test-prompt');
      expect(prompt.arguments).toHaveLength(1);
      expect(prompt.arguments?.[0]?.required).toBe(true);
    });

    it('should support prompts without arguments', () => {
      const prompt: Prompt = {
        name: 'simple-prompt',
        description: 'Simple prompt',
      };

      expect(prompt.name).toBe('simple-prompt');
      expect(prompt.arguments).toBeUndefined();
    });
  });

  describe('Resource type compatibility', () => {
    it('should create valid Resource objects', () => {
      const resource: Resource = {
        name: 'test-resource',
        uri: 'file://test.txt',
        description: 'A test resource',
      };

      expect(resource.name).toBe('test-resource');
      expect(resource.uri).toBe('file://test.txt');
      expect(resource.description).toBe('A test resource');
    });
  });

  describe('Content types', () => {
    it('should support TextContent', () => {
      const textContent: TextContent = {
        type: 'text',
        text: 'Hello world',
      };

      expect(textContent.type).toBe('text');
      expect(textContent.text).toBe('Hello world');
    });
  });

  describe('SchemaJSON type alias', () => {
    it('should accept any object structure', () => {
      const schema: SchemaJSON = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };

      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
    });
  });
});
