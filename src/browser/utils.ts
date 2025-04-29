export async function isWebCodecsSupportedForType(type: string): Promise<boolean> {
  return (
    'ImageDecoder' in window &&
    typeof globalThis.ImageDecoder !== 'undefined' &&
    typeof ImageDecoder.isTypeSupported === 'function' &&
    (await ImageDecoder.isTypeSupported(type))
  );
}
