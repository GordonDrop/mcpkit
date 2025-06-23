import { describe, expect, it } from 'vitest';
import { NDJSONParseError } from '../src/errors';

describe('NDJSONParseError', () => {
  describe('constructor', () => {
    it('should create error with all required properties', () => {
      const originalError = new Error('Invalid JSON');
      const lineNumber = 5;
      const partialContent = '{"invalid": json}';

      const error = new NDJSONParseError(lineNumber, originalError, partialContent);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NDJSONParseError);
      expect(error.name).toBe('NDJSONParseError');
      expect(error.lineNumber).toBe(lineNumber);
      expect(error.originalError).toBe(originalError);
      expect(error.partialContent).toBe(partialContent);
      expect(error.message).toBe('NDJSON parse error at line 5: Invalid JSON');
    });

    it('should accept custom message', () => {
      const originalError = new Error('Invalid JSON');
      const customMessage = 'Custom error message';

      const error = new NDJSONParseError(1, originalError, '{}', customMessage);

      expect(error.message).toBe(customMessage);
    });

    it('should have proper stack trace', () => {
      const originalError = new Error('Invalid JSON');
      const error = new NDJSONParseError(1, originalError, '{}');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NDJSONParseError');
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON object', () => {
      const originalError = new Error('Invalid JSON');
      const error = new NDJSONParseError(3, originalError, '{"test": }');

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'NDJSONParseError',
        message: 'NDJSON parse error at line 3: Invalid JSON',
        lineNumber: 3,
        originalError: {
          name: 'Error',
          message: 'Invalid JSON',
        },
        partialContent: '{"test": }',
      });
    });

    it('should handle different error types', () => {
      const originalError = new SyntaxError('Unexpected token');
      const error = new NDJSONParseError(1, originalError, 'invalid');

      const json = error.toJSON();

      expect(json.originalError).toEqual({
        name: 'SyntaxError',
        message: 'Unexpected token',
      });
    });
  });

  describe('error inheritance', () => {
    it('should be catchable as Error', () => {
      const originalError = new Error('Test');
      const error = new NDJSONParseError(1, originalError, '{}');

      expect(() => {
        throw error;
      }).toThrow(Error);
    });

    it('should be catchable as NDJSONParseError', () => {
      const originalError = new Error('Test');
      const error = new NDJSONParseError(1, originalError, '{}');

      expect(() => {
        throw error;
      }).toThrow(NDJSONParseError);
    });
  });
});
