import { createHash } from "node:crypto";
import type { PhotoCollection, StreamPhoto } from "@/types/photostream";

export const slugifyPhotoFolder = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const photoObjectId = (key: string) =>
  createHash("sha256").update(key).digest("hex").slice(0, 20);
export const titleFromFolder = (folder: string) =>
  folder
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
export const photoObjectUrl = (base: string, key: string) =>
  `${base.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;

export function photoExifFields(exif: Record<string, unknown>) {
  const text = (key: string) =>
    typeof exif[key] === "string" ? exif[key].trim() : undefined;
  const number = (key: string) =>
    typeof exif[key] === "number" && Number.isFinite(exif[key]) && exif[key] > 0
      ? exif[key]
      : undefined;
  const make = text("Make")?.replace(/^FUJIFILM$/i, "Fujifilm");
  const model = text("Model");
  const camera = model
    ? make && !model.toLowerCase().startsWith(make.toLowerCase())
      ? `${make} ${model}`
      : model
    : make;
  const date = text("DateTimeOriginal")?.match(/^(\d{4}):(\d{2}):(\d{2})/);
  const exposure = number("ExposureTime");
  return {
    camera,
    lens: text("LensModel"),
    date: date ? `${date[1]}-${date[2]}-${date[3]}` : undefined,
    aperture: number("FNumber"),
    iso: number("ISO"),
    focalLength: number("FocalLength"),
    shutter: exposure
      ? exposure < 1
        ? `1/${Math.round(1 / exposure)}`
        : String(exposure)
      : undefined,
  };
}

export function groupPhotoObjects(
  objects: { key: string; photo: StreamPhoto }[],
  previous: PhotoCollection[] = []
): PhotoCollection[] {
  const groups = new Map<
    string,
    {
      name: string;
      sets: Map<string, { name: string; photos: StreamPhoto[] }>;
      photos: StreamPhoto[];
    }
  >();
  for (const { key, photo } of objects) {
    const parts = key.split("/");
    const name = parts.length > 1 ? parts[0] : "moments";
    const slug = slugifyPhotoFolder(name);
    if (!slug) throw new Error(`Folder needs a readable name: ${name}`);
    let group = groups.get(slug);
    if (group && group.name !== name)
      throw new Error(
        `Folders '${group.name}' and '${name}' produce the same URL; rename one.`
      );
    if (!group) {
      group = { name, sets: new Map(), photos: [] };
      groups.set(slug, group);
    }
    group.photos.push(photo);
    if (parts.length > 2) {
      const setName = parts.slice(1, -1).join(" / ");
      const setSlug = `${slug}--${parts.slice(1, -1).map(slugifyPhotoFolder).join("--")}`;
      let set = group.sets.get(setSlug);
      if (set && set.name !== setName)
        throw new Error(
          `Two folders produce the same photoset URL: ${setName}`
        );
      if (!set) {
        set = { name: setName, photos: [] };
        group.sets.set(setSlug, set);
      }
      set.photos.push(photo);
    }
  }
  return [...groups].map(([slug, group]) => {
    const existing = previous.find((collection) => collection.slug === slug);
    return {
      slug,
      title: existing?.title ?? titleFromFolder(group.name),
      description: existing?.description,
      cover: group.photos.some((photo) => photo.id === existing?.cover)
        ? existing!.cover
        : group.photos[0].id,
      photos: group.photos,
      sets: [...group.sets].map(([setSlug, set]) => ({
        slug: setSlug,
        title:
          existing?.sets?.find((item) => item.slug === setSlug)?.title ??
          titleFromFolder(set.name),
        photos: set.photos,
      })),
    };
  });
}
