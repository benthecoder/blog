import "dotenv/config";
import { execFileSync } from "node:child_process";
import { neon } from "@neondatabase/serverless";
import { getEmbeddingChanges } from "@/utils/chunking/embeddingChanges";

async function main() {
  const base = process.argv[2];
  if (base === "--all") {
    execFileSync("pnpm", ["exec", "tsx", "scripts/generateEmbeddings.ts"], {
      stdio: "inherit",
    });
    return;
  }
  const { updated, deleted } = getEmbeddingChanges(base ?? "");
  console.log(
    `Embedding sync: ${updated.length} updated posts, ${deleted.length} deleted posts`
  );
  for (const slug of updated) {
    execFileSync(
      "pnpm",
      ["exec", "tsx", "scripts/generateEmbeddings.ts", slug],
      { stdio: "inherit" }
    );
  }
  if (deleted.length > 0) {
    if (!process.env.POSTGRES_URL)
      throw new Error(
        "POSTGRES_URL is required to remove deleted posts from search"
      );
    const sql = neon(process.env.POSTGRES_URL);
    await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(hashtext('blog:content_chunks'))`,
      sql`DELETE FROM content_chunks WHERE post_slug = ANY(${deleted}::text[])`,
    ]);
    console.log(`Removed search chunks for ${deleted.length} deleted posts`);
  }
}
main().catch((error) => {
  console.error("Embedding sync failed:", error);
  process.exitCode = 1;
});
