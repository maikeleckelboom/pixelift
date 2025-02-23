import {rgbaBytesToARGBIntArray} from "../shared";

export async function pixelift(input: string): Promise<number[]> {
    const imageData = await loadAndGetImageData(input)
    return rgbaBytesToARGBIntArray(imageData.data)
}

async function loadAndGetImageData(url: string) {
    const image = new Image()
    image.src = url
    image.crossOrigin = 'anonymous'
    await new Promise((resolve) => (image.onload = resolve))
    const canvas = new OffscreenCanvas(image.width, image.height)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Failed to get 2D context')
    context.drawImage(image, 0, 0, image.width, image.height)
    return context.getImageData(0, 0, image.width, image.height)
}