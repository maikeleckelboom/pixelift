import type { PixelData } from '../../../types';
import type { BrowserInput, BrowserOptions } from '../../types';
import { BITMAP_OPTIONS, CANVAS_OPTIONS } from './options';
import { createError } from '../../../shared/error';

export async function isSupported(_type?: unknown): Promise<boolean> {
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
  const { bitmap, shouldClose } =
    input instanceof ImageBitmap
      ? { bitmap: input, shouldClose: false }
      : { bitmap: await createImageFromBlob(input), shouldClose: true };

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d', CANVAS_OPTIONS);

  if (!context) {
    if (shouldClose) bitmap.close();
    throw createError.runtimeError('Failed to obtain 2D context for decoding');
  }

  setupContext(context);
  context.drawImage(bitmap, 0, 0);
  const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height, {
    colorSpace: 'srgb'
  });

  if (shouldClose) bitmap.close();
  return {
    data: imageData.data,
    width: imageData.width,
    height: imageData.height
  };
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

export async function convertToBlobUsingCanvas(
  source: Exclude<BrowserInput, string | URL | Blob | HTMLCanvasElement | OffscreenCanvas>,
  options?: BrowserOptions
): Promise<Blob> {
  let createdBitmap: ImageBitmap | undefined;
  let inputVideoFrame: VideoFrame | undefined;

  try {
    if (source instanceof ImageData) {
      const canvas = new OffscreenCanvas(source.width, source.height);
      const ctx = canvas.getContext('2d', CANVAS_OPTIONS);
      if (!ctx) throw createError.runtimeError('Canvas context acquisition failed');

      setupContext(ctx);
      ctx.putImageData(source, 0, 0);
      return canvas.convertToBlob({
        type: options?.type,
        quality: options?.quality
      });
    }

    let bitmapToDraw: ImageBitmap;
    if (source instanceof ImageBitmap) {
      bitmapToDraw = source;
    } else {
      if (typeof VideoFrame !== 'undefined' && source instanceof VideoFrame) {
        inputVideoFrame = source;
        createdBitmap = await createImageBitmap(inputVideoFrame, BITMAP_OPTIONS);
      } else if (
        source instanceof HTMLVideoElement &&
        typeof options?.frameAt === 'number'
      ) {
        createdBitmap = await createVideoFrameBitmap(source, options.frameAt);
      } else {
        createdBitmap = await createImageBitmap(source, BITMAP_OPTIONS);
      }
      bitmapToDraw = createdBitmap;
    }

    const canvas = new OffscreenCanvas(bitmapToDraw.width, bitmapToDraw.height);
    const ctx = canvas.getContext('2d', CANVAS_OPTIONS);
    if (!ctx) throw createError.runtimeError('Canvas context acquisition failed');

    setupContext(ctx);
    ctx.drawImage(bitmapToDraw, 0, 0);
    return canvas.convertToBlob({
      type: options?.type,
      quality: options?.quality
    });
  } finally {
    createdBitmap?.close();
    inputVideoFrame?.close();
  }
}
