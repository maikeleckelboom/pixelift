import { createError } from '../../../../shared/error';
import { IMAGE_BITMAP_OPTIONS } from '../options';

export async function createVideoFrameBitmap(
  source: HTMLVideoElement | string,
  targetTime?: number
): Promise<ImageBitmap> {
  const video = document.createElement('video');
  let effectiveTargetTime: number;

  try {
    // Configure video element based on input type
    if (typeof source === 'string') {
      video.src = source;
      video.crossOrigin = 'anonymous';
      effectiveTargetTime = targetTime ?? 0;
    } else {
      video.src = source.currentSrc;
      video.crossOrigin = source.crossOrigin;
      effectiveTargetTime = targetTime ?? source.currentTime;
    }

    video.muted = true;
    video.preload = 'auto';

    // Load metadata if needed
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

    // Seek to target time
    await seekVideoToTime(video, effectiveTargetTime);

    // Debug logs (remove in production)
    console.log(`Seeking video to time: ${effectiveTargetTime}`);
    console.log(`Actual video time: ${video.currentTime}`);

    return await createImageBitmap(video, IMAGE_BITMAP_OPTIONS);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw createError.aborted();
    }
    throw createError.runtimeError('Failed to create ImageBitmap from video', e);
  } finally {
    video.remove();
  }
}

async function seekVideoToTime(video: HTMLVideoElement, time: number): Promise<void> {
  if (time === video.currentTime) return;

  video.currentTime = time;
  await new Promise<void>((resolve) => {
    video.addEventListener('seeked', () => resolve(), { once: true });
  });
}
