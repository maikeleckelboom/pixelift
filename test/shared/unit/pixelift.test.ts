import { describe, expect, it } from 'vitest';
import { pixelift } from '../../../src';

describe('Pixelift', () => {
  it('should be a function', () => {
    expect(typeof pixelift).toBe('function');
  });

  it('should throw an error if no arguments are provided', async () => {
    // @ts-expect-error intentionally passing no arguments
    await expect(pixelift()).rejects.toThrowError();
  });

  it('should throw an error if the input is not a valid URL or Buffer', async () => {
    // @ts-expect-error intentionally passing an invalid argument
    await expect(pixelift({})).rejects.toThrowError();
  });

  it('should throw an error if the decoder is not supported', async () => {
    const url = new URL('../../../__fixtures__/pixelift.png', import.meta.url);
    await expect(
      // @ts-expect-error intentionally passing an unsupported decoder
      pixelift(url, { decoder: 'unsupported-decoder' })
    ).rejects.toThrowError();
  });

  it('should throw an error if the input format is not supported', async () => {
    const url = new URL('../../../__fixtures__/pixelift.txt', import.meta.url);
    await expect(pixelift(url)).rejects.toThrowError();
  });
});
