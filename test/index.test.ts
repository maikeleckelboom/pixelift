import { describe, expect, it } from 'vitest';
import { pixelift } from '../src';

describe('SSR', () => {
  it('should be a function', () => {
    expect(typeof pixelift).toBe('function');
  });

  it('should throw an error if input is not a valid image', async () => {
    const url = new URL('./assets/test.txt', import.meta.url);
    await expect(pixelift(url)).rejects.toThrowError();
  });

  it('should decode a image from a URL', async () => {
    const result = await pixelift(
      'https://fastly.picsum.photos/id/107/536/354.jpg?hmac=fLKWiXSw_CxcT7QPAtGkCxVjxdQwZ4Xnl0a3d_ib9PA'
    );
    expect(result.width).toBeDefined();
    expect(result.height).toBeDefined();
    expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
  }, 0);

  it('should throw an error if no input is provided', async () => {
    // @ts-expect-error missing input
    await expect(pixelift()).rejects.toThrowError();
  });

  it('should throw an error if input is not valid', async () => {
    // @ts-expect-error invalid input
    await expect(pixelift({})).rejects.toThrowError();
  });
}, 0);
