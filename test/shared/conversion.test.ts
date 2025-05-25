import { describe, expect, it } from 'vitest';
import { argbFromRgbaBytes, rgbaBytesFromArgb } from '../../src/shared/conversion';

describe('rgbaBytesFromArgb', () => {
  it('converts ARGB integers to RGBA bytes correctly', () => {
    const input = [0x12345678];
    const expected = new Uint8ClampedArray([0x34, 0x56, 0x78, 0x12]);
    expect(rgbaBytesFromArgb(input)).toEqual(expected);
  });

  it('handles multiple pixels', () => {
    const input = [0x11223344, 0xaabbccdd];
    const expected = new Uint8ClampedArray([
      0x22, 0x33, 0x44, 0x11, 0xbb, 0xcc, 0xdd, 0xaa
    ]);
    expect(rgbaBytesFromArgb(input)).toEqual(expected);
  });

  it('processes edge cases (transparent black and opaque white)', () => {
    expect(rgbaBytesFromArgb([0x00000000])).toEqual(new Uint8ClampedArray([0, 0, 0, 0]));
    expect(rgbaBytesFromArgb([0xffffffff])).toEqual(
      new Uint8ClampedArray([255, 255, 255, 255])
    );
  });

  it('treats negative integers as unsigned 32-bit values', () => {
    expect(rgbaBytesFromArgb([-1])).toEqual(new Uint8ClampedArray([255, 255, 255, 255]));
  });
});

describe('argbFromRgbaBytes', () => {
  it('converts 4-byte RGBA buffers to ARGB integers', () => {
    const input = new Uint8Array([0x11, 0x22, 0x33, 0x44]);
    const expected = new Uint32Array([0x44112233]);
    expect(argbFromRgbaBytes(input, { useTypedArray: true })).toEqual(expected);
  });

  it('accepts ArrayBuffer and other TypedArray types', () => {
    const bytes = [0x11, 0x22, 0x33, 0x44];
    const buffer1 = new Uint8Array(bytes).buffer;
    expect(argbFromRgbaBytes(buffer1, { useTypedArray: true })).toEqual(
      new Uint32Array([0x44112233])
    );

    const buffer2 = new Uint8ClampedArray(bytes);
    expect(argbFromRgbaBytes(buffer2, { useTypedArray: true })).toEqual(
      new Uint32Array([0x44112233])
    );
  });

  it('throws error when width and height is specified and length is invalid', () => {
    const input = new Uint8Array(7);
    expect(() => argbFromRgbaBytes(input, { width: 2, height: 2 })).toThrow();
  });
});

describe('Round-trip conversions', () => {
  it('rgbaBytesFromArgb → argbFromRgbaBytes returns original ARGB data', () => {
    const original = new Uint32Array([0x12345678, 0x9abcdef0]);
    const packed = rgbaBytesFromArgb(original);
    const unpacked = argbFromRgbaBytes(packed, { useTypedArray: true });
    expect(unpacked).toEqual(original);
  });

  it('argbFromRgbaBytes → rgbaBytesFromArgb returns original RGBA data', () => {
    const original = new Uint8ClampedArray([0x11, 0x22, 0x33, 0x44]);
    const unpacked = argbFromRgbaBytes(original, { useTypedArray: true });
    const packed = rgbaBytesFromArgb(unpacked);
    expect(packed).toEqual(original);
  });

  it('argbFromRgbaBytes → rgbaBytesFromArgb returns original RGBA color data', () => {
    const originalData = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255
    ]);

    const unpacked = argbFromRgbaBytes(originalData);
    const packed = rgbaBytesFromArgb(unpacked);

    expect(packed).toEqual(originalData);
  });

  it('correctly inverts colors while preserving alpha', () => {
    const originalColor = 0xff112233;
    const pixelBuffer = rgbaBytesFromArgb([originalColor]);
    const colors = argbFromRgbaBytes(pixelBuffer, { useTypedArray: true });

    const invertedColors = colors.map((color) => {
      const a = (color >>> 24) & 0xff;
      const r = (color >>> 16) & 0xff;
      const g = (color >>> 8) & 0xff;
      const b = color & 0xff;

      return ((a << 24) | ((0xff - r) << 16) | ((0xff - g) << 8) | (0xff - b)) >>> 0;
    });

    const invertedBuffer = rgbaBytesFromArgb(invertedColors);
    const [resultColor] = argbFromRgbaBytes(invertedBuffer);

    expect((resultColor || 0) >>> 0).toEqual(0xffeeddcc);
  });
});
