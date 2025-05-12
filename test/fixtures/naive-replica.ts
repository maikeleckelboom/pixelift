import type { BrowserInput } from '../../src/browser';

export async function drawToCanvasAndGetImageData(
  source: CanvasImageSource | VideoFrame,
  width: number,
  height: number
): Promise<ImageData> {
  if (width === 0 || height === 0) {
    throw new Error(`Invalid dimensions: ${width}x${height}`);
  }

  const canvas = new OffscreenCanvas(width, height);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  ctx.drawImage(source, 0, 0, width, height);
  if (source instanceof VideoFrame) source.close();

  return ctx.getImageData(0, 0, width, height);
}

export async function getUint8ClampedArrayFromInput(
  input: BrowserInput
): Promise<Uint8ClampedArray> {
  // 1. Direct data access
  if (input instanceof ImageData) return input.data;

  // 2. Canvas element handling
  if (input instanceof HTMLCanvasElement || input instanceof OffscreenCanvas) {
    const ctx = input.getContext('2d') as CanvasRenderingContext2D;
    return ctx.getImageData(0, 0, input.width, input.height).data;
  }

  // 3. VideoFrame handling
  if (input instanceof VideoFrame) {
    if (!input.codedWidth || !input.codedHeight) {
      input.close();
      throw new Error('Invalid VideoFrame dimensions');
    }
    const data = await drawToCanvasAndGetImageData(
      input,
      input.displayWidth,
      input.displayHeight
    );
    return data.data;
  }

  // 4. ImageBitmap handling
  if (input instanceof ImageBitmap) {
    if (!input.width || !input.height) {
      input.close();
      throw new Error('Invalid ImageBitmap dimensions');
    }
    const data = await drawToCanvasAndGetImageData(input, input.width, input.height);
    return data.data;
  }

  // 5. HTMLImageElement handling
  if (input instanceof HTMLImageElement) {
    if (!input.complete || !input.naturalWidth) {
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          input.onload = null;
          input.onerror = null;
        };

        input.onload = () => {
          cleanup();
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          input.naturalWidth ? resolve() : reject('Invalid image dimensions');
        };

        input.onerror = (err) => {
          cleanup();
          reject(`Image load failed: ${err}`);
        };

        if (!input.src) reject('Image source missing');
      });
    }
    const data = await drawToCanvasAndGetImageData(
      input,
      input.naturalWidth,
      input.naturalHeight
    );
    return data.data;
  }

  // 6. HTMLVideoElement handling
  if (input instanceof HTMLVideoElement) {
    if (input.readyState < HTMLMediaElement.HAVE_METADATA || !input.videoWidth) {
      await new Promise<void>((resolve, reject) => {
        const handleReady = () => {
          cleanup();
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          input.videoWidth ? resolve() : reject('Invalid video dimensions');
        };

        const cleanup = () => {
          input.removeEventListener('loadeddata', handleReady);
          input.removeEventListener('error', handleError);
        };

        const handleError = () => {
          cleanup();
          reject('Video load failed');
        };

        input.addEventListener('loadeddata', handleReady);
        input.addEventListener('error', handleError);

        if (!input.src && !input.currentSrc) {
          reject('Video source missing');
        }
      });
    }
    const data = await drawToCanvasAndGetImageData(
      input,
      input.videoWidth,
      input.videoHeight
    );
    return data.data;
  }

  // 7. Blob handling
  if (input instanceof Blob) {
    if (input.size === 0) throw new Error('Empty Blob');

    // Optimized image handling
    if (input.type.startsWith('image/') && typeof createImageBitmap !== 'undefined') {
      try {
        const bitmap = await createImageBitmap(input);
        const data = await drawToCanvasAndGetImageData(bitmap, bitmap.width, bitmap.height);
        bitmap.close();
        return data.data;
      } catch {
        /* Fallback to legacy method */
      }
    }

    const url = URL.createObjectURL(input);
    try {
      if (input.type.startsWith('image/')) {
        const img = new Image();
        return await new Promise<Uint8ClampedArray>((resolve, reject) => {
          img.onload = async () => {
            try {
              const result = await drawToCanvasAndGetImageData(
                img,
                img.naturalWidth,
                img.naturalHeight
              );
              resolve(result.data);
            } catch (e) {
              reject(e);
            }
          };
          img.onerror = () => reject('Image load failed');
          img.src = url;
        });
      }

      if (input.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;

        return await new Promise<Uint8ClampedArray>((resolve, reject) => {
          video.onloadeddata = async () => {
            try {
              const result = await drawToCanvasAndGetImageData(
                video,
                video.videoWidth,
                video.videoHeight
              );
              resolve(result.data);
            } catch (e) {
              reject(e);
            }
          };
          video.onerror = () => reject('Video load failed');
          video.src = url;
          video.load();
        });
      }

      throw new Error('Unsupported Blob type');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // 8. URL handling
  if (typeof input === 'string' || input instanceof URL) {
    const url = input instanceof URL ? input.href : input;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    return getUint8ClampedArrayFromInput(await response.blob());
  }

  throw new Error(`Unsupported input type: ${input}`);
}
