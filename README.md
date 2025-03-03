# Personal Blog

![home](public/images/home.jpeg)

A minimalistic blog built with Next.js, React, and TypeScript. It uses Markdown for content and features search functionality powered by vector embeddings.

Design inspired by [James Quiambao](https://www.jquiambao.com/) and [Lee Robinson](https://github.com/leerob/leerob.io).

## Features

- Markdown-based blog posts with frontmatter
- Dark/light mode support
- Three types of search:
  - Keyword search (traditional text search)
  - Semantic search (using vector embeddings)
  - Hybrid search (combination of both)
- RSS feed generation
- Responsive design
- Automated embedding generation via GitHub Actions

## Development

To run the development server:

```bash
npm run dev
```

To build for production:

```bash
npm run build
```

## Embedding Generation

Post content is processed into semantic embeddings using VoyageAI's embedding model. New embeddings are generated automatically via GitHub Actions when posts are added or updated.

To manually generate embeddings for a specific post:

```bash
npm run generate-embeddings [post-slug]
```

To generate embeddings for all posts:

```bash
npm run generate-embeddings
```

## TODO

Improvements

- [x] Syntax highlight https://bionicjulia.com/blog/setting-up-nextjs-markdown-blog-with-typescript
- [x] Add sitemap using [next-sitemap](https://www.tanvi.dev/blog/2-how-to-add-a-sitemap-to-your-nextjs-app)
- [ ] Optimize image loading https://macwright.com/2016/05/03/the-featherweight-website
- [ ] Make thoughts page faster
- [ ] improve SEO
  - [ ] https://nextjs.org/learn/seo/introduction-to-seo

New features

- [x] indicator for which page user is on like https://macwright.com/
- [x] I'm feeling lucky feature, that randomly selects a blog
- [ ] expanding text
  - [ ] https://www.spencerchang.me/
  - [ ] https://www.rishi.cx/
- [ ] Create pop up notes like https://www.rishi.cx/
- [ ] A real-time digital clock with seconds
- [ ] dark mode
  - [ ] [Dark Mode in Next JS 13 App Directory with TailwindCSS (for beginners) - YouTube](https://www.youtube.com/watch?v=optD7ns4ISQ)
- [ ] basic search
  - [jackyzha0/quartz](https://github.com/jackyzha0/quartz/blob/v4/quartz/components/scripts/search.inline.ts)
- [ ] embeddings
  - [ ] semantic search
    - [ ] https://focusreactive.com/ai-search-implementation/
    - [ ] https://supabase.com/blog/openai-embeddings-postgres-vector
  - [ ] Create a chat interface trained on my blog posts, have database for embeddings that allow daily insert on upload
  - [ ] refer to https://github.com/Swizec/swizbot-ui
- [ ] build a map of favorite restaurants and places like [build your corner](https://twitter.com/buildyourcorner)
- [ ] Add listening and reading updates
  - [ ] https://dev.to/j471n/how-to-use-spotify-api-with-nextjs-50o5
  - [ ] https://github.com/yihui-hu/yihui-work
- [ ] add hover over highlights for notes feature and expanding sidebar
  - [ ] https://linusrogge.com/about
  - [ ] hover to preview like https://stephango.com/buy-wisely
- [ ] breadcrumb navigation
  - [ ] https://jake.isnt.online/
- [ ] Setup contentlayer
  - [ ] https://youtu.be/nkGjob3q2GI?si=C-LTuMQNGydbxvPy&t=2847

## Inspirations

- [cnnmon/tiffanywang](https://github.com/cnnmon/tiffanywang)
- [quinnha/portfolio](https://github.com/quinnha/portfolio)
- [yihui-hu/yihui-work](https://github.com/yihui-hu/yihui-work)
- [Linus Rogge](https://linusrogge.com/)

## Setting up Planetscale for /thoughts page

```bash
brew install planetscale/tap/pscale
brew install mysql-client
```

```bash
pscale shell <DB_NAME> main
```

Run this to create table

```sql
CREATE TABLE tweets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Setting up Neon for embedding search

Create pgvector extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

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

Run generate embeddings

```bash
npm run generate-embeddings
```

- [pgvector: Embeddings and vector similarity | Supabase Docs](https://supabase.com/docs/guides/database/extensions/pgvector?database-method=dashboard)
- [supabase-community/nextjs-openai-doc-search: Template for building your own custom ChatGPT style doc search powered by Next.js, OpenAI, and Supabase.](https://github.com/supabase-community/nextjs-openai-doc-search)
- [transformers.js/examples/next-server/next.config.js at main · xenova/transformers.js](https://github.com/xenova/transformers.js/blob/main/examples/next-server/next.config.js)
