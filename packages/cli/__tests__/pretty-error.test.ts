import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { printError } from '../src/utils/pretty-error.js';

describe('printError utility', () => {
  let consoleSpy: MockInstance<Parameters<typeof console.error>, ReturnType<typeof console.error>>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should print Error objects with stack trace', () => {
    const error = new Error('Test error message');
    error.stack = 'Error: Test error message\n    at test.js:1:1\n    at main.js:2:2';

    printError(error, 'Test Label');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Test Label] Test error message'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('at test.js:1:1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('at main.js:2:2'));
  });

  it('should print Error objects without label', () => {
    const error = new Error('Test error message');

    printError(error);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Error] Test error message'));
  });

  it('should handle Error objects without stack trace', () => {
    const error = new Error('Test error message');
    error.stack = undefined;

    printError(error, 'No Stack');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[No Stack] Test error message'),
    );
    expect(consoleSpy).toHaveBeenCalledTimes(2);
  });

  it('should handle string errors', () => {
    printError('String error message', 'String Error');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[String Error] String error message'),
    );
  });

  it('should handle unknown error types', () => {
    const unknownError = { custom: 'error object' };

    printError(unknownError, 'Unknown');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Unknown] Unknown error occurred'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[object Object]'));
  });

  it('should handle null and undefined errors', () => {
    printError(null, 'Null Error');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Null Error] Unknown error occurred'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('null'));

    consoleSpy.mockClear();

    printError(undefined, 'Undefined Error');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Undefined Error] Unknown error occurred'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('undefined'));
  });

  it('should handle numeric errors', () => {
    printError(404, 'Numeric Error');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Numeric Error] Unknown error occurred'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('404'));
  });

  it('should always end with empty line', () => {
    printError(new Error('Test'));

    const calls = consoleSpy.mock.calls;
    expect(calls[calls.length - 1]).toEqual(['']);
  });
});
