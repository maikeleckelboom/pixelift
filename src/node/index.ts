import fs from 'node:fs/promises'
import { isNode } from '../shared/env'
import decodePNG from './decoders/png'
import decodeJPEG from './decoders/jpeg'
import decodeGIF from './decoders/gif'
import type { BrowserInput, ImageFormat, NodeFormatHandlers, NodeInput, PixelData, PixeliftOptions } from '../types'
import { FormatError, NetworkError, PixeliftError } from '../shared'

const nodeHandlers: NodeFormatHandlers = {
  png: { options: {}, decoder: decodePNG },
  jpg: { options: { formatAsRGBA: true }, decoder: decodeJPEG },
  jpeg: { options: { formatAsRGBA: true }, decoder: decodeJPEG },
  gif: { options: { frame: 0 }, decoder: decodeGIF },
  webp: {
    options: {},
    decoder: () => {
      throw new FormatError('WebP format is not supported in Node.js environment')
    }
  }
}

export async function pixelift<F extends ImageFormat>(
  input: NodeInput | BrowserInput,
  options?: PixeliftOptions<'node', F>
): Promise<PixelData> {
  if (isNode()) {
    const buffer = await getBuffer(input as NodeInput)
    const format = options?.format || detectFormat(buffer)
    const handler = nodeHandlers[format]
    if (!handler) throw new FormatError(`Unsupported format: ${format}`)
    return handler.decoder(buffer, options || handler.options)
  } else {
    return pixelift(input as BrowserInput)
  }
}

async function getBuffer(input: NodeInput): Promise<Buffer> {
  if (typeof input === 'string') {
    if (/^https?:\/\//.test(input)) {
      const response = await fetch(input, { method: 'GET' })
      if (!response.ok) {
        throw new NetworkError(`Failed to fetch: ${response.statusText}`, { status: response.status })
      }
      return Buffer.from(await response.arrayBuffer())
    } else {
      return await fs.readFile(input)
    }
  }
  if (Buffer.isBuffer(input)) return input
  throw new PixeliftError('Invalid input type')
}

function detectFormat(buffer: Buffer): ImageFormat {
  if (buffer.length < 12) throw new PixeliftError('Buffer is too short to detect format')
  const header = buffer.subarray(0, 12)
  const hexHeader = header.toString('hex')
  const asciiHeader = header.toString('ascii')
  if (hexHeader.startsWith('89504e47')) return 'png'
  if (hexHeader.startsWith('ffd8')) return 'jpeg'
  if (asciiHeader.startsWith('GIF8')) return 'gif'
  if (buffer.length < 16) throw new PixeliftError('Buffer too short')
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp'
  }
  throw new FormatError(`Unsupported format. Header: ${hexHeader.slice(0, 8)}...`)
}