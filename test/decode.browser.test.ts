import { describe, expect, it } from 'vitest';
import { pixelift } from '../src/browser';
import { isBrowser } from '../src/core/env.ts';

describe('decode (Browser)', () => {
  it('should run in a browser environment', () => {
    expect(isBrowser()).toBe(true);
  });

  it('handles 3-channel JPG', async () => {
    const url = new URL('./assets/test.jpg', import.meta.url);
    const { data, width, height } = await pixelift(url);
    expect(width).toBeDefined();
    expect(height).toBeDefined();
    expect(data.filter(Boolean).length).toBeGreaterThan(0);
  });

  it('decodes GIF correctly', async () => {
    const url = new URL('./assets/test.gif', import.meta.url);
    const { data, width, height } = await pixelift(url);
    expect(width).toBeDefined();
    expect(height).toBeDefined();
    expect(data.filter(Boolean).length).toBeGreaterThan(0);
  });

  it('decodes WebP correctly', async () => {
    const url = new URL('./assets/test.webp', import.meta.url);
    const { data, width, height } = await pixelift(url);
    expect(width).toBeDefined();
    expect(height).toBeDefined();
    expect(data.filter(Boolean).length).toBeGreaterThan(0);
  });

  it('decodes AVIF correctly', async () => {
    const url = new URL('./assets/test.avif', import.meta.url);
    const { data, width, height } = await pixelift(url);
    expect(width).toBeDefined();
    expect(height).toBeDefined();
    expect(data.filter(Boolean).length).toBeGreaterThan(0);
  });
});
