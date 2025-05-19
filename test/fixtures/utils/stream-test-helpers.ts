import { Readable } from 'node:stream';

/**
 * Creates a Readable stream that emits chunks of a buffer with a delay.
 * @param buffer The buffer to stream.
 * @param chunkSize The size of each chunk (default: 1024).
 * @param delay The delay in ms before pushing each chunk (default: 10).
 * @returns A Node.js Readable stream.
 */
export function createSlowReadableStream(
  buffer: Buffer,
  chunkSize: number = 1024,
  delay: number = 10
): Readable {
  let bytesSent = 0;
  return new Readable({
    read() {
      if (bytesSent >= buffer.length) {
        this.push(null);
        return;
      }
      const chunkEnd = Math.min(bytesSent + chunkSize, buffer.length);
      const chunk = buffer.subarray(bytesSent, chunkEnd);
      bytesSent += chunk.length;
      setTimeout(() => this.push(chunk), delay);
    }
  });
}

/**
 * Creates a Readable stream that emits a buffer once and then never ends.
 * @param buffer The buffer to emit.
 * @returns A Node.js Readable stream.
 */
export function createNeverEndingStream(buffer: Buffer): Readable {
  let sentData = false;
  return new Readable({
    read() {
      if (!sentData) {
        this.push(buffer);
        sentData = true;
      }
    }
  });
}
