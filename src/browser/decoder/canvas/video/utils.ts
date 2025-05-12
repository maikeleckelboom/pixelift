// In src/browser/decoder/canvas/video/utils.ts

import { createError } from '../../../../shared/error';
// Import BrowserOptions and imageBitmapOptions
import type { BrowserOptions } from '../../../types';
import { imageBitmapOptions } from '../options';

export async function createVideoFrameBitmap(
  source: HTMLVideoElement | string,
  options?: BrowserOptions
): Promise<ImageBitmap> {
  const video = document.createElement('video');
  const targetTime: number | undefined = options?.targetTime;
  let effectiveTargetTime: number;

  try {
    if (typeof source === 'string') {
      video.src = source;
      video.crossOrigin = 'anonymous';
      effectiveTargetTime = targetTime ?? 0;
    } else {
      video.src = source.currentSrc;
      video.crossOrigin = source.crossOrigin || 'anonymous';
      effectiveTargetTime = targetTime ?? source.currentTime;
    }

    video.muted = true;
    video.preload = 'auto';

    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise<void>((resolve, reject) => {
        video.addEventListener('loadedmetadata', () => resolve(), { once: true });
        video.addEventListener(
          'error',
          (err) => {
            reject(createError.runtimeError('Video metadata load failed', err));
          },
          { once: true }
        );
      });
    }

    await seekVideoToTime(video, effectiveTargetTime);

    // **Enhancement**: Use imageBitmapOptions to allow resizing directly from video frame
    return await createImageBitmap(video, imageBitmapOptions(options));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw createError.aborted();
    }
    throw createError.runtimeError('Failed to create ImageBitmap from video', e);
  } finally {
    // Consider if video.src = '' or video.removeAttribute('src') is needed before remove()
    // for complete resource cleanup, though remove() usually suffices.
    video.remove();
  }
}

async function seekVideoToTime(video: HTMLVideoElement, time: number): Promise<void> {
  if (video.currentTime === time) return;
  return new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener('error', onError);
      resolve();
    };
    const onError = (event: Event | string) => {
      video.removeEventListener('seeked', onSeeked);
      reject(
        createError.runtimeError(
          'Video seek operation failed',
          event instanceof Event ? (event.target as HTMLVideoElement)?.error : event
        )
      );
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });

    video.currentTime = time;
    // Some browsers might not fire 'seeked' if currentTime is set to the same value
    // or if the video isn't fully ready. The initial check helps.
    // If video.readyState is low, seeking might be problematic.
    // Consider adding a timeout or further checks if seek issues persist.
  });
}
