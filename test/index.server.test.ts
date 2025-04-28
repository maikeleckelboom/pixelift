import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { pixelift } from '../src';

describe('Server', () => {
  const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'] as const;

  test.each(formats)('should decode a %s image from a URL', async (format) => {
    const url = new URL(`./assets/test.${format}`, import.meta.url);
    const buffer = readFileSync(url);
    const result = await pixelift(buffer);

    expect(result.width).toBeDefined();
    expect(result.height).toBeDefined();
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
  });
});
