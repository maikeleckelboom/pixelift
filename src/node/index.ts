import fs from 'node:fs/promises'
import { PNG } from 'pngjs'
import { type BufferLike, decode } from 'jpeg-js'

import { type GifBinary, GifReader } from 'omggif'
import type { ImageFormat, NodeInput, PixelData, PixeliftOptions } from '../types'

export async function pixelift(input: NodeInput, options?: PixeliftOptions): Promise<PixelData> {
  const buffer = await getBuffer(input)
  const format = options?.format || detectFormat(buffer)
  let pixelsData: PixelData
  switch (format.toLowerCase()) {
    case 'png':
      pixelsData = decodePNG(buffer)
      break
    case 'jpg':
    case 'jpeg':
      pixelsData = decodeJPEG(buffer)
      break
    case 'gif':
      pixelsData = decodeGIF(buffer)
      break
    case 'webp':
      pixelsData = decodeWebP(buffer)
      break
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
  return pixelsData
}

function isBufferLike(input: unknown): input is Buffer {
  return Buffer.isBuffer(input)
}

async function getBuffer(input: NodeInput): Promise<Buffer> {
  if (typeof input === 'string') {
    if (/^https?:\/\//.test(input)) {
      const response = await fetch(input)
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
      return Buffer.from(await response.arrayBuffer())
    } else {
      return await fs.readFile(input)
    }
  } else if (isBufferLike(input)) {
    return input
  }

  throw new TypeError('Input must be string, Buffer, or URL')
}

function detectFormat(buffer: Buffer): ImageFormat {
  if (buffer.length < 12) {
    throw new Error(`Invalid buffer (${buffer.length} bytes), needs at least 12 bytes for header`)
  }
  const header = buffer.subarray(0, 12)
  const hexHeader = header.toString('hex')
  const asciiHeader = header.toString('ascii')
  if (hexHeader.startsWith('89504e47')) return 'png'
  if (hexHeader.startsWith('ffd8')) return 'jpeg'
  if (asciiHeader.startsWith('GIF8')) return 'gif'
  if (header.subarray(8, 12).toString() === 'WEBP') return 'webp'
  throw new Error(`Unsupported format. Header: ${hexHeader.slice(0, 8)}...`)
}

function decodePNG(buffer: Buffer): PixelData {
  const png = PNG.sync.read(buffer)
  return {
    data: new Uint8ClampedArray(png.data),
    width: png.width,
    height: png.height,
    channels: png.alpha ? 4 : 3
  }
}

function decodeJPEG(buffer: BufferLike): PixelData {
  const { data, width, height } = decode(buffer, {
    useTArray: true,
    formatAsRGBA: true
  })

  return {
    data: new Uint8ClampedArray(data),
    width,
    height,
    channels: 4 // Always 4 (RGBA) due to formatAsRGBA option
  }
}

function decodeGIF(buffer: GifBinary, frame: number = 0): PixelData {
  const reader = new GifReader(buffer)
  if (frame >= reader.numFrames()) {
    throw new Error(`Frame ${frame} out of bounds (total ${reader.numFrames()} frames)`)
  }
  const data = new Uint8ClampedArray(reader.width * reader.height * 4)
  reader.decodeAndBlitFrameBGRA(frame, data)
  for (let i = 0; i < data.length; i += 4) {
    const temp = data[i]
    data[i] = data[i + 2]
    data[i + 2] = temp
  }
  return {
    data,
    width: reader.width,
    height: reader.height,
    channels: 4 // Always 4 (RGBA) after conversion
  }
}

function decodeWebP(buffer: Buffer): PixelData {
  throw new Error('WebP format is not supported in the Node environment')
  // throw new Error('WebP support requires sharp package: npm install sharp')
}