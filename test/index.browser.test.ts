import { beforeAll, describe, expect, it } from 'vitest';
import { pixelift } from '../src/browser';

const FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;
type Format = (typeof FORMATS)[number];

let blobs: Record<Format, Blob>;

describe('Browser Pixelift Decode', () => {
  beforeAll(async () => {
    const entries = await Promise.all(
      FORMATS.map(async (format) => {
        const url = new URL(`./assets/pixelift.${format}`, import.meta.url);
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Failed to fetch ${format}: ${resp.status}`);
        const blob = await resp.blob();
        return [format, blob] as const;
      })
    );
    blobs = Object.fromEntries(entries) as Record<Format, Blob>;
  });

  it.concurrent.each(FORMATS)('should decode a %s image via WebGL', async (format) => {
    const { data, width, height } = await pixelift(blobs[format], { strategy: 'webgl' });
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    expect(data.some((v) => v !== 0)).toBe(true);
  });
});
