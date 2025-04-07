export class ModuleError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly module?: string,
    public readonly suggestion?: string,
  ) {
    super(message);
    this.name = 'ModuleError';

    // Maintain proper prototype chain
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ModuleError);
    }
    Object.setPrototypeOf(this, ModuleError.prototype);
  }
}