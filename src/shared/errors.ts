export enum PixeliftErrorCode {
  FileReadFailed = 'FILE_READ_FAILED',
  DecodeFailed = 'DECODE_FAILED',
  NetworkError = 'NETWORK_ERROR'
}

export class PixeliftError extends Error {
  public readonly code: PixeliftErrorCode;
  // public details?: Record<string, unknown>;

  constructor(
    code: PixeliftErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'PixeliftError';
    this.code = code;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PixeliftError);
    }
  }

  static decodeFailed(
    message: string,
    options?: ErrorOptions
  ): PixeliftError {
    const msg = `[${PixeliftErrorCode.DecodeFailed}] ${message}`;
    return new PixeliftError(PixeliftErrorCode.DecodeFailed, msg, options);
  }

  static requestFailed(
    message: string,
    options?: ErrorOptions
  ): PixeliftError {
    const msg = `[${PixeliftErrorCode.NetworkError}] ${message}`;
    return new PixeliftError(PixeliftErrorCode.NetworkError, msg, options);
  }

  static fileReadFailed(
    message: string,
    options?: ErrorOptions
  ): PixeliftError {
    const msg = `[${PixeliftErrorCode.FileReadFailed}] ${message}`;
    return new PixeliftError(PixeliftErrorCode.FileReadFailed, msg, options);
  }
}

// TODO: Improve error handling through-out app
// export function createError(
//   code: PixeliftErrorCode,
//   message: string,
//   details?: Record<string, any>
// ): PixeliftError {
//   const error = new PixeliftError(code, message);
//   if (details) {
//     error.details = details;
//   }
//   return error;
// }