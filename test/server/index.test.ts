import { readFileSync } from 'node:fs';
import { beforeAll, expect, test } from 'vitest';
import { type PixelData, pixelift } from 'pixelift';

const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'] as const;
type Format = (typeof formats)[number];

let urls: Record<Format, URL>;
let buffers: Record<Format, Buffer>;

beforeAll(() => {
  urls = Object.fromEntries(
    formats.map((format) => [
      format,
      new URL(`../fixtures/pixelift.${format}`, import.meta.url)
    ])
  ) as Record<Format, URL>;

  buffers = Object.fromEntries(
    formats.map((format) => [format, readFileSync(urls[format])])
  ) as Record<Format, Buffer>;
});

function assertValidResult(result: PixelData): void {
  expect(result.width).toBeDefined();
  expect(result.height).toBeDefined();
  expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
}

test.each(formats)(
  'should decode %s from buffer',
  async (format) => {
    const result = await pixelift(buffers[format]);
    assertValidResult(result);
  },
  0
);

test.each(formats)(
  'should decode %s from file',
  async (format) => {
    const result = await pixelift(urls[format]);
    assertValidResult(result);
  },
  0
);
