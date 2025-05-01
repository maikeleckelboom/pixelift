import { describe, expect, it } from 'vitest';
import { pixelift } from '../src';

describe('Browser (Client)', () => {
  const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'] as const;

  it.each(formats)('should decode a %s image from a URL', async (format) => {
    const url = new URL(`./assets/test.${format}`, import.meta.url);
    const { data, width, height } = await pixelift(url);

    expect(width).toBeDefined();
    expect(height).toBeDefined();
    expect(data.filter(Boolean).length).toBeGreaterThan(0);
  });
}, 0);

// describe('WebCodecs', () => {
//   it('should decode a image from a URL', async () => {
//     const result = await getSharpRawPixelData(
//       'https://fastly.picsum.photos/id/107/536/354.jpg?hmac=fLKWiXSw_CxcT7QPAtGkCxVjxdQwZ4Xnl0a3d_ib9PA'
//     );
//     expect(result).toBeDefined();
//   });
// });
