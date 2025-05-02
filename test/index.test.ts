import { describe, expect, it } from 'vitest';
import { pixelift } from '../src';
import * as fs from 'node:fs';

describe('SSR', () => {
  it('should be a function', () => {
    expect(typeof pixelift).toBe('function');
  });

  it('should decode a image from a URL', async () => {
    const blob = fs.readFileSync('./test/assets/pixelift.jpg');
    const result = await pixelift(blob);
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
