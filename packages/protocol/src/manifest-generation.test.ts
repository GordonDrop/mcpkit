import { describe, expect, it } from 'vitest';
import type { Manifest } from '../src/index.js';
import { validateManifest } from '../src/index.js';

describe('Manifest Generation', () => {
  describe('validateManifest', () => {
    it('should validate a complete manifest', () => {
      const manifest: Manifest = {
        tools: [
          {
            name: 'test-tool',
            description: 'A test tool',
            inputSchema: {
              type: 'object',
              properties: {
                input: { type: 'string' },
              },
              required: ['input'],
            },
          },
        ],
        prompts: [
          {
            name: 'test-prompt',
            description: 'A test prompt',
            arguments: [
              {
                name: 'param1',
                description: 'First parameter',
                required: true,
              },
            ],
          },
        ],
        resources: [
          {
            name: 'test-resource',
            uri: 'file://test.txt',
            description: 'A test resource',
          },
        ],
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
        implementation: {
          name: 'mcpkit-server',
          version: '0.1.0',
        },
      };

      expect(validateManifest(manifest)).toBe(true);
    });

    it('should validate minimal manifest', () => {
      const manifest: Manifest = {
        tools: [],
        prompts: [],
        resources: [],
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
        implementation: {
          name: 'test-server',
          version: '1.0.0',
        },
      };

      expect(validateManifest(manifest)).toBe(true);
    });

    it('should reject invalid manifest - missing tools array', () => {
      const manifest = {
        prompts: [],
        resources: [],
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
        implementation: {
          name: 'test-server',
          version: '1.0.0',
        },
      } as any;

      expect(validateManifest(manifest)).toBe(false);
    });

    it('should reject invalid manifest - missing implementation name', () => {
      const manifest = {
        tools: [],
        prompts: [],
        resources: [],
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
        implementation: {
          version: '1.0.0',
        },
      } as any;

      expect(validateManifest(manifest)).toBe(false);
    });

    it('should reject invalid manifest - null input', () => {
      expect(validateManifest(null as any)).toBe(false);
    });

    it('should reject invalid manifest - undefined input', () => {
      expect(validateManifest(undefined as any)).toBe(false);
    });

    it('should reject invalid manifest - non-object input', () => {
      expect(validateManifest('invalid' as any)).toBe(false);
    });

    it('should handle exceptions gracefully', () => {
      const manifest = {
        get tools() {
          throw new Error('Test error');
        },
      } as any;

      expect(validateManifest(manifest)).toBe(false);
    });
  });

  describe('Manifest structure validation', () => {
    it('should accept manifest with complex tool schemas', () => {
      const manifest: Manifest = {
        tools: [
          {
            name: 'complex-tool',
            description: 'A complex tool',
            inputSchema: {
              type: 'object',
              properties: {
                config: {
                  type: 'object',
                  properties: {
                    mode: { type: 'string', enum: ['fast', 'slow'] },
                    count: { type: 'number', minimum: 1 },
                  },
                  required: ['mode'],
                },
                items: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
              required: ['config'],
            },
          },
        ],
        prompts: [],
        resources: [],
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
        implementation: {
          name: 'complex-server',
          version: '2.0.0',
        },
      };

      expect(validateManifest(manifest)).toBe(true);
    });

    it('should accept manifest with multiple prompts with different argument structures', () => {
      const manifest: Manifest = {
        tools: [],
        prompts: [
          {
            name: 'no-args-prompt',
            description: 'Prompt without arguments',
          },
          {
            name: 'single-arg-prompt',
            description: 'Prompt with one argument',
            arguments: [
              {
                name: 'message',
                description: 'The message to display',
                required: true,
              },
            ],
          },
          {
            name: 'multi-arg-prompt',
            description: 'Prompt with multiple arguments',
            arguments: [
              {
                name: 'title',
                description: 'The title',
                required: true,
              },
              {
                name: 'subtitle',
                description: 'The subtitle',
                required: false,
              },
            ],
          },
        ],
        resources: [],
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
        implementation: {
          name: 'prompt-server',
          version: '1.5.0',
        },
      };

      expect(validateManifest(manifest)).toBe(true);
    });
  });
});
