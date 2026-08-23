export interface WikiMetadata {
  title: string;
  description: string;
  /** Parent grouping shown as a section on the wiki index, e.g. "Beverages". */
  category: string;
  tags: string[];
  lastUpdated: string;
  slug: string;
}
