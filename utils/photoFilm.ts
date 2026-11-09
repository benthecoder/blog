// Instant film formats: the photo window in millimetres. All three are 62
// tall, so prints of any format sit level beside each other.
const FILMS = {
  mini: [46, 62],
  square: [62, 62],
  wide: [99, 62],
} as const;

/** The format a photo of this shape would be printed on. */
export function filmFor(size: { width: number; height: number } | null) {
  if (!size) return FILMS.square;
  const ratio = size.width / size.height;
  // Cut-offs sit halfway (geometrically) between neighbouring formats.
  if (ratio < 0.86) return FILMS.mini;
  if (ratio > 1.26) return FILMS.wide;
  return FILMS.square;
}
