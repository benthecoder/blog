import fs from "fs";

import { describe, expect, it } from "vitest";
import {
  DRAFTS_DIR,
  ESSAYS_DIR,
  ESSAY_DRAFTS_DIR,
  LIBRARY_MD,
  POSTS_DIR,
  PROJECTS_MD,
  RECIPES_DIR,
  WIKI_DIR,
  WIKI_TEMPLATES_DIR,
} from "@/config/paths";
import { parseMarkdown } from "./frontmatter";
import { readMarkdownFile, scanMarkdownDir } from "./markdown";
import {
  bodyOnlySchema,
  draftFrontmatterSchema,
  essayFrontmatterSchema,
  postFrontmatterSchema,
  recipeFrontmatterSchema,
  wikiFrontmatterSchema,
  wikiTemplateFrontmatterSchema,
} from "./schemas";
import { DEFAULT_POST_TEMPLATE } from "@/app/admin/edit/post-template";

const post = (frontmatter: string) =>
  parseMarkdown(
    `---\n${frontmatter}\n---\nbody\n`,
    postFrontmatterSchema,
    "posts/x.md"
  );

describe("every content file on disk matches its schema", () => {
  // scanMarkdownDir throws a FrontmatterError on the first bad file, naming it.
  it.each([
    ["posts", POSTS_DIR, postFrontmatterSchema],
    ["post drafts", DRAFTS_DIR, postFrontmatterSchema],
    ["essays", ESSAYS_DIR, essayFrontmatterSchema],
    ["essay drafts", ESSAY_DRAFTS_DIR, essayFrontmatterSchema],
    ["wiki", WIKI_DIR, wikiFrontmatterSchema],
    ["recipes", RECIPES_DIR, recipeFrontmatterSchema],
    ["wiki templates", WIKI_TEMPLATES_DIR, wikiTemplateFrontmatterSchema],
  ] as const)("%s", (_, dir, schema) => {
    const files = scanMarkdownDir(dir, schema);
    const onDisk = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith(".md"))
      : [];
    expect(files).toHaveLength(onDisk.length);
  });

  it("parses the archive with every date readable", () => {
    const posts = scanMarkdownDir(POSTS_DIR, postFrontmatterSchema);
    expect(posts.length).toBeGreaterThan(1000);
    for (const { data } of posts) expect(typeof data.date).toBe("string");
  });

  it("body-only pages carry no frontmatter", () => {
    for (const file of [LIBRARY_MD, PROJECTS_MD])
      expect(readMarkdownFile(file, bodyOnlySchema).data).toEqual({});
  });
});

describe("post frontmatter", () => {
  it("accepts the shapes the archive uses", () => {
    expect(
      post(
        "title: '2026'\ndate: Nov 12 2024\ntags: a, b\nformat: links\nlocations: [Taipei]\nplace_context: transit"
      ).data
    ).toEqual({
      title: "2026",
      date: "Nov 12 2024",
      tags: "a, b",
      format: "links",
      locations: ["Taipei"],
      place_context: "transit",
    });
  });

  it("reads an unquoted ISO date as the text that was written", () => {
    expect(post("title: t\ndate: 2023-05-27").data.date).toBe("2023-05-27");
  });

  it.each([
    ["a missing date", "title: t", "date: required"],
    [
      "an object title",
      "title: {a: 1}\ndate: May 27, 2023",
      "title: Invalid input: expected string, received object",
    ],
    [
      "an unreadable date",
      "title: t\ndate: someday",
      'date: not a date; write it like "May 27, 2023" or 2023-05-27',
    ],
    [
      "an unknown format",
      "title: t\ndate: May 27, 2023\nformat: journl",
      "format: Invalid option",
    ],
    [
      "a misspelled key",
      "title: t\ndate: May 27, 2023\ntgas: a",
      'Unrecognized key: "tgas"',
    ],
    [
      "a non-list locations",
      "title: t\ndate: May 27, 2023\nlocations: Taipei",
      "locations: Invalid input: expected array",
    ],
  ])("rejects %s with the file and field", (_, frontmatter, message) => {
    expect(() => post(frontmatter)).toThrow("posts/x.md: invalid frontmatter");
    expect(() => post(frontmatter)).toThrow(message);
  });

  it("names the file when the YAML itself is broken", () => {
    expect(() =>
      parseMarkdown("---\ntitle: t\nbody", postFrontmatterSchema, "posts/y.md")
    ).toThrow("posts/y.md: Unclosed YAML frontmatter");
  });
});

describe("editor frontmatter", () => {
  it("accepts the blank new-post template", () => {
    const { data } = parseMarkdown(
      DEFAULT_POST_TEMPLATE.replace("date:", "date: Nov 1, 2026"),
      draftFrontmatterSchema,
      "editor"
    );
    expect(data).toMatchObject({
      title: null,
      tags: null,
      date: "Nov 1, 2026",
      format: "journal",
    });
  });

  it("reads typed scalars and tag lists as text", () => {
    const { data } = parseMarkdown(
      "---\ntitle: 2026\ntags: [a, b]\ndate: 2026-01-01\n---\n",
      draftFrontmatterSchema,
      "editor"
    );
    expect(data).toMatchObject({
      title: "2026",
      tags: "a, b",
      date: "2026-01-01",
    });
  });
});
