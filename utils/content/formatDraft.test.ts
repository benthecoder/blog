import { describe, expect, it } from "vitest";
import { formatDraft } from "./formatDraft";

const fm = (
  body: string,
  head = "title: t\ntags: journal\ndate: 'Feb 25, 2026'"
) => `---\n${head}\n---\n\n${body}`;

describe("formatDraft frontmatter", () => {
  it("reorders known keys and keeps others after them", () => {
    const out = formatDraft(
      "---\ndate: 'Feb 25, 2026'\nmood: ok\ntags: journal\ntitle: hi\n---\n\nbody\n"
    );
    expect(out).toBe(
      "---\ntitle: hi\ntags: journal\ndate: 'Feb 25, 2026'\nmood: ok\n---\n\nbody\n"
    );
  });

  it("quotes the date as 'Mon D, YYYY'", () => {
    expect(
      formatDraft("---\ntitle: t\ndate: 2026-02-05\n---\n\nx\n")
    ).toContain("date: 'Feb 5, 2026'\n");
    expect(
      formatDraft("---\ntitle: t\ndate: Mar 2, 2026\n---\n\nx\n")
    ).toContain("date: 'Mar 2, 2026'\n");
  });

  it("keeps existing title quoting", () => {
    expect(formatDraft("---\ntitle: 'nccn stuff'\n---\n\nx\n")).toContain(
      "title: 'nccn stuff'\n"
    );
  });
});

describe("formatDraft body", () => {
  it("moves a leading epigraph to the end under quote:", () => {
    const out = formatDraft(
      fm("> a line\n> – someone\n\nbody text\n\nlinks:\n- x\n")
    );
    expect(
      out.endsWith("links:\n- x\n\nquote:\n\n> a line\n> – someone\n")
    ).toBe(true);
    expect(out).toContain("---\n\nbody text\n");
  });

  it("skips the epigraph move when a quote: section exists", () => {
    const input = fm("> keep\n\nbody\n\nquote:\n\n> other\n");
    expect(formatDraft(input)).toContain("---\n\n> keep\n\nbody");
  });

  it("normalizes label lines", () => {
    const out = formatDraft(
      fm("meals::\n- breakfast:eggs\n- lunch:-\nwake:0900\nsee http://x.com\n")
    );
    expect(out).toContain(
      "meals:\n- breakfast: eggs\n- lunch: -\nwake: 0900\nsee http://x.com\n"
    );
  });

  it("collapses 3+ blank lines and blanks out whitespace-only lines", () => {
    const out = formatDraft(fm("a\n\n\n\n\nb\n   \nc\n"));
    expect(out).toContain("a\n\nb\n\nc\n");
  });

  it("keeps trailing double-space hard breaks", () => {
    const out = formatDraft(fm("wake: 0900  \nsleep: 0300\n"));
    expect(out).toContain("wake: 0900  \nsleep: 0300\n");
  });

  it("puts exactly one blank line before section labels", () => {
    const out = formatDraft(
      fm("text\nmeals:\n- a\n\n\ntil:\n- b\nlinks:\n- c\n")
    );
    expect(out).toContain("text\n\nmeals:\n- a\n\ntil:\n- b\n\nlinks:\n- c\n");
  });

  it("does not add a blank line before a label that opens the body", () => {
    expect(formatDraft(fm("til:\n- b\n"))).toBe(fm("til:\n- b\n"));
  });

  it("ends with exactly one newline", () => {
    expect(formatDraft(fm("x\n\n\n"))).toMatch(/x\n$/);
    expect(formatDraft(fm("x"))).toMatch(/x\n$/);
  });
});

const DRAFT = `---
date: Apr 1, 2026
title: 'nccn stuff'
tags: journal
---


> The only way out is through.
> – Robert Frost

- nccn stuff
- couldn't sleep at night



til:: 
- duck typing
meals:
- breakfast:-
- lunch: taco stand
---

wake:1030  
sleep: 0430
links:
- [x](https://example.com/a:b)
`;

describe("formatDraft on a real-shaped draft", () => {
  const out = formatDraft(DRAFT);

  it("round-trips to the expected shape", () => {
    expect(out).toBe(`---
title: 'nccn stuff'
tags: journal
date: 'Apr 1, 2026'
---

- nccn stuff
- couldn't sleep at night

til:
- duck typing

meals:
- breakfast: -
- lunch: taco stand
---

wake: 1030  
sleep: 0430

links:
- [x](https://example.com/a:b)

quote:

> The only way out is through.
> – Robert Frost
`);
  });

  it("is idempotent", () => {
    expect(formatDraft(out)).toBe(out);
    expect(formatDraft(formatDraft(DRAFT))).toBe(out);
  });

  it("preserves the wake hard break", () => {
    expect(out).toContain("wake: 1030  \n");
  });
});
