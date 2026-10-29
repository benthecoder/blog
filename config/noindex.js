// Matches <meta name="robots" content="...noindex...">, attributes in either order.
const ROBOTS_META = /<meta\b[^>]*\bname=["']robots["'][^>]*>/gi;

/** True when prerendered HTML carries a robots meta that includes noindex. */
function isNoindexHtml(html) {
  return (html.match(ROBOTS_META) ?? []).some((tag) => /noindex/i.test(tag));
}

module.exports = { isNoindexHtml };
