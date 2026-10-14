export interface StreamPhoto {
  id: string;
  src: string;
  width: number;
  height: number;
  caption: string;
  description?: string;
  camera?: string;
  lens?: string;
  aperture?: number;
  shutter?: string;
  iso?: number;
  focalLength?: number;
  date?: string;
  location?: string;
  // "Spot, City, Country", most specific first.
  place?: string;
  journal?: string;
  blurDataURL?: string;
  addedAt?: string;
}

export interface PhotoCollection {
  slug: string;
  title: string;
  description?: string;
  place?: string;
  cover: string;
  photos: StreamPhoto[];
  sets?: { slug: string; title: string; photos: StreamPhoto[] }[];
}
