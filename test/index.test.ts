import { describe, expect, it } from 'vitest';
import { pixelift } from '../src';

describe('Smoke', () => {
  it('should be a function', () => {
    expect(typeof pixelift).toBe('function');
  });
});
