// import 'server-only' not working with API routes yet
import { Generated, Kysely } from 'kysely';
import { PlanetScaleDialect } from 'kysely-planetscale';

interface TweetsTable {
  id: Generated<number>;
  content: string;
  created_at: Generated<Date>;
}

interface Database {
  tweets: TweetsTable;
}

export const queryBuilder = new Kysely<Database>({
  dialect: new PlanetScaleDialect({
    url: process.env.DATABASE_URL,
  }),
});
