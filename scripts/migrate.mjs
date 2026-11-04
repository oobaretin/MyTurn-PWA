import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is empty. Set it in .env.local first.");
  process.exit(1);
}

const migratePath = fileURLToPath(new URL("../db/migrate.sql", import.meta.url));
const sql = readFileSync(migratePath, "utf8");
const db = postgres(url, { prepare: false, max: 1 });

try {
  await db.unsafe(sql);
  console.log("Migration applied: db/migrate.sql");
} catch (err) {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await db.end();
}
