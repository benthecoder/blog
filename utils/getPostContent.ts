import { getPostPath } from "@/config/paths";
import { readMarkdownFile } from "./markdown";

const getPostContent = (slug: string) => readMarkdownFile(getPostPath(slug));

export default getPostContent;
