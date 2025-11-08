import { sql } from "@vercel/postgres";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL environment variable is required");
}

async function dropTable() {
  try {
    console.log("Connecting to database...");
    console.log("Dropping content_chunks table...");

    await sql`DROP TABLE IF EXISTS content_chunks`;

    console.log("✅ Table content_chunks dropped successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error dropping table:", error);
    process.exit(1);
  }
}

// Execute the function
dropTable();
