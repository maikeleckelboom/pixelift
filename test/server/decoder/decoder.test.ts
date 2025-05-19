import { describe, expect, it } from 'vitest';
import { decode } from '../../../src/server/decoder';
import { createReadStream, readFileSync } from 'node:fs';
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

describe('Decoder - streaming input handling', () => {
  it('should decode real NodeJS file stream', async () => {
    const fileStream = createReadStream('test/fixtures/assets/pixelift.png');
    const decodedImage = await decode(fileStream);

    expect(decodedImage).toMatchObject({
      data: expect.any(Uint8ClampedArray),
      width: expect.any(Number),
      height: expect.any(Number)
    });
    expect(decodedImage.data.length).toBeGreaterThan(0);
  });

  it('should decode Web ReadableStream input', async () => {
    const buffer = readFileSync('test/fixtures/assets/pixelift.png');

    const nodeStream = Readable.from(buffer);
    const decodedImage = await decode(nodeStream);

    expect(decodedImage.data.length).toBe(decodedImage.width * decodedImage.height * 4);
  }, 0);

  it('should handle slow streams with backpressure', async () => {
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

    const decodedImage = await decode(slowStream);
    expect(decodedImage.data).toHaveLength(2 * 2 * 4);
  }, 0);

  it('should abort processing mid-stream', async () => {
    const buffer = await generateTestImage();
    let sentData = false;
    const neverEndingStream = new Readable({
      read() {
        if (!sentData) {
          this.push(buffer);
          sentData = true;
        }
      }
    });

    const abortController = new AbortController();

    const decodePromise = decode(neverEndingStream, {
      signal: abortController.signal
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    abortController.abort();

    await expect(decodePromise).rejects.toThrow(
      'Operation aborted cause: Operation aborted'
    );

    expect(neverEndingStream.destroyed).toBe(true);
  });

  it('should decode Web ReadableStream input', async () => {
    const buffer = readFileSync('test/fixtures/assets/pixelift.png');

    const webStream = Readable.toWeb(
      Readable.from(buffer)
    ) as unknown as ReadableStream<Uint8Array>;

    const decodedImage = await decode(webStream);
    expect(decodedImage.data.length).toBeGreaterThan(0);
  });
}, 0);
