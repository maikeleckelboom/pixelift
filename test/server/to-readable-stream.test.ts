import { describe, expect, it, vi } from 'vitest';
import { Readable } from 'stream';
import { nodeToWebStream } from '../../src/shared/to-readable-stream.ts';

describe('nodeToWebStream', () => {
  it('converts a Node.js readable stream to a Web ReadableStream and reads data correctly', async () => {
    const nodeStream = new Readable({
      read() {
        this.push('Test data');
        this.push(null);
      }
    });

    const webStream = nodeToWebStream(nodeStream);
    const reader = webStream.getReader();
    const chunks: string[] = [];

    let done = false;
    while (!done) {
      const { value, done: isDone } = await reader.read();
      if (value) chunks.push(new TextDecoder().decode(value));
      done = isDone;
    }

    expect(chunks.join('')).toBe('Test data');
  });

  it('handles stream errors correctly', async () => {
    const error = new Error('Test error');
    const nodeStream = new Readable({
      read() {
        this.destroy(error);
      }
    });

    const webStream = nodeToWebStream(nodeStream);
    const reader = webStream.getReader();
    await expect(reader.read()).rejects.toThrow('Test error');
  });

  it('supports backpressure by pausing and resuming the Node.js stream', async () => {
    const pushSpy = vi.fn();
    const nodeStream = new Readable({
      read() {
        pushSpy();
        this.push('chunk1');
        this.push('chunk2');
        this.push(null);
      }
    });

    const webStream = nodeToWebStream(nodeStream);
    const reader = webStream.getReader();

    const firstChunk = await reader.read();
    expect(new TextDecoder().decode(firstChunk.value!)).toBe('chunk1');
    expect(pushSpy).toHaveBeenCalledTimes(1);

    const secondChunk = await reader.read();
    expect(new TextDecoder().decode(secondChunk.value!)).toBe('chunk2');
    expect(pushSpy).toHaveBeenCalledTimes(1);

    const lastChunk = await reader.read();
    expect(lastChunk.done).toBe(true);
  });

  it('properly destroys the Node.js stream when the WebStream is canceled', async () => {
    const destroySpy = vi.fn();
    const nodeStream = new Readable({
      read() {
        this.push('chunk');
      },
      destroy(error) {
        destroySpy(error);
        super.destroy(error);
      }
    });

    const webStream = nodeToWebStream(nodeStream);
    const reader = webStream.getReader();

    await reader.cancel('Test cancel');
    expect(destroySpy).toHaveBeenCalledWith('Test cancel');
  });
});
