import { describe, expect, it, vi } from 'vitest';
import { decode } from '../../../src/server/decoder';
import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import sharp from 'sharp';

async function generateTestImage() {
  return sharp({
    create: {
      width: 2,
      height: 2,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 }
    }
  })
    .png()
    .toBuffer();
}

describe('Decoder - progress tracking', () => {
  it('should track progress on buffer input', async () => {
    const buffer = readFileSync('test/fixtures/assets/pixelift.png');
    const progressSpy = vi.fn();

    const decodedImage = await decode(buffer, {}, progressSpy);

    expect(decodedImage).toMatchObject({
      data: expect.any(Uint8ClampedArray),
      width: expect.any(Number),
      height: expect.any(Number)
    });

    // For buffer input, we should have one progress call at 100%
    expect(progressSpy).toHaveBeenCalledTimes(1);
    expect(progressSpy).toHaveBeenCalledWith({
      loaded: buffer.length,
      total: buffer.length,
      progress: 1.0
    });
  });

  it('should track progress on stream input', async () => {
    const buffer = await generateTestImage();
    const fileStream = Readable.from(buffer);
    const progressSpy = vi.fn();

    const decodedImage = await decode(fileStream, {}, progressSpy);

    expect(decodedImage.data).toHaveLength(2 * 2 * 4);
    expect(progressSpy).toHaveBeenCalled();

    // The last progress event should have proper loaded bytes
    const lastCall = progressSpy.mock.calls[progressSpy.mock.calls.length - 1]?.at(0);
    expect(lastCall.loaded).toBe(buffer.length);
  });

  it('should track progress on slow streams with backpressure', async () => {
    const buffer = await generateTestImage();
    let bytesSent = 0;

    const slowStream = new Readable({
      read() {
        if (bytesSent >= buffer.length) {
          this.push(null);
          return;
        }

        const CHUNK_SIZE = 1024;
        const chunkEnd = bytesSent + CHUNK_SIZE;
        const chunk = buffer.subarray(bytesSent, chunkEnd);
        bytesSent += chunk.length;
        setTimeout(() => this.push(chunk), 10);
      }
    });

    const progressSpy = vi.fn();
    const decodedImage = await decode(slowStream, {}, progressSpy);

    expect(decodedImage.data).toHaveLength(2 * 2 * 4);
    expect(progressSpy).toHaveBeenCalled();

    // Check that one of the calls included the expected final progress update
    expect(progressSpy.mock.calls).toContainEqual([
      expect.objectContaining({
        loaded: buffer.length,
        total: buffer.length,
        progress: 1.0
      })
    ]);
  });
});
