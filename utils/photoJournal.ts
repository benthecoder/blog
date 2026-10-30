// Journal posts are slugged DDMMYY; a photo's calendar date (as written, no
// timezone conversion) links to the post for that day when one exists.
export function journalSlugFor(
  photoDate: string | undefined,
  postSlugs: Set<string>
): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(photoDate ?? "");
  if (!match) return undefined;
  const [, year, month, day] = match;
  const slug = `${day}${month}${year.slice(2)}`;
  return postSlugs.has(slug) ? slug : undefined;
}
