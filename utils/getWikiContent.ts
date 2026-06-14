import { getWikiPath } from "@/config/paths";
import { readMarkdownFile } from "./markdown";

const getWikiContent = (slug: string) => readMarkdownFile(getWikiPath(slug));

export default getWikiContent;
