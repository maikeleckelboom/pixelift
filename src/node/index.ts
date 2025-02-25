import fs from 'node:fs/promises'
import decodePNG from './decoders/png'
import decodeJPEG from './decoders/jpeg'
import decodeGIF from './decoders/gif'
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
      throw new Error('WebP format is not supported in Node environments')
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
  }

  if (Buffer.isBuffer(input)) {
    return input
  }

  throw new TypeError('Invalid input type')
}

function detectFormat(buffer: Buffer): ImageFormat {
  if (buffer.length < 12) {
    throw new Error('Buffer is too short to detect format')
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