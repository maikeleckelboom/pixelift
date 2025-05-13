import { createError } from '../../../../shared/error';
import type { BrowserOptions } from '../../../types';
import { imageBitmapOptions } from '../options';
import { isAbortError } from '../../../../shared/validation';

export async function createVideoFrameBitmap(
  source: HTMLVideoElement | string,
  options?: BrowserOptions
): Promise<ImageBitmap> {
  const video = document.createElement('video');
  const targetTime = options?.targetTime;
  let effectiveTargetTime: number;

  try {
    if (typeof source === 'string') {
      video.src = source;
      video.crossOrigin = 'anonymous';
      effectiveTargetTime = targetTime ?? 0;
    } else {
      video.src = source.currentSrc || source.src;
      video.crossOrigin = source.crossOrigin || 'anonymous';
      effectiveTargetTime = targetTime ?? source.currentTime ?? 0;
    }

    // Required for automatic playback in modern browsers
    video.muted = true;
    video.preload = 'auto';

    // Wait for basic metadata if not already loaded
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      await waitForVideoMetadata(video);
    }

    // Ensure we have the correct frame at target time
    await seekVideoToTime(video, effectiveTargetTime);

    // Generate the final image bitmap
    return await createImageBitmap(video, imageBitmapOptions(options));
  } catch (error) {
    if (isAbortError(error)) throw createError.aborted();
    throw createError.runtimeError('Failed to create ImageBitmap from video', error);
  } finally {
    video.remove();
  }
}

/** Handles video seeking with proper error handling and event cleanup */
async function seekVideoToTime(video: HTMLVideoElement, targetTime: number): Promise<void> {
  if (video.currentTime === targetTime) {
    // Already at correct time - check data availability
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    // Wait for data at current time position
    return new Promise((resolve, reject) => {
      const handleLoadedData = () => {
        cleanup();
        resolve();
      };

      const handleError = (event: Event) => {
        cleanup();
        reject(
          createError.runtimeError(
            'Video data load failed',
            (event.target as HTMLVideoElement)?.error
          )
        );
      };

      const cleanup = () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
      };

      video.addEventListener('loadeddata', handleLoadedData, { once: true });
      video.addEventListener('error', handleError, { once: true });
    });
  }

  // Need to perform seek operation
  return new Promise((resolve, reject) => {
    const handleSeeked = () => {
      cleanup();
      resolve();
    };

    const handleError = (event: Event) => {
      cleanup();
      const error = event instanceof ErrorEvent ? event.error : undefined;
      reject(createError.runtimeError('Video seek operation failed', error));
    };

    const cleanup = () => {
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };

    video.addEventListener('seeked', handleSeeked, { once: true });
    video.addEventListener('error', handleError, { once: true });

    video.currentTime = targetTime;
  });
}

/** Wait for basic video metadata to load */
async function waitForVideoMetadata(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    video.addEventListener('loadedmetadata', () => resolve(), { once: true });
    video.addEventListener(
      'error',
      (event) => {
        reject(createError.runtimeError('Video metadata load failed', event.error));
      },
      { once: true }
    );
  });
}
