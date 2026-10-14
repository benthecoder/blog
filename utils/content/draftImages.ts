/** Image URLs as publish-post rewrites them: staged drafts become live. */
export function publishImagePaths(markdown: string): string {
  return markdown.replace(/\/images\/drafts\//g, "/images/");
}

/** Image URLs as unpublish-post rewrites them: the slug's own photos go back to drafts. */
export function unpublishImagePaths(markdown: string, slug: string): string {
  return markdown.replace(/\/images\/([^/\s)"']+)/g, (match, filename) =>
    filename.startsWith(`${slug}-`) ? `/images/drafts/${filename}` : match
  );
}
