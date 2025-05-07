import { beforeAll, expect, test } from 'vitest';
import { pixelift } from 'pixelift/browser';
import { VERIFIED_INPUT_FORMATS } from '../../../src/shared/constants';

let blobs: Record<string, Blob>;

beforeAll(async () => {
  const entries = await Promise.all(
    VERIFIED_INPUT_FORMATS.map(async (format) => {
      const url = new URL(`../../__fixtures__/pixelift.${format}`, import.meta.url);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to fetch ${format}: ${resp.status}`);
      const blob = await resp.blob();
      return [format, blob] as const;
    })
  );
  blobs = Object.fromEntries(entries) as Record<string, Blob>;
}, 0);

test.each(VERIFIED_INPUT_FORMATS)(
  'should decode a %s image from blob',
  async (format) => {
    const result = await pixelift(blobs[format] as Blob);

    expect(result.width).toBeDefined();
    expect(result.height).toBeDefined();
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
  },
  0
);

test.each(VERIFIED_INPUT_FORMATS)(
  'should decode a %s image from url',
  async (format) => {
    const url = new URL(`../../__fixtures__/pixelift.${format}`, import.meta.url);
    const result = await pixelift(url);

    expect(result.width).toBeDefined();
    expect(result.height).toBeDefined();
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
  },
  0
);
