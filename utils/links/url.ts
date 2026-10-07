/** Invalid percent escapes are ordinary bad links, not rendering errors. */
export function tryDecodeUrlComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
