export class PixeliftError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'PixeliftError';
  }
}

export class FormatError extends PixeliftError {
  constructor(message: string, details?: any) {
    super(message, details);
    this.name = 'FormatError';
  }
}

export class NetworkError extends PixeliftError {
  constructor(message: string, details?: any) {
    super(message, details);
    this.name = 'NetworkError';
  }
}