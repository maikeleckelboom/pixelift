export const PIXELIFT_BROWSER_DECODERS = ['webCodecs', 'offscreenCanvas'] as const;

export const PIXELIFT_SERVER_DECODERS = ['sharp'] as const;

export const PIXELIFT_DECODERS = [
  ...PIXELIFT_BROWSER_DECODERS,
  ...PIXELIFT_SERVER_DECODERS
] as const;

export type PixeliftDecoder = (typeof PIXELIFT_DECODERS)[number];

export const VERIFIED_INPUT_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] as const;

export type VerifiedFormat = (typeof VERIFIED_INPUT_FORMATS)[number];

export const CANVAS_IMAGE_MIME_MAP = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  ico: 'image/x-icon',
  apng: 'image/apng',
  jxl: 'image/jxl',
  heic: 'image/heic',
  heif: 'image/heif'
} as const;

export const CANVAS_VIDEO_MIME_MAP = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  ogv: 'video/ogg',
  ogg: 'video/ogg',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  m2ts: 'video/mp2t',
  ts: 'video/mp2t',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  '3gp': 'video/3gpp',
  '3g2': 'video/3gpp2',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv'
} as const;

export const WEB_CODECS_MIME_MAP = {
  h265: 'video/mp4',
  vp9: 'video/webm',
  av1: 'video/mp4'
} as const;

export const MIME_MAP: Record<string, string> = {
  ...CANVAS_IMAGE_MIME_MAP,
  ...CANVAS_VIDEO_MIME_MAP,
  ...WEB_CODECS_MIME_MAP
} as const;
