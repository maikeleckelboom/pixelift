import type { BrowserInput, BrowserOptions } from '../types.ts';
import { NetworkError, PixeliftError } from '../core';

export async function loadAndGetImageData(
  imageSource: BrowserInput,
  options?: BrowserOptions,
): Promise<ImageData> {
  let bitmap: ImageBitmap;

  if (imageSource instanceof SVGElement) {
    return await createImageDataFromSvg(imageSource);
  }

  if (imageSource instanceof ImageBitmap) {
    bitmap = imageSource;
  } else if (typeof imageSource === 'string' || imageSource instanceof URL) {
    const blob = await getBlob(imageSource);
    bitmap = await createImageBitmap(blob, options);
  } else {
    bitmap = await createImageBitmap(imageSource, options);
  }

  const context = createOffscreenCanvasContext({
    width: bitmap.width,
    height: bitmap.height,
    colorSpace: options?.colorSpace,
  });
  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, bitmap.width, bitmap.height, {
    colorSpace: options?.colorSpace,
  });
}

async function getBlob(url: string | URL) {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new NetworkError(
      `Failed to fetch image from ${url}: ${response.status} ${response.statusText}`,
    );
  }
  return await response.blob();
}

export function createOffscreenCanvasContext(
  options?: BrowserOptions & { width?: number, height?: number },
) {
  const canvas = new OffscreenCanvas(options?.width ?? 1, options?.height ?? 1);
  const context = canvas.getContext('2d', {
    alpha: options?.alpha,
    colorSpace: options?.colorSpace,
  });
  if (!context) {
    throw new PixeliftError('Failed to get 2D context');
  }
  return context;
}

export async function createImageDataFromSvg(
  svg: SVGElement,
): Promise<ImageData> {
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
    type: 'image/svg+xml',
  });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });

    const outputWidth = img.naturalWidth;
    const outputHeight = img.naturalHeight;
    const context = createOffscreenCanvasContext();
    context.drawImage(img, 0, 0, outputWidth, outputHeight);
    return context.getImageData(0, 0, outputWidth, outputHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}