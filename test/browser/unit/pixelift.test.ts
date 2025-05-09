import { beforeAll, expect, test } from 'vitest';
import { pixelift } from '../../../src';
import { VERIFIED_INPUT_FORMATS } from '../../../src/shared/constants';

let blobs: Record<string, Blob>;
let urls: Record<string, URL>;

beforeAll(async () => {
  const entries = await Promise.all(
    VERIFIED_INPUT_FORMATS.map(async (format) => {
      const url = new URL(`../../__fixtures__/pixelift.${format}`, import.meta.url);
      const blob = await fetch(url).then((res) => res.blob());
      return [format, [blob, url]] as const;
    })
  );
  blobs = Object.fromEntries(entries.map(([format, [blob]]) => [format, blob]));
  urls = Object.fromEntries(entries.map(([format, [, url]]) => [format, url]));
});

test.each(VERIFIED_INPUT_FORMATS)(
  'should decode a %s image from blob',
  async (format) => {
    const result = await pixelift(blobs[format] as Blob);
    expect(result.width).toBeDefined();
    expect(result.height).toBeDefined();
  },
  0
);

test.each(VERIFIED_INPUT_FORMATS)(
  'should decode a %s image from url',
  async (format) => {
    const result = await pixelift(urls[format] as URL);
    expect(result.width).toBeDefined();
    expect(result.height).toBeDefined();
  },
  0
);
