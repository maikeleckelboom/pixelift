export function rgbaBytesToARGBIntArray(array: Uint8Array|Uint8ClampedArray): number[] {
    let result = []
    for (let i = 0; i < array.length; i += 4) {
        result.push((array[i + 3] << 24)
            | (array[i] << 16)
            | (array[i + 1] << 8)
            | array[i + 2])
    }
    return result
}