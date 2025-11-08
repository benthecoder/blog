import { neon } from "@neondatabase/serverless";
import { Metadata } from "next";
import { ThoughtsClient } from "@/components/thoughts";

export const metadata: Metadata = {
  title: "thoughts",
  description: "unfiltered thoughts, stream of consciousness",
};

interface Tweet {
  id: number;
  content: string;
  created_at: Date;
}

const sql = neon(process.env.POSTGRES_URL!);

async function getInitialThoughts(): Promise<{
  thoughts: Tweet[];
  total: number;
}> {
  const INITIAL_LIMIT = 100;

  const [thoughts, countResult] = await Promise.all([
    sql(`
      SELECT id, content, created_at
      FROM tweets
      ORDER BY created_at DESC
      LIMIT ${INITIAL_LIMIT}
    `) as unknown as Tweet[],
    sql(`SELECT COUNT(*) as count FROM tweets`) as unknown as {
      count: number;
    }[],
  ]);

  return {
    thoughts,
    total: countResult[0].count,
  };
}

export default async function ThoughtsPage() {
  const { thoughts, total } = await getInitialThoughts();

  return <ThoughtsClient initialThoughts={thoughts} total={total} />;
}

export const runtime = "edge";
export const revalidate = 0;
