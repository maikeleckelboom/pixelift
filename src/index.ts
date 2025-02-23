import {isNode} from './shared'

export type PixeliftNodeParams =
    string
    | Buffer
    | ArrayBuffer
    | Uint8Array
    | Uint8ClampedArray
    | Int8Array
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
    | Float32Array
    | Float64Array

export type PixeliftBrowserParams = string | ImageData | HTMLImageElement | ImageBitmap | OffscreenCanvas | Blob | File

type PixeliftImpl<T> = (input: T) => Promise<number[]>

export type Pixelift = PixeliftImpl<PixeliftNodeParams> | PixeliftImpl<PixeliftBrowserParams>

export type PixeliftParams = Parameters<Pixelift>

export async function pixelift(...args: PixeliftParams) {
    if (isNode) {
        const {pixelift: nodeImpl} = await import('./node/pixelift');
        return nodeImpl(...args as Parameters<typeof nodeImpl>);
    } else {
        const {pixelift: browserImpl} = await import('./browser/pixelift');
        return browserImpl(...args as Parameters<typeof browserImpl>);
    }
}