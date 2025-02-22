import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import { PNG } from 'pngjs'
import jpeg from 'jpeg-js'
import { GifReader } from 'omggif'
import { decode as decodeWebP } from '@jsquash/webp'

type ImageFormat = 'png' | 'jpeg' | 'jpg' | 'gif' | 'webp'

interface PixelData {
  data: Uint8Array
  width: number
  height: number
  channels: 3 | 4
}

const require = createRequire(import.meta.url)

export async function getPixels(
  source: Buffer | string,
  type?: ImageFormat
): Promise<PixelData> {
  const buffer = await getBuffer(source)
  const format = type || detectFormat(buffer)

  switch (format.toLowerCase() as ImageFormat) {
    case 'png':
      return decodePNG(buffer)
    case 'jpg':
    case 'jpeg':
      return decodeJPEG(buffer)
    case 'gif':
      return decodeGIF(buffer)
    case 'webp':
      return decodeWebPWrapper(buffer)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

async function getBuffer(source: Buffer | string): Promise<Buffer> {
  if (Buffer.isBuffer(source)) return source
  return source.startsWith('http')
    ? fetch(source)
        .then((res) => res.arrayBuffer())
        .then((ab) => Buffer.from(ab))
    : fs.readFile(source)
}

function detectFormat(buffer: Buffer): ImageFormat {
  const header = buffer.subarray(0, 12)
  const hexHeader = header.toString('hex')
  const asciiHeader = header.toString('ascii')

  if (hexHeader.startsWith('89504e47')) return 'png'
  if (hexHeader.startsWith('ffd8')) return 'jpeg'
  if (asciiHeader.startsWith('GIF8')) return 'gif'
  if (header.subarray(8, 12).toString() === 'WEBP') return 'webp'
  throw new Error('Unknown image format')
}

function decodePNG(buffer: Buffer): PixelData {
  const png = PNG.sync.read(buffer)
  return {
    data: new Uint8Array(png.data),
    width: png.width,
    height: png.height,
    channels: 4
  }
}

function decodeJPEG(buffer: Buffer): PixelData {
  const { data, width, height } = jpeg.decode(buffer, {
    useTArray: true,
    formatAsRGBA: false
  })

  return {
    data: new Uint8Array(data),
    width,
    height,
    channels: 3
  }
}

function decodeGIF(buffer: Buffer): PixelData {
  const reader = new GifReader(buffer)
  const gif = new Uint8Array(reader.width * reader.height * 4)
  reader.decodeAndBlitFrameBGRA(0, gif)

  return {
    data: gif,
    width: reader.width,
    height: reader.height,
    channels: 4
  }
}

async function decodeWebPWrapper(buffer: Buffer): Promise<PixelData> {
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  )
  const { data, width, height } = await decodeWebP(arrayBuffer as ArrayBuffer)
  const channels = data.length / (width * height)
  return {
    data: new Uint8Array(data),
    width,
    height,
    channels: channels as 3 | 4
  }
}

// PNG (sync for SSR efficiency)
export function decodePNGSync(buffer: Buffer) {
  const png = PNG.sync.read(buffer)
  return {
    data: new Uint8Array(png.data),
    width: png.width,
    height: png.height,
    channels: 4
  }
}

// GIF (frame selection for SSR)
export function decodeGIFFrame(buffer: Buffer, frame = 0) {
  const reader = new GifReader(buffer)
  const gif = new Uint8Array(reader.width * reader.height * 4)
  reader.decodeAndBlitFrameBGRA(frame, gif)
  return {
    data: gif,
    width: reader.width,
    height: reader.height,
    channels: 4
  }
}