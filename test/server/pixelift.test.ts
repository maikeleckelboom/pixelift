import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, test } from 'vitest';
import { pixelift } from '../../src/server';
import { VERIFIED_INPUT_FORMATS, type VerifiedFormat } from '../../src/shared/constants';
import { createHash } from 'node:crypto';

const buffers: Partial<Record<VerifiedFormat, Buffer>> = {};
const urls: Partial<Record<VerifiedFormat, URL>> = {};

beforeAll(() => {
  for (const format of VERIFIED_INPUT_FORMATS) {
    const resourceUrl = new URL(`../assets/pixelift.${format}`, import.meta.url);
    urls[format] = resourceUrl;
    buffers[format] = readFileSync(resourceUrl);
  }
});

describe('Pixelift Server', () => {
  test.each(VERIFIED_INPUT_FORMATS)(
    'should decode %s from `Buffer`',
    async (format) => {
      const result = await pixelift(buffers[format] as Buffer);
      expect(result.width).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);
    },
    0
  );

  test.each(VERIFIED_INPUT_FORMATS)(
    'should decode %s from `URL`',
    async (format) => {
      const result = await pixelift(urls[format] as URL);
      expect(result.width).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);
      const hash = hashData(result.data);
      expect(hash).toMatchSnapshot();
    },
    0
  );
}, 0);

function hashData(data: Uint8ClampedArray): string {
  return createHash('sha256').update(Buffer.from(data.buffer)).digest('hex');
}
