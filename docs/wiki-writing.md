# Wiki writing

Open `/admin/wiki/edit/new` on the local dev server. Title and content stay visible; address, category, tags, and description live under **Page details**.

**Tools → Template** offers Blank, Paper note, and Reading note for a new page. The templates contain headings and short comments to write against. Changing a nonempty note asks before replacing it.

**Tools → Check writing** checks repeated headings, unresolved `[[wiki links]]`, and missing `/wiki/` or `/posts/` destinations. It ignores code examples and comments, and reads the current local page index each time. External URLs and heading anchors are outside its scope. Checks are advisory; they do not block Save.

Click a finding to move the editor near that line. A missing wiki link offers **new page ↗**, opening another editor with the title and address prefilled. The original note remains open. After saving the linked page, check the original note again to see the updated index.

These tools run locally. Save writes a wiki Markdown file; publishing still means committing and pushing. Nothing in this change adds cloud drafts or automatic publishing.
