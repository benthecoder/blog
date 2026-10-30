import type { PostFormat, PostMetadata } from "@/types/post";

// Shared by the archive, homepage, and the one-time tag migration.
export const POST_FORMATS = [
  {
    id: "journal",
    label: "journal",
    heading: "journal",
    description: "daily entries and reflections",
    homeHeading: "recent journal entries",
    legacyTags: ["journal"],
  },
  {
    id: "essay",
    label: "essays",
    heading: "essays",
    description: "longer reflections",
    homeHeading: "recent writings",
    legacyTags: [],
  },
  {
    id: "book",
    label: "books",
    heading: "book notes",
    description: "notes on books",
    homeHeading: "recent book notes",
    legacyTags: ["book"],
  },
  {
    id: "links",
    label: "links",
    heading: "sunday links",
    description: "things worth sharing",
    homeHeading: "recent sunday links",
    legacyTags: ["links"],
  },
  {
    id: "resource",
    label: "resources",
    heading: "resources",
    description: "lists to come back to",
    homeHeading: "recent resources",
    legacyTags: ["resources", "listicles"],
  },
] as const satisfies readonly {
  id: PostFormat;
  label: string;
  heading: string;
  description: string;
  homeHeading: string;
  legacyTags: readonly string[];
}[];

export function isPostFormat(value: unknown): value is PostFormat {
  return POST_FORMATS.some(({ id }) => id === value);
}

export function formatOf(
  slug: string,
  data: { format?: unknown }
): PostFormat | undefined {
  if (isPostFormat(data.format)) return data.format;
  return /^\d{6}$/.test(slug) ? "journal" : undefined;
}

export function matchesFormat(
  post: Pick<PostMetadata, "slug" | "format">,
  format: PostFormat
): boolean {
  // Preserve the date-based journal, even when an entry has another format.
  return (
    post.format === format ||
    (format === "journal" && /^\d{6}$/.test(post.slug))
  );
}

export function formatConfig(format: PostFormat) {
  return POST_FORMATS.find(({ id }) => id === format)!;
}

// Keep old topic URLs useful when their tags become format fields.
export function formatForLegacyTag(tag: string): PostFormat | undefined {
  if (tag === "✰") return "essay";
  return POST_FORMATS.find(({ legacyTags }) =>
    (legacyTags as readonly string[]).includes(tag.toLowerCase())
  )?.id;
}
