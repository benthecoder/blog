export const WIKI_TEMPLATES = {
  blank: { label: "Blank", content: "" },
  paper: {
    label: "Paper note",
    content: `## Source
<!-- Paper link, authors, year. -->

## Question
<!-- What is the paper trying to answer? -->

## Method

## Evidence
<!-- Results, baselines, and limits. -->

## Questions
<!-- What is unclear or worth testing? -->

## Connections
<!-- Link related notes with [[Title]]. -->
`,
  },
  reading: {
    label: "Reading note",
    content: `## Source
<!-- Book or article, author, link. -->

## Notes

## Questions

## Connections
<!-- Link related notes with [[Title]]. -->
`,
  },
} as const;
export type WikiTemplate = keyof typeof WIKI_TEMPLATES;
