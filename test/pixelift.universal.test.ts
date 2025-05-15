import { describe, expect, it } from 'vitest';
import { pixelift } from '../src';

describe('Pixelift universal tests', () => {
  it('should error on any invalid input', async () => {
    const invalidInputs = [null, undefined, {}, [], 123];

    for (const input of invalidInputs) {
      // @ts-expect-error TS2769: No overload matches this call.
      await expect(pixelift(input)).rejects.toThrow(/Invalid input/);
    }
  });
});
