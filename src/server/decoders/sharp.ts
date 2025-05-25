import { importSharp } from './sharp-loader';
import type { PixelData } from '@/types';
import { Readable } from 'node:stream';
import type { PixelDecoder } from '@/plugin/types';
import type { ServerOptions } from '@/server/types';
import type { Sharp } from 'sharp';

type SharpDecoderInput = Buffer | string | Readable;

export const sharpDecoder: PixelDecoder = {
  name: 'sharp',
  priority: 1000,
  metadata: {
    runtimes: ['node'],
    description:
      'Sharp decoder for Node.js, supports Buffer, string (file path), and Readable streams.'
  },

  async canHandle(input: unknown): Promise<boolean> {
    return (
      input instanceof Buffer ||
      typeof input === 'string' ||
      input instanceof Readable ||
      input instanceof ReadableStream
    );
  },

  async decode(input: SharpDecoderInput, _options?: ServerOptions): Promise<PixelData> {
    const sharpInstanceCreator = await importSharp();

    let sharpProcessingChain: Sharp;

    if (input instanceof Buffer || typeof input === 'string') {
      sharpProcessingChain = sharpInstanceCreator(input);
    } else if (input instanceof Readable) {
      sharpProcessingChain = sharpInstanceCreator({ failOn: 'truncated' });
      input.pipe(sharpProcessingChain);
    } else {
      throw new Error(
        'Sharp decoder received an unexpected input type in decode(). Expected Buffer, string (file path), or Node.js Readable.'
      );
    }

    const { data, info } = await sharpProcessingChain
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return {
      data: new Uint8ClampedArray(data),
      width: info.width,
      height: info.height
    };
  }
};
