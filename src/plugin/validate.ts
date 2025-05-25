export function validateDecoderConfig(decoder: any): asserts decoder is {
  name: string;
  canHandle: (input: any) => Promise<boolean>;
  decode: (input: any, options?: any) => Promise<any>;
  priority?: number;
} {
  if (typeof decoder.name !== 'string' || !decoder.name.trim()) {
    throw new TypeError('Decoder must have a non-empty "name" property');
  }

  if (typeof decoder.canHandle !== 'function') {
    throw new TypeError('Decoder must have a "canHandle" function');
  }

  if (typeof decoder.decode !== 'function') {
    throw new TypeError('Decoder must have a "decode" function');
  }

  if (decoder.priority != null && typeof decoder.priority !== 'number') {
    throw new TypeError('Decoder "priority" must be a number or undefined');
  }
}
