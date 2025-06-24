import { describe, expect, it } from 'vitest';
import { renderPrompt } from '../src/index.js';

describe('Prompt Rendering', () => {
  describe('renderPrompt utility', () => {
    it('should render simple template with single parameter', () => {
      const template = 'Hello {{name}}!';
      const renderer = renderPrompt(template);
      const result = renderer({ name: 'World' });

      expect(result).toBe('Hello World!');
    });

    it('should render template with multiple parameters', () => {
      const template = 'Hello {{name}}, you are {{age}} years old.';
      const renderer = renderPrompt(template);
      const result = renderer({ name: 'Alice', age: 30 });

      expect(result).toBe('Hello Alice, you are 30 years old.');
    });

    it('should handle missing parameters by leaving placeholders', () => {
      const template = 'Hello {{name}}, welcome to {{place}}!';
      const renderer = renderPrompt(template);
      const result = renderer({ name: 'Bob' });

      expect(result).toBe('Hello Bob, welcome to {{place}}!');
    });

    it('should handle empty parameters object', () => {
      const template = 'Hello {{name}}!';
      const renderer = renderPrompt(template);
      const result = renderer({});

      expect(result).toBe('Hello {{name}}!');
    });

    it('should handle template without placeholders', () => {
      const template = 'Hello World!';
      const renderer = renderPrompt(template);
      const result = renderer({ name: 'Alice' });

      expect(result).toBe('Hello World!');
    });

    it('should convert non-string values to strings', () => {
      const template = 'Count: {{count}}, Active: {{active}}';
      const renderer = renderPrompt(template);
      const result = renderer({ count: 42, active: true });

      expect(result).toBe('Count: 42, Active: true');
    });

    it('should handle null and undefined values', () => {
      const template = 'Value: {{value}}, Other: {{other}}';
      const renderer = renderPrompt(template);
      const result = renderer({ value: null, other: undefined });

      expect(result).toBe('Value: null, Other: {{other}}');
    });

    it('should handle zero values correctly', () => {
      const template = 'Count: {{count}}';
      const renderer = renderPrompt(template);
      const result = renderer({ count: 0 });

      expect(result).toBe('Count: 0');
    });

    it('should handle empty string values', () => {
      const template = 'Message: "{{message}}"';
      const renderer = renderPrompt(template);
      const result = renderer({ message: '' });

      expect(result).toBe('Message: ""');
    });

    it('should handle complex object values by stringifying', () => {
      const template = 'Data: {{data}}';
      const renderer = renderPrompt(template);
      const result = renderer({ data: { key: 'value', num: 123 } });

      expect(result).toBe('Data: [object Object]');
    });

    it('should handle array values by stringifying', () => {
      const template = 'Items: {{items}}';
      const renderer = renderPrompt(template);
      const result = renderer({ items: ['a', 'b', 'c'] });

      expect(result).toBe('Items: a,b,c');
    });

    it('should handle multiple occurrences of same placeholder', () => {
      const template = '{{name}} said: "Hello {{name}}!"';
      const renderer = renderPrompt(template);
      const result = renderer({ name: 'Alice' });

      expect(result).toBe('Alice said: "Hello Alice!"');
    });

    it('should handle placeholders with numbers and underscores', () => {
      const template = 'User {{user_id}} has {{item_count}} items';
      const renderer = renderPrompt(template);
      const result = renderer({ user_id: 123, item_count: 5 });

      expect(result).toBe('User 123 has 5 items');
    });

    it('should not replace invalid placeholder patterns', () => {
      const template = 'Invalid: {{}} and {{123}} and {{user-name}}';
      const renderer = renderPrompt(template);
      const result = renderer({ '': 'empty', '123': 'number', 'user-name': 'hyphen' });

      // The regex \w+ matches word characters, so {{123}} will match and be replaced
      // but {{}} and {{user-name}} won't match because they don't contain valid \w+ patterns
      expect(result).toBe('Invalid: {{}} and number and {{user-name}}');
    });

    it('should handle nested braces correctly', () => {
      const template = 'Code: {{{code}}}';
      const renderer = renderPrompt(template);
      const result = renderer({ code: 'function()' });

      expect(result).toBe('Code: {function()}');
    });
  });

  describe('renderPrompt function reusability', () => {
    it('should create reusable renderer functions', () => {
      const template = 'Hello {{name}}!';
      const renderer = renderPrompt(template);

      const result1 = renderer({ name: 'Alice' });
      const result2 = renderer({ name: 'Bob' });

      expect(result1).toBe('Hello Alice!');
      expect(result2).toBe('Hello Bob!');
    });

    it('should create independent renderer functions', () => {
      const template1 = 'Hello {{name}}!';
      const template2 = 'Goodbye {{name}}!';

      const renderer1 = renderPrompt(template1);
      const renderer2 = renderPrompt(template2);

      const result1 = renderer1({ name: 'Alice' });
      const result2 = renderer2({ name: 'Alice' });

      expect(result1).toBe('Hello Alice!');
      expect(result2).toBe('Goodbye Alice!');
    });
  });
});
