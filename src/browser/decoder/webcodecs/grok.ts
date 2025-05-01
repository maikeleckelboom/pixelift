export async function getSharpRawPixelData(
  imageUrl: string | URL
): Promise<Uint8Array<ArrayBuffer>> {
  // Fetch the image
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  // Create ImageDecoder
  const imageDecoder = new ImageDecoder({
    data: blob.stream(),
    type: response.headers.get('content-type') || 'image/jpeg'
  });

  // Decode the image to get VideoFrame
  const result = await imageDecoder.decode();
  const videoFrame = result.image;

  // Create canvas and draw VideoFrame
  const canvas = document.createElement('canvas');
  canvas.width = videoFrame.displayWidth;
  canvas.height = videoFrame.displayHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');
  ctx.drawImage(videoFrame, 0, 0);

  // Get RGBA pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const rgbaBuffer = imageData.data; // Uint8ClampedArray

  // Check for an alpha channel
  let hasAlpha = false;
  for (let i = 3; i < rgbaBuffer.length; i += 4) {
    // eslint-disable-next-line
    if (rgbaBuffer[i]! < 255) {
      hasAlpha = true;
      break;
    }
  }

  let outputBuffer;
  if (hasAlpha) {
    // Keep RGBA data
    outputBuffer = new Uint8Array(rgbaBuffer);
  } else {
    // Convert to RGB
    outputBuffer = new Uint8Array(canvas.width * canvas.height * 3);
    let j = 0;
    for (let i = 0; i < rgbaBuffer.length; i += 4) {
      // eslint-disable-next-line
      outputBuffer[j] = rgbaBuffer[i]!;
      // eslint-disable-next-line
      outputBuffer[j + 1] = rgbaBuffer[i + 1]!;
      // eslint-disable-next-line
      outputBuffer[j + 2] = rgbaBuffer[i + 2]!;
      j += 3;
    }
  }

  // Clean up
  videoFrame.close();

  return outputBuffer;
}
