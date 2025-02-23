import fs from 'node:fs/promises'
import jpeg from 'jpeg-js'
import {PNG} from 'pngjs'
import {GifReader} from 'omggif'
import {rgbaBytesToARGBIntArray} from "../shared";
import type {PixeliftNodeParams} from "../index.ts";

export type PixeliftImageFormat = 'png' | 'jpeg' | 'jpg' | 'gif' | 'webp'

export async function pixelift(
    input: PixeliftNodeParams,
    type?: PixeliftImageFormat
): Promise<number[]> {
    const buffer = await getBuffer(input)
    const format = type || detectFormat(buffer)

    let pixels: Uint8Array

    switch (format.toLowerCase() as PixeliftImageFormat) {
        case 'png':
            pixels = decodePNG(buffer)
            break
        case 'jpg':
        case 'jpeg':
            pixels = decodeJPEG(buffer)
            break
        case 'gif':
            pixels = decodeGIF(buffer)
            break
        case 'webp':
            pixels = decodeWebP(buffer)
            break
        default:
            throw new Error(`Unsupported format: ${format}`);
    }

    return rgbaBytesToARGBIntArray(pixels)
}

async function getBuffer(input: PixeliftNodeParams): Promise<Buffer<ArrayBufferLike>> {
    if (typeof input === 'string') {
        if (/^https?:\/\//.test(input)) {
            const response = await fetch(input);
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
            return Buffer.from(await response.arrayBuffer());
        } else {
            return await fs.readFile(input);
        }
    } else {
        return input as Buffer;
    }
}

function detectFormat(buffer: Buffer): PixeliftImageFormat {
    const header = buffer.subarray(0, 12)
    const hexHeader = header.toString('hex')
    const asciiHeader = header.toString('ascii')

    if (hexHeader.startsWith('89504e47')) return 'png'
    if (hexHeader.startsWith('ffd8')) return 'jpeg'
    if (asciiHeader.startsWith('GIF8')) return 'gif'
    if (header.subarray(8, 12).toString() === 'WEBP') return 'webp'
    throw new Error('Unknown image format')
}

function decodePNG(buffer: Buffer): Uint8Array {
    const png = PNG.sync.read(buffer);
    return new Uint8Array(png.data);
}

function decodeJPEG(buffer: Buffer): Uint8Array {
    const {data, width, height} = jpeg.decode(buffer, {
        useTArray: true,
        formatAsRGBA: true
    });

    return new Uint8Array(data);
}

function decodeGIF(buffer: Buffer, frame: number = 0): Uint8Array {
    const reader = new GifReader(buffer);
    const data = new Uint8Array(reader.width * reader.height * 4);
    reader.decodeAndBlitFrameBGRA(frame, data);
    for (let i = 0; i < data.length; i += 4) {
        const temp = data[i];
        data[i] = data[i + 2]; // Red channel (originally at i+2) moves to i (Blue's position)
        data[i + 2] = temp;    // Blue channel (from i) moves to i+2 (Red's position)
    }
    return data;
}

function decodeWebP(buffer: Buffer): Uint8Array {
    throw new Error('WebP format is not supported in the Node environment')
}
