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
  // Existing test modified for direct Node.js stream handling
  it('should decode real Node.js file stream', async () => {
    const fileStream = createReadStream('test/fixtures/assets/pixelift.png');
    const decodedImage = await decode(fileStream);

    expect(decodedImage).toMatchObject({
      data: expect.any(Uint8ClampedArray),
      width: expect.any(Number),
      height: expect.any(Number)
    });
    expect(decodedImage.data.length).toBeGreaterThan(0);
  });

  // Web Stream compatibility test
  it('should decode Web ReadableStream input', async () => {
    const buffer = readFileSync('test/fixtures/assets/pixelift.png');
    // const webStream = Readable.toWeb(Readable.from(buffer));

    const nodeStream = Readable.from(buffer);
    const decodedImage = await decode(nodeStream);

    // Check decoded image dimensions rather than comparing to buffer size
    expect(decodedImage.data.length).toBe(decodedImage.width * decodedImage.height * 4); // RGBA format
  });

  // Backpressure handling
  it('should handle slow streams with backpressure', async () => {
    const buffer = await generateTestImage();
    let bytesSent = 0;

    const slowStream = new Readable({
      read() {
        if (bytesSent >= buffer.length) {
          this.push(null); // End stream
          return;
        }

        // Send 1KB chunks with 10ms delay
        const CHUNK_SIZE = 1024;
        const chunkEnd = bytesSent + CHUNK_SIZE;
        const chunk = buffer.subarray(bytesSent, chunkEnd);
        bytesSent += chunk.length;
        setTimeout(() => this.push(chunk), 10);
      }
    });

    const decodedImage = await decode(slowStream);
    expect(decodedImage.data).toHaveLength(2 * 2 * 4); // 2x2 RGBA
  });

  // Mid-stream abort
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

    // Create abort controller
    const abortController = new AbortController();

    // Start the decode operation
    const decodePromise = decode(neverEndingStream, {
      signal: abortController.signal
    });

    // Wait to ensure processing has started
    // The Sharp pipeline should be processing the image data now
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Now abort the operation while it's processing
    abortController.abort();

    // The promise should reject with an abort error
    await expect(decodePromise).rejects.toThrow(
      'Operation aborted cause: Operation aborted'
    );

    // Verify the stream was destroyed
    expect(neverEndingStream.destroyed).toBe(true);
  });

  it('should decode Web ReadableStream input', async () => {
    const buffer = readFileSync('test/fixtures/assets/pixelift.png');
    // Convert to Web ReadableStream correctly
    const webStream = Readable.toWeb(
      Readable.from(buffer)
    ) as unknown as ReadableStream<Uint8Array>;

    const decodedImage = await decode(webStream);
    expect(decodedImage.data.length).toBeGreaterThan(0);
  });
});
