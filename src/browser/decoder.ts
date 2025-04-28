import type { PixeliftBrowserInput, PixeliftBrowserOptions } from './types.ts';
import { PixeliftError } from '../common/errors.ts';
import { isImageBitmapSource, isStringOrURL } from '../common/validation.ts';
import type { PixelData } from '../types.ts';

function createRenderingContext(
  bitmap: ImageBitmap,
  options: PixeliftBrowserOptions = {}
): OffscreenCanvasRenderingContext2D {
  const width = options.width ?? bitmap.width;
  const height = options.height ?? bitmap.height;

  if (width <= 0 || height <= 0) {
    throw PixeliftError.decodeFailed(
      `Invalid canvas dimensions (width: ${width}, height: ${height})`
    );
  }

  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d', {
    alpha: true,
    colorSpace: 'srgb'
  });

  if (!context) {
    throw PixeliftError.decodeFailed('Failed to create canvas rendering context');
  }

  context.imageSmoothingEnabled = false;
  context.imageSmoothingQuality = 'low';
  context.drawImage(bitmap, 0, 0, width, height);
  return context;
}

function getImageDataFromCanvas(context: OffscreenCanvasRenderingContext2D): ImageData {
  const { width, height } = context.canvas;
  return context.getImageData(0, 0, width, height, { colorSpace: 'srgb' });
}

function loadImageFromURL(sourceURL: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => resolve(image);
    image.onerror = () => {
      reject(
        PixeliftError.fileReadFailed(`Failed to load image from URL`, {
          cause: new Error('Check CORS configuration or URL validity')
        })
      );
    };

    image.src = sourceURL;
  });
}

async function convertSVGToBitmap(svgBlob: Blob, sourceURL: string): Promise<ImageBitmap> {
  const objectURL = URL.createObjectURL(svgBlob);
  try {
    const image = await loadImageFromURL(objectURL);

    if (image.width <= 0 || image.height <= 0) {
      return Promise.reject(
        PixeliftError.decodeFailed(
          `Invalid SVG dimensions (width: ${image.width}, height: ${image.height})`
        )
      );
    }

    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext('2d');
    if (!context) {
      return Promise.reject(
        PixeliftError.decodeFailed('Failed to create 2D context for SVG processing')
      );
    }

    context.imageSmoothingEnabled = false;
    context.imageSmoothingQuality = 'low';
    context.drawImage(image, 0, 0);
    return await createImageBitmap(canvas);
  } catch (error) {
    throw PixeliftError.decodeFailed(`Failed to process SVG image`, { cause: error as Error });
  } finally {
    URL.revokeObjectURL(objectURL);
  }
}

async function fetchAndDecodeImage(source: string | URL): Promise<ImageBitmap> {
  const sourceURL = source.toString();
  const response = await fetch(new URL(sourceURL, location.origin).toString(), {
    mode: 'cors'
  });
  if (!response.ok) {
    throw PixeliftError.requestFailed(`Image fetch failed (HTTP ${response.status})`, {
      cause: new Error(response.statusText)
    });
  }

  // Check content type before processing
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.startsWith('text/html')) {
    const debugURL = new URL(sourceURL, location.origin).toString();
    throw PixeliftError.decodeFailed(
      `Expected an image but received HTML content from ${debugURL}. This usually indicates:\n` +
      `1. The URL points to a webpage instead of an image file\n` +
      `2. The server returned an error page (e.g., 404, 403, 500)\n` +
      `3. Authentication is required or cookies are missing\n` +
      `4. The URL protocol is incorrect (Try https:// instead of http://)\n` +
      `Tip: Open the URL in a browser to see what content is actually being returned`,
      { cause: new Error(`Invalid content type: ${contentType} for URL: ${debugURL}`) }
    );
  }

  if (contentType && !contentType.startsWith('image/') && !sourceURL.endsWith('.svg')) {
    throw PixeliftError.decodeFailed(
      `Expected an image but received content of type: ${contentType} from ${sourceURL}.\n` +
      `Ensure the URL points directly to an image file (jpg, png, gif, etc.)`,
      { cause: new Error(`Invalid content type for image processing`) }
    );
  }

  const imageBlob = await response.blob();

  try {
    if (imageBlob.type === 'image/svg+xml' || sourceURL.endsWith('.svg')) {
      return convertSVGToBitmap(imageBlob, sourceURL);
    }

    return await createImageBitmap(imageBlob);
  } catch (error) {
    throw PixeliftError.decodeFailed(`Failed to decode ${imageBlob.type || 'unknown'} image`, {
      cause: error as Error
    });
  }
}

async function fetchAndCreateImageBitmap(source: PixeliftBrowserInput): Promise<ImageBitmap> {
  if (isStringOrURL(source)) {
    return fetchAndDecodeImage(source);
  }

  if (source instanceof File || source instanceof Blob || isImageBitmapSource(source)) {
    try {
      return await createImageBitmap(source);
    } catch (error) {
      throw PixeliftError.decodeFailed(`Failed to process image source`, {
        cause: error as Error
      });
    }
  }

  throw PixeliftError.decodeFailed(`Unsupported image source type`, {
    cause: new TypeError(`Invalid image source type: ${typeof source}`)
  });
}

export async function decode(
  imageSource: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  try {
    const imageBitmap = await fetchAndCreateImageBitmap(imageSource);
    const drawingContext = createRenderingContext(imageBitmap, options);
    const { data, width, height } = getImageDataFromCanvas(drawingContext);
    return { data, width, height, channels: 4 };
  } catch (error: unknown) {
    if (error instanceof PixeliftError) {
      throw error;
    }
    throw PixeliftError.decodeFailed(`Failed to decode image`, { cause: error as Error });
  }
}
