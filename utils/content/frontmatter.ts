import { load, dump, CORE_SCHEMA, timestampTag, mergeTag } from "js-yaml";
import { z } from "zod";

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

/** Frontmatter that is not valid YAML or does not match its content schema. */
export class FrontmatterError extends Error {
  override name = "FrontmatterError";
  constructor(
    /** The file path, or where the text came from. */
    readonly source: string,
    /** What is wrong, without the source: one field per line. */
    readonly detail: string,
    options?: ErrorOptions
  ) {
    super(`${source}: ${detail}`, options);
  }
}

/** Readable list of what is wrong, one field per line: `date: not a date`. */
export function describeIssues(error: z.ZodError): string {
  return error.issues
    .map(({ path, message }) =>
      path.length ? `${path.join(".")}: ${message}` : message
    )
    .join("\n");
}

/**
 * The content boundary: YAML text in, typed frontmatter out. Throws a
 * FrontmatterError naming the source and every bad field, so a malformed
 * post fails the build instead of rendering "[object Object]".
 */
export function parseMarkdown<S extends z.ZodType>(
  markdown: string,
  schema: S,
  source: string
): { data: z.output<S>; content: string } {
  let parsed: ReturnType<typeof parseFrontmatter>;
  try {
    parsed = parseFrontmatter(markdown);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new FrontmatterError(source, reason, { cause: error });
  }
  const result = schema.safeParse(parsed.data);
  if (!result.success) {
    throw new FrontmatterError(
      source,
      `invalid frontmatter\n${describeIssues(result.error)}`,
      { cause: result.error }
    );
  }
  return { data: result.data, content: parsed.content };
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
