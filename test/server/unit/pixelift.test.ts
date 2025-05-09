import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, test } from 'vitest';
import { pixelift } from '../../../src/server';
import { VERIFIED_INPUT_FORMATS } from '../../../src/shared/constants';
import type { PixelData } from '../../../src';

type Format = (typeof VERIFIED_INPUT_FORMATS)[number];

let urls: Record<Format, URL>;
let buffers: Record<Format, Buffer>;

beforeAll(() => {
  urls = Object.fromEntries(
    VERIFIED_INPUT_FORMATS.map((format) => [
      format,
      new URL(`../../__fixtures__/pixelift.${format}`, import.meta.url)
    ])
  ) as Record<Format, URL>;

  buffers = Object.fromEntries(
    VERIFIED_INPUT_FORMATS.map((format) => [format, readFileSync(urls[format])])
  ) as Record<Format, Buffer>;
});

function assertValidResult(result: PixelData): void {
  expect(result.width).toBeDefined();
  expect(result.height).toBeDefined();
  expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
}

describe('Pixelift Server', () => {
  test.each(VERIFIED_INPUT_FORMATS)(
    'should decode %s from buffer',
    async (format) => {
      const result = await pixelift(buffers[format]);
      assertValidResult(result);
    },
    0
  );

  test.each(VERIFIED_INPUT_FORMATS)('should decode %s from url', async (format) => {
    const result = await pixelift(urls[format]);
    assertValidResult(result);
  });
});
