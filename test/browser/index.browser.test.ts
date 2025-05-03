import { beforeAll, describe, expect, test } from 'vitest';
import { pixelift } from 'pixelift';

const FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;
type Format = (typeof FORMATS)[number];

let blobs: Record<Format, Blob>;

describe('Browser Pixelift Decode', () => {
  beforeAll(async () => {
    const entries = await Promise.all(
      FORMATS.map(async (format) => {
        const url = new URL(`../assets/pixelift.${format}`, import.meta.url);
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Failed to fetch ${format}: ${resp.status}`);
        const blob = await resp.blob();
        return [format, blob] as const;
      })
    );
    blobs = Object.fromEntries(entries) as Record<Format, Blob>;
  });

  test.each(FORMATS)('should decode a %s image from blob', async (format) => {
    const result = await pixelift(blobs[format]);

    expect(result.width).toBeDefined();
    expect(result.height).toBeDefined();
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
  });
});
