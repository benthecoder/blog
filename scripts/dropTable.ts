import { sql } from "@vercel/postgres";
import * as dotenv from "dotenv";

dotenv.config();

// Ensure the database URL is properly set
process.env.POSTGRES_URL = process.env.DATABASE_URL;

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
