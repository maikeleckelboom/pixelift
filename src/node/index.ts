import fs from 'node:fs/promises'
import decodePNG from './decoders/png'
import decodeJPEG from './decoders/jpeg'
import decodeGIF from './decoders/gif'
import type { NodeInput, PixelData, PixeliftOptions, SupportedFormat } from '../types'

const decoders: Record<SupportedFormat | string & {}, (buffer: Buffer) => PixelData | never> = {
  'png': decodePNG,
  'jpg': decodeJPEG,
  'jpeg': decodeJPEG,
  'gif': decodeGIF,
  'webp': () => {
    throw new Error('WebP format is not supported in Node environments')
  }
}

export async function pixelift(input: NodeInput, options?: PixeliftOptions): Promise<PixelData> {
  const buffer = await getBuffer(input)
  const format = options?.format || detectFormat(buffer)
  const decoder = decoders[format]
  if (!decoder) {
    throw new Error(`Unsupported format: ${format}`)
  }
  return decoder(buffer)
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
  if (Buffer.isBuffer(input)) return input
  throw new TypeError('Invalid input type')
}

function detectFormat(buffer: Buffer): SupportedFormat {
  if (buffer.length < 12) throw new Error('Buffer is too short to detect format')
  const header = buffer.subarray(0, 12)
  const hexHeader = header.toString('hex')
  const asciiHeader = header.toString('ascii')
  if (hexHeader.startsWith('89504e47')) return 'png'
  if (hexHeader.startsWith('ffd8')) return 'jpeg'
  if (asciiHeader.startsWith('GIF8')) return 'gif'
  if (header.subarray(8, 12).toString() === 'WEBP') return 'webp'
  throw new Error(`Unsupported format. Header: ${hexHeader.slice(0, 8)}...`)
}