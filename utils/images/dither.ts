const stucki = [
  [1, 0, 8],
  [2, 0, 4],
  [-2, 1, 2],
  [-1, 1, 4],
  [0, 1, 8],
  [1, 1, 4],
  [2, 1, 2],
  [-2, 2, 1],
  [-1, 2, 2],
  [0, 2, 4],
  [1, 2, 2],
  [2, 2, 1],
] as const;

/** Stucki error diffusion on RGBA pixels. Preserve alpha and the input buffer. */
export function ditherImage(
  pixels: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    pixels.length !== width * height * 4
  ) {
    throw new Error("Expected a complete RGBA image");
  }
  const output = Uint8Array.from(pixels);
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    gray[i] =
      0.299 * pixels[i * 4] +
      0.587 * pixels[i * 4 + 1] +
      0.114 * pixels[i * 4 + 2];
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (pixels[index * 4 + 3] < 128) continue;
      const value = gray[index] < 128 ? 0 : 255;
      const error = gray[index] - value;
      output.fill(value, index * 4, index * 4 + 3);
      for (const [dx, dy, weight] of stucki) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny >= height) continue;
        const neighbor = ny * width + nx;
        if (pixels[neighbor * 4 + 3] >= 128)
          gray[neighbor] += (error * weight) / 42;
      }
    }
  }
  return output;
}
