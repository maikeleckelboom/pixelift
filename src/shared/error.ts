export class DecoderError extends Error {
  constructor(
    public readonly decoderId: string,
    message: string,
    public readonly type?: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'DecoderError';
  }
}

export class FormatError extends Error {
  constructor(
    public readonly type: string,
    options?: ErrorOptions
  ) {
    super(`Unable to decode image format "${type}"`, options);
    this.name = 'FormatError';
  }
}
