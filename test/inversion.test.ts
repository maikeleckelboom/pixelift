import { describe, expect, it ,afterEach} from 'vitest';
import { packPixels, unpackPixels } from '../src/core';


describe('Inverting Colors', () => {

  it('should invert colors correctly', () => {
    // Define an opaque color (ARGB): 0xFF112233.
    const originalColor = 0xFF112233;

    // Create a buffer for a single pixel.
    const pixelBuffer = packPixels([originalColor]);

    // Unpack to ARGB integers.
    const colors = unpackPixels(pixelBuffer);

    // Invert the RGB channels while keeping alpha intact.
    const invertedColors = colors.map(color => {
      const a = (color >>> 24) & 0xff; // Use unsigned shift for alpha
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;

      return (
        (a << 24) | ((255 - r) << 16) | ((255 - g) << 8) | (255 - b)
      )
    });

    // Convert the inverted color back to a buffer.
    const invertedBuffer = packPixels(invertedColors);

    // Unpack to verify the inversion.
    const color = unpackPixels(invertedBuffer)[0]!;

    // Expected inverted color: for 0xFF112233, the RGB inversion gives:
    // R: 255 - 0x11 = 0xEE, G: 255 - 0x22 = 0xDD, B: 255 - 0x33 = 0xCC,
    // so expected ARGB: 0xFFEEDDCC.
    expect(color >>> 0).toEqual(0xFFEEDDCC);
  });
});
