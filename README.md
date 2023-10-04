# Blog

![screenshot](public/images/home.png)

A minimalistic blog made with Next.js and Tailwind CSS.

Design inspired by [James Quiambao](https://www.jquiambao.com/) and [Lee Robinson](https://github.com/leerob/leerob.io)

Tutorial on how to build this blog can be found [here](https://www.youtube.com/watch?v=Hiabp1GY8fA).

OpenAI code taken from [magic-text](https://github.com/jxnl/magic-text)

## TODO

Improvements

- [ ] Optimize image loading https://macwright.com/2016/05/03/the-featherweight-website
- [ ] Make thoughts page faster
- [ ] improve SEO
  - [ ] https://nextjs.org/learn/seo/introduction-to-seo

New features

- [x] indicator for which page user is on like https://macwright.com/
- [ ] expanding text
  - [ ] https://www.spencerchang.me/
  - [ ] https://www.rishi.cx/
- [ ] Create pop up notes like https://www.rishi.cx/
- [ ] A real-time digital clock with seconds
- [ ] I'm feeling lucky feature, that randomly selects a blog
- [ ] dark mode
  - [ ] [Dark Mode in Next JS 13 App Directory with TailwindCSS (for beginners) - YouTube](https://www.youtube.com/watch?v=optD7ns4ISQ)
- [ ] basic search
  - [jackyzha0/quartz](https://github.com/jackyzha0/quartz/blob/v4/quartz/components/scripts/search.inline.ts)
- [ ] embeddings
  - [ ] semantic search
    - [ ] https://focusreactive.com/ai-search-implementation/
    - [ ] https://supabase.com/blog/openai-embeddings-postgres-vector
  - [ ] Create a chat interface trained on my blog posts, have database for embeddings that allow daily insert on upload
- [ ] build a map of favorite restaurants and places like [build your corner](https://twitter.com/buildyourcorner)
- [ ] Add listening and reading updates
  - [ ] https://dev.to/j471n/how-to-use-spotify-api-with-nextjs-50o5
  - [ ] https://github.com/yihui-hu/yihui-work
- [ ] add hover over highlights for notes feature and expanding sidebar
  - [ ] https://linusrogge.com/about
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

## Setting up Supabase for embedding search

- [pgvector: Embeddings and vector similarity | Supabase Docs](https://supabase.com/docs/guides/database/extensions/pgvector?database-method=dashboard)
- [supabase-community/nextjs-openai-doc-search: Template for building your own custom ChatGPT style doc search powered by Next.js, OpenAI, and Supabase.](https://github.com/supabase-community/nextjs-openai-doc-search)
- [transformers.js/examples/next-server/next.config.js at main · xenova/transformers.js](https://github.com/xenova/transformers.js/blob/main/examples/next-server/next.config.js)
