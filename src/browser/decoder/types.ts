/** Supported color spaces for CanvasRenderingContext2D. */
export type PredefinedColorSpace = 'srgb' | 'display-p3' | 'rec2020';

/** Subset of RequestInit for fetch customization. */
export type FetchOptions = Pick<RequestInit, 'credentials' | 'headers' | 'signal' | 'mode'>;

/**
 * Canvas-based decoding and rendering options.
 */
export interface CanvasConfig {
  /** Pass-through to getContext('2d', { alpha }). Defaults to true. */
  alpha?: boolean;
  /** Target width for resizing; if undefined, use original width. */
  resizeWidth?: number;
  /** Target height for resizing; if undefined, use original height. */
  resizeHeight?: number;
  /** Custom quality abstraction for resizing; does not map to browser API. */
  resizeQuality?: 'low' | 'medium' | 'high';
  /** Maps to context.imageSmoothingEnabled. Defaults to true. */
  smoothingEnabled?: boolean;
  /** Maps to context.imageSmoothingQuality. Defaults to 'medium'. */
  smoothingQuality?: 'low' | 'medium' | 'high';
  /** Pass-through to getContext('2d', { colorSpace }). */
  colorSpace?: PredefinedColorSpace;
}

/**
 * WebCodecs-based decoding options.
 */
export interface WebCodecsConfig {
  /** MIME type for ImageDecoder (e.g., 'image/png'). */
  type?: string;
  /** Frame index when decoding multi-frame images. */
  frameIndex?: number;
  /** If true, only complete frames are decoded. */
  completeFramesOnly?: boolean;
  /** Hints to prefer animation decoding. */
  preferAnimation?: boolean;
}

/**
 * Unified options for Pixelift decoding.
 */
export type PixeliftOptions = FetchOptions &
  (
    | { decoder: 'offscreenCanvas'; options?: CanvasConfig }
    | { decoder: 'webCodecs'; options?: WebCodecsConfig }
  );

/**
 * Sensible defaults for both _decoders; no resizing by default.
 */
export const dummyTestOptions: PixeliftOptions[] = [
  {
    decoder: 'offscreenCanvas',
    options: {
      alpha: true,
      colorSpace: 'srgb',
      smoothingEnabled: true,
      smoothingQuality: 'medium'
    }
  },
  {
    decoder: 'webCodecs',
    options: {
      type: 'image/png',
      frameIndex: 0,
      completeFramesOnly: true,
      preferAnimation: false
    }
  }
];
