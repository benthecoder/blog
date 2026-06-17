import { neon } from "@neondatabase/serverless";
import { Metadata } from "next";
import ThoughtsClient from "./ThoughtsClient";
import type { Thought } from "@/types/thoughts";

export const runtime = "edge";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "thoughts",
  description: "unfiltered thoughts, stream of consciousness",
};

const sql = neon(process.env.POSTGRES_URL!);
const INITIAL_LIMIT = 100;

async function getInitialThoughts(): Promise<{
  thoughts: Thought[];
  total: number;
}> {
  const [thoughts, countResult] = await Promise.all([
    sql`SELECT id, content, created_at FROM tweets ORDER BY created_at DESC LIMIT ${INITIAL_LIMIT}` as unknown as Thought[],
    sql`SELECT COUNT(*) as count FROM tweets` as unknown as {
      count: string;
    }[],
  ]);

  return {
    thoughts,
    total: Number(countResult[0].count),
  };
}

export default async function ThoughtsPage() {
  const { thoughts, total } = await getInitialThoughts();
  return <ThoughtsClient initialThoughts={thoughts} total={total} />;
}
