import { describe, expect, test, vi } from 'vitest';
import { pixelift } from '../src';

describe('Browser Environment', () => {
  const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'] as const;

  test.each(formats)('should decode a %s image from a URL', async (format) => {
    const url = new URL(`./assets/test.${format}`, import.meta.url);
    const { data, width, height } = await pixelift(url);

    expect(width).toBeDefined();
    expect(height).toBeDefined();
    expect(data.filter(Boolean).length).toBeGreaterThan(0);
  });
});
