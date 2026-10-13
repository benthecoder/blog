my digital commonplace book / blog / public journal

## Local development

Run `pnpm install`, configure the environment variables shown in `.env.example`, then run `pnpm dev`.

Use `/admin` for local writing tools. Wiki templates, paper fields and link checks are described in [Wiki writing](docs/wiki-writing.md). Wiki pages are saved to `wiki/<address>.md`; commit and push them to publish. Wiki saves are local only, and a save refuses to overwrite a page changed since it was opened.

Draft commands collect sources and format them; they do not write your takes or reflections:

```sh
pnpm draft weekly
pnpm draft monthly
pnpm draft quarterly
```

Drafts live in the gitignored `posts/drafts/` folder and are edited locally. Curius supplies saved links, highlights and comments; `/tweet` captures structured reactions and links for the weekly command. `/thoughts` renders the public stream. Publish through the local post editor.

Run `pnpm backup` with the “chonky” drive connected. See [Backup](scripts/backup/README.md) for configuration and recovery.

## Database and search

Thoughts and link takes use Neon Postgres through `@neondatabase/serverless`, with `POSTGRES_URL` configured locally and in the deployment environment. The existing `tweets` table needs `id`, `content`, `link`, `link_title` and `created_at`; the embedding command does not create it. Public capture does not fetch URLs, and backups include this table.

To generate the search index, configure `POSTGRES_URL` and `VOYAGE_AI_API_KEY` in the script environment (`scripts/generateEmbeddings.ts` loads `.env`) and run:

```sh
pnpm generate-embeddings
```

The script enables pgvector and creates `content_chunks` and its indexes when the table is absent. It does not migrate an existing table. The schema lives in the script rather than a separate SQL checklist.

## Code checks

Run `pnpm lint`, `pnpm test`, `pnpm typecheck` and `pnpm check:unused` before opening a code PR. Knip's manual maintenance entry points are declared in `knip.json`; an absent import alone does not mean a script is safe to delete.

Possible future additions are in [IDEAS.md](IDEAS.md).
