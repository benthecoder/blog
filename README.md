# Blog

![screenshot](public/images/home.png)

A minimalistic blog made with Next.js and Tailwind CSS.

Design inspired by [James Quiambao](https://www.jquiambao.com/) and [Lee Robinson](https://github.com/leerob/leerob.io)

Tutorial on how to build this blog can be found [here](https://www.youtube.com/watch?v=Hiabp1GY8fA).

OpenAI code taken from [magic-text](https://github.com/jxnl/magic-text)

## TODO

- [ ] Create a chat interface trained on my blog posts, have database for embeddings that allow daily insert on upload
- [ ] build a map of favorite restaurants and places like [build your corner](https://twitter.com/buildyourcorner)
- [ ] Add listening and reading updates
  - [ ] https://dev.to/j471n/how-to-use-spotify-api-with-nextjs-50o5
  - [ ] https://github.com/yihui-hu/yihui-work
- [ ] add hover over highlights for notes feature and expanding sidebar
  - [ ] https://linusrogge.com/about
- [ ] breadcrumb navigation
  - [ ] https://jake.isnt.online/
- [ ] expanding text
  - [ ] https://www.spencerchang.me/
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
