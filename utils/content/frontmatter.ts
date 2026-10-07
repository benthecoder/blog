import { load, dump, CORE_SCHEMA, timestampTag, mergeTag } from "js-yaml";

// Preserve dates and YAML merge keys used by the previous safe YAML parser.
const schema = CORE_SCHEMA.withTags(timestampTag, mergeTag);

/** Parse the blog's YAML frontmatter without executable language engines. */
export function parseFrontmatter(markdown: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const text = markdown.replace(/^\uFEFF/, "");
  const opening = /^---(?:yaml|yml)?[ \t]*(?:\r?\n|$)/.exec(text);
  if (!opening) {
    if (/^---\w/.test(text))
      throw new Error("Only YAML frontmatter is supported");
    return { data: {}, content: text };
  }
  const rest = text.slice(opening[0].length);
  const closing = /^---[ \t]*(?:\r?\n|$)/m.exec(rest);
  if (!closing) throw new Error("Unclosed YAML frontmatter");
  const yaml = rest.slice(0, closing.index);
  const data = yaml.trim() ? (load(yaml, { schema }) ?? {}) : {};
  if (typeof data !== "object" || Array.isArray(data) || data instanceof Date) {
    throw new Error("Frontmatter must be a YAML mapping");
  }
  return {
    data: data as Record<string, unknown>,
    content: rest.slice(closing.index + closing[0].length),
  };
}

/** Serialize frontmatter and preserve the body, ending the file with a newline. */
export function stringifyFrontmatter(
  content: string,
  data: Record<string, unknown>
): string {
  const yaml = dump(data).trimEnd();
  const body = content.endsWith("\n") ? content : `${content}\n`;
  return `${yaml === "{}" ? "" : `---\n${yaml}\n---\n`}${body}`;
}
