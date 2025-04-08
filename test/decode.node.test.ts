import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { pixelift } from '../src';
import { DecoderRegistry } from '../src/node/decoders/registry.ts';
import { SharpFactory } from '../src/node/decoders/factories/sharp.ts';

beforeEach(async () => {
  DecoderRegistry.registerFactory(SharpFactory);
});

describe('decode (Node)', () => {

  it('should decode a 3-channel JPG image from a file path', async () => {
    const image = readFileSync('./test/assets/test.jpg');
    const result = await pixelift(image);
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
  });

  it('should decode a 4-channel JPG image from a file path', async () => {
    const image = readFileSync('./test/assets/test.jpg');
    const result = await pixelift(image, {
      decoder: 'jpeg-js',
      options: {
        formatAsRGBA: true,
      },
    });
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);

  });

  it('should decode a JPG image from a buffer', async () => {
    const image = readFileSync('./test/assets/test.png');
    const result = await pixelift(image, {
      decoder: 'pngjs',
      options: {
        skipRescale: true,
        checkCRC: true,
      },
    });
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
  });

  it('should decode a GIF image from a file path', async () => {
    const image = readFileSync('./test/assets/test.gif');
    const result = await pixelift(image, {
      decoder: 'omggif',
      options: {
        frame: 2,
      },
    });
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
  });

  it('should decode a PNG image from a file path', async () => {
    const result = await pixelift('./test/assets/test.png');
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
  });

  it('should decode a PNG image from a buffer', async () => {
    const likeBuffer = readFileSync('./test/assets/test.png');
    const result = await pixelift(likeBuffer, {
      decoder: 'pngjs',
      options: {
        skipRescale: true,
        checkCRC: true,
      },
    });
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
  });

  it('should decode a TIFF image from a file path', async () => {
    const result = await pixelift('./test/assets/test.tiff', { decoder: 'sharp' });
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
  });


  it('should throw an error for invalid input', async () => {
    await expect(pixelift('invalid-path.png', { decoder: 'pngjs' })).rejects.toThrow();
    await expect(pixelift(Buffer.from('invalid'), { decoder: 'pngjs' })).rejects.toThrow();
  });
}); 