export abstract class RuntimeError extends Error {
  abstract readonly code: string;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    if (cause) {
      this.cause = cause;
    }
  }
}

export class ToolNotFoundError extends RuntimeError {
  readonly code = 'TOOL_NOT_FOUND';

  constructor(toolName: string) {
    super(`Tool '${toolName}' not found in registry`);
  }
}

export class PromptNotFoundError extends RuntimeError {
  readonly code = 'PROMPT_NOT_FOUND';

  constructor(promptName: string) {
    super(`Prompt '${promptName}' not found in registry`);
  }
}

export class ResourceNotFoundError extends RuntimeError {
  readonly code = 'RESOURCE_NOT_FOUND';

  constructor(resourceName: string) {
    super(`Resource '${resourceName}' not found in registry`);
  }
}

export class InvalidInputError extends RuntimeError {
  readonly code = 'INVALID_INPUT';

  constructor(entityName: string, entityType: 'tool' | 'prompt', validationError: Error) {
    super(`Invalid input for ${entityType} '${entityName}': ${validationError.message}`);
    this.cause = validationError;
  }
}

export class ExecutionFailure extends RuntimeError {
  readonly code = 'EXECUTION_FAILURE';

  constructor(entityName: string, entityType: 'tool' | 'prompt' | 'resource', cause: Error) {
    super(`Execution failed for ${entityType} '${entityName}': ${cause.message}`);
    this.cause = cause;
  }
}

export class NameConflictError extends RuntimeError {
  readonly code = 'NAME_CONFLICT';

  constructor(name: string, entityType: 'tool' | 'prompt' | 'resource') {
    super(`${entityType} with name '${name}' already exists in registry`);
  }
}

export class LifecycleError extends RuntimeError {
  readonly code = 'LIFECYCLE_ERROR';

  constructor(operation: string, reason: string) {
    super(`Lifecycle violation: ${operation} - ${reason}`);
  }
}
