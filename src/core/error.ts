// src/shared/error.ts

export const ErrorCode = {
  FORMAT_UNSUPPORTED: 'ERR_FORMAT_UNSUPPORTED',
  NETWORK_FAILURE: 'ERR_NETWORK_FAILURE',
  MISSING_DEPENDENCY: 'ERR_MISSING_DEPENDENCY',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];


export interface ErrorDetails {
  [key: string]: unknown;

  /** Suggested troubleshooting steps */
  suggestion?: string;
  /** Error code for programmatic handling */
  code?: string;
  /** Underlying system error reference */
  cause?: unknown;
}

export interface NetworkErrorDetails extends ErrorDetails {
  status?: number;
  url?: string;
  method?: string;
}

export interface FormatErrorDetails extends ErrorDetails {
  detectedFormat?: string;
  supportedFormats?: string[];
  headerHex?: string;
}

export interface DependencyErrorDetails extends ErrorDetails {
  name: string;
  requiredBy?: string;
  installCommand?: string;
}

export class PixeliftError extends Error {
  public readonly details: ErrorDetails;

  constructor(message: string, details: ErrorDetails = {}) {
    // Use the native cause option if available
    super(message, details.cause ? { cause: details.cause } : undefined);
    this.details = details;
    this.name = new.target.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      details: this.details,
      stack: this.stack,
    };
  }
}

export class FormatError extends PixeliftError {
  constructor(message: string, details: FormatErrorDetails = {}) {
    super(message, {
      code: ErrorCode.FORMAT_UNSUPPORTED,
      suggestion: details.suggestion || 'Check supported formats list',
      ...details,
    });
  }
}

export class NetworkError extends PixeliftError {
  constructor(message: string, details: NetworkErrorDetails = {}) {
    super(message, {
      code: ErrorCode.NETWORK_FAILURE,
      suggestion: details.suggestion || 'Verify network connection and URL',
      ...details,
    });
  }
}

export class MissingDependencyError extends PixeliftError {
  constructor(details: DependencyErrorDetails) {
    super(`Required dependency missing: ${details.module}`, {
      code: ErrorCode.MISSING_DEPENDENCY,
      suggestion: details.installCommand || `Install with: npm install ${details.module}`,
      ...details,
    });
  }
}