# Blog

![screenshot](public/images/home.png)

A minimalistic blog made with Next.js and Tailwind CSS.

Design inspired by [James Quiambao](https://www.jquiambao.com/) and [Lee Robinson](https://github.com/leerob/leerob.io)

Tutorial on how to build this blog can be found [here](https://www.youtube.com/watch?v=Hiabp1GY8fA).

OpenAI code taken from [magic-text](https://github.com/jxnl/magic-text)

## TODO

- [ ] Create a chat interface trained on my blog posts, have database for embeddings that allow daily insert on upload
- [ ] build a map of favorite restaurants and places like [build your corner](https://twitter.com/buildyourcorner)

## Inspirations

- [cnnmon/tiffanywang](https://github.com/cnnmon/tiffanywang)
- [quinnha/portfolio](https://github.com/quinnha/portfolio)

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
