export interface WikiMetadata {
  title: string;
  description: string;
  /** Parent grouping shown as a section on the wiki index, e.g. "Beverages". */
  category: string;
  tags: string[];
  lastUpdated: string;
  slug: string;
}

/** Optional bibliographic frontmatter for paper notes (category `papers/...`). */
export interface PaperFields {
  authors: string;
  year: string;
  url: string;
  /** Date I read it, YYYY-MM-DD. */
  read: string;
  /** Where the notes came from, e.g. `remarkable`. */
  source: string;
}

export interface WikiEditorPage extends WikiMetadata {
  content: string;
  version: string;
  paper: PaperFields;
}

/** A Markdown file in `templates/wiki/`; its frontmatter seeds a new page. */
export interface WikiTemplate {
  key: string;
  label: string;
  category: string;
  tags: string;
  /** Show the paper fields for pages made from this template. */
  paper: boolean;
  content: string;
}
