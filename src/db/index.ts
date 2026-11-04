import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | null = null;

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!client) {
    client = postgres(url, { prepare: false, max: 1 });
  }
  return client;
}

export function getDb() {
  return drizzle(getClient(), { schema });
}

export { schema };
