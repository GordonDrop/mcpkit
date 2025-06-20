import { describe, expect, it } from 'vitest';
import {
  ExecutionFailure,
  InvalidInputError,
  NameConflictError,
  PromptNotFoundError,
  ResourceNotFoundError,
  RuntimeError,
  ToolNotFoundError,
} from './errors';

describe('Runtime Errors', () => {
  describe('ToolNotFoundError', () => {
    it('should create error with correct message and code', () => {
      const error = new ToolNotFoundError('my-tool');

      expect(error).toBeInstanceOf(RuntimeError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ToolNotFoundError');
      expect(error.code).toBe('TOOL_NOT_FOUND');
      expect(error.message).toBe("Tool 'my-tool' not found in registry");
    });
  });

  describe('PromptNotFoundError', () => {
    it('should create error with correct message and code', () => {
      const error = new PromptNotFoundError('my-prompt');

      expect(error).toBeInstanceOf(RuntimeError);
      expect(error.name).toBe('PromptNotFoundError');
      expect(error.code).toBe('PROMPT_NOT_FOUND');
      expect(error.message).toBe("Prompt 'my-prompt' not found in registry");
    });
  });

  describe('ResourceNotFoundError', () => {
    it('should create error with correct message and code', () => {
      const error = new ResourceNotFoundError('my-resource');

      expect(error).toBeInstanceOf(RuntimeError);
      expect(error.name).toBe('ResourceNotFoundError');
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.message).toBe("Resource 'my-resource' not found in registry");
    });
  });

  describe('InvalidInputError', () => {
    it('should create error with correct message and code for tool', () => {
      const validationError = new Error('Invalid field: name');
      const error = new InvalidInputError('my-tool', 'tool', validationError);

      expect(error).toBeInstanceOf(RuntimeError);
      expect(error.name).toBe('InvalidInputError');
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.message).toBe("Invalid input for tool 'my-tool': Invalid field: name");
      expect(error.cause).toBe(validationError);
    });

    it('should create error with correct message and code for prompt', () => {
      const validationError = new Error('Missing required parameter');
      const error = new InvalidInputError('my-prompt', 'prompt', validationError);

      expect(error.message).toBe(
        "Invalid input for prompt 'my-prompt': Missing required parameter",
      );
      expect(error.cause).toBe(validationError);
    });
  });

  describe('ExecutionFailure', () => {
    it('should create error with correct message and code for tool', () => {
      const cause = new Error('Database connection failed');
      const error = new ExecutionFailure('my-tool', 'tool', cause);

      expect(error).toBeInstanceOf(RuntimeError);
      expect(error.name).toBe('ExecutionFailure');
      expect(error.code).toBe('EXECUTION_FAILURE');
      expect(error.message).toBe("Execution failed for tool 'my-tool': Database connection failed");
      expect(error.cause).toBe(cause);
    });

    it('should create error with correct message for prompt', () => {
      const cause = new Error('Template rendering failed');
      const error = new ExecutionFailure('my-prompt', 'prompt', cause);

      expect(error.message).toBe(
        "Execution failed for prompt 'my-prompt': Template rendering failed",
      );
    });

    it('should create error with correct message for resource', () => {
      const cause = new Error('File not found');
      const error = new ExecutionFailure('my-resource', 'resource', cause);

      expect(error.message).toBe("Execution failed for resource 'my-resource': File not found");
    });
  });

  describe('NameConflictError', () => {
    it('should create error with correct message and code for tool', () => {
      const error = new NameConflictError('duplicate-tool', 'tool');

      expect(error).toBeInstanceOf(RuntimeError);
      expect(error.name).toBe('NameConflictError');
      expect(error.code).toBe('NAME_CONFLICT');
      expect(error.message).toBe("tool with name 'duplicate-tool' already exists in registry");
    });

    it('should create error with correct message for prompt', () => {
      const error = new NameConflictError('duplicate-prompt', 'prompt');

      expect(error.message).toBe("prompt with name 'duplicate-prompt' already exists in registry");
    });

    it('should create error with correct message for resource', () => {
      const error = new NameConflictError('duplicate-resource', 'resource');

      expect(error.message).toBe(
        "resource with name 'duplicate-resource' already exists in registry",
      );
    });
  });

  describe('RuntimeError base class', () => {
    it('should set cause when provided', () => {
      const cause = new Error('Original error');

      class TestError extends RuntimeError {
        readonly code = 'TEST_ERROR';
      }

      const error = new TestError('Test message', cause);

      expect(error.cause).toBe(cause);
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('TestError');
    });

    it('should not set cause when not provided', () => {
      class TestError extends RuntimeError {
        readonly code = 'TEST_ERROR';
      }

      const error = new TestError('Test message');

      expect(error.cause).toBeUndefined();
    });
  });
});
