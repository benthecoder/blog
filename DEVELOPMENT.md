# Development Progress & Notes

This document tracks the development progress, TODO items, and setup instructions for the blog.

## TODO

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
- [ ] A real-time digital clock with seconds
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

## Database Setup Instructions

### Setting up Planetscale for /thoughts page

```bash
brew install planetscale/tap/pscale
brew install mysql-client
```

```bash
pscale shell <DB_NAME> main
```

Run this to create table:

```sql
CREATE TABLE tweets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

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
npm run generate-embeddings
```

### References

- [pgvector: Embeddings and vector similarity | Supabase Docs](https://supabase.com/docs/guides/database/extensions/pgvector?database-method=dashboard)
- [supabase-community/nextjs-openai-doc-search](https://github.com/supabase-community/nextjs-openai-doc-search)
- [transformers.js/examples/next-server](https://github.com/xenova/transformers.js/blob/main/examples/next-server/next.config.js)
