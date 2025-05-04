export const ErrorCode = {
  decoderUnsupported: 'decoder-unsupported',
  decodingFailed: 'decoding-failed',
  invalidInput: 'invalid-input',
  dependencyMissing: 'dependency-missing',
  environmentUnsupported: 'environment-unsupported',
  fetchFailed: 'fetch-failed',
  networkError: 'network-error',
  pathTraversal: 'path-traversal',
  aborted: 'aborted'
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

const MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.decoderUnsupported]: 'Decoder {decoder} is not supported for {detail}',
  [ErrorCode.decodingFailed]: 'Failed to decode {type}: {detail}',
  [ErrorCode.invalidInput]: 'Invalid input: expected {expected}, got {received}',
  [ErrorCode.dependencyMissing]: 'Required dependency missing: {dependency}',
  [ErrorCode.environmentUnsupported]: 'Current environment does not support {feature}',
  [ErrorCode.fetchFailed]: 'Failed to fetch from {url}: {status} {statusText}',
  [ErrorCode.pathTraversal]: 'Path traversal attempt detected: {path}',
  [ErrorCode.aborted]: 'Operation aborted',
  [ErrorCode.networkError]: 'Network error: {detail}'
};

function formatMessage(template: string, context: Record<string, unknown> = {}): string {
  return template.replace(/\{(\w+)}/g, (_, key) =>
    key in context ? String(context[key]) : `{${key}}`
  );
}

export class PixeliftError extends Error {
  public readonly code: ErrorCode;
  public readonly context: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    context: Record<string, unknown> = {},
    options?: ErrorOptions
  ) {
    const message = formatMessage(MESSAGES[code], context);
    super(message, options);
    this.name = 'PixeliftError';
    this.code = code;
    this.context = context;
  }

  public toString(): string {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
}

export const createError = {
  aborted: (): PixeliftError => new PixeliftError(ErrorCode.aborted),

  decoderUnsupported: (decoder: string, detail: string): PixeliftError =>
    new PixeliftError(ErrorCode.decoderUnsupported, { decoder, detail }),

  decodingFailed: (type: string, detail: string, cause?: unknown): PixeliftError =>
    new PixeliftError(ErrorCode.decodingFailed, { type, detail }, { cause }),

  dependencyMissing: (dependency: string, cause?: unknown): PixeliftError =>
    new PixeliftError(ErrorCode.dependencyMissing, { dependency }, { cause }),

  environmentUnsupported: (feature: string): PixeliftError =>
    new PixeliftError(ErrorCode.environmentUnsupported, { feature }),

  fetchFailed: (url: string, status: number, statusText: string): PixeliftError =>
    new PixeliftError(ErrorCode.fetchFailed, { url, status, statusText }),

  invalidInput: (expected: string, received: string): PixeliftError =>
    new PixeliftError(ErrorCode.invalidInput, { expected, received }),

  networkError: (detail: string, cause?: unknown): PixeliftError =>
    new PixeliftError(ErrorCode.networkError, { detail }, { cause }),

  pathTraversal: (path: string): PixeliftError =>
    new PixeliftError(ErrorCode.pathTraversal, { path })
} as const;
