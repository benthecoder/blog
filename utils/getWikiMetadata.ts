import { WIKI_DIR } from "@/config/paths";
import { WikiMetadata } from "@/types/wiki";
import { scanMarkdownDir } from "./markdown";

const getWikiMetadata = (): WikiMetadata[] =>
  scanMarkdownDir(WIKI_DIR)
    .map(({ slug, data }) => ({
      title: (data.title as string) || slug,
      description: (data.description as string) || "",
      tags: Array.isArray(data.tags)
        ? (data.tags as string[])
        : typeof data.tags === "string"
          ? (data.tags as string).split(",").map((t) => t.trim())
          : [],
      lastUpdated: (data.lastUpdated as string) || "",
      slug,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

export default getWikiMetadata;
