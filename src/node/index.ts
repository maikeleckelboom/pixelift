import fs from 'node:fs/promises'
import decodePNG from './decoders/png'
import decodeJPEG from './decoders/jpeg'
import decodeGIF from './decoders/gif'
import type { BrowserInput, FormatHandlers, NodeInput, PixelData, PixeliftOptions, ImageFormat } from '../types'
import { isNode } from '../shared/env.ts'

const nodeHandlers: FormatHandlers = {
  png: {
    options: {},
    decoder: (buffer, options) => decodePNG(buffer, options)
  },
  jpg: {
    options: {
      formatAsRGBA: true
    },
    decoder: (buffer, options) => decodeJPEG(buffer, options)
  },
  jpeg: {
    options: {
      formatAsRGBA: true
    },
    decoder: (buffer, options) => decodeJPEG(buffer, options)
  },
  gif: {
    options: {
      frame: 0
    },
    decoder: (buffer, options) => decodeGIF(buffer, options)
  },
  webp: {
    options: {},
    decoder: () => {
      throw new Error('WebP format is not supported in Node environments')
    }
  }
}

export async function pixelift<F extends ImageFormat>(
  input: NodeInput | BrowserInput,
  options?: PixeliftOptions<F>
): Promise<PixelData> {
  if (isNode()) {
    const buffer = await getBuffer(input as NodeInput)
    const format = options?.format || detectFormat(buffer)
    const handler = nodeHandlers[format]
    if (!handler) throw new Error(`Unsupported format: ${format}`)
    return handler.decoder(buffer, options || handler.options)
  } else {
    return pixelift(input as BrowserInput)
  }
}

async function getBuffer(input: NodeInput): Promise<Buffer> {
  if (typeof input === 'string') {
    if (/^https?:\/\//.test(input)) {
      const response = await fetch(input, { method: 'GET' })
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
      return Buffer.from(await response.arrayBuffer())
    } else {
      return await fs.readFile(input)
    }
  }
  if (Buffer.isBuffer(input)) return input
  throw new TypeError('Invalid input type')
}

function detectFormat(buffer: Buffer): ImageFormat {
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