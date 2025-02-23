import fs from 'node:fs/promises'
import { PNG } from 'pngjs'
import jpeg, { type BufferLike } from 'jpeg-js'
import { type GifBinary, GifReader } from 'omggif'
import type { ImageFormat, NodeInput, PixelData } from '../types'

export async function pixelift(input: NodeInput, type?: ImageFormat): Promise<PixelData> {
  const buffer = await getBuffer(input)
  const format = type || detectFormat(buffer)
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

async function getBuffer(input: NodeInput): Promise<Buffer> {
  if (typeof input === 'string') {
    if (/^https?:\/\//.test(input)) {
      const response = await fetch(input)
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
      return Buffer.from(await response.arrayBuffer())
    } else {
      return await fs.readFile(input)
    }
  } else {
    return input as Buffer
  }
}

function detectFormat(buffer: Buffer): ImageFormat {
  if (buffer.length < 12) throw new Error("Invalid buffer");
  const header = buffer.subarray(0, 12)
  const hexHeader = header.toString('hex')
  const asciiHeader = header.toString('ascii')
  if (hexHeader.startsWith('89504e47')) return 'png'
  if (hexHeader.startsWith('ffd8')) return 'jpeg'
  if (asciiHeader.startsWith('GIF8')) return 'gif'
  if (header.subarray(8, 12).toString() === 'WEBP') return 'webp'
  throw new Error('Unsupported format')
}

function decodePNG(buffer: Buffer): PixelData {
  const png = PNG.sync.read(buffer)
  return {
    data: new Uint8ClampedArray(png.data),
    width: png.width,
    height: png.height
  }
}

function decodeJPEG(buffer: BufferLike): PixelData {
  const { data, width, height } = jpeg.decode(buffer, {
    useTArray: true,
    formatAsRGBA: true
  })

  return {
    data: new Uint8ClampedArray(data),
    width,
    height
  }
}

function decodeGIF(buffer: GifBinary, frame: number = 0): PixelData {
  const reader = new GifReader(buffer)
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
    height: reader.height
  }
}

function decodeWebP(_buffer: Buffer): PixelData {
  // WebP support is not available in the Node environment
  // To add WebP support, you can use the 'sharp' package
  // https://sharp.pixelplumbing.com/api-output#webp
  throw new Error('WebP format is not supported in the Node environment')
}
