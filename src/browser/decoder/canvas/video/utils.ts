import { createError } from '../../../../shared/error';
import type { BrowserOptions } from '../../../types';
import { imageBitmapOptions } from '../options';
import { isAbortError } from '../../../../shared/validation';

const VIDEO_SEEK_TIMEOUT = 15000; // 15 seconds
const MIN_BUFFERED_DURATION = 0.1; // 100ms

export async function createVideoFrameBitmap(
  source: HTMLVideoElement | string,
  options?: BrowserOptions
): Promise<ImageBitmap> {
  const video = document.createElement('video');
  const targetTime = options?.targetTime;
  let effectiveTargetTime: number;

  try {
    // Configure video element
    if (typeof source === 'string') {
      video.src = source;
      video.crossOrigin = 'anonymous';
      effectiveTargetTime = targetTime ?? 0;
    } else {
      video.src = source.currentSrc || source.src;
      video.crossOrigin = source.crossOrigin || 'anonymous';
      effectiveTargetTime = targetTime ?? source.currentTime ?? 0;
    }

    video.muted = true;
    video.preload = 'auto';

    // Metadata load with safety checks
    await new Promise<void>((resolve, reject) => {
      const handleSuccess = () => {
        cleanup();
        resolve();
      };

      const handleError = (event: Event) => {
        cleanup();
        reject(
          createError.runtimeError(
            'Video metadata load failed',
            (event.target as HTMLVideoElement)?.error
          )
        );
      };

      const cleanup = () => {
        video.removeEventListener('loadedmetadata', handleSuccess);
        video.removeEventListener('error', handleError);
      };

      video.addEventListener('loadedmetadata', handleSuccess, { once: true });
      video.addEventListener('error', handleError, { once: true });
    });

    // Playback attempt with improved safety
    let played = false;
    try {
      if (video.paused) {
        await video.play();
        played = true;
      }
    } catch (playError) {
      console.warn('Video autoplay blocked, attempting seek anyway:', playError);
    }

    // Buffer check for seek safety
    if (played && video.buffered.length > 0) {
      const bufferEnd = video.buffered.end(video.buffered.length - 1);
      if (bufferEnd < effectiveTargetTime + MIN_BUFFERED_DURATION) {
        throw createError.runtimeError(
          `Insufficient video buffer for target time ${effectiveTargetTime}`
        );
      }
    }

    // Safer seek with timeout
    await seekVideoToTime(video, effectiveTargetTime);

    // Final bitmap capture
    return await createImageBitmap(video, imageBitmapOptions(options));
  } catch (error) {
    if (isAbortError(error)) throw createError.aborted();
    throw createError.runtimeError('Failed to create video frame bitmap', error);
  } finally {
    video.removeAttribute('src');
    video.load();
    video.remove();
  }
}

async function seekVideoToTime(video: HTMLVideoElement, targetTime: number): Promise<void> {
  const controller = new AbortController();

  try {
    const seekPromise = new Promise<void>((resolve, reject) => {
      if (Math.abs(video.currentTime - targetTime) < 0.001) {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          return resolve();
        }
      }

      const cleanup = () => {
        controller.abort();
        video.removeEventListener('seeked', handleSeek);
        video.removeEventListener('error', handleError);
      };

      const handleSeek = () => {
        cleanup();
        resolve();
      };

      const handleError = (event: Event) => {
        cleanup();
        reject(
          createError.runtimeError(
            'Video seek failed',
            (event.target as HTMLVideoElement)?.error
          )
        );
      };

      video.addEventListener('seeked', handleSeek, { signal: controller.signal });
      video.addEventListener('error', handleError, { signal: controller.signal });
      video.currentTime = targetTime;
    });

    const timeout = new Promise<void>((_, reject) =>
      setTimeout(() => {
        controller.abort();
        reject(
          createError.runtimeError(`Video seek timed out after ${VIDEO_SEEK_TIMEOUT}ms`)
        );
      }, VIDEO_SEEK_TIMEOUT)
    );

    await Promise.race([seekPromise, timeout]);
  } finally {
    controller.abort();
  }
}
