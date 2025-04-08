import { describe, expect, it } from 'vitest';
import { packPixels, unpackPixels } from '../src/core';


describe('Conversion Utilities', () => {
  it('should retains original pixel data after round trip conversion', () => {
    // Example RGBA pixel data: red, green, blue (each pixel is 4 bytes)
    const originalData = new Uint8ClampedArray([
      255, 0, 0, 255,   // red pixel: ARGB = 0xFFFF0000
      0, 255, 0, 255,   // green pixel: ARGB = 0xFF00FF00
      0, 0, 255, 255,   // blue pixel: ARGB = 0xFF0000FF
    ]);

    // Unpack to ARGB integers and then pack back to raw bytes.
    const colors = unpackPixels(originalData);

    // Convert back to raw bytes
    const roundTripData = packPixels(colors);

    expect(roundTripData).toEqual(originalData);
  });

  it('correctly converts RGB data to opaque ARGB integers', () => {
    // RGB input (3 bytes/pixel) should produce opaque colors.
    const rgbData = new Uint8ClampedArray([
      0, 0, 255, // Blue pixel: should become 0xFF0000FF
    ]);

    const color = unpackPixels(rgbData)[0]!;

    // Convert to unsigned to compare
    expect(color >>> 0).toEqual(0xFF0000FF);
  });
});