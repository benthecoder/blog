# Development Progress & Notes

This document tracks the development progress, TODO items, and setup instructions for the blog.

## Writing wiki pages

Run `pnpm dev` and open `/admin/wiki` (or choose Wiki from `/admin`). Create a
page, fill in its title, category, description and comma-separated tags, then
write Markdown in the editor. Categories can be nested, such as
`religion/christianity`. Use `[[Page title]]` or `[[Page title|label]]` to connect
existing wiki pages or posts; Preview shows the resolved links.

Save with the button or Cmd/Ctrl+S. Pages are written to `wiki/<address>.md` in
this checkout. Saving updates an existing page only if it has not changed since
you opened it, and a new page cannot overwrite an existing address. Commit and
push the Markdown files to update the live site. The editor is a local tool;
production does not accept wiki saves. Wiki pages have no blog draft or publish
step, and can still be edited directly in an IDE.

## TODO

### Roadmap (in order)

1. [x] **Hard-drive backup script.** Plug in the drive "chonky" and run `pnpm backup` (merged; run from your main checkout). The first verified backup was made 2026-10-04. It writes to `/Volumes/chonky/bneo-blog-backup/`:
   - [x] R2 images: an additive mirror of all 336 files. R2 has no versioning or backups, and about 90 of these exist nowhere else.
   - [x] Dated snapshots, hard-linked so unchanged files cost no space, of posts, drafts (gitignored, so this Mac is otherwise the only copy), draft images, `/thoughts` from Neon and a git bundle of every branch.
   - [ ] ~~Auto-run on mount~~: dropped. macOS blocks background jobs from removable drives unless they run as an approved named app. It stays manual unless revisited.
   - [ ] Delete `~/blog-purge-backup/`. It's safe to do now that the drive copy is verified.
2. [ ] **Finish the in-flight work**, one git worktree per session:
   - [x] Draft photo panel + Format button (merged).
   - [x] Sunday links CLI and admin period templates (merged). Writing and publishing the posts remain manual.
   - [x] Wiki graph and local editor (merged).
   - [ ] Write the first wiki topics, starting with Christianity and AI papers.
3. [ ] **Publish every draft** (~121 in `posts/drafts/`, about half of them stubs). Use the admin editor's photo panel to add each day's photos, run Format, spell-check, and publish.
4. [ ] **photos.bneo.xyz.** A photostream site modeled on [paulstamatiou.com/photos](https://paulstamatiou.com/photos). It has two parts: a chronological **photostream**, and **photosets** grouped into trip collections. Each collection shows stats (photos taken, days, km) and has day-by-day sets. This fits our day-based journal: each day's photos can link to its post. Photos would come from R2.

### Improvements

- [x] Syntax highlight https://bionicjulia.com/blog/setting-up-nextjs-markdown-blog-with-typescript
- [x] Add sitemap using [next-sitemap](https://www.tanvi.dev/blog/2-how-to-add-a-sitemap-to-your-nextjs-app)
- [ ] Optimize image loading https://macwright.com/2016/05/03/the-featherweight-website
- [ ] Make thoughts page faster
- [ ] improve SEO
  - [ ] https://nextjs.org/learn/seo/introduction-to-seo

### New features

- [x] indicator for which page user is on like https://macwright.com/
- [x] I'm feeling lucky feature, that randomly selects a blog
- [x] dark mode with Japanese color palette
- [x] basic search (keyword, semantic, and hybrid search)
- [x] embeddings with VoyageAI
  - [x] semantic search using pgvector
  - [x] Create a chat interface trained on blog posts (Claude API)
- [ ] expanding text
  - [ ] https://www.spencerchang.me/
  - [ ] https://www.rishi.cx/
- [ ] Create pop up notes like https://www.rishi.cx/
- [x] A real-time digital clock with seconds
- [ ] build a map of favorite restaurants and places like [build your corner](https://twitter.com/buildyourcorner)
- [ ] Add listening and reading updates
  - [ ] https://dev.to/j471n/how-to-use-spotify-api-with-nextjs-50o5
  - [ ] https://github.com/yihui-hu/yihui-work
- [ ] add hover over highlights for notes feature and expanding sidebar
  - [ ] https://linusrogge.com/about
  - [ ] hover to preview like https://stephango.com/buy-wisely
- [ ] breadcrumb navigation
  - [ ] https://jake.isnt.online/
- ~~Setup contentlayer~~ — abandoned project (no Next.js 15 support); current `utils/content/markdown.ts` approach is fine

### Writing system (goal: weekly links, monthly overview, quarterly reflection)

Source of truth is the blog. Capture is cheap and happens in the moment; the AI only collects and formats, it never writes the takes.

- [ ] **Capture**: Curius is the link inbox. `https://curius.app/api/users/2790/links?page=N` (public, paginated 30/page) returns `highlights[]` and `comments[]` per link; `searchLinks` does not. Filter by `createdDate`.
- [ ] **Quick takes**: /tweet (local) should capture a link plus a one-line reaction as structured rows, not one text blob (see "Link takes" below).
- [ ] **Weekly: `sunday links #N`** (resumes at #17; the series ended at #16 on 2025-07-20)
  - [x] `pnpm draft weekly` pulls last 7 days from Curius + link takes, writes a draft `posts/DDMMYY.md`
  - [x] each link: highlight as blockquote, take beneath it (empty `- take:` slot if none), "also" list for no-take links, read/watch footer
  - [ ] ~7 items with real takes, not 30. Delete what you saved but didn't read
  - [ ] lowercase title, open with a photo + caption or a verse, no intro paragraph, takes 1-3 sentences, no article summaries
- [ ] **Monthly: `highlights, {month} {year}`** (first Sunday)
  - [x] `pnpm draft monthly` gathers the month's sunday links posts, Curius highlights, `journal`-tagged posts, /thoughts
  - [x] drafts sections: things i enjoyed reading, things i enjoyed watching, plot (candidate events only, I write the prose)
  - [ ] publish on the blog first, then paste into Substack by hand
- [ ] **Quarterly: `q1/q2/q3/q4 reflection`**
  - [x] `pnpm draft quarterly` gathers the quarter's monthly highlights posts + thoughts + journal posts into a draft with prompts, no generated reflections
- [x] Drafts live in `posts/drafts/` and are edited locally.

#### Link takes (reworking /tweet)

- [x] `/tweet` stores reactions and links in Neon’s `tweets` table (`content`, `link`, `link_title`); missing titles are resolved only by the local draft CLI after merging sources (four requests at a time); public and admin APIs use stored titles or URL fallbacks
- [ ] /thoughts keeps rendering plain thoughts; link takes feed the weekly script
- [ ] /tweet lists recent entries with a delete button (dev only)

## Inspirations

- [cnnmon/tiffanywang](https://github.com/cnnmon/tiffanywang)
- [quinnha/portfolio](https://github.com/quinnha/portfolio)
- [yihui-hu/yihui-work](https://github.com/yihui-hu/yihui-work)
- [Linus Rogge](https://linusrogge.com/)

## Database Setup Instructions

### Thoughts and link takes

Thoughts and link takes use Neon Postgres through `@neondatabase/serverless`,
with `POSTGRES_URL` configured locally and in the deployment environment. The
current `tweets` table includes `id`, `content`, `link`, `link_title`, and
`created_at`. See `/api/tweet` for capture and `/api/thoughts` for pagination.
The public capture API does not fetch URLs. Backup snapshots include this table.

### Code hygiene

Run `pnpm check:unused` for Knip's dependency, file, and export checks. Manual
maintenance scripts are explicit entry points in `knip.json`; an absent import
alone does not mean a script is safe to delete. Run `pnpm lint`, `pnpm test`, and
`pnpm exec tsc --noEmit` before opening a PR.

### Setting up Neon for embedding search

Create pgvector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Create the content_chunks table:

```sql
CREATE TABLE content_chunks (
    id UUID PRIMARY KEY,
    post_slug TEXT NOT NULL,
    post_title TEXT NOT NULL,
    content TEXT NOT NULL,
    chunk_type TEXT NOT NULL,
    metadata JSONB NOT NULL,
    sequence INTEGER NOT NULL,
    embedding vector(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a vector index for faster similarity search
CREATE INDEX ON content_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create additional indexes for faster filtering
CREATE INDEX idx_content_chunks_post_slug ON content_chunks(post_slug);
CREATE INDEX idx_content_chunks_chunk_type ON content_chunks(chunk_type);
```

Run generate embeddings:

```bash
pnpm run generate-embeddings
```

### References

- [pgvector: Embeddings and vector similarity | Supabase Docs](https://supabase.com/docs/guides/database/extensions/pgvector?database-method=dashboard)
- [supabase-community/nextjs-openai-doc-search](https://github.com/supabase-community/nextjs-openai-doc-search)
- [transformers.js/examples/next-server](https://github.com/xenova/transformers.js/blob/main/examples/next-server/next.config.js)
