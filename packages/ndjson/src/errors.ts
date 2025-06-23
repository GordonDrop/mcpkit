export class NDJSONParseError extends Error {
  public readonly lineNumber: number;
  public readonly originalError: Error;
  public readonly partialContent: string;

  constructor(lineNumber: number, originalError: Error, partialContent: string, message?: string) {
    const defaultMessage = `NDJSON parse error at line ${lineNumber}: ${originalError.message}`;
    super(message || defaultMessage);

    this.name = 'NDJSONParseError';
    this.lineNumber = lineNumber;
    this.originalError = originalError;
    this.partialContent = partialContent;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NDJSONParseError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      lineNumber: this.lineNumber,
      originalError: {
        name: this.originalError.name,
        message: this.originalError.message,
      },
      partialContent: this.partialContent,
    };
  }
}
