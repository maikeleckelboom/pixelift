export type PixeliftErrorCode =
  | 'BrowserDecodingError'
  | 'ServerDecodingError'
  | 'SharpMissingError'
  | 'NetworkError'
  | 'InvalidInputError';

export interface PixeliftErrorOptions {
  cause?: Error;
}

export class PixeliftError extends Error {
  public readonly code: PixeliftErrorCode;
  public readonly cause?: Error; // ← strongly typed here

  constructor(code: PixeliftErrorCode, message: string, options?: PixeliftErrorOptions) {
    super(message, { cause: options?.cause });
    this.name = code;
    this.code = code;
    this.cause = options?.cause;
  }

  public toJSON(): {
    code: PixeliftErrorCode;
    name: string;
    message: string;
    cause?: { name: string; message: string };
    stack?: string;
  } {
    return {
      code: this.code,
      name: this.name,
      message: this.message,
      cause: this.cause
        ? { name: this.cause.name, message: this.cause.message }
        : undefined,
      stack: this.stack
    };
  }
}

export async function wrapErrors<T>(
  fn: () => Promise<T>,
  ErrorClass: new (msg: string, opts?: PixeliftErrorOptions) => PixeliftError,
  prefix: string
): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    throw new ErrorClass(`${prefix}: ${(<Error>err).message}`, { cause: <Error>err });
  }
}

export class BrowserDecodingError extends PixeliftError {
  constructor(message: string, options?: PixeliftErrorOptions) {
    super('BrowserDecodingError', `Browser decoding error: ${message}`, options);
  }
}

export class ServerDecodingError extends PixeliftError {
  constructor(message: string, options?: PixeliftErrorOptions) {
    super('ServerDecodingError', `Server decoding error: ${message}`, options);
  }
}

export class SharpMissingError extends PixeliftError {
  constructor(options?: PixeliftErrorOptions) {
    super(
      'SharpMissingError',
      [
        'The "sharp" dependency is required for server-side image processing.',
        'To enable this feature on the server, install it with:',
        '`npm install sharp`',
        'If server-side processing isn’t needed, use the browser build instead.'
      ].join(' '),
      options
    );
  }
}
