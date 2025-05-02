import { describe, expect, it } from 'vitest';
import { pixelift } from '../src/browser';

const JPG_IMAGE_URL =
  'https://fastly.picsum.photos/id/107/536/354.jpg?hmac=fLKWiXSw_CxcT7QPAtGkCxVjxdQwZ4Xnl0a3d_ib9PA';

describe('Browser', () => {
  it('should decode a JPG image from an external URL', async () => {
    const result = await pixelift(JPG_IMAGE_URL);
    expect(result.width).toBeDefined();
    expect(result.height).toBeDefined();
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
  });

  const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'] as const;
  it.each(formats)(
    'should decode a %s image from a URL',
    async (format) => {
      const url = new URL(`./assets/pixelift.${format}`, import.meta.url);
      const blob = await fetch(url).then((r) => r.blob());
      const { data, width, height } = await pixelift(blob, { decoder: 'webgl' });

      expect(width).toBeDefined();
      expect(height).toBeDefined();
      expect(data.filter(Boolean).length).toBeGreaterThan(0);
    },
    0
  );
}, 0);
