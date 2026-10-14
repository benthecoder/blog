# Wiki writing

Open `/admin/wiki/edit/new` on the local dev server.

**Start from** offers the templates in `templates/wiki/` (Blank is built in). A template is an ordinary Markdown file: its body becomes the new page, and its frontmatter sets the menu `label`, `order`, and defaults for `category`, `tags`, and `paper: true` (show the paper fields). Add or edit a template by editing that folder; no code change is needed.

**Paper fields** (authors, year, link, read on, notes from) appear for pages under a `papers/...` category, pages started from the Paper note template, or pages that already have them. They are saved as frontmatter (`authors`, `year`, `url`, `read`, `source`) and feed `/papers`. Clearing a field removes it from the file.

**Check** runs local checks: repeated headings, unresolved `[[wiki links]]`, and missing `/wiki/` or `/posts/` destinations. It ignores code and reads the current index each time. Checks are advisory and never block Save.

For an unresolved `[[link]]`:

- **use “Title”** retargets every occurrence to the closest existing page (by title or address, tolerant of plurals and typos), keeping the words the reader sees: `[[Transformers]]` becomes `[[Transformer|Transformers]]`.
- **create stub** saves `wiki/<address>.md` from the Concept template so the link resolves. Fill it in before publishing; a stub is a real page once pushed.
- **new page ↗** opens another editor with the title and address prefilled.

Click a finding to move the editor to that line. These tools run locally; publishing still means committing and pushing.
