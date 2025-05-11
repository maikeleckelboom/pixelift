import type { PixelData } from '../../../types';
import type { BrowserInput, BrowserOptions } from '../../types';
import { BITMAP_OPTIONS, CANVAS_OPTIONS } from './options';
import { createError } from '../../../shared/error';

export function isSupported(_type?: unknown): boolean {
  return (
    'OffscreenCanvas' in window &&
    typeof OffscreenCanvas === 'function' &&
    typeof createImageBitmap === 'function'
  );
}

async function createImageFromBlob(input: Blob): Promise<ImageBitmap> {
  if (input.type === 'image/svg+xml') {
    const svgUrl = URL.createObjectURL(input);
    try {
      const image = new Image();
      image.src = svgUrl;
      await image.decode();
      return createImageBitmap(image, BITMAP_OPTIONS);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }
  return createImageBitmap(input, BITMAP_OPTIONS);
}

function setupContext(context: OffscreenCanvasRenderingContext2D): void {
  context.imageSmoothingEnabled = false;
  context.imageSmoothingQuality = 'low';
}
export async function decode(
  input: Blob | ImageBitmap,
  _?: BrowserOptions
): Promise<PixelData> {
  let bitmapToProcess: ImageBitmap;
  let shouldCloseBitmapInternally = false;

  if (input instanceof ImageBitmap) {
    bitmapToProcess = input;
  } else {
    bitmapToProcess = await createImageFromBlob(input);
    shouldCloseBitmapInternally = true;
  }

  try {
    const canvas = new OffscreenCanvas(bitmapToProcess.width, bitmapToProcess.height);
    const context = canvas.getContext('2d', CANVAS_OPTIONS);

    if (!context) {
      throw createError.runtimeError('Failed to obtain 2D context for decoding');
    }

    setupContext(context);
    context.drawImage(bitmapToProcess, 0, 0);
    return context.getImageData(0, 0, bitmapToProcess.width, bitmapToProcess.height, {
      colorSpace: 'srgb'
    });
  } finally {
    if (shouldCloseBitmapInternally) {
      bitmapToProcess.close();
    }
  }
}

async function seekVideoToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanUp = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };

    const onSeeked = () => {
      cleanUp();
      resolve();
    };

    const onError = (event: Event) => {
      cleanUp();
      const error = (event.target as HTMLVideoElement)?.error;
      reject(
        createError.runtimeError(
          `Video seek error (${time}s): [${error?.code}] ${error?.message}`
        )
      );
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.currentTime = time;
  });
}

async function createVideoFrameBitmap(
  source: HTMLVideoElement,
  frameAt: number
): Promise<ImageBitmap> {
  const wasPaused = source.paused;
  const originalTime = source.currentTime;

  if (!wasPaused) source.pause();

  try {
    if (source.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          source.removeEventListener('loadedmetadata', onLoad);
          source.removeEventListener('error', onError);
        };
        const onLoad = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(createError.runtimeError('Video metadata load failed'));
        };
        source.addEventListener('loadedmetadata', onLoad);
        source.addEventListener('error', onError);
      });
    }

    await seekVideoToTime(source, frameAt);
    return await createImageBitmap(source, BITMAP_OPTIONS);
  } finally {
    try {
      source.currentTime = originalTime;
      if (!wasPaused) await source.play();
    } catch (e) {
      console.warn('Video state restoration failed:', e);
    }
  }
}

/**
 *
 * @param input - HTMLVideoElement | HTMLOrSVGImageElement | ImageBitmap | VideoFrame | ImageData
 * @param options
 */
export async function convertToBlobUsingCanvas(
  input: Exclude<BrowserInput, string | URL | Blob | HTMLCanvasElement | OffscreenCanvas>,
  options?: BrowserOptions
): Promise<Blob> {
  let createdBitmap: ImageBitmap | undefined;
  let inputVideoFrame: VideoFrame | undefined;

  try {
    if (input instanceof ImageData) {
      const canvas = new OffscreenCanvas(input.width, input.height);
      const context = canvas.getContext(
        '2d',
        CANVAS_OPTIONS
      ) as OffscreenCanvasRenderingContext2D;
      setupContext(context);
      context.putImageData(input, 0, 0);
      return canvas.convertToBlob({
        type: options?.type,
        quality: options?.quality
      });
    }

    let bitmapToDraw: ImageBitmap;
    if (input instanceof ImageBitmap) {
      bitmapToDraw = input;
    } else {
      if (input instanceof VideoFrame) {
        inputVideoFrame = input;
        createdBitmap = await createImageBitmap(inputVideoFrame, BITMAP_OPTIONS);
      } else if (
        input instanceof HTMLVideoElement &&
        typeof options?.frameAt === 'number'
      ) {
        createdBitmap = await createVideoFrameBitmap(input, options.frameAt);
      } else {
        createdBitmap = await createImageBitmap(input, BITMAP_OPTIONS);
      }
      bitmapToDraw = createdBitmap;
    }

    const canvas = new OffscreenCanvas(bitmapToDraw.width, bitmapToDraw.height);
    const context = canvas.getContext(
      '2d',
      CANVAS_OPTIONS
    ) as OffscreenCanvasRenderingContext2D;
    setupContext(context);
    context.drawImage(bitmapToDraw, 0, 0);
    return canvas.convertToBlob({
      type: options?.type,
      quality: options?.quality
    });
  } finally {
    createdBitmap?.close();
    inputVideoFrame?.close();
  }
}
